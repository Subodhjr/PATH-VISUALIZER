import React from 'react';
import { Node, GridSize } from '../types/grid';
import NodeComponent from './Node';

interface GridProps {
  grid: Node[][];
  gridSize: GridSize;
  cellSize: number;
  onNodeClick: (row: number, col: number) => void;
  onMouseDown: (row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseUp: () => void;
}

const Grid: React.FC<GridProps> = ({
  grid,
  gridSize,
  cellSize,
  onNodeClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp
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

  const handleTouchStart = (row: number, col: number) => {
    onMouseDown(row, col);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element?.getAttribute('data-node')) {
      const row = parseInt(element.getAttribute('data-row') || '0');
      const col = parseInt(element.getAttribute('data-col') || '0');
      onMouseEnter(row, col);
    }
  };

  const handleTouchEnd = () => {
    onMouseUp();
  };

  return (
    <div 
      className="relative touch-none"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize.cols}, ${cellSize}px)`,
        width: 'fit-content',
        gap: 0
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {grid.map((row, rowIdx) => 
        row.map((node, colIdx) => (
          <NodeComponent
            key={`${rowIdx}-${colIdx}`}
            node={node}
            onMouseDown={() => onMouseDown(rowIdx, colIdx)}
            onMouseEnter={() => onMouseEnter(rowIdx, colIdx)}
            onMouseUp={onMouseUp}
            onTouchStart={() => handleTouchStart(rowIdx, colIdx)}
            onClick={() => onNodeClick(rowIdx, colIdx)}
          />
        ))
      )}
    </div>
  );
};

Grid.displayName = 'Grid';

export default Grid;