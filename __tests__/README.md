# Tests

This directory contains unit and integration tests for the Notion-GCal Sync application.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test __tests__/lib/auth.test.ts

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

```
__tests__/
├── lib/
│   ├── auth.test.ts          # Authentication and email whitelist tests
│   └── env.test.ts            # Environment variable validation tests
└── proxy.test.ts              # Route protection proxy tests
```

## Test Coverage

### Authentication Tests (`lib/auth.test.ts`)

Tests for authentication functionality:

- **Email Whitelist**: Verifies authorized/unauthorized email logic
- **Environment Variables**: Validates required auth configuration
- **Session Strategy**: Confirms JWT-based authentication
- **OAuth Configuration**: Tests Google OAuth setup
- **Security**: Validates logging and rejection of unauthorized attempts
- **Callback URLs**: Tests redirect behavior

### Proxy Tests (`proxy.test.ts`)

Tests for route protection:

- **Public Routes**: Verifies auth endpoints, cron jobs, and webhooks are accessible
- **Protected Routes**: Ensures dashboard and API routes require authentication
- **Redirect Behavior**: Tests unauthenticated user redirection
- **Security Headers**: Validates CRON_SECRET and ADMIN_SECRET
- **Route Matching**: Tests middleware matcher configuration

### Environment Variable Tests (`lib/env.test.ts`)

Tests for environment configuration:

- **NEXTAUTH_SECRET**: Required secret validation
- **NEXTAUTH_URL**: Optional URL validation
- **GOOGLE_CLIENT_ID**: Google OAuth client ID validation
- **GOOGLE_CLIENT_SECRET**: Google OAuth client secret validation
- **AUTHORIZED_EMAILS**: Email list parsing and trimming
- **Complete Configuration**: End-to-end config validation

## Writing New Tests

When adding new features, ensure you:

1. **Create tests first** (TDD approach when possible)
2. **Test edge cases** (null, undefined, empty strings, etc.)
3. **Test security** (unauthorized access, invalid inputs)
4. **Test error handling** (what happens when things fail)
5. **Test happy paths** (normal, expected behavior)

### Example Test

```typescript
import { describe, expect, it } from "vitest";

describe("Feature Name", () => {
  describe("Specific Functionality", () => {
    it("should do something specific", () => {
      const result = myFunction("input");
      expect(result).toBe("expected output");
    });

    it("should handle edge case", () => {
      const result = myFunction(null);
      expect(result).toBe(null);
    });
  });
});
```

## Test Best Practices

1. **Use descriptive test names**: Tests should read like documentation
2. **One assertion per test**: Focus each test on a single behavior
3. **AAA Pattern**: Arrange, Act, Assert
4. **No test interdependencies**: Each test should be independent
5. **Clean up after tests**: Reset state, mocks, environment variables

## Continuous Integration

Tests run automatically on:

- Every push to `main` branch
- Every pull request
- Before deployment to Vercel

Tests must pass before code can be merged or deployed.

## Troubleshooting

### Tests fail with environment variable errors

Make sure you have a `.env.local` file with all required variables. You can copy from `.env.example`:

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

### Tests timeout

Increase the timeout in the test file:

```typescript
it("should complete async operation", async () => {
  // Test code
}, { timeout: 10000 }); // 10 second timeout
```

### Mock-related errors

Ensure you're properly cleaning up mocks:

```typescript
import { afterEach, beforeEach, vi } from "vitest";

describe("Tests with mocks", () => {
  let originalConsoleLog: typeof console.log;

  beforeEach(() => {
    originalConsoleLog = console.log;
    console.log = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [NextAuth Testing](https://next-auth.js.org/getting-started/client#testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
