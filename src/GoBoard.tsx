import React, { useState, useCallback } from 'react';
import GoGame, { type Vertex, type Sign } from './GoGame';

interface GoBoardProps {
  size?: number;
  boardSize?: number;
  onGameStateChange?: (game: GoGame) => void;
  interactive?: boolean;
  showStarPoints?: boolean;
  showCoordinates?: boolean;
}

const GoBoard: React.FC<GoBoardProps> = ({
  size = 19,
  boardSize = 19,
  onGameStateChange,
  interactive = true,
  showCoordinates = true
}) => {
  const [game, setGame] = useState<GoGame>(() => GoGame.fromDimensions(boardSize, boardSize));
  const [currentPlayer, setCurrentPlayer] = useState<Sign>(1); // 1 for black, -1 for white
  const [hoverPosition, setHoverPosition] = useState<{ row: number; col: number } | null>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);

  // Calculate cell size based on board size
  const cellSize = size === 19 ? 25 : size === 13 ? 30 : 35;

  // Generate star point positions
  const getStarPoints = useCallback((): { row: number; col: number }[] => {
    if (boardSize === 19) {
      return [
        { row: 3, col: 3 }, { row: 3, col: 9 }, { row: 3, col: 15 },
        { row: 9, col: 3 }, { row: 9, col: 9 }, { row: 9, col: 15 },
        { row: 15, col: 3 }, { row: 15, col: 9 }, { row: 15, col: 15 }
      ];
    } else if (boardSize === 13) {
      return [
        { row: 3, col: 3 }, { row: 3, col: 9 },
        { row: 6, col: 6 },
        { row: 9, col: 3 }, { row: 9, col: 9 }
      ];
    } else if (boardSize === 9) {
      return [
        { row: 2, col: 2 }, { row: 2, col: 6 },
        { row: 4, col: 4 },
        { row: 6, col: 2 }, { row: 6, col: 6 }
      ];
    }
    return [];
  }, [boardSize]);

  const starPoints = getStarPoints();
  const letters = 'ABCDEFGHJKLMNOPQRST'.slice(0, boardSize);


  const handleIntersectionClick = useCallback((row: number, col: number) => {
    if (!interactive) return;

    // Convert UI coordinates (row, col) to GoGame coordinates (x, y)
    const vertex: Vertex = [col, row];

    // Check if the move is valid using GoGame's analyzeMove
    const moveAnalysis = game.analyzeMove(currentPlayer, vertex);
    
    if (moveAnalysis.pass || moveAnalysis.overwrite) {
      // Invalid move - position occupied or out of bounds
      return;
    }

    if (moveAnalysis.ko) {
      // Ko rule violation
      console.warn('Ko rule prevents this move');
      return;
    }

    if (moveAnalysis.suicide) {
      // Suicide move - could be prevented based on rules
      console.warn('This move would be suicide');
      // For now, we'll allow suicide moves but warn about them
    }

    try {
      // Make the move using GoGame logic
      const newGame = game.makeMove(currentPlayer, vertex, {
        preventOverwrite: true,
        preventKo: true,
        preventSuicide: false // Allow suicide for now
      });

      // Update game state
      setGame(newGame);
      setCurrentPlayer(currentPlayer === 1 ? -1 : 1);
      setLastMove({ row, col });
      
      // Notify parent component of game state change
      onGameStateChange?.(newGame);

      // Log the move
      const moveNotation = newGame.stringifyVertex(vertex);
      const playerName = currentPlayer === 1 ? 'Black' : 'White';
      console.log(`${playerName} played at ${moveNotation}`);

    } catch (error) {
      console.error('Failed to make move:', error);
    }
  }, [game, currentPlayer, interactive, onGameStateChange]);

  const getIntersectionType = (row: number, col: number) => {
    const isTopEdge = row === 0;
    const isBottomEdge = row === boardSize - 1;
    const isLeftEdge = col === 0;
    const isRightEdge = col === boardSize - 1;

    if (isTopEdge && isLeftEdge) return 'corner-top-left';
    if (isTopEdge && isRightEdge) return 'corner-top-right';
    if (isBottomEdge && isLeftEdge) return 'corner-bottom-left';
    if (isBottomEdge && isRightEdge) return 'corner-bottom-right';
    if (isTopEdge) return 'edge-top';
    if (isBottomEdge) return 'edge-bottom';
    if (isLeftEdge) return 'edge-left';
    if (isRightEdge) return 'edge-right';
    return 'interior';
  };

  const renderGridLines = (_row: number, _col: number, type: string) => {
    const lineStyle = {
      position: 'absolute' as const,
      backgroundColor: 'black',
    };

    const horizontalLine = {
      ...lineStyle,
      height: '1px',
      top: '50%',
      transform: 'translateY(-50%)',
    };

    const verticalLine = {
      ...lineStyle,
      width: '1px',
      left: '50%',
      transform: 'translateX(-50%)',
    };

    switch (type) {
      case 'corner-top-left':
        return (
          <>
            <div style={{ ...horizontalLine, width: '50%', left: '50%' }} />
            <div style={{ ...verticalLine, height: '50%', top: '50%' }} />
          </>
        );
      case 'corner-top-right':
        return (
          <>
            <div style={{ ...horizontalLine, width: '50%', left: '0' }} />
            <div style={{ ...verticalLine, height: '50%', top: '50%' }} />
          </>
        );
      case 'corner-bottom-left':
        return (
          <>
            <div style={{ ...horizontalLine, width: '50%', left: '50%' }} />
            <div style={{ ...verticalLine, height: '50%', top: '0' }} />
          </>
        );
      case 'corner-bottom-right':
        return (
          <>
            <div style={{ ...horizontalLine, width: '50%', left: '0' }} />
            <div style={{ ...verticalLine, height: '50%', top: '0' }} />
          </>
        );
      case 'edge-top':
        return (
          <>
            <div style={{ ...horizontalLine, width: '100%', left: '0' }} />
            <div style={{ ...verticalLine, height: '50%', top: '50%' }} />
          </>
        );
      case 'edge-bottom':
        return (
          <>
            <div style={{ ...horizontalLine, width: '100%', left: '0' }} />
            <div style={{ ...verticalLine, height: '50%', top: '0' }} />
          </>
        );
      case 'edge-left':
        return (
          <>
            <div style={{ ...horizontalLine, width: '50%', left: '50%' }} />
            <div style={{ ...verticalLine, height: '100%', top: '0' }} />
          </>
        );
      case 'edge-right':
        return (
          <>
            <div style={{ ...horizontalLine, width: '50%', left: '0' }} />
            <div style={{ ...verticalLine, height: '100%', top: '0' }} />
          </>
        );
      default: // interior
        return (
          <>
            <div style={{ ...horizontalLine, width: '100%', left: '0' }} />
            <div style={{ ...verticalLine, height: '100%', top: '0' }} />
          </>
        );
    }
  };

  // Render preview stone component
  const renderPreviewStone = (row: number, col: number) => {
    if (!interactive || !hoverPosition || hoverPosition.row !== row || hoverPosition.col !== col) {
      return null;
    }

    const vertex: Vertex = [col, row];
    const hasStone = game.get(vertex) !== 0;
    
    if (hasStone) return null;

    const stoneSize = Math.floor(cellSize * 0.8);
    const previewColor = currentPlayer === 1 ? 'black' : 'white';

    return (
      <div
        style={{
          position: 'absolute',
          width: `${stoneSize}px`,
          height: `${stoneSize}px`,
          borderRadius: '50%',
          zIndex: 8,
          opacity: 0.5,
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          background: previewColor === 'black' 
            ? 'radial-gradient(circle at 30% 30%, #666, #222 70%, #000)'
            : 'linear-gradient(to top, #C9D1FF, #fff)',
          border: previewColor === 'black' ? '1px solid #000' : '1px solid #c3c3c3',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* White stone highlight for preview */}
        {previewColor === 'white' && (
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              right: '2px',
              bottom: '4px',
              background: 'linear-gradient(to bottom, rgba(238, 238, 238, 0.6) 0%, rgba(238, 238, 238, 0) 100%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    );
  };

  const renderIntersection = (row: number, col: number) => {
    const intersectionType = getIntersectionType(row, col);
    const isStarPoint = starPoints.some(point => point.row === row && point.col === col);
    
    // Get stone state from GoGame
    const vertex: Vertex = [col, row];
    const stoneSign = game.get(vertex);
    const hasStone = stoneSign !== 0;
    const stoneColor = stoneSign === 1 ? 'black' : stoneSign === -1 ? 'white' : null;
    const isLastStone = lastMove && lastMove.row === row && lastMove.col === col;

    const intersectionStyle = {
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      position: 'relative' as const,
      cursor: interactive && !hasStone ? 'default' : 'default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const stoneSize = Math.floor(cellSize * 0.8);

    return (
      <div
        key={`${row}-${col}`}
        style={intersectionStyle}
        onClick={() => handleIntersectionClick(row, col)}
        onMouseEnter={() => {
          if (interactive) {
            setHoverPosition({ row, col });
          }
        }}
        onMouseLeave={() => {
          setHoverPosition(null);
        }}
      >
        {/* Grid lines */}
        {renderGridLines(row, col, intersectionType)}
        
        {/* Star point */}
        {isStarPoint && (
          <div
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              backgroundColor: 'black',
              borderRadius: '50%',
              zIndex: 5,
            }}
          />
        )}
        
        {/* Stone */}
        {hasStone && stoneColor && (
          <div
            style={{
              position: 'absolute',
              width: `${stoneSize}px`,
              height: `${stoneSize}px`,
              borderRadius: '50%',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              background: stoneColor === 'black' 
                ? 'radial-gradient(circle at 30% 30%, #666, #222 70%, #000)'
                : 'linear-gradient(to top, #C9D1FF, #fff)',
              border: stoneColor === 'black' ? '1px solid #000' : '1px solid #c3c3c3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* White stone highlight */}
            {stoneColor === 'white' && (
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '4px',
                  background: 'linear-gradient(to bottom, rgba(238, 238, 238, 0.8) 0%, rgba(238, 238, 238, 0) 100%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
            )}
            
            {/* Last stone indicator */}
            {isLastStone && (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  border: `1.5px solid ${stoneColor === 'black' ? 'white' : 'black'}`,
                  zIndex: 11,
                }}
              />
            )}
          </div>
        )}
        
        {/* Coordinates */}
        {showCoordinates && (
          <>
            {/* Letter coordinates on top edge */}
            {row === 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#8b4513',
                  pointerEvents: 'none',
                  zIndex: 15,
                }}
              >
                {letters[col]}
              </div>
            )}
            
            {/* Letter coordinates on bottom edge */}
            {row === boardSize - 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#8b4513',
                  pointerEvents: 'none',
                  zIndex: 15,
                }}
              >
                {letters[col]}
              </div>
            )}
            
            {/* Number coordinates on left edge */}
            {col === 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#8b4513',
                  pointerEvents: 'none',
                  zIndex: 15,
                }}
              >
                {boardSize - row}
              </div>
            )}
            
            {/* Number coordinates on right edge */}
            {col === boardSize - 1 && (
              <div
                style={{
                  position: 'absolute',
                  right: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#8b4513',
                  pointerEvents: 'none',
                  zIndex: 15,
                }}
              >
                {boardSize - row}
              </div>
            )}
          </>
        )}
        
        {/* Preview stone */}
        {renderPreviewStone(row, col)}
      </div>
    );
  };

  const boardStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
    gap: '0',
    background: '#deb887',
    border: '20px solid #8b4513',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    padding: '20px',
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '20px',
    background: '#f5f5dc',
    minHeight: '100vh',
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        Go Game ({boardSize}×{boardSize})
      </h1>
      
      <div style={boardStyle}>
        {Array.from({length: boardSize}, (_, row) =>
          Array.from({length: boardSize}, (_, col) =>
            renderIntersection(row, col)
          )
        )}
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
        <div>
          <strong>Current player: {currentPlayer === 1 ? 'Black' : 'White'}</strong>
        </div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>
          Black captures: {game.getCaptures(1)} | White captures: {game.getCaptures(-1)}
        </div>
        {interactive && (
          <div style={{ fontSize: '12px', marginTop: '5px', fontStyle: 'italic' }}>
            Click any empty intersection to place a stone
          </div>
        )}
      </div>
    </div>
  );
};

export default GoBoard;