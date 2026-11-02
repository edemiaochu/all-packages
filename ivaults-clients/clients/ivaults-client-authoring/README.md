# @szewtwin/ivaults-client-authoring

Copyright © Szewec Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains an API client that exposes a subset of [iVaults API](https://developer.szewec.com/apis/ivaults-v2/) operations - it extends the client from the [`@szewtwin/ivaults-client-management`](../ivaults-client-management/README.md) package and adds more operations that enable applications to author iVaults - acquire Birefcases, manage Locks, etc. This library also adds the ability to perform iVault operations that include file transfer - create or download Changesets, create iVault from Baseline file.

Please see the [list of key methods and types](../../docs/IVaultsClientAuthoring.md) to discover what API operations are exposed by this client package.

## Usage examples

**Note:** Since the `@szewtwin/ivaults-client-authoring` package extends the [`@szewtwin/ivaults-client-management`](../ivaults-client-management/README.md) package all usage examples presented for the `@szewtwin/ivaults-client-management` package are valid for this one as well.

### Storage Client

To use authoring `IVaultsClient` a `ClientStorage` instance needs to be provided. If you are not including `@szewtwin/ivaults-access-backend`, you can create an instance that fully supports iVaults api in the following way:

```typescript

import {
  GoogleClientStorage
} from "@szewtwin/object-storage-google/lib/client";
import {
  ClientStorageWrapperFactory,
} from "@szewtwin/object-storage-google/lib/client/wrappers";

import {
  AzureClientStorage,
  BlockBlobClientWrapperFactory,
} from "@szewtwin/object-storage-azure";
import {
  ClientStorage,
  StrategyClientStorage,
} from "@szewtwin/object-storage-core";

function createDefaultClientStorage(): ClientStorage {
  return new StrategyClientStorage([
    {
      instanceName: "azure",
      instance: new AzureClientStorage(new BlockBlobClientWrapperFactory()),
    },
    {
      instanceName: "google",
      instance: new GoogleClientStorage(new ClientStorageWrapperFactory()),
    }
  ]);
}
```

### Authorization

`IVaultsClient` expects the authorization info to be passed in a form of an asynchronous callback that returns authorization info. It is a common use case to consume `IVaultsClient` in szewTwin.js platform based applications which use `IVaultApp.getAccessToken` or `IVaultHost.getAccessToken` to get the authorization header value returned as a string. The authorization header value specifies the schema and access token e.g. `Bearer ey...`. To convert this value into the format that `IVaultsClients` expect users can use `AccessTokenAdapter` class which is exported by both [`@szewtwin/ivaults-access-frontend`](../../szewtwin-platform-access/ivaults-access-frontend/src/interface-adapters/AccessTokenAdapter.ts) and [`@szewtwin/ivaults-access-backend`](../../szewtwin-platform-access/ivaults-access-backend/src/interface-adapters/AccessTokenAdapter.ts) packages.

```typescript
const iVaultIterator: EntityListIterator<MinimalIVault> =
  iVaultsClient.iVaults.getMinimalList({
    authorization: AccessTokenAdapter.toAuthorizationCallback(IVaultHost.getAccessToken),
    urlParams: {
      projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc",
    },
  });
```

### Headers

To include custom headers in your requests, you have the option to provide additional headers or header factories. When constructing an instance of `IVaultsClient`, any headers passed to the constructor will be automatically added to all requests made by the client. On the other hand, when invoking specific operations, you can pass headers through the operation parameters, which will be included only in the requests related to that particular operation. If a header with the same key is specified in both the constructor and operation parameters, the header from the operation parameters will overwrite the corresponding header from the constructor.

**Note:** Whitespace values, such as empty strings or spaces are treated as regular headers in our requests. This means that if you provide a whitespace header value it will be sent with the request.

```typescript

const iVaultsClient = new IVaultsClient({
  cloudStorage: createDefaultClientStorage(),
  headers: {
    "X-Correlation-Id": () => "xCorrelationIdValue",
    "some-custom-header": "someCustomValue",
  },
});

iVaultsClient.baselineFiles.getSingle({
  headers: {
    "X-Correlation-Id": "some value that overrides factory",
    "new-custom-header": "header that will be sent in this operation requests",
  },
});
```

### Create iVault from Baseline File

```typescript
import {
  Authorization,
  IVault,
  IVaultsClient,
} from "@szewtwin/ivaults-client-authoring";

/** Function that creates a new iVault from Baseline file and prints its id to the console. */
async function createIVaultFromBaselineFile(): Promise<void> {
  const iVaultsClient: IVaultsClient = new IVaultsClient({ cloudStorage: createDefaultClientStorage() });
  const iVault: IVault = await iVaultsClient.iVaults.createFromBaseline({
    authorization: () => getAuthorization(),
    iVaultProperties: {
      projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc",
      name: "Sun City Renewable-energy Plant",
      description: "Overall model of wind and solar farms in Sun City",
      filePath: "D:\\ivaults\\sun-city.dtw",
    },
  });

  console.log(iVault.id);
}

/** Function that returns valid authorization information. */
async function getAuthorization(): Promise<Authorization> {
  return { scheme: "Bearer", token: "ey..." };
}
```
