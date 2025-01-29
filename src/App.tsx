import React, { useState, useCallback, useEffect } from 'react';
import { Play, RotateCcw, MousePointer2, Split } from 'lucide-react';
import Grid from './components/Grid';
import { Node, NodeType, GridSize } from './types/grid';
import { dijkstra } from './algorithms/dijkstra';
import { astar } from './algorithms/astar';

// Add algorithm type
type AlgorithmType = 'dijkstra' | 'astar' | 'compare';

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

  const runAlgorithm = (type: 'dijkstra' | 'astar', grid: Node[][]): {
    visitedNodes: Node[];
    path: Node[];
    executionTime: number;
  } => {
    const startTime = performance.now();
    const result = type === 'dijkstra' 
      ? dijkstra(grid, startNode!, endNode!)
      : astar(grid, startNode!, endNode!);
    const endTime = performance.now();
    return {
      ...result,
      executionTime: endTime - startTime
    };
  };

  const visualizeAlgorithm = async () => {
    try {
      if (!startNode || !endNode) {
        setError('Please set both start and end points');
        return;
      }
      
      setIsRunning(true);
      setError(null);
      setDijkstraMetrics(null);
      setAstarMetrics(null);

      // Reset grid visualization
      const newGrid = grid.map(row =>
        row.map(node => ({
          ...node,
          distance: Infinity,
          gScore: Infinity,
          fScore: Infinity,
          hScore: 0,
          isVisited: false,
          previousNode: null,
          type: ['visited', 'path', 'visited-dijkstra', 'visited-astar', 'path-dijkstra', 'path-astar'].includes(node.type) 
            ? 'empty' 
            : node.type,
        }))
      );
      setGrid(newGrid);

      if (algorithm === 'compare') {
        // Run both algorithms
        const gridCopy1 = newGrid.map(row => row.map(node => ({ ...node })));
        const gridCopy2 = newGrid.map(row => row.map(node => ({ ...node })));

        const dijkstraResult = runAlgorithm('dijkstra', gridCopy1);
        const astarResult = runAlgorithm('astar', gridCopy2);

        // Visualize both algorithms side by side
        const maxLength = Math.max(
          dijkstraResult.visitedNodes.length,
          astarResult.visitedNodes.length
        );

        for (let i = 0; i < maxLength; i++) {
          await new Promise<void>(resolve => {
            setTimeout(() => {
              setGrid(g => {
                const newG = g.map(row => row.map(node => ({ ...node })));
                
                if (i < dijkstraResult.visitedNodes.length) {
                  const dijkstraNode = dijkstraResult.visitedNodes[i];
                  if (newG[dijkstraNode.row][dijkstraNode.col].type === 'empty') {
                    newG[dijkstraNode.row][dijkstraNode.col].type = 'visited-dijkstra';
                  }
                }

                if (i < astarResult.visitedNodes.length) {
                  const astarNode = astarResult.visitedNodes[i];
                  if (newG[astarNode.row][astarNode.col].type === 'empty') {
                    newG[astarNode.row][astarNode.col].type = 'visited-astar';
                  }
                }

                return newG;
              });
              resolve();
            }, ANIMATION_SPEED);
          });
        }

        // Visualize paths
        const maxPathLength = Math.max(
          dijkstraResult.path.length,
          astarResult.path.length
        );

        for (let i = 0; i < maxPathLength; i++) {
          await new Promise<void>(resolve => {
            setTimeout(() => {
              setGrid(g => {
                const newG = g.map(row => row.map(node => ({ ...node })));
                
                if (i < dijkstraResult.path.length) {
                  const dijkstraNode = dijkstraResult.path[i];
                  if (newG[dijkstraNode.row][dijkstraNode.col].type !== 'start' && 
                      newG[dijkstraNode.row][dijkstraNode.col].type !== 'end') {
                    newG[dijkstraNode.row][dijkstraNode.col].type = 'path-dijkstra';
                  }
                }

                if (i < astarResult.path.length) {
                  const astarNode = astarResult.path[i];
                  if (newG[astarNode.row][astarNode.col].type !== 'start' && 
                      newG[astarNode.row][astarNode.col].type !== 'end') {
                    newG[astarNode.row][astarNode.col].type = 'path-astar';
                  }
                }

                return newG;
              });
              resolve();
            }, ANIMATION_SPEED * 2);
          });
        }

        // Set metrics
        setDijkstraMetrics({
          executionTime: dijkstraResult.executionTime,
          nodesVisited: dijkstraResult.visitedNodes.length,
          pathLength: dijkstraResult.path.length,
          pathFound: dijkstraResult.path.length > 0
        });

        setAstarMetrics({
          executionTime: astarResult.executionTime,
          nodesVisited: astarResult.visitedNodes.length,
          pathLength: astarResult.path.length,
          pathFound: astarResult.path.length > 0
        });

      } else {
        // Run single algorithm
        const result = runAlgorithm(algorithm, newGrid);
        
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
            }, ANIMATION_SPEED);
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
              }, ANIMATION_SPEED * 2);
            });
          }
        } else {
          setError('No path found!');
        }

        // Set metrics for the chosen algorithm
        const metrics = {
          executionTime: result.executionTime,
          nodesVisited: result.visitedNodes.length,
          pathLength: result.path.length,
          pathFound: result.path.length > 0
        };

        if (algorithm === 'dijkstra') {
          setDijkstraMetrics(metrics);
        } else {
          setAstarMetrics(metrics);
        }
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
              <option value="compare">Compare Both</option>
            </select>

            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              onClick={visualizeAlgorithm}
              disabled={!startNode || !endNode || isRunning}
            >
              {algorithm === 'compare' ? (
                <>
                  <Split size={20} />
                  Compare Algorithms
                </>
              ) : (
                <>
                  <Play size={20} />
                  Visualize {algorithm === 'dijkstra' ? "Dijkstra's" : "A*"}
                </>
              )}
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
          {(dijkstraMetrics || astarMetrics) && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              {dijkstraMetrics && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">Dijkstra's Algorithm</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Execution Time: {dijkstraMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {dijkstraMetrics.nodesVisited}</li>
                    <li>Path Length: {dijkstraMetrics.pathLength}</li>
                    <li>Path Found: {dijkstraMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {astarMetrics && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-bold text-purple-800 mb-2">A* Algorithm</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Execution Time: {astarMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {astarMetrics.nodesVisited}</li>
                    <li>Path Length: {astarMetrics.pathLength}</li>
                    <li>Path Found: {astarMetrics.pathFound ? 'Yes' : 'No'}</li>
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