export type NodeType = 
  | 'empty' 
  | 'wall' 
  | 'start' 
  | 'end' 
  | 'visited' 
  | 'visited-dijkstra'
  | 'visited-astar'
  | 'path'
  | 'path-dijkstra'
  | 'path-astar';

export interface Node {
  row: number;
  col: number;
  type: NodeType;
  distance: number;
  isVisited: boolean;
  previousNode: Node | null;
}

export interface GridSize {
  rows: number;
  cols: number;
}

export interface AlgorithmResult {
  visitedNodesInOrder: Node[];
  shortestPath: Node[];
}