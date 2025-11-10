import React, { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Component demonstrating React hooks conversion
 */
export default function HooksExample() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Hello');
  const [items, setItems] = useState([]);

  // Mount effect
  useEffect(() => {
    console.log('Component mounted');
    // Fetch initial data
  }, []);

  // Update effect with dependencies
  useEffect(() => {
    console.log('Count changed:', count);
  }, [count]);

  // Effect with cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Tick');
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // useCallback
  const handleIncrement = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  // useMemo
  const doubleCount = useMemo(() => {
    return count * 2;
  }, [count]);

  return (
    <View padding={20}>
      <Text text={`Count: ${count}`} style={{ fontSize: 24 }} />
      <Text text={`Double: ${doubleCount}`} style={{ fontSize: 18 }} />
      <Text text={message} style={{ fontSize: 16 }} />
      <Button 
        title="Increment" 
        onPress={handleIncrement}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}
