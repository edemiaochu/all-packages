# szewTwins Client Usage Examples

This document provides comprehensive examples for using the szewTwins Client library. All examples assume you have a valid `AccessToken` from `@szewtwin/core-szewec`.

## Table of Contents

- [Basic Operations](#basic-operations)
- [szewTwins Management](#szewtwins-management)
- [Repository Operations](#repository-operations)
- [Export Operations](#export-operations)
- [Image Management](#image-management)
- [Favorites and Recents](#favorites-and-recents)
- [Account Operations](#account-operations)
- [Advanced Queries](#advanced-queries)
- [Environment Configuration](#environment-configuration)
- [Error Handling](#error-handling)

## Basic Operations

### Get List of szewTwins

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  MultiSZEWTwinMinimalResponse,
} from "@szewtwin/szewtwins-client";

/** Function that queries all szewTwins and prints their ids to the console. */
async function printszewTwinIds(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const szewTwinsResponse: SzewecAPIResponse<MultiSZEWTwinMinimalResponse> =
    await szewTwinsClient.getSZEWTwins(accessToken, { subClass: "Project" });

  szewTwinsResponse.data!.szewTwins.forEach((actualszewTwin) => {
    console.log(actualszewTwin.id);
  });
}
```

### Get szewTwin by ID

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWTwinMinimalResponse,
} from "@szewtwin/szewtwins-client";

/** Function that gets szewTwin by id and prints the id and displayName. */
async function printszewTwinDetails(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const szewTwinsResponse: SzewecAPIResponse<SZEWTwinMinimalResponse> =
    await szewTwinsClient.getSZEWTwin(
      accessToken,
      "3865240b-cfd9-4ba1-a9e5-65e8813d006b"
    );
  const actualszewTwin = szewTwinsResponse.data!.szewTwin;
  console.log(actualszewTwin.id, actualszewTwin.displayName);
}
```

### Pagination with Top/Skip

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  MultiSZEWTwinMinimalResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates pagination using top/skip parameters. */
async function paginatedQuery(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const szewTwinsResponse: SzewecAPIResponse<MultiSZEWTwinMinimalResponse> =
    await szewTwinsClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      top: 25,
      skip: 13,
    });

  szewTwinsResponse.data!.szewTwins.forEach((actualszewTwin) => {
    console.log(actualszewTwin.id);
  });
}
```

## szewTwins Management

### Create, Update, and Delete an szewTwin

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWtwinCreate,
  SZEWtwinUpdate,
  SZEWTwinRepresentationResponse,
} from "@szewtwin/szewtwins-client";

/** Function that creates, updates, and then deletes an szewTwin. */
async function demoCRUD(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  /* Create the szewTwin */
  const newszewTwin: SZEWtwinCreate = {
    displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
    number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
    type: "Bridge",
    subClass: "Asset",
    class: "Thing",
    dataCenterLocation: "East US",
    status: "Trial",
  };

  // Act
  const createResponse: SzewecAPIResponse<SZEWTwinRepresentationResponse> =
    await szewTwinsClient.createSZEWTwin(accessToken, newszewTwin);
  const szewTwinId = createResponse.data!.szewTwin.id;

  console.log("Created szewTwin:", szewTwinId);

  /* Update the szewTwin */
  const updatedszewTwin: SZEWtwinUpdate = {
    displayName: `Updated ${newszewTwin.displayName}`,
    status: "Active",
  };

  const updateResponse: SzewecAPIResponse<SZEWTwinRepresentationResponse> =
    await szewTwinsClient.updateSZEWtwin(accessToken, szewTwinId, updatedszewTwin);

  console.log("Updated szewTwin:", updateResponse.data!.szewTwin.displayName);

  /* Delete the szewTwin */
  const deleteResponse: SzewecAPIResponse<undefined> =
    await szewTwinsClient.deleteSZEWtwin(accessToken, szewTwinId);

  console.log("Deleted szewTwin, status:", deleteResponse.status);
}
```

## Repository Operations

Repository `class` and `subClass` values are API-provided string identifiers.
The examples below use common values, but the exported repository aliases are no longer exhaustive unions.

### Get Repositories by szewTwin ID

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  MultiRepositoriesResponse,
} from "@szewtwin/szewtwins-client";

/** Function that queries all szewTwin Repositories and prints their ids to the console. */
async function printRepositoryIds(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const repositoriesResponse: SzewecAPIResponse<MultiRepositoriesResponse> =
    await szewTwinsClient.getRepositories(
      accessToken,
      "e36e29fa-11c0-4ac8-9ead-e8678ebc393c"
    );

  repositoriesResponse.data!.repositories.forEach((actualRepository) => {
    console.log(actualRepository.id);
  });
}
```

### Filter Repositories by Class and SubClass

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  MultiRepositoriesResponse,
} from "@szewtwin/szewtwins-client";

/** Function that queries filtered repositories. */
async function printFilteredRepositoryIds(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const repositoriesResponse: SzewecAPIResponse<MultiRepositoriesResponse> =
    await szewTwinsClient.getRepositories(
      accessToken,
      "e36e29fa-11c0-4ac8-9ead-e8678ebc393c",
      {
        class: "GeographicInformationSystem",
        subClass: "WebMapService",
      }
    );

  repositoriesResponse.data!.repositories.forEach((actualRepository) => {
    console.log(actualRepository.id);
  });
}
```

### Create and Delete Repository

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWtwinCreate,
  SZEWTwinRepresentationResponse,
  NewRepositoryConfig,
  SingleRepositoryResponse,
} from "@szewtwin/szewtwins-client";

/** Function that creates an szewTwin, creates a repository, then deletes both. */
async function demoRepositoryCRUD(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  /* Create an szewTwin first */
  const newszewTwin: SZEWtwinCreate = {
    displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
    number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
    type: "Bridge",
    subClass: "Asset",
    class: "Thing",
    dataCenterLocation: "East US",
    status: "Trial",
  };
  const createResponse: SzewecAPIResponse<SZEWTwinRepresentationResponse> =
    await szewTwinsClient.createSZEWTwin(accessToken, newszewTwin);
  const szewTwinId = createResponse.data!.szewTwin.id;

  /* Create the szewTwin Repository */
  const newRepository: NewRepositoryConfig = {
    class: "GeographicInformationSystem",
    subClass: "WebMapService",
    uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
  };
  const repositoryCreateResponse: SzewecAPIResponse<SingleRepositoryResponse> =
    await szewTwinsClient.createRepository(
      accessToken,
      szewTwinId,
      newRepository
    );

  const repositoryId = repositoryCreateResponse.data!.repository.id;

  console.log("Created repository:", repositoryId);

  /* Delete the szewTwin Repository */
  const repositoryDeleteResponse: SzewecAPIResponse<undefined> =
    await szewTwinsClient.deleteRepository(
      accessToken,
      szewTwinId,
      repositoryId
    );

  console.log("Deleted repository, status:", repositoryDeleteResponse.status);

  /* Delete the szewTwin */
  const deleteSZEWTwinResponse: SzewecAPIResponse<undefined> =
    await szewTwinsClient.deleteSZEWtwin(accessToken, szewTwinId);

  console.log("Deleted szewTwin, status:", deleteSZEWTwinResponse.status);
}
```

### Get Single Repository Details

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SingleRepositoryResponse,
} from "@szewtwin/szewtwins-client";

/** Function that gets details of a specific repository. */
async function getRepositoryDetails(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const response: SzewecAPIResponse<SingleRepositoryResponse> =
    await client.getRepository(
      accessToken,
      "your-szewtwin-id",
      "your-repository-id"
    );

  if (response.error) {
    console.error("Error fetching repository:", response.error.message);
    return;
  }

  const repo = response.data!.repository;
  console.log(`Repository: ${repo.displayName || repo.id}`);
  console.log(`Class: ${repo.class}, SubClass: ${repo.subClass}`);
  console.log(`URI: ${repo.uri}`);

  if (repo.capabilities) {
    console.log(`Capabilities: ${repo.capabilities.join(", ")}`);
  }
}
```

## Global Repository Operations

Global repositories are not scoped to a specific szewTwin. These endpoints are currently Technical Preview APIs.

### Get Global Repositories

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  MultiRepositoriesResponse,
} from "@szewtwin/szewtwins-client";

/** Function that lists global repositories available to all szewTwins. */
async function printGlobalRepositoryIds(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const response: SzewecAPIResponse<MultiRepositoriesResponse> =
    await client.getGlobalRepositories(accessToken, { class: "Cesium" });

  response.data!.repositories.forEach((repository) => {
    console.log(repository.id, repository.displayName);
  });
}
```

### Get Global Repository Resources and Graphics

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";

/** Function that reads a global repository resource and its graphics metadata. */
async function readGlobalResourceGraphics(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const resourcesResponse = await client.getGlobalRepositoryResources(
    accessToken,
    "cesium",
    { top: 1 }
  );

  const resource = resourcesResponse.data!.resources[0];
  const resourceResponse = await client.getGlobalRepositoryResource(
    accessToken,
    "cesium",
    resource.id,
    "representation"
  );
  const graphicsResponse = await client.getGlobalResourceGraphics(
    accessToken,
    "cesium",
    resource.id
  );

  console.log(resourceResponse.data!.resource.displayName);
  console.log(graphicsResponse.data!.graphics.map((graphic) => graphic.uri));
}
```

### Update Repository

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SingleRepositoryResponse,
  Repository,
} from "@szewtwin/szewtwins-client";

/** Function that updates repository properties. */
async function updateRepository(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const updates: Partial<Omit<Repository, "id" | "class" | "subClass" | "capabilities">> = {
    displayName: "Updated Repository Name",
    description: "Updated repository description",
    uri: "https://updated-service-url.com/service"
  };

  const response: SzewecAPIResponse<SingleRepositoryResponse> =
    await client.updateRepository(
      accessToken,
      "your-szewtwin-id",
      "your-repository-id",
      updates
    );

  if (response.error) {
    console.error("Error updating repository:", response.error.message);
    return;
  }

  const repo = response.data!.repository;
  console.log(`Repository updated: ${repo.displayName}`);
  console.log(`New description: ${repo.description}`);
}
```

### Repository Resource Operations

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  PostRepositoryResourceResponse,
  GetRepositoryResourceMinimalResponse,
  GetMultiRepositoryResourceMinimalResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates repository resource CRUD operations. */
async function manageRepositoryResources(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";
  const repositoryId = "your-geo-info-system-repository-id";

  // Create a repository resource
  const newResource = {
    id: "resource-identifier",
    displayName: "My Geographic Resource"
  };

  const createResponse: SzewecAPIResponse<PostRepositoryResourceResponse> =
    await client.createRepositoryResource(accessToken, szewTwinId, repositoryId, newResource);

  if (createResponse.error) {
    console.error("Error creating resource:", createResponse.error.message);
    return;
  }

  console.log("Resource created:", createResponse.data!.resource.id);

  // Get all repository resources
  const getAllResponse: SzewecAPIResponse<GetMultiRepositoryResourceMinimalResponse> =
    await client.getRepositoryResources(accessToken, szewTwinId, repositoryId, {
      search: "geographic",
      top: 10
    });

  if (getAllResponse.error) {
    console.error("Error fetching resources:", getAllResponse.error.message);
    return;
  }

  console.log(`Found ${getAllResponse.data!.resources.length} resources`);

  // Get specific resource details
  const getResponse: SzewecAPIResponse<GetRepositoryResourceMinimalResponse> =
    await client.getRepositoryResource(
      accessToken,
      szewTwinId,
      repositoryId,
      newResource.id
    );

  if (getResponse.error) {
    console.error("Error fetching resource details:", getResponse.error.message);
    return;
  }

  console.log(`Resource details: ${getResponse.data!.resource.displayName}`);

  // Delete the repository resource
  const deleteResponse: SzewecAPIResponse<undefined> =
    await client.deleteRepositoryResource(
      accessToken,
      szewTwinId,
      repositoryId,
      newResource.id
    );

  if (deleteResponse.error) {
    console.error("Error deleting resource:", deleteResponse.error.message);
    return;
  }

  console.log("Resource deleted successfully");
}
```

### Repository Resources with Different Result Modes

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  GetRepositoryResourceRepresentationResponse,
  GetMultiRepositoryResourceRepresentationResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates getting repository resources with detailed information. */
async function getDetailedRepositoryResources(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";
  const repositoryId = "your-repository-id";
  const resourceId = "your-resource-id";

  // Get detailed information about a specific resource
  const detailedResponse: SzewecAPIResponse<GetRepositoryResourceRepresentationResponse> =
    await client.getRepositoryResource(
      accessToken,
      szewTwinId,
      repositoryId,
      resourceId,
      "representation"
    );

  if (detailedResponse.error) {
    console.error("Error fetching detailed resource:", detailedResponse.error.message);
    return;
  }

  const resource = detailedResponse.data!.resource;
  console.log(`Resource: ${resource.displayName}`);
  console.log(`Created: ${resource.createdDateTime}`);
  console.log(`Modified: ${resource.lastModified}`);
  console.log(`Size: ${resource.size} bytes`);

  // Get all resources with detailed information
  const allDetailedResponse: SzewecAPIResponse<GetMultiRepositoryResourceRepresentationResponse> =
    await client.getRepositoryResources(
      accessToken,
      szewTwinId,
      repositoryId,
      { top: 5 },
      "representation"
    );

  if (allDetailedResponse.error) {
    console.error("Error fetching detailed resources:", allDetailedResponse.error.message);
    return;
  }

  const resources = allDetailedResponse.data!.resources;
  console.log(`\nFound ${resources.length} detailed resources:`);
  resources.forEach((res) => {
    console.log(`- ${res.displayName} (${res.size} bytes, modified: ${res.lastModified})`);
  });
}
```

## Advanced Queries

### Enhanced OData Query

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  MultiSZEWTwinRepresentationResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates enhanced query capabilities with OData parameters. */
async function advancedQuery(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const szewTwinsResponse: SzewecAPIResponse<MultiSZEWTwinRepresentationResponse> =
    await szewTwinsClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      resultMode: "representation",
      filter: "status eq 'Active'",
      orderby: "displayName asc",
      select: "id,displayName,status,createdDateTime",
      top: 10,
    });

  // Access szewTwins data
  const szewTwins = szewTwinsResponse.data!.szewTwins;

  // Access HAL navigation links
  const links = szewTwinsResponse.data!._links;
  console.log("Self link:", links.self?.href);
  console.log("Next page:", links.next?.href);

  szewTwins.forEach((szewtwin) => {
    console.log(`${szewtwin.displayName} (${szewtwin.status}) - Created: ${szewtwin.createdDateTime}`);
  });
}
```

## Repository URI-Based Operations (Federated Architecture)

The URI-based repository methods enable direct calls to federated repository endpoints using URIs from repository capabilities. This supports distributed architecture where repository data may be hosted on different services.

### Why Use URI-Based Methods?

- **Federated Architecture**: Direct client-to-source communication without routing through central API
- **Improved Performance**: Reduced latency by eliminating extra hops
- **Future-Proof**: Supports evolving distributed infrastructure
- **Backward Compatible**: Old methods still work, migrate at your own pace

### Get Repository Resources Using Capability URI

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SingleRepositoryResponse,
  GetMultiRepositoryResourceMinimalResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates using URI-based resource fetching. */
async function getResourcesWithUri(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";
  const repositoryId = "your-repository-id";

  // Step 1: Get repository with capabilities
  const repoResponse: SzewecAPIResponse<SingleRepositoryResponse> =
    await client.getRepository(accessToken, szewTwinId, repositoryId);

  if (repoResponse.error) {
    console.error("Error fetching repository:", repoResponse.error.message);
    return;
  }

  // Step 2: Extract capability URI
  const resourcesUri = repoResponse.data?.repository.capabilities?.resources?.uri;

  if (!resourcesUri) {
    console.log("Repository does not support resources capability");
    return;
  }

  // Step 3: Use URI-based method to fetch resources
  const resourcesResponse: SzewecAPIResponse<GetMultiRepositoryResourceMinimalResponse> =
    await client.getRepositoryResourcesByUri(accessToken, resourcesUri);

  if (resourcesResponse.error) {
    console.error("Error fetching resources:", resourcesResponse.error.message);
    return;
  }

  // Step 4: Process resources
  const resources = resourcesResponse.data!.resources;
  console.log(`Found ${resources.length} resources`);

  resources.forEach((resource) => {
    console.log(`- ${resource.displayName || resource.id} (${resource.class})`);
  });
}
```

### Get Resources with Filtering and Pagination

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  GetMultiRepositoryResourceRepresentationResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates URI-based resource fetching with OData parameters. */
async function getFilteredResourcesWithUri(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";
  const repositoryId = "your-repository-id";

  // Get repository capabilities
  const repoResponse = await client.getRepository(accessToken, szewTwinId, repositoryId);
  const resourcesUri = repoResponse.data?.repository.capabilities?.resources?.uri;

  if (!resourcesUri) {
    console.log("Resources capability not available");
    return;
  }

  // Fetch resources with search and pagination in representation mode
  const resourcesResponse: SzewecAPIResponse<GetMultiRepositoryResourceRepresentationResponse> =
    await client.getRepositoryResourcesByUri(
      accessToken,
      resourcesUri,
      {
        search: "map",  // Search for resources containing "map"
        top: 10,        // Limit to 10 results
        skip: 0         // Start from beginning
      },
      "representation"  // Get detailed resource information
    );

  if (resourcesResponse.error) {
    console.error("Error:", resourcesResponse.error.message);
    return;
  }

  const resources = resourcesResponse.data!.resources;
  console.log(`Found ${resources.length} matching resources`);

  resources.forEach((resource) => {
    console.log(`Resource: ${resource.displayName || resource.id}`);
    console.log(`  Type: ${resource.class} / ${resource.subClass || "N/A"}`);
    if (resource.description) {
      console.log(`  Description: ${resource.description}`);
    }
  });
}
```

### Get Single Resource Using Capability URI

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  GetRepositoryResourceRepresentationResponse,
} from "@szewtwin/szewtwins-client";

/** Function that fetches a specific resource using its capability URI. */
async function getResourceByUri(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";
  const repositoryId = "your-repository-id";
  const resourceId = "your-resource-id";

  // Get repository capabilities
  const repoResponse = await client.getRepository(accessToken, szewTwinId, repositoryId);
  const resourcesUri = repoResponse.data?.repository.capabilities?.resources?.uri;

  if (!resourcesUri) {
    console.log("Resources capability not available");
    return;
  }

  // Construct specific resource URI
  const resourceUri = `${resourcesUri}/${resourceId}`;

  // Fetch resource with full details
  const resourceResponse: SzewecAPIResponse<GetRepositoryResourceRepresentationResponse> =
    await client.getRepositoryResourceByUri(
      accessToken,
      resourceUri,
      "representation"
    );

  if (resourceResponse.error) {
    console.error("Error fetching resource:", resourceResponse.error.message);
    return;
  }

  const resource = resourceResponse.data!.resource;
  console.log(`Resource: ${resource.displayName || resource.id}`);
  console.log(`Class: ${resource.class}`);

  // Check for graphics capability
  if (resource.capabilities?.graphics?.uri) {
    console.log("Graphics available at:", resource.capabilities.graphics.uri);
  }
}
```

### Get Graphics Metadata Using Capability URI

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  GetRepositoryResourceRepresentationResponse,
  ResourceGraphicsResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates fetching graphics metadata for a resource. */
async function getResourceGraphics(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";
  const repositoryId = "your-repository-id";
  const resourceId = "your-resource-id";

  // Get repository capabilities
  const repoResponse = await client.getRepository(accessToken, szewTwinId, repositoryId);
  const resourcesUri = repoResponse.data?.repository.capabilities?.resources?.uri;

  if (!resourcesUri) {
    console.log("Resources capability not available");
    return;
  }

  // Get resource with capabilities
  const resourceUri = `${resourcesUri}/${resourceId}`;
  const resourceResponse: SzewecAPIResponse<GetRepositoryResourceRepresentationResponse> =
    await client.getRepositoryResourceByUri(accessToken, resourceUri, "representation");

  if (resourceResponse.error) {
    console.error("Error fetching resource:", resourceResponse.error.message);
    return;
  }

  // Extract graphics capability URI
  const graphicsUri = resourceResponse.data?.resource.capabilities?.graphics?.uri;

  if (!graphicsUri) {
    console.log("Resource does not have graphics capability");
    return;
  }

  // Fetch graphics metadata
  const graphicsResponse: SzewecAPIResponse<ResourceGraphicsResponse> =
    await client.getResourceGraphicsByUri(accessToken, graphicsUri);

  if (graphicsResponse.error) {
    console.error("Error fetching graphics:", graphicsResponse.error.message);
    return;
  }

  const graphics = graphicsResponse.data!.graphics;
  console.log(`Graphics Content Type: ${graphics.contentType}`);
  console.log(`Graphics URI: ${graphics.uri}`);

  // Display authentication information
  if (graphics.authentication) {
    console.log(`Authentication Type: ${graphics.authentication.type}`);

    switch (graphics.authentication.type) {
      case "ApiKey-Authentication":
        console.log(`  Header: ${graphics.authentication.header}`);
        console.log(`  Query Parameter: ${graphics.authentication.query}`);
        break;

      case "OAuth2AuthCodePKCE-Authentication":
        console.log(`  Authorization Endpoint: ${graphics.authentication.authorizationEndpoint}`);
        console.log(`  Token Endpoint: ${graphics.authentication.tokenEndpoint}`);
        console.log(`  Client ID: ${graphics.authentication.clientId}`);
        break;

      case "Basic-Authentication":
        console.log("  Basic authentication required");
        break;
    }
  }

  // Display provider configuration (e.g., for CesiumJS)
  if (graphics.provider) {
    console.log(`Provider Name: ${graphics.provider.name}`);
    console.log("Provider Options:", JSON.stringify(graphics.provider.options, null, 2));
  }
}
```

### Migration Example: Old Method to New URI-Based Method

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";

/** Function demonstrating migration from deprecated to URI-based methods. */
async function migrationExample(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";
  const repositoryId = "your-repository-id";
  const resourceId = "your-resource-id";

  // ❌ OLD WAY (deprecated - will be removed in v3.0.0)
  const oldResponse = await client.getRepositoryResource(
    accessToken,
    szewTwinId,
    repositoryId,
    resourceId,
    "representation"
  );

  if (oldResponse.data) {
    console.log("Old method result:", oldResponse.data.resource.displayName);
  }

  // ✅ NEW WAY (recommended - supports federated architecture)
  const repoResponse = await client.getRepository(accessToken, szewTwinId, repositoryId);
  const resourcesUri = repoResponse.data?.repository.capabilities?.resources?.uri;

  if (resourcesUri) {
    const resourceUri = `${resourcesUri}/${resourceId}`;
    const newResponse = await client.getRepositoryResourceByUri(
      accessToken,
      resourceUri,
      "representation"
    );

    if (newResponse.data) {
      console.log("New method result:", newResponse.data.resource.displayName);
    }
  }

  // Both methods return equivalent data, but the new method:
  // - Supports federated/distributed architecture
  // - Enables direct communication with source repositories
  // - Improves performance by reducing network hops
  // - Future-proofs your code for evolving infrastructure
}
```

### Error Handling with URI-Based Methods

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";

/** Function that demonstrates proper error handling with URI-based methods. */
async function handleErrors(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";
  const repositoryId = "your-repository-id";

  try {
    // Get repository capabilities
    const repoResponse = await client.getRepository(accessToken, szewTwinId, repositoryId);

    if (repoResponse.error) {
      console.error(`Repository error [${repoResponse.error.code}]:`, repoResponse.error.message);
      return;
    }

    const resourcesUri = repoResponse.data?.repository.capabilities?.resources?.uri;

    // Check if capability is available
    if (!resourcesUri) {
      console.log("Repository does not support resources capability");
      console.log("This repository class may not provide resource management");
      return;
    }

    // Attempt to fetch resources
    const resourcesResponse = await client.getRepositoryResourcesByUri(accessToken, resourcesUri);

    if (resourcesResponse.error) {
      // Handle specific error codes
      switch (resourcesResponse.error.code) {
        case "Unauthorized":
          console.error("Access token does not have permission for this resource");
          break;
        case "NotFound":
          console.error("Resource endpoint not found - capability URI may be invalid");
          break;
        case "InternalServerError":
          console.error("Federated service encountered an error");
          break;
        default:
          console.error(`Error [${resourcesResponse.error.code}]:`, resourcesResponse.error.message);
      }
      return;
    }

    // Success
    const resources = resourcesResponse.data!.resources;
    console.log(`Successfully fetched ${resources.length} resources`);

  } catch (error) {
    console.error("Unexpected error:", error);
  }
}
```

### Resource Graphics

The szewTwins API supports retrieving graphics metadata for repository resources. This metadata includes URLs to access graphical content (such as 3D tiles, imagery, terrain data) along with any required authentication details. Graphics can be retrieved using either ID-based parameters or a direct URI.

#### Get Resource Graphics by ID

Retrieve graphics metadata using szewTwin ID, repository ID, and resource ID:

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  ResourceGraphicsResponse,
} from "@szewtwin/szewtwins-client";

/** Function that retrieves resource graphics metadata by ID. */
async function getResourceGraphicsByIds(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const szewTwinId = "your-szewtwin-id";
  const repositoryId = "your-repository-id";
  const resourceId = "your-resource-id";

  const response: SzewecAPIResponse<ResourceGraphicsResponse> =
    await client.getResourceGraphics(
      accessToken,
      szewTwinId,
      repositoryId,
      resourceId
    );

  if (response.error) {
    console.error("Error fetching graphics:", response.error.message);
    // Graphics capability may not be available for all resources
    if (response.status === 404) {
      console.log("Graphics capability not available for this resource");
    }
    return;
  }

  const graphics = response.data!.graphics;
  console.log(`Found ${graphics.length} graphics resources`);

  graphics.forEach((graphic, index) => {
    console.log(`\nGraphic ${index + 1}:`);
    console.log(`  Type: ${graphic.type}`);
    console.log(`  URI: ${graphic.uri}`);

    // Handle authentication if present
    if (graphic.authentication) {
      console.log(`  Authentication Type: ${graphic.authentication.type}`);

      switch (graphic.authentication.type) {
        case "apiKey":
          console.log(`    Header/Query: ${graphic.authentication.headerOrQueryParameter}`);
          console.log(`    Value: ${graphic.authentication.value}`);
          break;
        case "basic":
          console.log(`    Username: ${graphic.authentication.username}`);
          // Password would be stored securely, not logged
          break;
        case "oauth2AuthCodePKCE":
          console.log(`    Client ID: ${graphic.authentication.clientId}`);
          console.log(`    Auth URL: ${graphic.authentication.authorizationUrl}`);
          console.log(`    Token URL: ${graphic.authentication.tokenUrl}`);
          console.log(`    Scopes: ${graphic.authentication.scopes?.join(", ")}`);
          break;
      }
    }

    // CesiumJS provider configuration if available
    if (graphic.provider) {
      console.log(`  Provider: ${graphic.provider.name}`);
      switch (graphic.provider.name) {
        case "UrlTemplateImageryProvider":
          console.log(`  Tiling Scheme: ${graphic.provider.options.tilingScheme}`);
          if (graphic.provider.options.bounds) {
            console.log(`  Bounds: ${graphic.provider.options.bounds.join(", ")}`);
          }
          console.log(`  Credit: ${graphic.provider.options.credit}`);
          break;
        case "Google2DImageryProvider":
          console.log(`  Map Type: ${graphic.provider.options.mapType}`);
          console.log(`  URL: ${graphic.provider.options.url}`);
          break;
      }
    }
  });
}
```

#### Get Resource Graphics by URI

Alternatively, retrieve graphics metadata using a direct URI (obtained from repository resource capabilities):

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  ResourceGraphicsResponse,
  GetRepositoryResourceRepresentationResponse,
} from "@szewtwin/szewtwins-client";

/** Function that retrieves resource graphics using capability URI. */
async function getResourceGraphicsByUri(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  // First, get the repository resource to find the graphics capability URI
  const resourceResponse: SzewecAPIResponse<GetRepositoryResourceRepresentationResponse> =
    await client.getRepositoryResource(
      accessToken,
      "your-szewtwin-id",
      "your-repository-id",
      "your-resource-id",
      "representation"
    );

  if (resourceResponse.error) {
    console.error("Error fetching resource:", resourceResponse.error.message);
    return;
  }

  const resource = resourceResponse.data!.resource;

  // Check if the resource has a graphics capability link
  const graphicsLink = resource._links?.graphics?.href;

  if (!graphicsLink) {
    console.log("This resource does not support graphics capabilities");
    return;
  }

  console.log(`Using graphics capability URI: ${graphicsLink}`);

  // Use the URI to get graphics metadata
  const graphicsResponse: SzewecAPIResponse<ResourceGraphicsResponse> =
    await client.getResourceGraphicsByUri(accessToken, graphicsLink);

  if (graphicsResponse.error) {
    console.error("Error fetching graphics from URI:", graphicsResponse.error.message);
    return;
  }

  const graphics = graphicsResponse.data!.graphics;
  console.log(`Retrieved ${graphics.length} graphics from URI`);

  // Process graphics metadata (same as ID-based approach)
  graphics.forEach((graphic) => {
    console.log(`Type: ${graphic.type}, URI: ${graphic.uri}`);
  });
}
```

#### Handling Different Authentication Types

Graphics resources may require authentication. Here's how to handle each type:

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  ResourceGraphicsResponse,
  ResourceGraphics,
} from "@szewtwin/szewtwins-client";

