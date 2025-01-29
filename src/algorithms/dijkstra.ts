import { Node } from '../types/grid';

export function dijkstra(
  grid: Node[][],
  startNode: Node,
  endNode: Node
): { visitedNodes: Node[]; path: Node[] } {
  const visitedNodes: Node[] = [];
  const queue: Node[] = [];
  
  // Reset and initialize all nodes
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      const node = grid[row][col];
      node.distance = Infinity;
      node.previousNode = null;
      node.isVisited = false;
    }
  }

  // Initialize start node
  startNode.distance = 0;
  queue.push(startNode);

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const currentNode = queue.shift()!;

    // Skip if already visited or is a wall
    if (currentNode.isVisited || currentNode.type === 'wall') continue;

    // Mark as visited
    currentNode.isVisited = true;
    visitedNodes.push(currentNode);

    // Check if we reached the end node
    if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
      const path = reconstructPath(currentNode);
      return {
        visitedNodes,
        path
      };
    }

    // Update unvisited neighbors
    updateUnvisitedNeighbors(currentNode, grid, queue);
  }

  return { visitedNodes, path: [] };
}

function updateUnvisitedNeighbors(node: Node, grid: Node[][], queue: Node[]): void {
  const neighbors = getValidNeighbors(node, grid);
  
  for (const neighbor of neighbors) {
    if (neighbor.type === 'wall') continue;
    
    const tentativeDistance = node.distance + 1;
    
    if (tentativeDistance < neighbor.distance) {
      neighbor.distance = tentativeDistance;
      neighbor.previousNode = node;
      
      // Add to queue if not already in it
      if (!queue.includes(neighbor)) {
        queue.push(neighbor);
      }
    }
  }
}

function getValidNeighbors(node: Node, grid: Node[][]): Node[] {
  const neighbors: Node[] = [];
  const { row, col } = node;

  // Check all four directions
  if (row > 0) neighbors.push(grid[row - 1][col]); // up
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]); // down
  if (col > 0) neighbors.push(grid[row][col - 1]); // left
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]); // right

  // Return only unvisited neighbors
  return neighbors.filter(neighbor => !neighbor.isVisited);
}

function reconstructPath(endNode: Node): Node[] {
  const path: Node[] = [];
  let currentNode: Node | null = endNode;

  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }

  // Only return path if it actually starts from a node with distance 0 (start node)
  if (path.length > 0 && path[0].distance === 0) {
    return path;
  }
  
  return [];
}