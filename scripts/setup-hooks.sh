#!/usr/bin/env bash

# Setup Git Hooks
# This script installs git hooks to ensure code quality before commits

set -e

# Skip in CI environments - no git hooks needed
if [ -n "$CI" ] || [ -n "$VERCEL" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$CIRCLECI" ]; then
  exit 0
fi

echo "🔧  Setting up git hooks..."

# Get the git directory (works for both regular repos and worktrees)
GIT_DIR=$(git rev-parse --git-dir)

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_DIR/hooks"

# Install pre-commit hook
cat > "$GIT_DIR/hooks/pre-commit" << 'EOF'
#!/usr/bin/env sh

# Pre-commit hook to ensure code quality
# This hook runs linting and formatting before each commit

echo "🔍  Running pre-commit checks..."

# Find pnpm executable
PNPM_CMD=""
if command -v pnpm >/dev/null 2>&1; then
  PNPM_CMD="pnpm"
else
  echo "❌  pnpm not found in PATH. Please install pnpm or ensure it's in your PATH."
  exit 1
fi

# Run oxlint with auto-fix and oxfmt formatting
echo "📝  Linting and formatting code..."
$PNPM_CMD run lint:fix
$PNPM_CMD run format

# Stage any changes made by the formatter/fixer
git add -u

# Check if there are still linting/formatting errors
echo "✅  Verifying lint and format status..."
if ! $PNPM_CMD run lint; then
  echo "❌  Linting failed. Please fix the errors manually and try again."
  exit 1
fi

if ! $PNPM_CMD run format:check; then
  echo "❌  Formatting check failed. Please fix and try again."
  exit 1
fi

echo "✅  Pre-commit checks passed!"
exit 0
EOF

# Make the hook executable
chmod +x "$GIT_DIR/hooks/pre-commit"

echo "✅  Git hooks installed successfully!"
echo ""
echo "💡  The pre-commit hook will now:"
echo "   1. Auto-fix lint issues with oxlint"
echo "   2. Auto-format your code with oxfmt"
echo "   3. Run linting and format checks"
echo "   4. Prevent commits if checks fail"
echo ""
echo "To bypass the hook (not recommended): git commit --no-verify"