/** Function demonstrating how to handle different authentication types for graphics. */
async function handleGraphicsAuthentication(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const response: SzewecAPIResponse<ResourceGraphicsResponse> =
    await client.getResourceGraphics(
      accessToken,
      "your-szewtwin-id",
      "your-repository-id",
      "your-resource-id"
    );

  if (response.error) {
    console.error("Error:", response.error.message);
    return;
  }

  response.data!.graphics.forEach((graphic: ResourceGraphics) => {
    if (!graphic.authentication) {
      console.log(`No authentication required for: ${graphic.uri}`);
      return;
    }

    switch (graphic.authentication.type) {
      case "apiKey":
        // Add API key as header or query parameter
        const param = graphic.authentication.headerOrQueryParameter;
        const value = graphic.authentication.value;

        if (graphic.authentication.location === "header") {
          console.log(`Add header: ${param}: ${value}`);
          // fetch(graphic.uri, { headers: { [param]: value } });
        } else {
          console.log(`Add query parameter: ${param}=${value}`);
          // const url = new URL(graphic.uri);
          // url.searchParams.set(param, value);
          // fetch(url.toString());
        }
        break;

      case "basic":
        // Use HTTP Basic Authentication
        const username = graphic.authentication.username;
        const password = graphic.authentication.password;
        const credentials = btoa(`${username}:${password}`);
        console.log(`Add Authorization header: Basic ${credentials}`);
        // fetch(graphic.uri, {
        //   headers: { 'Authorization': `Basic ${credentials}` }
        // });
        break;

      case "oauth2AuthCodePKCE":
        // Implement OAuth2 Authorization Code flow with PKCE
        console.log("OAuth2 PKCE required:");
        console.log(`  Client ID: ${graphic.authentication.clientId}`);
        console.log(`  Auth URL: ${graphic.authentication.authorizationUrl}`);
        console.log(`  Token URL: ${graphic.authentication.tokenUrl}`);
        console.log(`  Scopes: ${graphic.authentication.scopes?.join(", ")}`);

        // This requires a multi-step OAuth2 flow:
        // 1. Generate PKCE code verifier and challenge
        // 2. Redirect user to authorizationUrl with challenge
        // 3. Handle callback with authorization code
        // 4. Exchange code for access token at tokenUrl
        // 5. Use access token to fetch graphics
        break;
    }
  });
}
```

#### Integration with CesiumJS

When graphics include CesiumJS provider configuration, you can use it directly:

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  ResourceGraphicsResponse,
} from "@szewtwin/szewtwins-client";

/** Function demonstrating CesiumJS integration with graphics provider. */
async function setupCesiumProvider(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const response: SzewecAPIResponse<ResourceGraphicsResponse> =
    await client.getResourceGraphics(
      accessToken,
      "your-szewtwin-id",
      "your-repository-id",
      "your-resource-id"
    );

  if (response.error || !response.data?.graphics) {
    console.error("Could not retrieve graphics");
    return;
  }

  // Find graphics with CesiumJS provider configuration
  const cesiumGraphic = response.data.graphics.find((g) => g.provider);

  if (!cesiumGraphic || !cesiumGraphic.provider) {
    console.log("No CesiumJS provider configuration available");
    return;
  }

  const provider = cesiumGraphic.provider;
  console.log("CesiumJS Provider Configuration:");
  console.log(`  Name: ${provider.name}`);

  if (provider.name !== "UrlTemplateImageryProvider") {
    console.log(`  Provider ${provider.name} is not compatible with UrlTemplateImageryProvider setup`);
    return;
  }

  if (!provider.options.bounds) {
    console.log("  UrlTemplate provider did not include bounds");
    return;
  }

  console.log(`  Tiling Scheme: ${provider.options.tilingScheme}`);
  console.log(`  Bounds [W, S, E, N]: ${provider.options.bounds.join(", ")}`);
  console.log(`  Credit: ${provider.options.credit}`);

  // Example: Create Cesium imagery provider
  // This is pseudocode - actual implementation depends on your Cesium setup
  /*
  import { UrlTemplateImageryProvider, Rectangle } from 'cesium';

  const imageryProvider = new UrlTemplateImageryProvider({
    url: cesiumGraphic.uri,
    rectangle: Rectangle.fromDegrees(
      provider.options.bounds[0],  // west
      provider.options.bounds[1],  // south
      provider.options.bounds[2],  // east
      provider.options.bounds[3]   // north
    ),
    credit: provider.options.credit,
    // Add authentication headers if needed
  });

  viewer.imageryLayers.addImageryProvider(imageryProvider);
  */
}
```

