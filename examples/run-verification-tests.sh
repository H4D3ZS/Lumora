#!/bin/bash

# Examples End-to-End Verification Test Script
# This script verifies that both example applications work correctly

set -e

echo "========================================="
echo "Lumora Examples Verification Test"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# Helper functions
pass_test() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASS_COUNT++))
}

fail_test() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAIL_COUNT++))
}

skip_test() {
    echo -e "${YELLOW}⊘ SKIP${NC}: $1"
    ((SKIP_COUNT++))
}

# Test 1: Verify Node.js is installed
echo "Test 1: Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    pass_test "Node.js is installed ($NODE_VERSION)"
else
    fail_test "Node.js is not installed"
fi
echo ""

# Test 2: Verify Flutter is installed
echo "Test 2: Checking Flutter installation..."
if command -v flutter &> /dev/null; then
    FLUTTER_VERSION=$(flutter --version | head -1)
    pass_test "Flutter is installed ($FLUTTER_VERSION)"
else
    skip_test "Flutter is not installed (required for Dart code validation)"
fi
echo ""

# Test 3: Verify todo-app schema exists
echo "Test 3: Checking todo-app schema..."
if [ -f "examples/todo-app/schema.json" ]; then
    pass_test "todo-app schema.json exists"
else
    fail_test "todo-app schema.json not found"
fi
echo ""

# Test 4: Verify chat-app schema exists
echo "Test 4: Checking chat-app schema..."
if [ -f "examples/chat-app/schema.json" ]; then
    pass_test "chat-app schema.json exists"
else
    fail_test "chat-app schema.json not found"
fi
echo ""

# Test 5: Validate todo-app schema JSON
echo "Test 5: Validating todo-app schema JSON..."
if node -e "JSON.parse(require('fs').readFileSync('examples/todo-app/schema.json', 'utf8'))" 2>/dev/null; then
    pass_test "todo-app schema is valid JSON"
else
    fail_test "todo-app schema has invalid JSON"
fi
echo ""

# Test 6: Validate chat-app schema JSON
echo "Test 6: Validating chat-app schema JSON..."
if node -e "JSON.parse(require('fs').readFileSync('examples/chat-app/schema.json', 'utf8'))" 2>/dev/null; then
    pass_test "chat-app schema is valid JSON"
else
    fail_test "chat-app schema has invalid JSON"
fi
echo ""

# Test 7: Verify todo-app schema structure
echo "Test 7: Verifying todo-app schema structure..."
SCHEMA_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('examples/todo-app/schema.json', 'utf8')).schemaVersion)" 2>/dev/null)
if [ "$SCHEMA_VERSION" = "1.0" ]; then
    pass_test "todo-app schema has correct version (1.0)"
else
    fail_test "todo-app schema has incorrect version ($SCHEMA_VERSION)"
fi
echo ""

# Test 8: Verify chat-app schema structure
echo "Test 8: Verifying chat-app schema structure..."
SCHEMA_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('examples/chat-app/schema.json', 'utf8')).schemaVersion)" 2>/dev/null)
if [ "$SCHEMA_VERSION" = "1.0" ]; then
    pass_test "chat-app schema has correct version (1.0)"
else
    fail_test "chat-app schema has incorrect version ($SCHEMA_VERSION)"
fi
echo ""

# Test 9: Test todo-app TSX to schema conversion
echo "Test 9: Testing todo-app TSX to schema conversion..."
if node tools/codegen/cli.js tsx2schema examples/todo-app/App.tsx /tmp/todo-test.json 2>&1 | grep -q "successfully"; then
    pass_test "todo-app TSX to schema conversion works"
    rm -f /tmp/todo-test.json
else
    fail_test "todo-app TSX to schema conversion failed"
fi
echo ""

# Test 10: Test chat-app TSX to schema conversion
echo "Test 10: Testing chat-app TSX to schema conversion..."
if node tools/codegen/cli.js tsx2schema examples/chat-app/App.tsx /tmp/chat-test.json 2>&1 | grep -q "successfully"; then
    pass_test "chat-app TSX to schema conversion works"
    rm -f /tmp/chat-test.json
else
    fail_test "chat-app TSX to schema conversion failed"
