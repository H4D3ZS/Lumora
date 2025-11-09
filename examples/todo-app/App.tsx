/**
 * Todo App Example for Lumora Framework
 * 
 * This example demonstrates:
 * - View, Text, Button, List, and Input primitives
 * - Event handling with emit:action:payload format
 * - Dynamic list rendering
 * - Interactive UI components
 * 
 * Usage:
 *   cd examples/todo-app
 *   node ../../tools/codegen/cli.js tsx2schema App.tsx schema.json
 *   
 * Then push to Dev-Proxy:
 *   curl -X POST http://localhost:3000/send/<sessionId> \
 *     -H "Content-Type: application/json" \
 *     -d @schema.json
 */

export default function TodoApp() {
  return (
    <View padding={20} backgroundColor="#F8F9FA">
      {/* Header */}
      <View padding={16} backgroundColor="#007AFF" style={{ borderRadius: 12, marginBottom: 20 }}>
        <Text 
          text="📝 My Todo List" 
          style={{ fontSize: 28, fontWeight: "bold", color: "#FFFFFF" }} 
        />
        <Text 
          text="Stay organized and productive" 
          style={{ fontSize: 14, color: "#E3F2FD", marginTop: 4 }} 
        />
      </View>

      {/* Add Todo Input */}
      <View padding={16} backgroundColor="#FFFFFF" style={{ borderRadius: 8, marginBottom: 20 }}>
        <Text 
          text="Add New Task" 
          style={{ fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 12 }} 
        />
        <Input 
          placeholder="What needs to be done?"
          style={{ padding: 12, backgroundColor: "#F5F5F5", borderRadius: 6, marginBottom: 12 }}
        />
        <Button 
          title="Add Task" 
          onTap="emit:addTodo:{}"
          style={{ backgroundColor: "#28A745", padding: 12, borderRadius: 6 }}
        />
      </View>

      {/* Todo List */}
      <View style={{ marginBottom: 20 }}>
        <Text 
          text="Active Tasks" 
          style={{ fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 12 }} 
        />
        
        <List>
          {/* Todo Item 1 */}
          <View padding={16} backgroundColor="#FFFFFF" style={{ marginBottom: 8, borderRadius: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text 
                  text="Complete project documentation" 
                  style={{ fontSize: 16, color: "#333", marginBottom: 4 }} 
                />
                <Text 
                  text="Due: Today" 
                  style={{ fontSize: 12, color: "#999" }} 
                />
              </View>
              <Button 
                title="✓" 
                onTap="emit:completeTodo:{id:1}"
                style={{ backgroundColor: "#28A745", padding: 8, minWidth: 40 }}
              />
            </View>
          </View>

          {/* Todo Item 2 */}
          <View padding={16} backgroundColor="#FFFFFF" style={{ marginBottom: 8, borderRadius: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text 
                  text="Review pull requests" 
                  style={{ fontSize: 16, color: "#333", marginBottom: 4 }} 
                />
                <Text 
                  text="Due: Tomorrow" 
                  style={{ fontSize: 12, color: "#999" }} 
                />
              </View>
              <Button 
                title="✓" 
                onTap="emit:completeTodo:{id:2}"
                style={{ backgroundColor: "#28A745", padding: 8, minWidth: 40 }}
              />
            </View>
          </View>

          {/* Todo Item 3 */}
          <View padding={16} backgroundColor="#FFFFFF" style={{ marginBottom: 8, borderRadius: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text 
                  text="Update dependencies" 
                  style={{ fontSize: 16, color: "#333", marginBottom: 4 }} 
                />
                <Text 
                  text="Due: This week" 
                  style={{ fontSize: 12, color: "#999" }} 
                />
              </View>
              <Button 
                title="✓" 
                onTap="emit:completeTodo:{id:3}"
                style={{ backgroundColor: "#28A745", padding: 8, minWidth: 40 }}
              />
            </View>
          </View>
        </List>
      </View>

      {/* Completed Section */}
      <View padding={16} backgroundColor="#E8F5E9" style={{ borderRadius: 8 }}>
        <Text 
          text="✓ Completed Tasks" 
          style={{ fontSize: 16, fontWeight: "600", color: "#2E7D32", marginBottom: 8 }} 
        />
        <Text 
          text="3 tasks completed today" 
          style={{ fontSize: 14, color: "#66BB6A" }} 
        />
        <Button 
          title="View All" 
          onTap="emit:viewCompleted:{}"
          style={{ backgroundColor: "#4CAF50", marginTop: 12, padding: 10, borderRadius: 6 }}
        />
      </View>

      {/* Footer Stats */}
      <View style={{ marginTop: 20, padding: 16, backgroundColor: "#FFFFFF", borderRadius: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text text="3" style={{ fontSize: 24, fontWeight: "bold", color: "#007AFF" }} />
            <Text text="Active" style={{ fontSize: 12, color: "#999" }} />
          </View>
          <View style={{ alignItems: "center" }}>
            <Text text="3" style={{ fontSize: 24, fontWeight: "bold", color: "#28A745" }} />
            <Text text="Done" style={{ fontSize: 12, color: "#999" }} />
          </View>
          <View style={{ alignItems: "center" }}>
            <Text text="6" style={{ fontSize: 24, fontWeight: "bold", color: "#333" }} />
            <Text text="Total" style={{ fontSize: 12, color: "#999" }} />
          </View>
        </View>
      </View>
    </View>
  );
}
