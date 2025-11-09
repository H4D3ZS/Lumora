import React from 'react';
import { View, Text, Button, List, Input } from '@lumora/primitives';

export default function App() {
  return (
    <View padding={16} backgroundColor="#FFFFFF">
      <Text 
        text="Welcome to Lumora" 
        style={{ fontSize: 24, fontWeight: 'bold', color: '#000000' }}
      />
      <Text 
        text="Start building your mobile-first Flutter app" 
        style={{ fontSize: 16, color: '#666666' }}
      />
      <Button 
        title="Get Started" 
        onTap="emit:button_clicked:{}"
      />
    </View>
  );
}
