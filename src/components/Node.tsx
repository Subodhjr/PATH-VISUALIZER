<div
  className={`
    w-6 h-6 border border-gray-300 transition-colors duration-200
    ${getNodeTypeClass(type)}
  `}
  onMouseDown={() => onMouseDown(row, col)}
  onMouseEnter={() => onMouseEnter(row, col)}
  onMouseUp={onMouseUp}
>
</div>

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