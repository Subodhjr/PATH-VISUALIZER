interface NodeProps {
  node: Node;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  onMouseUp: () => void;
  onTouchStart: () => void;
  onClick?: () => void;
}

const NodeComponent: React.FC<NodeProps> = ({
  node,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onTouchStart,
  onClick
}) => {
  const { type, row, col } = node;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
  };

  return (
    <div
      className={`
        w-6 h-6 border border-gray-300 transition-colors duration-200
        ${getNodeTypeClass(type)}
      `}
      data-node="true"
      data-row={row}
      data-col={col}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown();
      }}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      onClick={handleClick}
      onTouchStart={(e) => {
        e.preventDefault();
        onTouchStart();
        onClick?.();
      }}
    />
  );
};

const getNodeTypeClass = (type: NodeType): string => {
  switch (type) {
    case 'wall':
      return 'bg-gray-800';
    case 'start':
      return 'bg-green-500';
    case 'end':
      return 'bg-red-500';
    case 'visited':
      return 'bg-blue-200';
    case 'path':
      return 'bg-yellow-400';
    default:
      return 'bg-white';
  }
};

export default NodeComponent; 