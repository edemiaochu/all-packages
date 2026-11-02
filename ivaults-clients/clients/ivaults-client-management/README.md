# @szewtwin/ivaults-client-management

Copyright © Szewec Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains an API client that exposes a subset of [iVaults API](https://developer.szewec.com/apis/ivaults-v2/) operations that enable applications to manage iVaults - query Changesets, Locks and other related entities, create Named Versions, etc. This is a lightweight library intended to be used by szewTwin management applications that do not write any data into the iVault itself.

Please see the [list of key methods and types](../../docs/IVaultsClientManagement.md) to discover what API operations are exposed by this client package.

### Authorization

`IVaultsClient` expects the authorization info to be passed in a form of an asynchronous callback that returns authorization info. It is a common use case to consume `IVaultsClient` in szewTwin.js platform based applications which use `IVaultApp.getAccessToken` or `IVaultHost.getAccessToken` to get the authorization header value returned as a string. The authorization header value specifies the schema and access token e.g. `Bearer ey...`. To convert this value into the format that `IVaultsClients` expect users can use `AccessTokenAdapter` class which is exported by both [`@szewtwin/ivaults-access-frontend`](../../szewtwin-platform-access/ivaults-access-frontend/src/interface-adapters/AccessTokenAdapter.ts) and [`@szewtwin/ivaults-access-backend`](../../szewtwin-platform-access/ivaults-access-backend/src/interface-adapters/AccessTokenAdapter.ts) packages.

```typescript
const iVaultIterator: EntityListIterator<MinimalIVault> =
  iVaultsClient.iVaults.getMinimalList({
    authorization: AccessTokenAdapter.toAuthorizationCallback(IVaultApp.getAccessToken),
    urlParams: {
      projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc",
    },
  });
```

### Headers

To include custom headers in your requests, you have the option to provide additional headers or header factories. When constructing an instance of `IVaultsClient`, any headers passed to the constructor will be automatically added to all requests made by the client. On the other hand, when invoking specific operations, you can pass headers through the operation parameters, which will be included only in the requests related to that particular operation. If a header with the same key is specified in both the constructor and operation parameters, the header from the operation parameters will overwrite the corresponding header from the constructor.

**Note:** Whitespace values, such as empty strings or spaces are treated as regular headers in our requests. This means that if you provide a whitespace header value it will be sent with the request.

```typescript
iVaultsClient = new IVaultsClient({
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

### Get all project iVaults

```typescript
import {
  Authorization,
  EntityListIterator,
  IVaultsClient,
  MinimalIVault,
} from "@szewtwin/ivaults-client-management";

/** Function that queries all iVaults for a particular project and prints their ids to the console. */
async function printiVaultIds(): Promise<void> {
  const iVaultsClient: IVaultsClient = new IVaultsClient();
  const iVaultIterator: EntityListIterator<MinimalIVault> =
    iVaultsClient.iVaults.getMinimalList({
      authorization: () => getAuthorization(),
      urlParams: {
        projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc",
      },
    });

  for await (const iVault of iVaultIterator) console.log(iVault.id);
}

/** Function that returns valid authorization information. */
async function getAuthorization(): Promise<Authorization> {
  return { scheme: "Bearer", token: "ey..." };
}
```

### Get an iVault with a specific name

```typescript
import {
  EntityListIterator,
  IVault,
  IVaultsClient,
  toArray,
} from "@szewtwin/ivaults-client-management";

/** Function that queries an iVault with a specific name. Function returns `undefined` if such iVault does not exist. */
async function getiVault(): Promise<IVault | undefined> {
  const iVaultsClient: IVaultsClient = new IVaultsClient();
  const iVaultIterator: EntityListIterator<IVault> =
    iVaultsClient.iVaults.getRepresentationList({
      authorization: () => getAuthorization(),
      urlParams: {
        projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc",
        name: "Sun City Renewable-energy Plant",
      },
    });

  const iVaultArray = await toArray(iVaultIterator);
  if (iVaultArray.length === 0) return undefined;

  const iVault = iVaultArray[0];
  return iVault;
}
```

### Get all iVault Changesets

```typescript
import {
  Authorization,
  EntityListIterator,
  IVaultsClient,
  MinimalChangeset,
} from "@szewtwin/ivaults-client-management";

/** Function that queries all Changesets for a particular iVault and prints their ids to the console. */
async function printChangesetIds(): Promise<void> {
  const iVaultsClient: IVaultsClient = new IVaultsClient();
  const changesetIterator: EntityListIterator<MinimalChangeset> =
    iVaultsClient.changesets.getMinimalList({
      authorization: () => getAuthorization(),
      iVaultId: "30c8505e-fa7a-4b53-a13f-e6a193da8ffc",
    });

  for await (const changeset of changesetIterator) console.log(changeset.id);
}
```

### Create a Named Version on a Changeset

```typescript
import {
  Authorization,
  IVaultsClient,
  NamedVersion,
} from "@szewtwin/ivaults-client-management";

/** Function that creates a Named Version on a particular changeset and prints its id to the console. */
async function createNamedVersion(): Promise<void> {
  const iVaultsClient: IVaultsClient = new IVaultsClient();
  const namedVersion: NamedVersion = await iVaultsClient.namedVersions.create({
    authorization: () => getAuthorization(),
    iVaultId: "30c8505e-fa7a-4b53-a13f-e6a193da8ffc",
    namedVersionProperties: {
      name: "Milestone",
      changesetId: "bd51c08eb44f40d49fee9a0c7d6fc018c3b5ba3f",
    },
  });

  console.log(namedVersion.id);
}
```