## Export Operations

### Get All Exports for User

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWTwinExportMultiResponse,
} from "@szewtwin/szewtwins-client";

/** Function that gets all export operations for the current user. */
async function getAllExports(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const response: SzewecAPIResponse<SZEWTwinExportMultiResponse> =
    await client.getExports(accessToken);

  if (response.error) {
    console.error("Error fetching exports:", response.error.message);
    return;
  }

  const exports = response.data!.exports;
  console.log(`Found ${exports.length} export operations`);

  exports.forEach((exportOp) => {
    console.log(`Export ${exportOp.id}: ${exportOp.status} - ${exportOp.createdDateTime}`);
  });
}
```

### Get Specific Export Details

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWTwinExportSingleResponse,
} from "@szewtwin/szewtwins-client";

/** Function that gets details of a specific export operation. */
async function getExportDetails(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const exportId = "your-export-id";

  const response: SzewecAPIResponse<SZEWTwinExportSingleResponse> =
    await client.getExport(accessToken, exportId);

  if (response.error) {
    console.error("Error fetching export:", response.error.message);
    return;
  }

  const exportOp = response.data!.export;
  console.log(`Export Status: ${exportOp.status}`);
  console.log(`Created: ${exportOp.createdDateTime}`);

  if (exportOp.downloadUrl) {
    console.log(`Download URL: ${exportOp.downloadUrl}`);
  }

  if (exportOp.errorMessage) {
    console.log(`Error: ${exportOp.errorMessage}`);
  }
}
```

