# Migration Guide: szewTwins Client v1.x.x to v2.x.x

This guide will help you migrate from szewTwins Client v1.x.x to v2.x.x. Version 2.0 introduces significant breaking changes, new features, and a completely redesigned API surface.

## Table of Contents

- [Overview](#overview)
- [Class Migration](#class-migration)
- [Type Renames and Remapping](#type-renames-and-remapping)
- [Method Renames](#method-renames)
- [Response Structure Changes](#response-structure-changes)
- [Environment Configuration Changes](#environment-configuration-changes)
- [Parameter Changes](#parameter-changes)
- [New Public Exports Available](#new-public-exports-available)
- [New Methods Available](#new-methods-available)
- [Critical Migration Steps](#critical-migration-steps)
- [Migration Examples](#migration-examples)

## Overview

Version 2.0 represents a complete API redesign focused on:

- Modern TypeScript patterns with better type safety
- Comprehensive szewTwins API coverage
- Consistent naming conventions
- Enhanced developer experience
- HAL specification compliance for navigation links

## Class Migration

### Main Client Class

```typescript
// v1.x.x
import { SZEWTwinsAccessClient } from '@szewtwin/szewtwins-client';
const client = new SZEWTwinsAccessClient();

// v2.x.x
import { SZEWTwinsClient } from '@szewtwin/szewtwins-client';
const client = new SZEWTwinsClient();
```

The constructor signature remains the same, supporting optional custom URL parameter.

**Source**: [`src/szewTwinsClient.ts`](src/szewTwinsClient.ts)

## Type Renames and Remapping

### Response Types

```typescript
// v1.x.x
SZEWTwinAPIResponse
SZEWTwinResultMode

// v2.x.x
SzewecAPIResponse
ResultMode
```

**Source**: [`src/types/CommonApiTypes.ts`](src/types/CommonApiTypes.ts)

### Interface Splits

```typescript
// v1.x.x
interface SZEWTwin // Single interface for all cases

// v2.x.x
interface SZEWTwinMinimal
interface SZEWTwinRepresentation extends SZEWTwinMinimal
```

**Source**: [`src/types/SZEWTwin.ts`](src/types/SZEWTwin.ts)

### Enum to String Union Conversions

All enums have been converted to string union types for better API compatibility and type safety. String unions are preferred over enums because:

- **Type space vs Value space**: Enums exist in both type space and value space, creating runtime objects that can cause bundling issues and unexpected behavior. String unions exist only in the type space, providing compile-time safety without runtime overhead.
- **API compatibility**: String unions are more compatible with JSON APIs and don't require importing enum objects for comparison.
- **Serialization**: String unions serialize naturally without the need for special handling that enums sometimes require.

```typescript
// v1.x.x
enum SZEWTwinClass {
  Account = "Account",
  Thing = "Thing",
  Endeavor = "Endeavor"
}
// Creates runtime object: SZEWTwinClass.Account === "Account"

// v2.x.x
type SZEWTwinClass = "Thing" | "Endeavor" | "Account"
// Pure type definition: no runtime overhead, direct string comparison
```

**Source**: [`src/types/SZEWTwin.ts`](src/types/SZEWTwin.ts)

```typescript
// v1.x.x
enum SZEWTwinSubClass {
  Account = "Account",
  Asset = "Asset",
  Project = "Project",
  Portfolio = "Portfolio",
  Program = "Program",
  WorkPackage = "WorkPackage"
}

// v2.x.x
type SZEWTwinSubClass = "Account" | "Asset" | "Project" | "Portfolio" | "Program" | "WorkPackage"
```

**Source**: [`src/types/SZEWTwin.ts`](src/types/SZEWTwin.ts)

```typescript
// v1.x.x
enum RepositoryClass {
  iVaults = "iVaults",
  Storage = "Storage",
  Forms = "Forms",
  Issues = "Issues",
  RealityData = "RealityData",
  GeographicInformationSystem = "GeographicInformationSystem"
}

// v2.x.x
type RepositoryClass = "iVaults" | "Storage" | "Forms" | "Issues" | "RealityData" | "GeographicInformationSystem" | "Construction" | "Performance" | "Subsurface"
```

**Source**: [`src/types/Repository.ts`](src/types/Repository.ts)

```typescript
// v1.x.x
enum RepositorySubClass {
  WebMapService = "WebMapService",
  WebMapTileService = "WebMapTileService",
  ArcGIS = "ArcGIS",
  UrlTemplate = "UrlTemplate"
}

// v2.x.x
type RepositorySubClass = "WebMapService" | "WebMapTileService" | "ArcGIS" | "UrlTemplate" | "EvoWorkspace"
```

**Source**: [`src/types/Repository.ts`](src/types/Repository.ts)

## Method Renames

All method names have been updated to remove the 'Async' suffix and follow modern naming conventions:

**Source**: [`src/szewTwinsClient.ts`](src/szewTwinsClient.ts)

| v1.x.x Method | v2.x.x Method |
|---------------|---------------|
| `queryAsync()` | `getSZEWTwins()` |
| `getAsync()` | `getSZEWTwin()` |
| `queryFavoritesAsync()` | `getFavoritesSZEWTwins()` |
| `queryRecentsAsync()` | `getRecentUsedSZEWTwins()` |
| `queryRepositoriesAsync()` | `getRepositories()` |
| `getPrimaryAccountAsync()` | `getPrimaryAccount()` |
| `getAccountAsync()` | `getSZEWTwinAccount()` |
| `createszewTwin()` | `createSZEWTwin()` |
| `updateszewTwin()` | `updateSZEWtwin()` |
| `deleteszewTwin()` | `deleteSZEWtwin()` |

## Response Structure Changes

### v1.x.x Response Pattern

```typescript
// v1.x.x - Data was automatically unwrapped
const response = await client.queryAsync(token);
const szewtwins = response.data; // Array of szewTwins directly
```

### v2.x.x Response Pattern

```typescript
// v2.x.x - Data is properly wrapped with descriptive properties
const response = await client.getSZEWTwins(token);
const szewtwins = response.data.szewTwins; // Array in szewTwins property
const links = response.data._links; // HAL specification links

// Single szewTwin responses
const response = await client.getSZEWTwin(token, szewTwinId);
const szewtwin = response.data.szewTwin; // Single szewTwin in szewTwin property

// Repository responses
const response = await client.getRepositories(token, szewTwinId);
const repositories = response.data.repositories; // Array in repositories property
```

All paged responses now include `_links` properties following the HAL specification for navigation and pagination.
Single response now just include the object wrapped in a property name such as:

```typescript
{
  szewTwin: {...data};
}

```

## Environment Configuration Changes

### URL Prefix Configuration

Version 2.0 changes how environment-based URL prefixes are configured for better cross-platform compatibility:

```typescript
// v1.x.x - Node.js specific
process.env.IVJS_URL_PREFIX

// v2.x.x - Universal (works in both Node.js and browsers)
globalThis.IVJS_URL_PREFIX
```

**Benefits of the new approach:**

- **Cross-Platform Compatibility**: Works in both Node.js and browser environments
- **Runtime Configuration**: Can be modified at runtime, not just at process startup
- **Modern Standards**: Uses ES2020 `globalThis` standard for accessing global objects
- **Dynamic Environment Switching**: Enables scenarios like switching environments without restart

## Parameter Changes

### Deprecated subClass Parameter Removal

```typescript
// v1.x.x
await client.queryAsync(token, SZEWTwinSubClass.Project, args);
await client.queryFavoritesAsync(token, SZEWTwinSubClass.Asset, args);

// v2.x.x - subClass moved into args object
await client.getSZEWTwins(token, { subClass: "Project", ...args });
await client.getFavoritesSZEWTwins(token, { subClass: "Asset", ...args });
```

### Query Arguments Consolidation

Query arguments have been consolidated into single parameter objects with better TypeScript support:

```typescript
// v2.x.x - Enhanced query parameters
await client.getSZEWTwins(token, {
  subClass: "Project",
  status: "Active",
  search: "My Project",
  top: 10,
  skip: 0,
  resultMode: "representation",
  queryScope: "all",
  // New OData parameters, note "filter" ,"orderby" ,and "select" are only present in the getSZEWtwins method
  filter: "status eq 'Active'",
  orderby: "displayName asc",
  select: "id,displayName,status"
});
```

## New Public Exports Available

Version 2.0 exports many new types for enhanced development experience:

### Tree Shaking and Type-Only Imports

A major improvement in v2.x.x is the separation of types from runtime code to enable better tree shaking and smaller bundle sizes:

- **v1.x.x Problem**: Types were mixed with runtime exports in value space, preventing effective tree shaking
- **v2.x.x Solution**: Types are exported separately and should be imported with `import type` syntax

This change provides significant benefits:

1. **Bundle Size Reduction**: Only the runtime code you actually use gets bundled
2. **Better Tree Shaking**: Build tools can eliminate unused type definitions completely
3. **Faster Builds**: TypeScript can optimize type-only imports more efficiently
4. **Clear Intent**: Distinguishes between runtime dependencies and compile-time type checking

```typescript
// v1.x.x - Mixed exports prevented tree shaking
import { SZEWTwinsAccessClient, SZEWTwinClass, SomeUtilFunction } from '@szewtwin/szewtwins-client';
// This would bundle ALL exports, even unused ones

// v2.x.x - Separate type and value imports enable tree shaking
import { SZEWTwinsClient } from '@szewtwin/szewtwins-client'; // Runtime code only
import type { SZEWTwinClass, SzewecAPIResponse } from '@szewtwin/szewtwins-client'; // Types only

// Result: Only SZEWTwinsClient runtime code is bundled, types are stripped at compile time
```

**Migration Tip**: Always use `import type` for type-only imports to maximize bundle optimization:

### Repository Resource Types

```typescript
import type {
  PostRepositoryResourceResponse,
  GetRepositoryResourceMinimalResponse,
  GetRepositoryResourceRepresentationResponse,
  GetMultiRepositoryResourceMinimalResponse,
  GetMultiRepositoryResourceRepresentationResponse,
  NewRepositoryConfig
} from '@szewtwin/szewtwins-client';
```

**Source**: [`src/types/Repository.ts`](src/types/Repository.ts)

### Export Types

```typescript
import type {
  SZEWTwinExportRequestInfo,
  SZEWTwinExportSingleResponse,
  SZEWTwinExportMultiResponse
} from '@szewtwin/szewtwins-client';
```

**Source**: [`src/types/SZEWTwinExport.ts`](src/types/SZEWTwinExport.ts)

### Image Types

```typescript
import type { SZEWTwinImageResponse } from '@szewtwin/szewtwins-client';
```

**Source**: [`src/types/SZEWTwinImage.ts`](src/types/SZEWTwinImage.ts)

### Enhanced Query and Response Types

```typescript
import type {
  ODataQueryParams,
  SZEWTwinsQueryArg,
  Links,
  ResultMode,
  SzewecAPIResponse
} from '@szewtwin/szewtwins-client';
```

**Sources**:

- [`src/types/SZEWTwinsQueryArgs.ts`](src/types/SZEWTwinsQueryArgs.ts) - `SZEWTwinsQueryArg`
- [`src/types/CommonApiTypes.ts`](src/types/CommonApiTypes.ts) - `ODataQueryParams`, `SzewecAPIResponse`, `ResultMode`
- [`src/types/links.ts`](src/types/links.ts) - `Links`

## New Methods Available

Version 2.0 introduces many new methods for comprehensive szewTwins API coverage:

### Repository Resources (New) (Beta)

```typescript
// Create resources in GIS repositories
await client.createRepositoryResource(token, szewTwinId, repositoryId, resource);

// Get individual repository resources
await client.getRepositoryResource(token, szewTwinId, repositoryId, resourceId);

// Get multiple resources with filtering/pagination
await client.getRepositoryResources(token, szewTwinId, repositoryId, queryParams);
```

**Source**: [`src/szewTwinsClient.ts`](src/szewTwinsClient.ts) - Repository resource methods

### szewTwin Exports (New)

```typescript
// Create new szewTwin exports
await client.createExport(token, exportRequest);

// Get specific export details
await client.getExport(token, exportId);

// List user's exports
await client.getExports(token);
```

**Source**: [`src/szewTwinsClient.ts`](src/szewTwinsClient.ts) - Export methods

### Image Management (New)

```typescript
// Upload PNG/JPEG images
await client.uploadSZEWTwinImage(token, szewTwinId, imageBlob, contentType);

// Retrieve szewTwin images
await client.getSZEWTwinImage(token, szewTwinId);

// Remove szewTwin images
await client.deleteSZEWTwinImage(token, szewTwinId);
```

**Source**: [`src/szewTwinsClient.ts`](src/szewTwinsClient.ts) - Image management methods

### Enhanced Favorites and Recents

```typescript
// Add/remove favorites (new methods)
await client.addSZEWTwinToFavorites(token, szewTwinId);
await client.removeSZEWTwinFromFavorites(token, szewTwinId);

// Add to recents (new method)
await client.addSZEWTwinToMyRecents(token, szewTwinId);
```

**Source**: [`src/szewTwinsClient.ts`](src/szewTwinsClient.ts) - Favorites and recents methods

### Enhanced Repository Management

```typescript
// Get single repository by ID (new)
await client.getRepository(token, szewTwinId, repositoryId);

// Update existing repositories (new)
await client.updateRepository(token, szewTwinId, repositoryId, updates);

// Create repositories with enhanced type safety (improved in v2.x.x)
const newRepository: NewRepositoryConfig = {
  class: "GeographicInformationSystem",
  subClass: "WebMapService",
  uri: "https://example.com/mapserver",
  displayName: "My Map Service"
};
await client.createRepository(token, szewTwinId, newRepository);
```

**Source**: [`src/szewTwinsClient.ts`](src/szewTwinsClient.ts) - Repository management methods

**Note**: The `createRepository` method now uses `NewRepositoryConfig` type which provides better type safety by restricting class and subClass combinations to only those supported for repository creation.

## Critical Migration Steps

Follow these steps in order to migrate your codebase:

### 1. Update Import Statements

```typescript
// Replace this
import { SZEWTwinsAccessClient } from '@szewtwin/szewtwins-client';

// With this
import { SZEWTwinsClient } from '@szewtwin/szewtwins-client';
```

### 2. Update Class Instantiation

```typescript
// Replace this
const client = new SZEWTwinsAccessClient();

// With this
const client = new SZEWTwinsClient();
```

### 3. Remove 'Async' from Method Names

```typescript
// Replace this
await client.queryAsync(token, subClass, args);

// With this
await client.getSZEWTwins(token, args);
```

### 4. Update Response Handling

```typescript
// Replace this
const response = await client.queryAsync(token);
const szewtwins = response.data; // Direct array access

// With this
const response = await client.getSZEWTwins(token);
const szewtwins = response.data.szewTwins; // Wrapped in szewTwins property
const links = response.data._links; // Access navigation links
```

### 5. Move subClass Parameters

```typescript
// Replace this
await client.queryAsync(token, SZEWTwinSubClass.Project, args);

// With this
await client.getSZEWTwins(token, { subClass: "Project", ...args });
```

### 6. Update Type Imports

```typescript
// Replace enum imports
import { SZEWTwinClass, SZEWTwinSubClass } from '@szewtwin/szewtwins-client';

// With type imports (values remain the same)
import type { SZEWTwinClass, SZEWTwinSubClass } from '@szewtwin/szewtwins-client';
```

### 7. Update SZEWTwin Type Usage

```typescript
// Replace generic SZEWTwin usage
const szewtwin: SZEWTwin = response.data;

// With specific interface
const szewtwin: SZEWTwinMinimal = response.data.szewTwin; // For minimal mode
// OR
const szewtwin: SZEWTwinRepresentation = response.data.szewTwin; // For representation mode
```

### 8. Update Response Type Annotations

```typescript
// Replace this
const response: SZEWTwinsAPIResponse<SZEWTwin[]> = await client.queryAsync(token);

// With this
const response: SzewecAPIResponse<MultiSZEWTwinMinimalResponse> = await client.getSZEWTwins(token);
```

## Migration Examples

### Complete Before/After Example

```typescript
// v1.x.x
import { SZEWTwinsAccessClient, SZEWTwinSubClass, SZEWTwinsAPIResponse, SZEWTwin } from '@szewtwin/szewtwins-client';

const client = new SZEWTwinsAccessClient();

async function getProjectSZEWTwins(token: string) {
  const response: SZEWTwinsAPIResponse<SZEWTwin[]> = await client.queryAsync(
    token,
    SZEWTwinSubClass.Project,
    {
      top: 10,
      search: "My Project",
      resultMode: "representation"
    }
  );

  const szewtwins = response.data; // Direct array access
  return szewtwins;
}

// v2.x.x
import { SZEWTwinsClient } from '@szewtwin/szewtwins-client';
import type {SzewecAPIResponse, MultiSZEWTwinRepresentationResponse} from '@szewtwin/szewtwins-client'

const client = new SZEWTwinsClient();

async function getProjectSZEWTwins(token: string) {
  const response: SzewecAPIResponse<MultiSZEWTwinRepresentationResponse> = await client.getSZEWTwins(
    token,
    {
      subClass: "Project", // Moved into args object
      top: 10,
      search: "My Project",
      resultMode: "representation"
    }
  );

  const szewtwins = response.data.szewTwins; // Wrapped in szewTwins property
  const links = response.data._links; // Access navigation links
  return { szewtwins, links };
}
```

### Repository Query Migration

```typescript
// v1.x.x
const response = await client.queryRepositoriesAsync(token, szewTwinId, {
  class: "GeographicInformationSystem"
});
const repositories = response.data; // Direct array

// v2.x.x
const response = await client.getRepositories(token, szewTwinId, {
  class: "GeographicInformationSystem"
});
const repositories = response.data.repositories; // Wrapped in repositories property
```

### Repository Creation with Enhanced Type Safety

```typescript
// v1.x.x - Basic Repository interface
const newRepository: Repository = {
  class: RepositoryClass.GeographicInformationSystem,
  subClass: RepositorySubClass.WebMapService,
  uri: "https://example.com/mapserver"
};
await client.createRepository(token, szewTwinId, newRepository);

// v2.x.x - NewRepositoryConfig with restricted types
import type { NewRepositoryConfig } from '@szewtwin/szewtwins-client';

const newRepository: NewRepositoryConfig = {
  class: "GeographicInformationSystem", // Only creatable classes allowed
  subClass: "WebMapService", // Only creatable subClasses allowed
  uri: "https://example.com/mapserver",
  displayName: "My Map Service" // Optional but recommended
};
await client.createRepository(token, szewTwinId, newRepository);
```

This migration guide should help you successfully upgrade from szewTwins Client v1.x.x to v2.x.x. The new version provides significantly enhanced functionality while maintaining the core patterns you're familiar with.

## Additional Resources

- **Main Export File**: [`src/szewtwins-client.ts`](src/szewtwins-client.ts) - All public exports
- **Client Implementation**: [`src/szewTwinsClient.ts`](src/szewTwinsClient.ts) - Main client class
- **Type Definitions**: [`src/types/`](src/types/) - All type definitions
