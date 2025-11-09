/**
 * Example TSX component for demonstrating the tsx2schema CLI
 * 
 * Usage:
 *   node cli.js tsx2schema example.tsx example-output.json
 *   node cli.js tsx2schema example.tsx example-output.json --watch
 */

export default function ExampleApp() {
  return (
    <View padding={20} backgroundColor="#F5F5F5">
      <Text 
        text="Welcome to Lumora" 
        style={{ fontSize: 28, fontWeight: "bold", color: "#333" }} 
      />
      
      <Text 
        text="A mobile-first Flutter development framework" 
        style={{ fontSize: 16, color: "#666", marginTop: 8 }} 
      />
      
      <Button 
        title="Get Started" 
        onTap="emit:getStarted:{}"
        style={{ marginTop: 20, backgroundColor: "#007AFF" }}
      />
      
      <List style={{ marginTop: 30 }}>
        <View padding={12} backgroundColor="#FFFFFF" style={{ marginBottom: 8 }}>
          <Text text="✓ Instant preview on device" style={{ fontSize: 14 }} />
        </View>
        
        <View padding={12} backgroundColor="#FFFFFF" style={{ marginBottom: 8 }}>
          <Text text="✓ Live hot reload" style={{ fontSize: 14 }} />
        </View>
        
        <View padding={12} backgroundColor="#FFFFFF" style={{ marginBottom: 8 }}>
          <Text text="✓ Production-ready Dart code" style={{ fontSize: 14 }} />
        </View>
      </List>
      
      <Input 
        placeholder="Enter your email"
        style={{ marginTop: 20, padding: 12, backgroundColor: "#FFFFFF" }}
      />
    </View>
  );
}