### Create New Export Operation

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWTwinExportRequestInfo,
  SZEWTwinExportSingleResponse,
} from "@szewtwin/szewtwins-client";

/** Function that creates a new export operation for an szewTwin. */
async function createExport(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const exportRequest: SZEWTwinExportRequestInfo = {
    szewTwinId: "your-szewtwin-id",
    exportType: "CSV", // or "3SM"
    geometryOptions: {
      includeSourceGeometry: true,
      chordTolerance: 0.1
    }
  };

  const response: SzewecAPIResponse<SZEWTwinExportSingleResponse> =
    await client.createExport(accessToken, exportRequest);

  if (response.error) {
    console.error("Error creating export:", response.error.message);
    return;
  }

  const exportOp = response.data!.export;
  console.log(`Export created with ID: ${exportOp.id}`);
  console.log(`Status: ${exportOp.status}`);

  // Poll for completion
  await pollExportStatus(client, accessToken, exportOp.id);
}

async function pollExportStatus(
  client: SZEWTwinsClient,
  accessToken: AccessToken,
  exportId: string
): Promise<void> {
  let completed = false;

  while (!completed) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const response = await client.getExport(accessToken, exportId);
    if (response.error) {
      console.error("Error checking export status:", response.error.message);
      break;
    }

    const exportOp = response.data!.export;
    console.log(`Export status: ${exportOp.status}`);

    if (exportOp.status === "Complete") {
      console.log(`Export completed! Download URL: ${exportOp.downloadUrl}`);
      completed = true;
    } else if (exportOp.status === "Failed") {
      console.error(`Export failed: ${exportOp.errorMessage}`);
      completed = true;
    }
  }
}
```

## Image Management

### Upload and Manage szewTwin Images

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWTwinImageResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates image management capabilities. */
async function manageImages(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";

  // Upload an image
  const imageFile = new File([/* your image data */], "szewtwin-image.png", { type: "image/png" });
  const uploadResponse: SzewecAPIResponse<SZEWTwinImageResponse> =
    await szewTwinsClient.uploadSZEWTwinImage(accessToken, szewTwinId, imageFile, "image/png");

  console.log("Image uploaded:", uploadResponse.data!.image.id);

  // Get the image
  const getResponse: SzewecAPIResponse<SZEWTwinImageResponse> =
    await szewTwinsClient.getSZEWTwinImage(accessToken, szewTwinId);

  console.log("Retrieved image:", getResponse.data!.image.url);

  // Delete the image
  await szewTwinsClient.deleteSZEWTwinImage(accessToken, szewTwinId);
  console.log("Image deleted");
}
```

