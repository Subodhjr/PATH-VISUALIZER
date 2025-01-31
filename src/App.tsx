import React, { useState, useCallback, useEffect } from 'react';
import { Play, RotateCcw, MousePointer2, Split } from 'lucide-react';
import Grid from './components/Grid';
import { Node, NodeType, GridSize } from './types/grid';
import { dijkstra } from './algorithms/dijkstra';
import { astar } from './algorithms/astar';
import { bfs } from './algorithms/bfs';
import { dfs } from './algorithms/dfs';

// Add algorithm type
type AlgorithmType = 'dijkstra' | 'astar' | 'bfs' | 'dfs';

interface AlgorithmMetrics {
  executionTime: number;
  nodesVisited: number;
  pathLength: number;
  pathFound: boolean;
}

const GRID_SIZE: GridSize = { rows: 20, cols: 35 };
const CELL_SIZE = 25;
const ANIMATION_SPEED = 20;

function App() {
  // Add algorithm state
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('dijkstra');
  const [grid, setGrid] = useState<Node[][]>(() => createInitialGrid());
  const [isRunning, setIsRunning] = useState(false);
  const [startNode, setStartNode] = useState<Node | null>(null);
  const [endNode, setEndNode] = useState<Node | null>(null);
  const [currentTool, setCurrentTool] = useState<'wall' | 'start' | 'end'>('wall');
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dijkstraMetrics, setDijkstraMetrics] = useState<AlgorithmMetrics | null>(null);
  const [astarMetrics, setAstarMetrics] = useState<AlgorithmMetrics | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState<SpeedOption>('normal');
  const [bfsMetrics, setBfsMetrics] = useState<AlgorithmMetrics | null>(null);
  const [dfsMetrics, setDfsMetrics] = useState<AlgorithmMetrics | null>(null);

  function createInitialGrid(): Node[][] {
    const newGrid: Node[][] = [];
    for (let row = 0; row < GRID_SIZE.rows; row++) {
      const currentRow: Node[] = [];
      for (let col = 0; col < GRID_SIZE.cols; col++) {
        currentRow.push({
          row,
          col,
          type: 'empty',
          distance: Infinity,
          isVisited: false,
          previousNode: null,
        });
      }
      newGrid.push(currentRow);
    }
    return newGrid;
  }

  const resetGrid = useCallback(() => {
    setGrid(createInitialGrid());
    setStartNode(null);
    setEndNode(null);
    setIsRunning(false);
    setError(null);
  }, []);

  const handleNodeClick = useCallback((row: number, col: number) => {
    if (isRunning) return;

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(rowArray => rowArray.map(node => ({ ...node })));
      const clickedNode = newGrid[row][col];

      if (currentTool === 'start') {
        if (startNode) {
          newGrid[startNode.row][startNode.col].type = 'empty';
        }
        clickedNode.type = 'start';
        setStartNode(clickedNode);
      } else if (currentTool === 'end') {
        if (endNode) {
          newGrid[endNode.row][endNode.col].type = 'empty';
        }
        clickedNode.type = 'end';
        setEndNode(clickedNode);
      } else if (currentTool === 'wall' && 
                 clickedNode.type !== 'start' && 
                 clickedNode.type !== 'end') {
        clickedNode.type = clickedNode.type === 'wall' ? 'empty' : 'wall';
      }

      return newGrid;
    });
  }, [currentTool, isRunning, startNode, endNode]);

  const handleMouseDown = useCallback((row: number, col: number) => {
    if (isRunning || currentTool !== 'wall') return;
    setIsMousePressed(true);
    handleNodeClick(row, col);
  }, [isRunning, currentTool, handleNodeClick]);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (!isMousePressed || isRunning || currentTool !== 'wall') return;
    handleNodeClick(row, col);
  }, [isMousePressed, isRunning, currentTool, handleNodeClick]);

  const handleMouseUp = useCallback(() => {
    setIsMousePressed(false);
  }, []);

  const runAlgorithm = (type: 'dijkstra' | 'astar' | 'bfs' | 'dfs', grid: Node[][]): {
    visitedNodes: Node[];
    path: Node[];
    executionTime: number;
  } => {
    const startTime = performance.now();
    const result = type === 'dijkstra' 
      ? dijkstra(grid, startNode!, endNode!)
      : type === 'astar' 
        ? astar(grid, startNode!, endNode!)
        : type === 'bfs' 
          ? bfs(grid, startNode!, endNode!)
          : dfs(grid, startNode!, endNode!);
    const endTime = performance.now();
    return {
      ...result,
      executionTime: endTime - startTime
    };
  };

  // Add speed mapping function
  const getAnimationSpeed = (speed: SpeedOption): number => {
    const speedMap = {
      veryFast: 5,
      fast: 15,
      normal: 25,
      slow: 50,
      verySlow: 100
    };
    return speedMap[speed];
  };

  const visualizeAlgorithm = async () => {
    if (!startNode || !endNode || isRunning) return;
    setIsRunning(true);
    setError(null);

    // Reset the grid visualization
    const newGrid = grid.map(row =>
      row.map(node => ({
        ...node,
        isVisited: false,
        distance: Infinity,
        previousNode: null,
        type: ['visited', 'path'].includes(node.type) ? 'empty' : node.type,
      }))
    );
    setGrid(newGrid);

    try {
      // Reset all metrics
      setDijkstraMetrics(null);
      setAstarMetrics(null);
      setBfsMetrics(null);
      setDfsMetrics(null);

      const startTime = performance.now();
      const result = (() => {
        switch (algorithm) {
          case 'dijkstra':
            return dijkstra(newGrid, startNode, endNode);
          case 'astar':
            return astar(newGrid, startNode, endNode);
          case 'bfs':
            return bfs(newGrid, startNode, endNode);
          case 'dfs':
            return dfs(newGrid, startNode, endNode);
          default:
            throw new Error('Invalid algorithm selected');
        }
      })();
      const endTime = performance.now();

      // Create metrics
      const metrics: AlgorithmMetrics = {
        executionTime: endTime - startTime,
        nodesVisited: result.visitedNodes.length,
        pathLength: result.path.length,
        pathFound: result.path.length > 0
      };

      // Set appropriate metrics based on algorithm
      switch (algorithm) {
        case 'dijkstra':
          setDijkstraMetrics(metrics);
          break;
        case 'astar':
          setAstarMetrics(metrics);
          break;
        case 'bfs':
          setBfsMetrics(metrics);
          break;
        case 'dfs':
          setDfsMetrics(metrics);
          break;
      }

      // Visualize visited nodes
      for (let i = 0; i < result.visitedNodes.length; i++) {
        await new Promise<void>(resolve => {
          setTimeout(() => {
            setGrid(g => {
              const newG = g.map(row => row.map(node => ({ ...node })));
              const node = result.visitedNodes[i];
              if (newG[node.row][node.col].type === 'empty') {
                newG[node.row][node.col].type = 'visited';
              }
              return newG;
            });
            resolve();
          }, getAnimationSpeed(animationSpeed));
        });
      }

      // Visualize path
      if (result.path.length > 0) {
        for (let i = 0; i < result.path.length; i++) {
          await new Promise<void>(resolve => {
            setTimeout(() => {
              setGrid(g => {
                const newG = g.map(row => row.map(node => ({ ...node })));
                const node = result.path[i];
                if (newG[node.row][node.col].type !== 'start' && 
                    newG[node.row][node.col].type !== 'end') {
                  newG[node.row][node.col].type = 'path';
                }
                return newG;
              });
              resolve();
            }, getAnimationSpeed(animationSpeed) * 2);
          });
        }
      } else {
        setError('No path found!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isRunning) return;
      
      switch (e.key.toLowerCase()) {
        case 'w':
          setCurrentTool('wall');
          break;
        case 's':
          setCurrentTool('start');
          break;
        case 'e':
          setCurrentTool('end');
          break;
        case 'r':
          resetGrid();
          break;
        case ' ':
          e.preventDefault();
          if (!isRunning && startNode && endNode) {
            visualizeAlgorithm();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, startNode, endNode, resetGrid]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Pathfinding Visualizer
          </h1>

          <div className="flex gap-4 mb-6">
            {/* Add algorithm selector */}
            <select
              className="px-4 py-2 border rounded-lg"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
              disabled={isRunning}
            >
              <option value="dijkstra">Dijkstra's Algorithm</option>
              <option value="astar">A* Algorithm</option>
              <option value="bfs">Breadth-First Search</option>
              <option value="dfs">Depth-First Search</option>
            </select>

            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              onClick={visualizeAlgorithm}
              disabled={!startNode || !endNode || isRunning}
            >
              <Play size={20} />
              Visualize {
                algorithm === 'dijkstra' ? "Dijkstra's" : 
                algorithm === 'astar' ? "A*" :
                algorithm === 'bfs' ? "BFS" :
                "DFS"
              }
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              onClick={resetGrid}
              disabled={isRunning}
            >
              <RotateCcw size={20} />
              Reset
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  currentTool === 'wall' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setCurrentTool('wall')}
                disabled={isRunning}
              >
                <MousePointer2 size={20} />
                Wall
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  currentTool === 'start' ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setCurrentTool('start')}
                disabled={isRunning}
              >
                Start Point
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  currentTool === 'end' ? 'bg-red-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setCurrentTool('end')}
                disabled={isRunning}
              >
                End Point
              </button>
            </div>
          </div>

          {/* Algorithm Metrics */}
          {(dijkstraMetrics || astarMetrics || bfsMetrics || dfsMetrics) && (
            <div className="mt-6 grid grid-cols-1 gap-4">
              {algorithm === 'dijkstra' && dijkstraMetrics && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">Dijkstra's Algorithm Results</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Execution Time: {dijkstraMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {dijkstraMetrics.nodesVisited}</li>
                    <li>Path Length: {dijkstraMetrics.pathLength}</li>
                    <li>Path Found: {dijkstraMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {algorithm === 'astar' && astarMetrics && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-bold text-purple-800 mb-2">A* Algorithm Results</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Execution Time: {astarMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {astarMetrics.nodesVisited}</li>
                    <li>Path Length: {astarMetrics.pathLength}</li>
                    <li>Path Found: {astarMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {algorithm === 'bfs' && bfsMetrics && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">BFS Algorithm Results</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Execution Time: {bfsMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {bfsMetrics.nodesVisited}</li>
                    <li>Path Length: {bfsMetrics.pathLength}</li>
                    <li>Path Found: {bfsMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {algorithm === 'dfs' && dfsMetrics && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-bold text-yellow-800 mb-2">DFS Algorithm Results</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Execution Time: {dfsMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {dfsMetrics.nodesVisited}</li>
                    <li>Path Length: {dfsMetrics.pathLength}</li>
                    <li>Path Found: {dfsMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <Grid
              grid={grid}
              gridSize={GRID_SIZE}
              cellSize={CELL_SIZE}
              onNodeClick={handleNodeClick}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseUp={handleMouseUp}
            />
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p className="mb-2">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select a tool (Wall, Start Point, or End Point) from the toolbar</li>
              <li>Click and drag to draw walls quickly</li>
              <li>Click to place start and end points</li>
              <li>Click "Visualize" to see the algorithm in action</li>
              <li>Use "Reset" to clear the grid and start over</li>
              <li>Keyboard shortcuts: (W)all, (S)tart, (E)nd, (R)eset, Space to visualize</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;