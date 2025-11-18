# Fixed App.tsx for Existing Projects

If you created a project with lumora-cli v1.0.3 or earlier, your `App.tsx` file has TypeScript errors because the Lumora components aren't declared.

## Fix for Existing Projects

Replace the content of `web/src/App.tsx` with:

```tsx
import React, { useState } from 'react';

// Lumora components - these get converted to Flutter widgets
// View -> Container, Text -> Text, Button -> ElevatedButton
declare const View: any;
declare const Text: any;
declare const Button: any;

export function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Welcome to Lumora!
      </Text>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Count: {count}
      </Text>
      <Button onPress={() => setCount(count + 1)}>
        Increment
      </Button>
    </View>
  );
}
```

## Or Create a New Project

The easiest solution is to create a new project with the latest version:

```bash
# Update lumora-cli
npm install -g lumora-cli@latest

# Create new project (will have fixed template)
lumora init my-new-app
cd my-new-app
npm install
lumora start
```

## What Changed

- Added `declare const` statements for Lumora components
- Added comments explaining the component mapping
- No TypeScript errors!

## How Lumora Components Work

Lumora uses special component names that get converted to Flutter widgets:

| React Component | Flutter Widget |
|----------------|----------------|
| `<View>` | `Container` |
| `<Text>` | `Text` |
| `<Button>` | `ElevatedButton` |
| `<Image>` | `Image` |
| `<ScrollView>` | `SingleChildScrollView` |
| `<ListView>` | `ListView` |
| `<TextInput>` | `TextField` |

These components don't need to be imported - they're recognized by the Lumora parser and converted to their Flutter equivalents!

---

**Now available in lumora-cli@1.0.4!** 🎉