## Favorites and Recents

### Work with Favorites and Recents

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  MultiSZEWTwinMinimalResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates favorites and recents management. */
async function manageFavoritesAndRecents(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";

  // Add to favorites
  await szewTwinsClient.addSZEWTwinToFavorites(accessToken, szewTwinId);

  // Add to recents
  await szewTwinsClient.addSZEWTwinToMyRecents(accessToken, szewTwinId);

  // Get favorite szewTwins
  const favoritesResponse: SzewecAPIResponse<MultiSZEWTwinMinimalResponse> =
    await szewTwinsClient.getFavoritesSZEWTwins(accessToken, { subClass: "Project" });

  console.log("Favorite szewTwins:", favoritesResponse.data!.szewTwins.length);

  // Get recent szewTwins
  const recentsResponse: SzewecAPIResponse<MultiSZEWTwinMinimalResponse> =
    await szewTwinsClient.getRecentUsedSZEWTwins(accessToken);

  console.log("Recent szewTwins:", recentsResponse.data!.szewTwins.length);

  // Remove from favorites
  await szewTwinsClient.removeSZEWTwinFromFavorites(accessToken, szewTwinId);
}
```

## Account Operations

### Get Primary Account

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWTwinMinimalResponse,
} from "@szewtwin/szewtwins-client";

/** Function that gets the primary account for the current user. */
async function getPrimaryAccount(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const response: SzewecAPIResponse<SZEWTwinMinimalResponse> =
    await client.getPrimaryAccount(accessToken);

  if (response.error) {
    console.error("Error fetching primary account:", response.error.message);
    return;
  }

  const account = response.data!.szewTwin;
  console.log(`Primary Account: ${account.displayName}`);
  console.log(`Account ID: ${account.id}`);
  console.log(`Account Type: ${account.type}`);
  console.log(`Status: ${account.status}`);
}
```

