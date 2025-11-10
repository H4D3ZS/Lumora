import React, { createContext, useContext, useState } from 'react';

/**
 * Theme context example
 */
const ThemeContext = createContext({ theme: 'light' });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Component using context
 */
export default function ThemedButton() {
  const { theme, setTheme } = useContext(ThemeContext);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <View padding={20} backgroundColor={theme === 'light' ? '#FFFFFF' : '#333333'}>
      <Text 
        text={`Current theme: ${theme}`}
        style={{ 
          fontSize: 18,
          color: theme === 'light' ? '#000000' : '#FFFFFF'
        }}
      />
      <Button 
        title="Toggle Theme" 
        onPress={toggleTheme}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}
