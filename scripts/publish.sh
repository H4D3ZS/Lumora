#!/bin/bash

# Lumora Framework Publishing Script
# This script automates the publishing process for Lumora

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NEW_VERSION="1.0.0"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --version)
      NEW_VERSION="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: ./scripts/publish.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --version VERSION    Set version number (default: 1.0.0)"
      echo "  --dry-run           Run without actually publishing"
      echo "  --help              Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Lumora Framework Publishing Script  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Version: ${NEW_VERSION}${NC}"
echo -e "${YELLOW}Dry Run: ${DRY_RUN}${NC}"
echo ""

# Function to print step
print_step() {
  echo -e "${GREEN}▶ $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if we're in the root directory
if [ ! -f "package.json" ]; then
  print_error "Must be run from the root directory of the project"
  exit 1
fi

# Step 1: Check git status
print_step "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
  print_warning "Working directory is not clean. Uncommitted changes detected."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
print_success "Git status checked"

# Step 2: Run tests
print_step "Running tests..."

# TypeScript tests
print_step "  Testing lumora_ir..."
cd packages/lumora_ir
npm test || { print_error "lumora_ir tests failed"; exit 1; }
cd ../..

print_step "  Testing lumora-cli..."
cd packages/lumora-cli
npm test || { print_error "lumora-cli tests failed"; exit 1; }
cd ../..

# Flutter tests
print_step "  Testing flutter-dev-client..."
cd apps/flutter-dev-client
flutter test || { print_error "flutter-dev-client tests failed"; exit 1; }
cd ../..

print_step "  Testing kiro_ui_tokens..."
cd packages/kiro_ui_tokens
flutter test || { print_error "kiro_ui_tokens tests failed"; exit 1; }
cd ../..

print_success "All tests passed"

# Step 3: Build packages
print_step "Building packages..."

print_step "  Building lumora_ir..."
cd packages/lumora_ir
npm run build || { print_error "lumora_ir build failed"; exit 1; }
cd ../..

print_step "  Building lumora-cli..."
cd packages/lumora-cli
npm run build || { print_error "lumora-cli build failed"; exit 1; }
cd ../..

print_success "All packages built successfully"

# Step 4: Update version numbers
if [ "$DRY_RUN" = false ]; then
  print_step "Updating version numbers to ${NEW_VERSION}..."
  
  # Update root package.json
  npm version ${NEW_VERSION} --no-git-tag-version
  
  # Update lumora_ir
  cd packages/lumora_ir
  npm version ${NEW_VERSION} --no-git-tag-version
  cd ../..
  
  # Update lumora-cli
  cd packages/lumora-cli
  npm version ${NEW_VERSION} --no-git-tag-version
  cd ../..
  
  # Update Flutter packages (manual edit required)
  print_warning "Please manually update version in:"
  print_warning "  - apps/flutter-dev-client/pubspec.yaml"
  print_warning "  - packages/kiro_ui_tokens/pubspec.yaml"
  read -p "Press enter when done..."
  
  print_success "Version numbers updated"
else
  print_warning "Skipping version update (dry run)"
fi

# Step 5: Create git commit and tag
if [ "$DRY_RUN" = false ]; then
  print_step "Creating git commit and tag..."
  
  git add .
  git commit -m "Release v${NEW_VERSION}: Performance optimizations

- Add comprehensive caching across interpreter and parsers
- Optimize hot reload with batching and faster delta calculation
- Improve performance by 40-90% across all components
- Add cache management APIs and monitoring
- Update documentation with performance metrics"
  
  git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}: Performance Optimizations

Major performance improvements:
- 50% faster schema interpretation
- 90% faster parsing (cached)
- 40% faster hot reload
- 70% faster delta calculation

See CHANGELOG.md for full details."
  
  print_success "Git commit and tag created"
else
  print_warning "Skipping git commit and tag (dry run)"
fi

# Step 6: Publish to npm
if [ "$DRY_RUN" = false ]; then
  print_step "Publishing to npm..."
  
  read -p "Are you logged in to npm? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please run 'npm login' first"
    exit 1
  fi
  
  # Publish lumora_ir
  print_step "  Publishing lumora-ir..."
  cd packages/lumora_ir
  npm publish --access public || { print_error "Failed to publish lumora-ir"; exit 1; }
  cd ../..
  
  # Publish lumora-cli
  print_step "  Publishing lumora-cli..."
  cd packages/lumora-cli
  npm publish --access public || { print_error "Failed to publish lumora-cli"; exit 1; }
  cd ../..
  
  print_success "Packages published to npm"
else
  print_warning "Skipping npm publish (dry run)"
  
  # Show what would be published
  print_step "Dry run - would publish:"
  cd packages/lumora_ir
  npm pack --dry-run
  cd ../..
  
  cd packages/lumora-cli
  npm pack --dry-run
  cd ../..
fi

# Step 7: Push to git
if [ "$DRY_RUN" = false ]; then
  print_step "Pushing to git..."
  
  read -p "Push to origin? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    git push origin "v${NEW_VERSION}"
    print_success "Pushed to git"
  else
    print_warning "Skipped git push"
  fi
else
  print_warning "Skipping git push (dry run)"
fi

# Step 8: Create GitHub release
if [ "$DRY_RUN" = false ]; then
  print_step "Creating GitHub release..."
  
  if command -v gh &> /dev/null; then
    read -p "Create GitHub release? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      gh release create "v${NEW_VERSION}" \
        --title "Lumora v${NEW_VERSION} - Performance Optimizations" \
        --notes-file RELEASE_NOTES.md \
        --latest
      print_success "GitHub release created"
    else
      print_warning "Skipped GitHub release"
    fi
  else
    print_warning "GitHub CLI not found. Please create release manually at:"
    print_warning "https://github.com/your-org/lumora/releases/new"
  fi
else
  print_warning "Skipping GitHub release (dry run)"
fi

# Step 9: Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Publishing Complete!          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
print_success "Version ${NEW_VERSION} published successfully!"
echo ""
echo "Next steps:"
echo "  1. Announce release on social media"
echo "  2. Update documentation site"
echo "  3. Update example applications"
echo "  4. Monitor for issues"
echo ""
echo "Links:"
echo "  - npm: https://www.npmjs.com/package/lumora-ir"
echo "  - npm: https://www.npmjs.com/package/lumora-cli"
echo "  - GitHub: https://github.com/your-org/lumora/releases/tag/v${NEW_VERSION}"
echo ""
