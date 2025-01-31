import React from 'react';
import { Node, GridSize } from '../types/grid';

interface GridProps {
  grid: Node[][];
  gridSize: GridSize;
  cellSize: number;
  onNodeClick: (row: number, col: number) => void;
  onMouseDown: (row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseUp: () => void;
}

const Grid: React.FC<GridProps> = React.memo(({
  grid,
  gridSize,
  cellSize,
  onNodeClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
}) => {
  const getNodeColor = (node: Node): string => {
    switch (node.type) {
      case 'wall':
        return '#2d3748';
      case 'start':
        return '#48bb78';
      case 'end':
        return '#f56565';
      case 'visited':
      case 'visited-dijkstra':
        return '#90cdf4';
      case 'visited-astar':
        return '#d6bcfa';
      case 'path':
      case 'path-dijkstra':
        return '#4299e1';
      case 'path-astar':
        return '#9f7aea';
      default:
        return '#fff';
    }
  };

  const handleMouseEvent = (
    event: React.MouseEvent<HTMLDivElement>,
    handler: (row: number, col: number) => void
  ) => {
    const element = event.target as HTMLElement;
    const row = parseInt(element.getAttribute('data-row') || '');
    const col = parseInt(element.getAttribute('data-col') || '');
    
    if (!isNaN(row) && !isNaN(col)) {
      handler(row, col);
    }
  };

  return (
    <div 
      className="relative touch-none"
      style={{
        width: gridSize.cols * cellSize,
        height: gridSize.rows * cellSize,
        maxWidth: '100vw',
        maxHeight: '70vh',
      }}
    >
      <div 
        className="grid gap-0 border border-gray-300 rounded-lg"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize.cols}, ${cellSize}px)`,
        }}
      >
        {grid.map((row, rowIdx) =>
          row.map((node, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              data-row={rowIdx}
              data-col={colIdx}
              className="border border-gray-200"
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: getNodeColor(node),
                transition: 'background-color 0.3s ease',
              }}
              onClick={(e) => handleMouseEvent(e, onNodeClick)}
              onMouseDown={(e) => handleMouseEvent(e, onMouseDown)}
              onMouseEnter={(e) => handleMouseEvent(e, onMouseEnter)}
              onMouseUp={onMouseUp}
            />
          ))
        )}
      </div>
    </div>
  );
});

Grid.displayName = 'Grid';

export default Grid;