### Get szewTwin Account Details

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  SZEWTwinMinimalResponse,
  SZEWTwinRepresentationResponse,
} from "@szewtwin/szewtwins-client";

/** Function that gets account details for a specific szewTwin. */
async function getSZEWTwinAccount(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };
  const szewTwinId = "your-szewtwin-id";

  // Get minimal account details
  const minimalResponse: SzewecAPIResponse<SZEWTwinMinimalResponse> =
    await client.getSZEWTwinAccount(accessToken, szewTwinId, "minimal");

  if (minimalResponse.error) {
    console.error("Error fetching szewTwin account:", minimalResponse.error.message);
    return;
  }

  const minimalAccount = minimalResponse.data!.szewTwin;
  console.log(`Account (Minimal): ${minimalAccount.displayName}`);

  // Get detailed account information
  const detailedResponse: SzewecAPIResponse<SZEWTwinRepresentationResponse> =
    await client.getSZEWTwinAccount(accessToken, szewTwinId, "representation");

  if (detailedResponse.error) {
    console.error("Error fetching detailed account:", detailedResponse.error.message);
    return;
  }

  const detailedAccount = detailedResponse.data!.szewTwin;
  console.log(`Account (Detailed): ${detailedAccount.displayName}`);
  console.log(`Created: ${detailedAccount.createdDateTime}`);
  console.log(`Created By: ${detailedAccount.createdBy}`);
  console.log(`Data Center: ${detailedAccount.dataCenterLocation}`);

  if (detailedAccount.parentId) {
    console.log(`Parent Account: ${detailedAccount.parentId}`);
  }
}
```

## Environment Configuration

### Using Custom Base URLs

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";
import type {
  SzewecAPIResponse,
  MultiSZEWTwinMinimalResponse,
} from "@szewtwin/szewtwins-client";

/** Function that demonstrates environment configuration for different deployment environments. */
async function configureEnvironment(): Promise<void> {
  // Set URL prefix for different environments
  // This works in both Node.js and browser environments
  globalThis.IVJS_URL_PREFIX = "dev-";  // For development environment
  // globalThis.IVJS_URL_PREFIX = "qa-";   // For QA environment
  // globalThis.IVJS_URL_PREFIX = undefined; // For production environment

  // Client will automatically use the configured environment
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  // This will now hit dev-api.szewec.com/szewtwins instead of api.szewec.com/szewtwins
  const szewTwinsResponse: SzewecAPIResponse<MultiSZEWTwinMinimalResponse> =
    await szewTwinsClient.getSZEWTwins(accessToken, { subClass: "Project" });

  console.log(`Fetched ${szewTwinsResponse.data!.szewTwins.length} szewTwins from development environment`);
}

/** Alternative: Configure environment from process.env in Node.js applications */
function configureFromEnvironment(): void {
  // In test files or Node.js applications, you can bridge from process.env
  globalThis.IVJS_URL_PREFIX = process.env.IVJS_URL_PREFIX;

  // Now all szewTwins client instances will use the configured environment
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient();
}

/** Using constructor with custom URL */
async function useCustomURL(): Promise<void> {
  const szewTwinsClient: SZEWTwinsClient = new SZEWTwinsClient("https://api.szewec.com/szewtwins");
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const szewTwinsResponse: SzewecAPIResponse<MultiSZEWTwinMinimalResponse> =
    await szewTwinsClient.getSZEWTwins(accessToken, { subClass: "Project" });

  szewTwinsResponse.data!.szewTwins.forEach((actualszewTwin) => {
    console.log(actualszewTwin.id);
  });
}
```

## Error Handling

### Standard Error Handling Pattern

```typescript
import type { AccessToken } from "@szewtwin/core-szewec";
import { SZEWTwinsClient } from "@szewtwin/szewtwins-client";

async function handleErrors(): Promise<void> {
  const client = new SZEWTwinsClient();
  const accessToken: AccessToken = { /* get_access_token_logic_here */ };

  const response = await client.getSZEWTwin(accessToken, "invalid-id");

  if (response.error) {
    switch (response.status) {
      case 404:
        console.log("szewTwin not found");
        break;
      case 422:
        console.log("Validation error:", response.error.details);
        break;
      case 401:
        console.log("Unauthorized - check access token");
        break;
      default:
        console.log("API error:", response.error.message);
    }
    return;
  }

  // Safe to use data after error check
  const szewTwin = response.data!.szewTwin;
  console.log("Found szewTwin:", szewTwin.displayName);
}
```
