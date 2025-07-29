import React from 'react';

interface CollaborativeCursorProps {
  name: string;
  color: string;
  position: { top: number; left: number };
}

const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({
  name,
  color,
  position
}) => {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div
        className="h-5 w-0.5 animate-pulse"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute -top-6 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
};

export default CollaborativeCursor;
