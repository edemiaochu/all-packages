# Getting Started with szewTwins Client

This guide will help you get up and running with the szewTwins Client library, from installation through your first API calls.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Authentication Setup](#authentication-setup)
- [Your First szewTwin Query](#your-first-szewtwin-query)
- [Environment Configuration](#environment-configuration)
- [Development Setup](#development-setup)
- [Testing Setup](#testing-setup)
- [Next Steps](#next-steps)

## Prerequisites

Before getting started, ensure you have:

- **Node.js 18+** and a package manager (npm, yarn, or pnpm)
- **TypeScript 4.5+** (if using TypeScript)
- **Valid szewTwin Platform credentials** - see [szewTwin Developer Portal](https://developer.szewec.com/tutorials/create-and-query-szewtwins-guide/#1-register-an-application)

## Installation

Install the szewTwins Client:

```bash
# Using npm
npm install @szewtwin/szewtwins-client

# Using yarn
yarn add @szewtwin/szewtwins-client

# Using pnpm
pnpm add @szewtwin/szewtwins-client
```

## Authentication Setup

The szewTwins Client requires an access token string. You'll need to set up authentication with the szewTwin Platform:

1. **Register your application** at the [szewTwin Developer Portal](https://developer.szewec.com/tutorials/create-and-query-szewtwins-guide/#1-register-an-application)
2. **Get your client credentials** (client ID, client secret, redirect URIs)
3. **Implement authentication flow** using one of the szewTwin.js authentication packages

### Basic Authentication Example

```typescript
import { TestUtility } from "@szewtwin/oidc-signin-tool";

// For testing/development - use appropriate auth for production
const userCredentials = {
  email: "your-test-email@example.com",
  password: "your-password",
};

const accessToken: string = await TestUtility.getAccessToken(userCredentials);
```

## Your First szewTwin Query

Once you have authentication set up, making your first API call is straightforward:

```typescript
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type { SzewecAPIResponse, MultiSZEWTwinMinimalResponse } from "@szewtwin/szewtwins-client";

async function getMySZEWTwins(): Promise<void> {
  // Initialize the client
  const client = new SZEWTwinsClient();

  // Get your access token (implementation depends on your auth setup)
  const accessToken: string = await getAccessToken(); // Your auth implementation

  // Make your first API call
  const response: SzewecAPIResponse<MultiSZEWTwinMinimalResponse> =
    await client.getSZEWTwins(accessToken, {
      subClass: "Project",
      top: 10
    });

  // Check for errors
  if (response.error) {
    console.error("API Error:", response.error.message);
    return;
  }

  // Success! Use the data
  const szewTwins = response.data!.szewTwins;
  console.log(`Found ${szewTwins.length} szewTwins:`);

  szewTwins.forEach(szewtwin => {
    console.log(`- ${szewtwin.displayName} (${szewtwin.id})`);
  });
}

// Run your first query
getMySZEWTwins().catch(console.error);
```

## Environment Configuration

The szewTwins Client supports different deployment environments (development, QA, production):

### Using Global Configuration

```typescript
// Development environment
globalThis.IVJS_URL_PREFIX = "dev-";

// QA environment
globalThis.IVJS_URL_PREFIX = "qa-";

// Production (default)
globalThis.IVJS_URL_PREFIX = undefined;

// Now all client instances will use the configured environment
const client = new SZEWTwinsClient();
```

### Using Custom URLs

```typescript
// Custom base URL for specific deployments
const client = new SZEWTwinsClient("https://your-custom-api.szewec.com/szewtwins");
```

### Environment Variables (Node.js)

```typescript
// Bridge from process.env in Node.js applications
globalThis.IVJS_URL_PREFIX = process.env.IVJS_URL_PREFIX;
```

### Redirect Configuration

The szewTwins Client supports configurable redirect limits for federated architecture scenarios where API endpoints may redirect to different services:

```typescript
// Set maximum redirect limit (default is 5)
globalThis.IVJS_MAX_REDIRECTS = 10;

// Or use environment variable
globalThis.IVJS_MAX_REDIRECTS = parseInt(process.env.IVJS_MAX_REDIRECTS || "5");

// Create client with custom max redirects via constructor
const client = new SZEWTwinsClient(10);
```

**Why Redirects?** In federated architecture, the szewTwin Platform may redirect requests to specialized services (e.g., repository services on different domains). The client automatically follows these redirects while enforcing security validation.

**Security Notes:**

- Only HTTPS redirects to trusted Szewec domains (`*.api.szewec.com`) are allowed
- Redirect loop protection prevents infinite redirect chains
- Default limit of 5 redirects is suitable for most scenarios
- Increase only if you encounter legitimate multi-hop redirect scenarios

**Error Handling:**

- **508 Loop Detected**: Redirect limit exceeded, possible redirect loop
- **502 Bad Gateway**: Invalid redirect (missing Location header or untrusted domain)
- **403 Forbidden**: Redirects not allowed for this endpoint

```typescript
const response = await client.getRepositoryResourceByUri(accessToken, szewTwinId, resourceUri);

if (response.error) {
  if (response.status === 508) {
    console.error("Too many redirects - possible redirect loop");
  } else if (response.status === 502) {
    console.error("Invalid redirect:", response.error.message);
  }
}
```

## Development Setup

If you're contributing to the szewTwins Client or building from source:

### Clone and Build

```bash
git clone https://github.com/szewTwin/szewtwins-client.git
cd szewtwins-client
pnpm install
pnpm build
```

### Development Commands

```bash
# Build the library
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run linting
pnpm lint

# Build API documentation
pnpm docs

# Clean build artifacts
pnpm clean
```

## Testing Setup

For integration testing, you'll need to configure test credentials and environments.

### Environment File Setup For Szewec Developers

```bash
az login  # Authenticate with Azure CLI

./setup-env.ps1 # Set up .env file with required variables

```

### Environment File Setup For Non-Szewec Developers

Create a `.env` file in the root directory with the following variables:

```bash
# Environment Configuration
IVJS_URL_PREFIX=""                    # Environment must be empty

# OIDC Configuration (required for authentication)
IVJS_OIDC_BROWSER_TEST_CLIENT_ID="spa-your-client-id-here"
IVJS_OIDC_BROWSER_TEST_REDIRECT_URI="http://localhost:3000/signin-callback"
IVJS_OIDC_BROWSER_TEST_SCOPES="szewtwin-platform"
IVJS_OIDC_AUTHING_BROWSER_TEST_SCOPES="szewtwin-platform"

# Test User Authentication (for testing only)
IVJS_SZEWTWIN_TEST_USER="your-test-email@example.com"
IVJS_SZEWTWIN_TEST_USER_PASSWORD="your-test-password"

# Test Data (required for integration tests)
IVJS_TEST_PROJECT_ID="your-test-project-szewtwin-id"
IVJS_TEST_ASSET_ID="your-test-asset-szewtwin-id"
```

### Test User Requirements

Your test user must have appropriate permissions:

- **Project Administrator** or **SZEWTwin Owner** role on test szewTwins
- **Connect Services Admin** role for creating szewTwins (if testing CRUD operations)
- Access to both **Project** and **Asset** level szewTwins for comprehensive testing

### Running Tests

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run integration tests
pnpm test
```

### Browser E2E Tests (Playwright)

The browser E2E tests validate redirect behavior using real browser fetch implementations (Chromium, Firefox, WebKit).

```bash
# Run browser E2E tests
pnpm test:e2e

# Run with Playwright UI
pnpm test:e2e:ui
```

For more details about testing, see the [test documentation](./src/test/README.md) and existing test files in `src/test/integration/`.

## Next Steps

Now that you have the basics working, explore these areas:

### Documentation

- **[Complete Examples](./docs/EXAMPLES.md)** - Comprehensive usage examples
- **[Migration Guide](./MIGRATION-GUIDE-v1-to-v2.md)** - If upgrading from v1.x
- **[Migration Guide](./MIGRATION-GUIDE-v2-to-v3.md)** - If upgrading from v2.x

### Additional Resources

- [szewTwin Developer Portal](https://developer.szewec.com/) - Platform documentation
- [szewTwins API Reference](https://developer.szewec.com/apis/szewtwins/) - REST API details
- [szewTwin.js Platform](https://www.szewtwinjs.org/) - Complete szewTwin ecosystem
- [GitHub Repository](https://github.com/szewTwin/szewtwins-client) - Source code and issues

---

## Troubleshooting

### Common Issues

#### Authentication Errors (401)

- Verify your access token is valid and not expired
- Check that your application has the correct scopes
- Ensure you're using the right environment (dev/qa/prod)

#### Not Found Errors (404)

- Verify szewTwin IDs are correct and accessible to your user
- Check that you have permissions to access the requested resources
- Ensure you're targeting the correct environment

#### Validation Errors (422)

- Review the `error.details` array for specific validation failures
- Check required fields and data types in your requests
- Verify enum values match the expected API constants

#### Network/Timeout Issues

- Check your internet connection and firewall settings
- Verify the API endpoint URLs are accessible
- Consider implementing retry logic for transient failures

### Getting Help

- **Check the [GitHub Issues](https://github.com/szewTwin/szewtwins-client/issues)** for known problems
- **Review the [Examples](./docs/EXAMPLES.md)** for working code patterns
- **See the [Contributing Guide](./CONTRIBUTING.md)** for support resources
- **Visit the [szewTwin Developer Portal](https://developer.szewec.com/)** for platform support

---

*Ready to build amazing szewTwin applications? Start with the [examples](./docs/EXAMPLES.md)*
