import React from 'react';

export default function FinalTest() {
  return (
    <div style={{ padding: 16, backgroundColor: '#f0f0f0' }}>
      <h1>Final Test Component</h1>
      <p>This is a comprehensive test</p>
      <button onClick={() => console.log('clicked')}>
        Click Me
      </button>
    </div>
  );
}
