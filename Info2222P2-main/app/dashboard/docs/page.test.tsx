/**
 * Example test for the collaborative document editor
 *
 * This is a simple mock test showing how the operational transformations
 * might be tested and verified.
 */
import {
  TextOperation,
  createInsertOperation,
  createDeleteOperation,
  transformOperations
} from '@/lib/collaborative-editor';

describe('Collaborative Document Operations', () => {
  // Test inserting text
  test('should correctly create insert operations', () => {
    const operations = createInsertOperation(5, 'hello');

    expect(operations).toEqual([
      { type: 'retain', position: 0, count: 5 },
      { type: 'insert', position: 5, chars: 'hello' },
    ]);
  });

  // Test deleting text
  test('should correctly create delete operations', () => {
    const operations = createDeleteOperation(10, 3);

    expect(operations).toEqual([
      { type: 'retain', position: 0, count: 10 },
      { type: 'delete', position: 10, count: 3 },
    ]);
  });

  // Applying operations
  test('should correctly apply operations to a document', () => {
    const content = 'The quick brown fox';

    // Insert "very " at position 4
    const insertOperations = createInsertOperation(4, 'very ');
    const newContent = applyOperations(content, insertOperations);

    expect(newContent).toBe('The very quick brown fox');

    // Delete "brown " from the result
    const deleteOperations = createDeleteOperation(10, 6);
    const finalContent = applyOperations(newContent, deleteOperations);

    expect(finalContent).toBe('The very quick fox');
  });

  // Transforming concurrent operations
  test('should handle concurrent edits with operational transform', () => {
    const content = 'Hello world';

    // User 1 adds " beautiful" at position 5
    const op1 = createInsertOperation(5, ' beautiful');

    // User 2 adds " amazing" at position 5 at the same time
    const op2 = createInsertOperation(5, ' amazing');

    // Transform op2 against op1
    const transformedOp2 = transformOperations(op2, op1);

    // Apply op1 first
    const intermediate = applyOperations(content, op1);
    expect(intermediate).toBe('Hello beautiful world');

    // Then apply transformed op2
    const final = applyOperations(intermediate, transformedOp2);

    // The expected result preserves both users' edits
    expect(final).toBe('Hello beautiful amazing world');
  });
});

// Test helper function to apply operations to a document
function applyOperations(content: string, operations: TextOperation[]): string {
  let newContent = '';
  let currentPosition = 0;

  for (const op of operations) {
    if (op.type === 'retain') {
      const count = op.count || 0;
      newContent += content.slice(currentPosition, currentPosition + count);
      currentPosition += count;
    } else if (op.type === 'insert' && op.chars) {
      newContent += op.chars;
    } else if (op.type === 'delete') {
      const count = op.count || 0;
      currentPosition += count;
    }
  }

  // Add any remaining content
  if (currentPosition < content.length) {
    newContent += content.slice(currentPosition);
  }

  return newContent;
}
