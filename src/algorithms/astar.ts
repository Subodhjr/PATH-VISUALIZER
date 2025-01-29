import { Node } from '../types/grid';

export function astar(
  grid: Node[][],
  startNode: Node,
  endNode: Node
): { visitedNodes: Node[]; path: Node[] } {
  const visitedNodes: Node[] = [];
  const openSet: Node[] = [];
  const closedSet = new Set<Node>();
  
  // Reset and initialize all nodes
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      const node = grid[row][col];
      node.gScore = Infinity;
      node.fScore = Infinity;
      node.hScore = manhattanDistance(node, endNode);
      node.previousNode = null;
      node.isVisited = false;
    }
  }

  // Initialize start node
  startNode.gScore = 0;
  startNode.fScore = startNode.hScore;
  openSet.push(startNode);

  while (openSet.length > 0) {
    // Get node with lowest fScore
    openSet.sort((a, b) => a.fScore - b.fScore);
    const currentNode = openSet.shift()!;

    // Skip if already in closed set or is a wall
    if (closedSet.has(currentNode) || currentNode.type === 'wall') continue;

    // Add to visited nodes and closed set
    currentNode.isVisited = true;
    visitedNodes.push(currentNode);
    closedSet.add(currentNode);

    // Check if we reached the end node
    if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
      const path = reconstructPath(currentNode);
      return {
        visitedNodes,
        path
      };
    }

    // Get valid neighbors
    const neighbors = getValidNeighbors(currentNode, grid);
    
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor) || neighbor.type === 'wall') continue;

      // Calculate tentative gScore
      const tentativeGScore = currentNode.gScore + 1;

      if (tentativeGScore < neighbor.gScore) {
        // This path is better, record it
        neighbor.previousNode = currentNode;
        neighbor.gScore = tentativeGScore;
        neighbor.fScore = neighbor.gScore + neighbor.hScore;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return { visitedNodes, path: [] };
}

function manhattanDistance(nodeA: Node, nodeB: Node): number {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
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

  // Only return path if it actually starts from a node with gScore 0 (start node)
  if (path.length > 0 && path[0].gScore === 0) {
    return path;
  }
  
  return [];
}