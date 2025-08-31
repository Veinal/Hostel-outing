import React from 'react';

const QRCode = ({ data, size = 100 }) => {
  // Simple hash function to generate a pattern
  const hash = data.split('').reduce((a, b) => {
    a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
    return a;
  }, 0);

  // Generate 5x5 grid pattern based on hash
  const generatePattern = () => {
    const pattern = [];
    for (let i = 0; i < 5; i++) {
      const row = [];
      for (let j = 0; j < 5; j++) {
        const index = i * 5 + j;
        const shouldFill = (hash >> index) & 1;
        row.push(shouldFill);
      }
      pattern.push(row);
    }
    return pattern;
  };

  const pattern = generatePattern();
  const cellSize = size / 5;

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {pattern.map((row, i) =>
          row.map((cell, j) => (
            <rect
              key={`${i}-${j}`}
              x={j * cellSize}
              y={i * cellSize}
              width={cellSize}
              height={cellSize}
              fill={cell ? '#000' : '#fff'}
              stroke="#ccc"
              strokeWidth="0.5"
            />
          ))
        )}
      </svg>
    </div>
  );
};

export default QRCode;
