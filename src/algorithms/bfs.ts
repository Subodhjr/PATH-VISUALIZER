import { Node } from '../types/grid';

export function bfs(
  grid: Node[][],
  startNode: Node,
  endNode: Node
): { visitedNodes: Node[]; path: Node[] } {
  const visitedNodes: Node[] = [];
  const queue: Node[] = [];
  
  // Initialize all nodes
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      const node = grid[row][col];
      node.previousNode = null;
      node.isVisited = false;
    }
  }

  // Start with the start node
  startNode.isVisited = true;
  queue.push(startNode);

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    visitedNodes.push(currentNode);

    // Check if we've reached the end node
    if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
      return {
        visitedNodes,
        path: reconstructPath(currentNode)
      };
    }

    const neighbors = getUnvisitedNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      if (neighbor.type !== 'wall' && !neighbor.isVisited) {
        neighbor.isVisited = true;
        neighbor.previousNode = currentNode;
        queue.push(neighbor);
      }
    }
  }

  return { visitedNodes, path: [] };
}

function getUnvisitedNeighbors(node: Node, grid: Node[][]): Node[] {
  const neighbors: Node[] = [];
  const { row, col } = node;

  // Check all four directions
  if (row > 0) neighbors.push(grid[row - 1][col]); // up
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]); // down
  if (col > 0) neighbors.push(grid[row][col - 1]); // left
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]); // right

  return neighbors;
}

function reconstructPath(endNode: Node): Node[] {
  const path: Node[] = [];
  let currentNode: Node | null = endNode;

  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }

  return path;
} 