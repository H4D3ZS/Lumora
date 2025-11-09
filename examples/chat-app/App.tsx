/**
 * Chat App Example for Lumora Framework
 * 
 * This example demonstrates:
 * - View, Text, Button, List, and Input primitives
 * - Message list rendering with sender/receiver styling
 * - Event handling for sending messages
 * - Scrollable message history
 * - Input field with send button
 * 
 * Usage:
 *   cd examples/chat-app
 *   node ../../tools/codegen/cli.js tsx2schema App.tsx schema.json
 *   
 * Then push to Dev-Proxy:
 *   curl -X POST http://localhost:3000/send/<sessionId> \
 *     -H "Content-Type: application/json" \
 *     -d @schema.json
 */

export default function ChatApp() {
  return (
    <View padding={0} backgroundColor="#E5DDD5">
      {/* Header */}
      <View padding={16} backgroundColor="#075E54" style={{ paddingTop: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text 
              text="💬 Team Chat" 
              style={{ fontSize: 20, fontWeight: "bold", color: "#FFFFFF" }} 
            />
            <Text 
              text="5 members online" 
              style={{ fontSize: 12, color: "#B2DFDB", marginTop: 2 }} 
            />
          </View>
          <Button 
            title="⋮" 
            onTap="emit:openMenu:{}"
            style={{ backgroundColor: "transparent", padding: 8 }}
          />
        </View>
      </View>

      {/* Messages List */}
      <View style={{ flex: 1, padding: 16 }}>
        <List>
          {/* Received Message 1 */}
          <View style={{ marginBottom: 12, alignItems: "flex-start" }}>
            <View padding={12} backgroundColor="#FFFFFF" style={{ borderRadius: 8, maxWidth: 280 }}>
              <Text 
                text="Sarah" 
                style={{ fontSize: 12, fontWeight: "600", color: "#075E54", marginBottom: 4 }} 
              />
              <Text 
                text="Hey team! How's the project coming along?" 
                style={{ fontSize: 15, color: "#303030", lineHeight: 20 }} 
              />
              <Text 
                text="10:30 AM" 
                style={{ fontSize: 11, color: "#999", marginTop: 4, textAlign: "right" }} 
              />
            </View>
          </View>

          {/* Sent Message 1 */}
          <View style={{ marginBottom: 12, alignItems: "flex-end" }}>
            <View padding={12} backgroundColor="#DCF8C6" style={{ borderRadius: 8, maxWidth: 280 }}>
              <Text 
                text="Great! We're making good progress on the MVP." 
                style={{ fontSize: 15, color: "#303030", lineHeight: 20 }} 
              />
              <Text 
                text="10:32 AM ✓✓" 
                style={{ fontSize: 11, color: "#666", marginTop: 4, textAlign: "right" }} 
              />
            </View>
          </View>

          {/* Received Message 2 */}
          <View style={{ marginBottom: 12, alignItems: "flex-start" }}>
            <View padding={12} backgroundColor="#FFFFFF" style={{ borderRadius: 8, maxWidth: 280 }}>
              <Text 
                text="Mike" 
                style={{ fontSize: 12, fontWeight: "600", color: "#075E54", marginBottom: 4 }} 
              />
              <Text 
                text="I just pushed the new features to the repo. Can someone review?" 
                style={{ fontSize: 15, color: "#303030", lineHeight: 20 }} 
              />
              <Text 
                text="10:35 AM" 
                style={{ fontSize: 11, color: "#999", marginTop: 4, textAlign: "right" }} 
              />
            </View>
          </View>

          {/* Sent Message 2 */}
          <View style={{ marginBottom: 12, alignItems: "flex-end" }}>
            <View padding={12} backgroundColor="#DCF8C6" style={{ borderRadius: 8, maxWidth: 280 }}>
              <Text 
                text="I'll take a look right now! 👍" 
                style={{ fontSize: 15, color: "#303030", lineHeight: 20 }} 
              />
              <Text 
                text="10:36 AM ✓✓" 
                style={{ fontSize: 11, color: "#666", marginTop: 4, textAlign: "right" }} 
              />
            </View>
          </View>

          {/* Received Message 3 */}
          <View style={{ marginBottom: 12, alignItems: "flex-start" }}>
            <View padding={12} backgroundColor="#FFFFFF" style={{ borderRadius: 8, maxWidth: 280 }}>
              <Text 
                text="Emma" 
                style={{ fontSize: 12, fontWeight: "600", color: "#075E54", marginBottom: 4 }} 
              />
              <Text 
                text="The design mockups are ready. I'll share them in the design channel." 
                style={{ fontSize: 15, color: "#303030", lineHeight: 20 }} 
              />
              <Text 
                text="10:40 AM" 
                style={{ fontSize: 11, color: "#999", marginTop: 4, textAlign: "right" }} 
              />
            </View>
          </View>

          {/* System Message */}
          <View style={{ marginBottom: 12, alignItems: "center" }}>
            <View padding={8} backgroundColor="#FFF9C4" style={{ borderRadius: 6 }}>
              <Text 
                text="📌 Meeting scheduled for 2:00 PM today" 
                style={{ fontSize: 13, color: "#F57F17", textAlign: "center" }} 
              />
            </View>
          </View>

          {/* Received Message 4 */}
          <View style={{ marginBottom: 12, alignItems: "flex-start" }}>
            <View padding={12} backgroundColor="#FFFFFF" style={{ borderRadius: 8, maxWidth: 280 }}>
              <Text 
                text="Alex" 
                style={{ fontSize: 12, fontWeight: "600", color: "#075E54", marginBottom: 4 }} 
              />
              <Text 
                text="Perfect timing! I have some updates to share in the meeting." 
                style={{ fontSize: 15, color: "#303030", lineHeight: 20 }} 
              />
              <Text 
                text="10:45 AM" 
                style={{ fontSize: 11, color: "#999", marginTop: 4, textAlign: "right" }} 
              />
            </View>
          </View>

          {/* Sent Message 3 */}
          <View style={{ marginBottom: 12, alignItems: "flex-end" }}>
            <View padding={12} backgroundColor="#DCF8C6" style={{ borderRadius: 8, maxWidth: 280 }}>
              <Text 
                text="Sounds good! See you all at 2 PM 🚀" 
                style={{ fontSize: 15, color: "#303030", lineHeight: 20 }} 
              />
              <Text 
                text="10:46 AM ✓✓" 
                style={{ fontSize: 11, color: "#666", marginTop: 4, textAlign: "right" }} 
              />
            </View>
          </View>
        </List>
      </View>

      {/* Typing Indicator */}
      <View padding={12} backgroundColor="#F0F0F0" style={{ borderTopWidth: 1, borderTopColor: "#DDD" }}>
        <Text 
          text="Sarah is typing..." 
          style={{ fontSize: 13, color: "#666", fontStyle: "italic" }} 
        />
      </View>

      {/* Input Area */}
      <View padding={12} backgroundColor="#F0F0F0" style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Input 
            placeholder="Type a message..."
            style={{ padding: 12, backgroundColor: "#FFFFFF", borderRadius: 20, fontSize: 15 }}
          />
        </View>
        <Button 
          title="📤" 
          onTap="emit:sendMessage:{}"
          style={{ backgroundColor: "#075E54", padding: 12, borderRadius: 20, minWidth: 48 }}
        />
      </View>

      {/* Quick Actions */}
      <View padding={8} backgroundColor="#F0F0F0" style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <Button 
          title="📎" 
          onTap="emit:attachFile:{}"
          style={{ backgroundColor: "transparent", padding: 8 }}
        />
        <Button 
          title="📷" 
          onTap="emit:takePhoto:{}"
          style={{ backgroundColor: "transparent", padding: 8 }}
        />
        <Button 
          title="🎤" 
          onTap="emit:recordVoice:{}"
          style={{ backgroundColor: "transparent", padding: 8 }}
        />
        <Button 
          title="😊" 
          onTap="emit:openEmoji:{}"
          style={{ backgroundColor: "transparent", padding: 8 }}
        />
      </View>
    </View>
  );
}