fi
echo ""

# Test 11: Verify todo-app generated Dart files exist
echo "Test 11: Checking todo-app generated Dart files..."
if [ -f "examples/todo-app/generated/bloc/lib/features/todo/presentation/pages/todo_page.dart" ]; then
    pass_test "todo-app Dart files exist"
else
    fail_test "todo-app Dart files not found"
fi
echo ""

# Test 12: Verify chat-app generated Dart files exist
echo "Test 12: Checking chat-app generated Dart files..."
if [ -f "examples/chat-app/generated/riverpod/lib/features/chat/presentation/pages/chat_page.dart" ]; then
    pass_test "chat-app Dart files exist"
else
    fail_test "chat-app Dart files not found"
fi
echo ""

# Test 13: Check schema sizes
echo "Test 13: Checking schema sizes..."
TODO_SIZE=$(wc -c < examples/todo-app/schema.json)
CHAT_SIZE=$(wc -c < examples/chat-app/schema.json)
if [ $TODO_SIZE -lt 51200 ] && [ $CHAT_SIZE -lt 102400 ]; then
    pass_test "Schema sizes are reasonable (todo: ${TODO_SIZE} bytes, chat: ${CHAT_SIZE} bytes)"
else
    fail_test "Schema sizes are too large (todo: ${TODO_SIZE} bytes, chat: ${CHAT_SIZE} bytes)"
fi
echo ""

# Test 14: Verify todo-app README exists
echo "Test 14: Checking todo-app README..."
if [ -f "examples/todo-app/README.md" ]; then
    pass_test "todo-app README.md exists"
else
    fail_test "todo-app README.md not found"
fi
echo ""

# Test 15: Verify chat-app README exists
echo "Test 15: Checking chat-app README..."
if [ -f "examples/chat-app/README.md" ]; then
    pass_test "chat-app README.md exists"
else
    fail_test "chat-app README.md not found"
fi
echo ""

# Test 16: Verify codegen tool exists
echo "Test 16: Checking codegen tool..."
if [ -f "tools/codegen/cli.js" ]; then
    pass_test "Codegen CLI tool exists"
else
    fail_test "Codegen CLI tool not found"
fi
echo ""

# Test 17: Check for event handlers in todo-app schema
echo "Test 17: Verifying todo-app event handlers..."
if grep -q "emit:addTodo" examples/todo-app/schema.json && grep -q "emit:completeTodo" examples/todo-app/schema.json; then
    pass_test "todo-app has correct event handlers"
else
    fail_test "todo-app missing event handlers"
fi
echo ""

# Test 18: Check for event handlers in chat-app schema
echo "Test 18: Verifying chat-app event handlers..."
if grep -q "emit:sendMessage" examples/chat-app/schema.json && grep -q "emit:attachFile" examples/chat-app/schema.json; then
    pass_test "chat-app has correct event handlers"
else
    fail_test "chat-app missing event handlers"
fi
echo ""

# Test 19: Verify todo-app has all required components
echo "Test 19: Checking todo-app components..."
if grep -q '"type": "View"' examples/todo-app/schema.json && \
   grep -q '"type": "Text"' examples/todo-app/schema.json && \
   grep -q '"type": "Button"' examples/todo-app/schema.json && \
   grep -q '"type": "List"' examples/todo-app/schema.json && \
   grep -q '"type": "Input"' examples/todo-app/schema.json; then
    pass_test "todo-app has all required component types"
else
    fail_test "todo-app missing required component types"
fi
echo ""

# Test 20: Verify chat-app has all required components
echo "Test 20: Checking chat-app components..."
if grep -q '"type": "View"' examples/chat-app/schema.json && \
   grep -q '"type": "Text"' examples/chat-app/schema.json && \
   grep -q '"type": "Button"' examples/chat-app/schema.json && \
   grep -q '"type": "List"' examples/chat-app/schema.json && \
   grep -q '"type": "Input"' examples/chat-app/schema.json; then
    pass_test "chat-app has all required component types"
else
    fail_test "chat-app missing required component types"
fi
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo -e "${YELLOW}Skipped: $SKIP_COUNT${NC}"
echo "Total: $((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
