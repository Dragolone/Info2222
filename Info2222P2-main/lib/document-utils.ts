// Utility functions for document editing and handling
import React from 'react';

/**
 * Find node and offset at a specific document position
 */
export function findNodeAtPosition(container: Node, position: number): { node: Node; offset: number } {
  let currentPos = 0;

  // Helper function to traverse the DOM tree
  function findPosition(node: Node): { node: Node; offset: number } | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const length = node.textContent?.length || 0;

      // If the position is within this text node
      if (currentPos <= position && position <= currentPos + length) {
        return { node, offset: position - currentPos };
      }

      currentPos += length;
    } else {
      // Process child nodes
      for (let i = 0; i < node.childNodes.length; i++) {
        const result = findPosition(node.childNodes[i]);
        if (result) return result;
      }
    }

    return null;
  }

  const result = findPosition(container);
  if (result) return result;

  // If position is beyond the content, return the last position
  const lastTextNode = findLastTextNode(container);
  return {
    node: lastTextNode || container,
    offset: lastTextNode ? (lastTextNode.textContent?.length || 0) : 0
  };
}

/**
 * Find the last text node in a container
 */
function findLastTextNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node;
  }

  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const lastTextNode = findLastTextNode(node.childNodes[i]);
    if (lastTextNode) return lastTextNode;
  }

  return null;
}

/**
 * Get text position (index) from DOM node and offset
 */
export function getTextPosition(container: Node, node: Node, offset: number): number {
  let position = 0;

  // Helper function to calculate position
  function traverse(current: Node): boolean {
    if (current === node) {
      position += offset;
      return true;
    }

    if (current.nodeType === Node.TEXT_NODE) {
      position += current.textContent?.length || 0;
    } else {
      for (let i = 0; i < current.childNodes.length; i++) {
        if (traverse(current.childNodes[i])) {
          return true;
        }
      }
    }

    return false;
  }

  traverse(container);
  return position;
}

/**
 * Find word boundaries at a cursor position
 */
export function findWordBoundaryAtPosition(text: string, position: number): { start: number, end: number } {
  // Check if we're in a valid position
  if (position < 0 || position > text.length) {
    return { start: position, end: position };
  }

  // Find word boundaries
  let start = position;
  let end = position;

  // Move start back to the beginning of the word
  while (start > 0 && !/\s/.test(text[start - 1])) {
    start--;
  }

  // Move end forward to the end of the word
  while (end < text.length && !/\s/.test(text[end])) {
    end++;
  }

  // If we're just at a space, return empty boundary
  if (start === end) {
    return { start, end };
  }

  return { start, end };
}

/**
 * Format Markdown text into HTML elements
 */
export function formatContent(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    // Handle alignment directives at the paragraph level
    if (line.includes('<center>') || line.includes('</center>')) {
      line = line.replace(/<center>([\s\S]*?)<\/center>/g, '$1');
      return React.createElement('p', {
        key: i,
        className: "text-center my-2",
        dangerouslySetInnerHTML: { __html: formatInlineStyles(line) }
      });
    } else if (line.includes('<right>') || line.includes('</right>')) {
      line = line.replace(/<right>([\s\S]*?)<\/right>/g, '$1');
      return React.createElement('p', {
        key: i,
        className: "text-right my-2",
        dangerouslySetInnerHTML: { __html: formatInlineStyles(line) }
      });
    } else if (line.includes('<left>') || line.includes('</left>')) {
      line = line.replace(/<left>([\s\S]*?)<\/left>/g, '$1');
      return React.createElement('p', {
        key: i,
        className: "text-left my-2",
        dangerouslySetInnerHTML: { __html: formatInlineStyles(line) }
      });
    }

    // Handle existing formatting
    if (line.startsWith('# ')) {
      return React.createElement('h1', {
        key: i,
        className: "text-3xl font-bold mt-6 mb-2",
        dangerouslySetInnerHTML: { __html: formatInlineStyles(line.substring(2)) }
      });
    } else if (line.startsWith('## ')) {
      return React.createElement('h2', {
        key: i,
        className: "text-2xl font-semibold mt-5 mb-2",
        dangerouslySetInnerHTML: { __html: formatInlineStyles(line.substring(3)) }
      });
    } else if (line.startsWith('### ')) {
      return React.createElement('h3', {
        key: i,
        className: "text-xl font-medium mt-4 mb-2",
        dangerouslySetInnerHTML: { __html: formatInlineStyles(line.substring(4)) }
      });
    } else if (line.startsWith('- ')) {
      return React.createElement('li', {
        key: i,
        className: "ml-6",
        dangerouslySetInnerHTML: { __html: formatInlineStyles(line.substring(2)) }
      });
    } else if (line.match(/^\d+\. /)) {
      return React.createElement('li', {
        key: i,
        className: "ml-6 list-decimal",
        dangerouslySetInnerHTML: { __html: formatInlineStyles(line.substring(line.indexOf('. ') + 2)) }
      });
    } else if (line.trim() === '') {
      return React.createElement('br', { key: i });
    } else {
      return React.createElement('p', {
        key: i,
        className: "my-2",
        dangerouslySetInnerHTML: { __html: formatInlineStyles(line) }
      });
    }
  });
}

/**
 * Format inline styles in text
 */
export function formatInlineStyles(text: string): string {
  let formatted = text;

  // Process formatting in a specific order to avoid interference

  // Bold - Use non-greedy matching and word boundaries where possible
  formatted = formatted.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');

  // Italic - Ensure we only match single asterisks not followed by another asterisk
  formatted = formatted.replace(/(?<!\*)\*([\s\S]+?)\*(?!\*)/g, '<em>$1</em>');

  // Underline
  formatted = formatted.replace(/__([\s\S]+?)__/g, '<u>$1</u>');

  // Strikethrough
  formatted = formatted.replace(/~~([\s\S]+?)~~/g, '<del>$1</del>');

  return formatted;
}

/**
 * Calculate the new selection range after applying formatting
 */
export function getNewSelectionRange(
  format: string,
  text: string,
  start: number,
  end: number,
  wasFormatted: boolean
): { start: number, end: number } {
  // Determine the adjustment based on formatting type
  let adjustment = 0;

  switch (format) {
    case 'bold':
      adjustment = 4; // ** at start and end = 4 chars
      break;
    case 'italic':
      adjustment = 2; // * at start and end = 2 chars
      break;
    case 'underline':
      adjustment = 4; // __ at start and end = 4 chars
      break;
    case 'align-center':
      adjustment = 17; // <center></center> = 17 chars
      break;
    case 'align-right':
      adjustment = 15; // <right></right> = 15 chars
      break;
    case 'align-left':
      adjustment = 13; // <left></left> = 13 chars
      break;
    default:
      adjustment = 0;
  }

  // If formatting was removed, subtract the adjustment
  // Otherwise, add the adjustment
  const newEnd = wasFormatted ? end - adjustment : end + adjustment;

  return {
    start,
    end: newEnd
  };
}
