import React, { useState } from 'react';

interface Stone {
  row: number;
  col: number;
  color: 'black' | 'white';
}

interface GoBoardProps {
  size?: number;
  boardSize?: number;
  initialStones?: Stone[];
  onStonePlace?: (row: number, col: number, color: 'black' | 'white') => void;
  interactive?: boolean;
  showStarPoints?: boolean;
  showCoordinates?: boolean;
}

const GoBoard: React.FC<GoBoardProps> = ({
  size = 19,
  boardSize = 19,
  initialStones = [],
  onStonePlace,
  interactive = true,
  showCoordinates = true
}) => {
  const [stones, setStones] = useState<Stone[]>(initialStones);
  const [nextStone, setNextStone] = useState<'black' | 'white'>('black');

  // Calculate cell size based on board size
  const cellSize = size === 19 ? 25 : size === 13 ? 30 : 35;

  // Generate star point positions
  const getStarPoints = (): { row: number; col: number }[] => {
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
  };

  const starPoints = getStarPoints();
  const letters = 'ABCDEFGHJKLMNOPQRST'.slice(0, boardSize);

  const handleIntersectionClick = (row: number, col: number) => {
    if (!interactive) return;

    // Check if position is already occupied
    const occupied = stones.some(stone => stone.row === row && stone.col === col);
    if (occupied) return;

    const newStone: Stone = { row, col, color: nextStone };
    setStones([...stones, newStone]);
    setNextStone(nextStone === 'black' ? 'white' : 'black');

    if (onStonePlace) {
      onStonePlace(row, col, nextStone);
    }
  };

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

  const renderIntersection = (row: number, col: number) => {
    const intersectionType = getIntersectionType(row, col);
    const isStarPoint = starPoints.some(point => point.row === row && point.col === col);
    const stone = stones.find(s => s.row === row && s.col === col);
    const isLastStone = stone && stones.indexOf(stone) === stones.length - 1;

    const intersectionStyle = {
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      position: 'relative' as const,
      cursor: interactive && !stone ? 'crosshair' : 'default',
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
          if (interactive && !stone) {
            // Could add hover effect here
          }
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
        {stone && (
          <div
            style={{
              position: 'absolute',
              width: `${stoneSize}px`,
              height: `${stoneSize}px`,
              borderRadius: '50%',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              background: stone.color === 'black' 
                ? 'radial-gradient(circle at 30% 30%, #666, #222 70%, #000)'
                : 'linear-gradient(to top, #C9D1FF, #fff)',
              border: stone.color === 'black' ? '1px solid #000' : '1px solid #c3c3c3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* White stone highlight */}
            {stone.color === 'white' && (
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
                  border: `1.5px solid ${stone.color === 'black' ? 'white' : 'black'}`,
                  zIndex: 11,
                }}
              />
            )}
          </div>
        )}
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
        React Go Board - HTML Elements ({boardSize}×{boardSize})
      </h1>
      
      {showCoordinates && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
          gap: '0',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          {letters.split('').map((letter, i) => (
            <div key={i} style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#8b4513',
            }}>
              {letter}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showCoordinates && (
          <div style={{ 
            display: 'grid',
            gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
            gap: '0',
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#8b4513',
            alignItems: 'center',
            textAlign: 'center',
            marginRight: '10px'
          }}>
            {Array.from({length: boardSize}, (_, i) => (
              <div key={i}>{boardSize - i}</div>
            ))}
          </div>
        )}
        
        <div style={boardStyle}>
          {Array.from({length: boardSize}, (_, row) =>
            Array.from({length: boardSize}, (_, col) =>
              renderIntersection(row, col)
            )
          )}
        </div>
        
        {showCoordinates && (
          <div style={{ 
            display: 'grid',
            gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
            gap: '0',
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#8b4513',
            alignItems: 'center',
            textAlign: 'center',
            marginLeft: '10px'
          }}>
            {Array.from({length: boardSize}, (_, i) => (
              <div key={i}>{boardSize - i}</div>
            ))}
          </div>
        )}
      </div>
      
      {showCoordinates && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
          gap: '0',
          marginTop: '10px',
          textAlign: 'center'
        }}>
          {letters.split('').map((letter, i) => (
            <div key={i} style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#8b4513',
            }}>
              {letter}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
        Next stone: <strong>{nextStone}</strong>
        {interactive && ' (Click any intersection to place)'}
      </div>
    </div>
  );
};

// Example usage with different board sizes
const App = () => {
  const [selectedBoard, setSelectedBoard] = useState<19 | 13 | 9>(19);
  
  const sampleStones19: Stone[] = [
    { row: 3, col: 3, color: 'black' },
    { row: 3, col: 15, color: 'white' },
    { row: 15, col: 3, color: 'white' },
    { row: 15, col: 15, color: 'black' },
    { row: 9, col: 9, color: 'black' },
    { row: 4, col: 4, color: 'white' },
    { row: 5, col: 3, color: 'black' },
    { row: 6, col: 4, color: 'white' },
  ];

  const sampleStones13: Stone[] = [
    { row: 3, col: 3, color: 'black' },
    { row: 9, col: 9, color: 'white' },
    { row: 6, col: 6, color: 'black' },
  ];

  const sampleStones9: Stone[] = [
    { row: 2, col: 2, color: 'black' },
    { row: 6, col: 6, color: 'white' },
    { row: 4, col: 4, color: 'black' },
  ];

  const getSampleStones = () => {
    switch(selectedBoard) {
      case 19: return sampleStones19;
      case 13: return sampleStones13;
      case 9: return sampleStones9;
    }
  };

  const handleStonePlace = (row: number, col: number, color: 'black' | 'white') => {
    const letters = 'ABCDEFGHJKLMNOPQRST'.slice(0, selectedBoard);
    console.log(`Stone placed at ${letters[col]}${selectedBoard - row}: ${color}`);
  };

  return (
    <div>
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        background: 'white', 
        padding: '10px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Board Size:</div>
        {[19, 13, 9].map(size => (
          <button
            key={size}
            onClick={() => setSelectedBoard(size as 19 | 13 | 9)}
            style={{
              margin: '2px',
              padding: '5px 10px',
              border: selectedBoard === size ? '2px solid #8b4513' : '1px solid #ccc',
              borderRadius: '4px',
              background: selectedBoard === size ? '#f5f5dc' : 'white',
              cursor: 'pointer'
            }}
          >
            {size}×{size}
          </button>
        ))}
      </div>
      
      <GoBoard
        size={selectedBoard}
        boardSize={selectedBoard}
        initialStones={getSampleStones()}
        onStonePlace={handleStonePlace}
        interactive={true}
        showStarPoints={true}
        showCoordinates={true}
      />
    </div>
  );
};

export default App;