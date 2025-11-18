import React, { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>
        Welcome to Lumora! 🚀
      </h1>
      <p style={{ fontSize: 18, marginBottom: 10 }}>
        Count: {count}
      </p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '12px 24px',
          fontSize: 16,
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        Increment
      </button>
      <p style={{ marginTop: 20, color: '#666', fontSize: 14 }}>
        💡 This React code auto-syncs to lib/main.dart!
      </p>
    </div>
  );
}

export default App;
