import React, { useState, useEffect } from 'react';

/**
 * Counter component with state management
 */
export default function Counter() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Click the button!');

  const handleIncrement = () => {
    setCount(count + 1);
    setMessage(`Count is now ${count + 1}`);
  };

  return (
    <View padding={20}>
      <Text text={message} style={{ fontSize: 24, marginBottom: 20 }} />
      <Text text={`Current count: ${count}`} style={{ fontSize: 18 }} />
      <Button 
        title="Increment" 
        onPress={handleIncrement}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}
