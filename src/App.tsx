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

// Add this type and state
type AnimationSpeed = 'veryFast' | 'fast' | 'normal' | 'slow' | 'verySlow';

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
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>('normal');
  const [bfsMetrics, setBfsMetrics] = useState<AlgorithmMetrics | null>(null);
  const [dfsMetrics, setDfsMetrics] = useState<AlgorithmMetrics | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'single' | 'comparison'>('single');
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<Record<AlgorithmType, boolean>>({
    dijkstra: false,
    astar: false,
    bfs: false,
    dfs: false
  });

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
    setError(null);
    // Reset all metrics
    setDijkstraMetrics(null);
    setAstarMetrics(null);
    setBfsMetrics(null);
    setDfsMetrics(null);
  }, []);

  const handleNodeClick = (row: number, col: number) => {
    if (isRunning) return;
    
    const node = grid[row][col];
    if (currentTool === 'start') {
      // Remove previous start node if exists
      if (startNode) {
        setGrid(g => {
          const newGrid = g.map(row => row.map(node => ({ ...node })));
          newGrid[startNode.row][startNode.col].type = 'empty';
          return newGrid;
        });
      }
      // Set new start node
      setGrid(g => {
        const newGrid = g.map(row => row.map(node => ({ ...node })));
        newGrid[row][col].type = 'start';
        return newGrid;
      });
      setStartNode(node);
    } else if (currentTool === 'end') {
      // Remove previous end node if exists
      if (endNode) {
        setGrid(g => {
          const newGrid = g.map(row => row.map(node => ({ ...node })));
          newGrid[endNode.row][endNode.col].type = 'empty';
          return newGrid;
        });
      }
      // Set new end node
      setGrid(g => {
        const newGrid = g.map(row => row.map(node => ({ ...node })));
        newGrid[row][col].type = 'end';
        return newGrid;
      });
      setEndNode(node);
    } else if (currentTool === 'wall' && 
               node.type !== 'start' && 
               node.type !== 'end') {
      setGrid(g => {
        const newGrid = g.map(row => row.map(n => ({ ...n })));
        newGrid[row][col].type = newGrid[row][col].type === 'wall' ? 'empty' : 'wall';
        return newGrid;
      });
    }
  };

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
  const getAnimationSpeed = (speed: AnimationSpeed): number => {
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

    // Reset all metrics
    setDijkstraMetrics(null);
    setAstarMetrics(null);
    setBfsMetrics(null);
    setDfsMetrics(null);

    try {
      if (comparisonMode === 'single') {
        // Single algorithm visualization
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
              throw new Error('Invalid algorithm');
          }
        })();
        const endTime = performance.now();

        // Set metrics for single algorithm
        const metrics: AlgorithmMetrics = {
          executionTime: endTime - startTime,
          nodesVisited: result.visitedNodes.length,
          pathLength: result.path.length,
          pathFound: result.path.length > 0
        };

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

        // Visualize nodes
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
        }
      } else {
        // Comparison mode
        const selectedAlgos = Object.entries(selectedAlgorithms)
          .filter(([_, selected]) => selected)
          .map(([algo]) => algo as AlgorithmType);

        for (const algo of selectedAlgos) {
          // Reset grid for each algorithm
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

          const startTime = performance.now();
          const result = (() => {
            switch (algo) {
              case 'dijkstra':
                return dijkstra(newGrid, startNode, endNode);
              case 'astar':
                return astar(newGrid, startNode, endNode);
              case 'bfs':
                return bfs(newGrid, startNode, endNode);
              case 'dfs':
                return dfs(newGrid, startNode, endNode);
              default:
                throw new Error('Invalid algorithm');
            }
          })();
          const endTime = performance.now();

          // Set metrics for current algorithm
          const metrics: AlgorithmMetrics = {
            executionTime: endTime - startTime,
            nodesVisited: result.visitedNodes.length,
            pathLength: result.path.length,
            pathFound: result.path.length > 0
          };

          switch (algo) {
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

          // Visualize nodes
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
          }

          // Add delay between algorithms
          if (algo !== selectedAlgos[selectedAlgos.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
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
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-8">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">
            Pathfinding Visualizer
          </h1>

          {/* Controls Section with better mobile layout */}
          <div className="flex flex-col gap-2">
            {/* Algorithm and Speed Selectors */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="w-full sm:w-44 px-2 py-1.5 text-sm md:text-base border rounded-lg"
                value={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.value as ComparisonMode)}
                disabled={isRunning}
              >
                <option value="single">Single Algorithm</option>
                <option value="compare">Compare Algorithms</option>
              </select>

              <select
                className="w-full sm:w-36 px-2 py-1.5 text-sm md:text-base border rounded-lg"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(e.target.value as AnimationSpeed)}
                disabled={isRunning}
              >
                <option value="veryFast">Very Fast</option>
                <option value="fast">Fast</option>
                <option value="normal">Normal</option>
                <option value="slow">Slow</option>
                <option value="verySlow">Very Slow</option>
              </select>

              {comparisonMode === 'single' && (
                <select
                  className="w-full sm:w-44 px-2 py-1.5 text-sm md:text-base border rounded-lg"
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
                  disabled={isRunning}
                >
                  <option value="dijkstra">Dijkstra's Algorithm</option>
                  <option value="astar">A* Algorithm</option>
                  <option value="bfs">Breadth-First Search</option>
                  <option value="dfs">Depth-First Search</option>
                </select>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:flex gap-2">
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm md:text-base rounded-lg hover:bg-green-600 disabled:opacity-50"
                onClick={visualizeAlgorithm}
                disabled={!startNode || !endNode || isRunning}
              >
                <Play size={16} className="hidden sm:block" />
                {comparisonMode === 'single' 
                  ? `Visualize ${algorithm === 'dijkstra' ? "Dijkstra's" : algorithm === 'astar' ? "A*" : algorithm === 'bfs' ? "BFS" : "DFS"}`
                  : 'Compare'
                }
              </button>
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-200 text-sm md:text-base rounded-lg hover:bg-gray-300 disabled:opacity-50"
                onClick={resetGrid}
                disabled={isRunning}
              >
                <RotateCcw size={16} className="hidden sm:block" />
                Reset
              </button>
            </div>

            {/* Tool Buttons */}
            <div className="grid grid-cols-3 sm:flex gap-2">
              <button
                className={`w-full sm:w-20 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-sm md:text-base ${
                  currentTool === 'wall' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setCurrentTool('wall')}
                disabled={isRunning}
              >
                <MousePointer2 size={16} className="hidden sm:block" />
                Wall
              </button>
              <button
                className={`w-full sm:w-20 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-sm md:text-base ${
                  currentTool === 'start' ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setCurrentTool('start')}
                disabled={isRunning}
              >
                Start
              </button>
              <button
                className={`w-full sm:w-20 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-sm md:text-base ${
                  currentTool === 'end' ? 'bg-red-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setCurrentTool('end')}
                disabled={isRunning}
              >
                End
              </button>
            </div>

            {/* Comparison Checkboxes */}
            {comparisonMode === 'compare' && (
              <div className="grid grid-cols-2 gap-2 text-sm md:text-base">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedAlgorithms.dijkstra}
                    onChange={(e) => setSelectedAlgorithms(prev => ({
                      ...prev,
                      dijkstra: e.target.checked
                    }))}
                    disabled={isRunning}
                  />
                  Dijkstra's
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedAlgorithms.astar}
                    onChange={(e) => setSelectedAlgorithms(prev => ({
                      ...prev,
                      astar: e.target.checked
                    }))}
                    disabled={isRunning}
                  />
                  A*
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedAlgorithms.bfs}
                    onChange={(e) => setSelectedAlgorithms(prev => ({
                      ...prev,
                      bfs: e.target.checked
                    }))}
                    disabled={isRunning}
                  />
                  BFS
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedAlgorithms.dfs}
                    onChange={(e) => setSelectedAlgorithms(prev => ({
                      ...prev,
                      dfs: e.target.checked
                    }))}
                    disabled={isRunning}
                  />
                  DFS
                </label>
              </div>
            )}
          </div>

          {/* Metrics Display */}
          {comparisonMode === 'compare' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {selectedAlgorithms.dijkstra && dijkstraMetrics && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">Dijkstra's Algorithm</h3>
                  <ul className="space-y-1 text-xs md:text-sm">
                    <li>Execution Time: {dijkstraMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {dijkstraMetrics.nodesVisited}</li>
                    <li>Path Length: {dijkstraMetrics.pathLength}</li>
                    <li>Path Found: {dijkstraMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {selectedAlgorithms.astar && astarMetrics && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h3 className="font-bold text-purple-800 mb-2">A* Algorithm</h3>
                  <ul className="space-y-1 text-xs md:text-sm">
                    <li>Execution Time: {astarMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {astarMetrics.nodesVisited}</li>
                    <li>Path Length: {astarMetrics.pathLength}</li>
                    <li>Path Found: {astarMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {selectedAlgorithms.bfs && bfsMetrics && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">BFS Algorithm</h3>
                  <ul className="space-y-1 text-xs md:text-sm">
                    <li>Execution Time: {bfsMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {bfsMetrics.nodesVisited}</li>
                    <li>Path Length: {bfsMetrics.pathLength}</li>
                    <li>Path Found: {bfsMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {selectedAlgorithms.dfs && dfsMetrics && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h3 className="font-bold text-yellow-800 mb-2">DFS Algorithm</h3>
                  <ul className="space-y-1 text-xs md:text-sm">
                    <li>Execution Time: {dfsMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {dfsMetrics.nodesVisited}</li>
                    <li>Path Length: {dfsMetrics.pathLength}</li>
                    <li>Path Found: {dfsMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            // Single algorithm metrics display
            <div className="mt-4">
              {algorithm === 'dijkstra' && dijkstraMetrics && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">Dijkstra's Results</h3>
                  <ul className="space-y-1 text-xs md:text-sm">
                    <li>Execution Time: {dijkstraMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {dijkstraMetrics.nodesVisited}</li>
                    <li>Path Length: {dijkstraMetrics.pathLength}</li>
                    <li>Path Found: {dijkstraMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {algorithm === 'astar' && astarMetrics && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h3 className="font-bold text-purple-800 mb-2">A* Results</h3>
                  <ul className="space-y-1 text-xs md:text-sm">
                    <li>Execution Time: {astarMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {astarMetrics.nodesVisited}</li>
                    <li>Path Length: {astarMetrics.pathLength}</li>
                    <li>Path Found: {astarMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {algorithm === 'bfs' && bfsMetrics && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">BFS Results</h3>
                  <ul className="space-y-1 text-xs md:text-sm">
                    <li>Execution Time: {bfsMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {bfsMetrics.nodesVisited}</li>
                    <li>Path Length: {bfsMetrics.pathLength}</li>
                    <li>Path Found: {bfsMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
              {algorithm === 'dfs' && dfsMetrics && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h3 className="font-bold text-yellow-800 mb-2">DFS Results</h3>
                  <ul className="space-y-1 text-xs md:text-sm">
                    <li>Execution Time: {dfsMetrics.executionTime.toFixed(2)}ms</li>
                    <li>Nodes Visited: {dfsMetrics.nodesVisited}</li>
                    <li>Path Length: {dfsMetrics.pathLength}</li>
                    <li>Path Found: {dfsMetrics.pathFound ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Grid Container with better mobile scaling */}
          <div className="flex justify-center overflow-hidden">
            <div className="transform scale-[0.4] sm:scale-[0.6] md:scale-[0.8] lg:scale-100 origin-top">
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
          </div>

          {/* Instructions */}
          <div className="mt-4 text-xs sm:text-sm text-gray-600">
            <p className="mb-2">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select tool (Wall, Start, End)</li>
              <li>Click/drag for walls</li>
              <li>Click for start/end points</li>
              <li>Press Visualize to start</li>
              <li>Shortcuts: (W)all, (S)tart, (E)nd, (R)eset, Space to visualize</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;