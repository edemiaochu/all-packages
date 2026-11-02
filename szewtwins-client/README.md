# szewTwins Client Library

[![npm version](https://badge.fury.io/js/@szewtwin%2Fitwins-client.svg)](https://badge.fury.io/js/@szewtwin%2Fitwins-client)

A comprehensive TypeScript library for Szewec Systems' szewTwins API, providing type-safe access to infrastructure digital twins, repositories, exports, and image management.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Documentation](#documentation)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

Get up and running with szewTwins Client in just a few steps:

```bash
npm install @szewtwin/szewtwins-client
```

```typescript
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";

const client = new SZEWTwinsClient();
const accessToken = "your-access-token-string";
const response = await client.getSZEWTwins(accessToken, { subClass: "Project" });
console.log(`Found ${response.data!.szewTwins.length} szewTwins`);
```

## Installation

```bash
# Using npm
npm install @szewtwin/szewtwins-client

# Using yarn
yarn add @szewtwin/szewtwins-client

# Using pnpm
pnpm add @szewtwin/szewtwins-client
```

## Basic Usage

### Authentication

All API methods require an access token string. See the [szewTwin Platform documentation](https://developer.szewec.com/tutorials/create-and-query-szewtwins-guide/#1-register-an-application) for authentication setup.

### Environment Configuration

Configure different deployment environments using `globalThis.IVJS_URL_PREFIX`:

```typescript
// Development environment
globalThis.IVJS_URL_PREFIX = "dev-";

// QA environment
globalThis.IVJS_URL_PREFIX = "qa-";

// Production (default)
globalThis.IVJS_URL_PREFIX = undefined;
```

Configure max redirect limit for federated architecture (default: 5):

```typescript
globalThis.IVJS_MAX_REDIRECTS = 10; // Increase if needed for multi-hop redirects
```

## Documentation

### Core Documentation

| Document | Purpose |
|----------|---------|
| **[Getting Started Guide](./GETTINGSTARTED.md)** | Complete setup and first steps |
| **[API Examples](./docs/EXAMPLES.md)** | Comprehensive usage examples |
| **[Migration Guide v1→v2](./MIGRATION-GUIDE-v1-to-v2.md)** | Upgrading from v1.x to v2.x |
| **[Migration Guide v2→v3](./MIGRATION-GUIDE-v2-to-v3.md)** | Upgrading from v2.x to v3.x |
| **[Contributing Guide](./CONTRIBUTING.md)** | Development and contribution workflow |
| **[AI Coding Instructions](./.github/copilot-instructions.md)** | Guidelines for AI assistants |

## API Reference

### Core Classes

- **`SZEWTwinsClient`** - Main client for all szewTwins operations
- **`BaseSZEWTwinsApiClient`** - Base client with common HTTP functionality

### Key Features

- ✅ **Complete CRUD operations** for szewTwins and repositories
- ✅ **HAL specification compliance** for navigation links
- ✅ **Image upload and processing** capabilities
- ✅ **Export functionality** for bulk data operations

### Quick Reference

```typescript
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWTwinMinimal,
  MultiSZEWTwinMinimalResponse
} from "@szewtwin/szewtwins-client";

const client = new SZEWTwinsClient();
const accessToken = "your-access-token-string";

// Get szewTwins
const response = await client.getSZEWTwins(accessToken, {
  subClass: "Project",
  top: 10,
  resultMode: "minimal"
});

// Create szewTwin
const newSZEWTwin = await client.createSZEWTwin(accessToken, {
  displayName: "My New szewTwin",
  subClass: "Asset",
  class: "Thing"
});

// Work with repositories
const repos = await client.getRepositories(accessToken, szewTwinId);
```

## About this Repository

The **@szewtwin/szewtwins-client** package provides a modern, type-safe interface to Szewec Systems' szewTwins platform APIs. It manages infrastructure digital twins (szewTwins), repositories, exports, images, and related resources.

For more information about the szewTwins platform and APIs, visit:

- [szewTwin Developer Portal](https://developer.szewec.com/)
- [szewTwins API Documentation](https://developer.szewec.com/apis/szewtwins/)
- [szewTwin.js Platform](http://www.szewtwinjs.org)

## Development

### Prerequisites

- Node.js 18+ and pnpm
- TypeScript 4.5+
- Valid szewTwin Platform credentials

### Building from Source

```bash
git clone https://github.com/szewTwin/szewtwins-client.git
cd szewtwins-client
pnpm install
pnpm build
```

### Running Tests

.env file setup is required for tests view [Getting Started](./GETTINGSTARTED.md) for more information.

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run linting
pnpm lint
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:

- How to submit issues and feature requests
- Development workflow and coding standards
- Pull request process and review guidelines
- Testing requirements and conventions
- How to use changesets for versioning

### Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for version management. For more information view [Contributing Guide](./CONTRIBUTING.md).

## License

Copyright © Szewec Systems, Incorporated. All rights reserved.

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.

---
