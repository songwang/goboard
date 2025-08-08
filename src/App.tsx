import React, { useState } from 'react';
import GoBoard from './GoBoard';
import GoGame from './GoGame';

const App = () => {
  const [selectedBoard, setSelectedBoard] = useState<19 | 13 | 9>(19);

  const handleGameStateChange = (game: GoGame) => {
    console.log('Game state updated:', {
      blackCaptures: game.getCaptures(1),
      whiteCaptures: game.getCaptures(-1),
      isEmpty: game.isEmpty(),
      isValid: game.isValid()
    });
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
        onGameStateChange={handleGameStateChange}
        interactive={true}
        showStarPoints={true}
        showCoordinates={true}
      />
    </div>
  );
};

export default App;