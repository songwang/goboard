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
  size = 500,
  boardSize = 19,
  initialStones = [],
  onStonePlace,
  interactive = true,
  showStarPoints = true,
  showCoordinates = false
}) => {
  const [stones, setStones] = useState<Stone[]>(initialStones);
  const [nextStone, setNextStone] = useState<'black' | 'white'>('black');

  // Calculate grid spacing and positions
  const margin = size * 0.05; // 5% margin
  const gridSize = size - (margin * 2);
  const cellSize = gridSize / (boardSize - 1);

  // Generate star point positions for standard board sizes
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

  const getCoordinatePosition = (index: number) => margin + (index * cellSize);

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    
    // Get click position relative to SVG
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Scale to SVG coordinates
    const svgX = (x / rect.width) * size;
    const svgY = (y / rect.height) * size;
    
    // Snap to nearest intersection
    const col = Math.round((svgX - margin) / cellSize);
    const row = Math.round((svgY - margin) / cellSize);
    
    // Check if position is within board bounds
    if (col >= 0 && col < boardSize && row >= 0 && row < boardSize) {
      // Check if position is already occupied
      const occupied = stones.some(stone => stone.row === row && stone.col === col);
      
      if (!occupied) {
        const newStone: Stone = { row, col, color: nextStone };
        setStones([...stones, newStone]);
        setNextStone(nextStone === 'black' ? 'white' : 'black');
        
        if (onStonePlace) {
          onStonePlace(row, col, nextStone);
        }
      }
    }
  };

  const renderGridLines = () => {
    const lines = [];
    
    // Horizontal lines
    for (let i = 0; i < boardSize; i++) {
      const y = getCoordinatePosition(i);
      lines.push(
        <line
          key={`h-${i}`}
          x1={margin}
          y1={y}
          x2={size - margin}
          y2={y}
          stroke="black"
          strokeWidth="1"
        />
      );
    }
    
    // Vertical lines
    for (let i = 0; i < boardSize; i++) {
      const x = getCoordinatePosition(i);
      lines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={margin}
          x2={x}
          y2={size - margin}
          stroke="black"
          strokeWidth="1"
        />
      );
    }
    
    return lines;
  };

  const renderStarPoints = () => {
    if (!showStarPoints) return null;
    
    return getStarPoints().map(({ row, col }, index) => (
      <circle
        key={`star-${index}`}
        cx={getCoordinatePosition(col)}
        cy={getCoordinatePosition(row)}
        r={size * 0.006} // Responsive star point size
        fill="black"
      />
    ));
  };

  const renderCoordinates = () => {
    if (!showCoordinates) return null;
    
    const letters = 'ABCDEFGHJKLMNOPQRST'; // I is skipped in Go notation
    const coords = [];
    
    for (let i = 0; i < boardSize; i++) {
      const pos = getCoordinatePosition(i);
      const fontSize = size * 0.024; // Responsive font size
      
      // Top and bottom letters
      coords.push(
        <text
          key={`top-${i}`}
          x={pos}
          y={margin * 0.6}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#8b4513"
          fontWeight="bold"
        >
          {letters[i]}
        </text>
      );
      
      coords.push(
        <text
          key={`bottom-${i}`}
          x={pos}
          y={size - margin * 0.3}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#8b4513"
          fontWeight="bold"
        >
          {letters[i]}
        </text>
      );
      
      // Left and right numbers
      coords.push(
        <text
          key={`left-${i}`}
          x={margin * 0.4}
          y={pos + fontSize * 0.3}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#8b4513"
          fontWeight="bold"
        >
          {boardSize - i}
        </text>
      );
      
      coords.push(
        <text
          key={`right-${i}`}
          x={size - margin * 0.4}
          y={pos + fontSize * 0.3}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#8b4513"
          fontWeight="bold"
        >
          {boardSize - i}
        </text>
      );
    }
    
    return coords;
  };

  const renderStones = () => {
    const stoneRadius = cellSize * 0.48; // Responsive stone size
    const lastStoneIndex = stones.length - 1;
    
    return stones.map((stone, index) => {
      const x = getCoordinatePosition(stone.col);
      const y = getCoordinatePosition(stone.row);
      const isLastStone = index === lastStoneIndex;
      
      if (stone.color === 'black') {
        return (
          <g key={`stone-${index}`}>
            <circle
              cx={x}
              cy={y}
              r={stoneRadius}
              fill="url(#blackStone)"
              filter="url(#dropShadow)"
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            />
            {isLastStone && (
              <circle
                cx={x}
                cy={y}
                r={stoneRadius * 0.5}
                fill="none"
                stroke="white"
                strokeWidth={stoneRadius * 0.08}
              />
            )}
          </g>
        );
      } else {
        return (
          <g
            key={`stone-${index}`}
            filter="url(#dropShadow)"
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            <circle
              cx={x}
              cy={y}
              r={stoneRadius}
              fill="url(#whiteStoneBase)"
              stroke="#c3c3c3"
              strokeWidth={stoneRadius * 0.04}
            />
            <circle
              cx={x}
              cy={y}
              r={stoneRadius * 0.875}
              fill="url(#whiteStoneHighlight)"
            />
            {isLastStone && (
              <circle
                cx={x}
                cy={y}
                r={stoneRadius * 0.5}
                fill="none"
                stroke="black"
                strokeWidth={stoneRadius * 0.08}
              />
            )}
          </g>
        );
      }
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onClick={handleClick}
        style={{
          background: '#deb887',
          border: `${size * 0.03}px solid #8b4513`,
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}
      >
        <defs>
          {/* Black stone gradient */}
          <radialGradient id="blackStone" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#666" />
            <stop offset="70%" stopColor="#222" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          
          {/* White stone gradient (base layer) */}
          <linearGradient id="whiteStoneBase" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#C9D1FF" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
          
          {/* White stone highlight (top layer) */}
          <linearGradient id="whiteStoneHighlight" x1="0%" y1="85%" x2="0%" y2="65%">
            <stop offset="0%" stopColor="#eee" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#eee" stopOpacity="0" />
          </linearGradient>
          
          {/* Drop shadow filter */}
          <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.4" />
          </filter>
        </defs>
        
        {/* Grid lines */}
        {renderGridLines()}
        
        {/* Star points */}
        {renderStarPoints()}
        
        {/* Coordinates */}
        {renderCoordinates()}
        
        {/* Stones */}
        {renderStones()}
      </svg>
    </div>
  );
};

// Example usage with some sample configurations
const App = () => {
  const [gameStones, setGameStones] = useState<Stone[]>([
    { row: 3, col: 3, color: 'black' },
    { row: 3, col: 15, color: 'white' },
    { row: 15, col: 3, color: 'white' },
    { row: 15, col: 15, color: 'black' },
    { row: 9, col: 9, color: 'black' },
    { row: 4, col: 4, color: 'white' },
    { row: 5, col: 3, color: 'black' },
    { row: 6, col: 4, color: 'white' }
  ]);

  const handleStonePlace = (row: number, col: number, color: 'black' | 'white') => {
    console.log(`Stone placed at ${row}, ${col}: ${color}`);
  };

  return (
    <div style={{ background: '#f5f5dc', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        React Go Board Component
      </h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
        {/* Full 19x19 board with coordinates */}
        <div>
          <h3 style={{ textAlign: 'center', color: '#666' }}>19×19 Board with Coordinates</h3>
          <GoBoard
            size={600}
            boardSize={19}
            initialStones={gameStones}
            onStonePlace={handleStonePlace}
            showCoordinates={true}
          />
        </div>
        
        {/* Smaller 13x13 board */}
        <div>
          <h3 style={{ textAlign: 'center', color: '#666' }}>13×13 Board</h3>
          <GoBoard
            size={400}
            boardSize={13}
            initialStones={[
              { row: 3, col: 3, color: 'black' },
              { row: 9, col: 9, color: 'white' },
              { row: 6, col: 6, color: 'black' }
            ]}
          />
        </div>
        
        {/* Mini 9x9 board */}
        <div>
          <h3 style={{ textAlign: 'center', color: '#666' }}>9×9 Board (Non-interactive)</h3>
          <GoBoard
            size={300}
            boardSize={9}
            initialStones={[
              { row: 2, col: 2, color: 'black' },
              { row: 6, col: 6, color: 'white' },
              { row: 4, col: 4, color: 'black' }
            ]}
            interactive={false}
          />
        </div>
      </div>
    </div>
  );
};

export default App;