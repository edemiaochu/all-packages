# @szewtwin/presentation-core-interop

Copyright © Szewec Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

The `@szewtwin/presentation-core-interop` package acts as a layer between [`szewtwinjs-core` packages](https://www.szewtwinjs.org/reference/) and `presentation` packages:

- `@szewtwin/presentation-hierarchies`
- `@szewtwin/unified-selection`

Having this interop layer helps us evolve both sides without affecting one another in a major way.

## API

### `createIVaultKey`

Attempts to create a unique identifier for the given iVault. In majority of cases that's going to be the `key` property, but if it's not set (e.g. when using [BlankConnection](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/blankconnection/)) - `name` property is used instead. Finally, if both are empty - the function will throw an error.

Example:

```ts
import { IVaultConnection } from "@szewtwin/core-frontend";
import { createIVaultKey } from "@szewtwin/presentation-core-interop";

IVaultConnection.onOpen.addListener((ivault: IVaultConnection) => {
  const key = createIVaultKey(ivault);
  console.log(`IVault opened: "${key}"`);
});
```

### `createDMSqlQueryExecutor`

Maps an iVault in the form of `szewtwinjs-core` [IVaultDb](https://www.szewtwinjs.org/reference/core-backend/ivaults/ivaultdb/) or [IVaultConnection](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/ivaultconnection/) to an instance of `DMSqlQueryExecutor`, used in `@szewtwin/presentation-hierarchies` and `@szewtwin/unified-selection` packages.

Example:

```ts
import { IVaultDb } from "@szewtwin/core-backend";
import { createDMSqlQueryExecutor } from "@szewtwin/presentation-core-interop";

const ivault: IVaultDb = getIVaultDb();
const executor = createDMSqlQueryExecutor(ivault);
for await (const row of executor.createQueryReader(MY_QUERY)) {
  // TODO: do something with `row`
}
```

### `createDMSchemaProvider`

Maps an instance of `szewtwinjs-core` [SchemaContext](https://www.szewtwinjs.org/reference/dmschema-metadata/context/schemacontext/) class to an instance of `DMSchemaProvider`, used in `@szewtwin/presentation-hierarchies` and `@szewtwin/unified-selection` packages.

Example:

```ts
import { SchemaContext } from "@szewtwin/dmschema-metadata";
import { createDMSchemaProvider } from "@szewtwin/presentation-core-interop";

const schemas = new SchemaContext();
const schemaProvider = createDMSchemaProvider(schemas);
// the created schema provider may be used in `@szewtwin/presentation-hierarchies` or `@szewtwin/unified-selection` packages
```

### `createValueFormatter`

Creates an instance of `IPrimitiveValueFormatter` that knows how to format primitive property values using their units' information. That information is retrieved from an iVault through `szewtwinjs-core` [SchemaContext](https://www.szewtwinjs.org/reference/dmschema-metadata/context/schemacontext/).

Example:

```ts
import { SchemaContext } from "@szewtwin/dmschema-metadata";
import { createValueFormatter } from "@szewtwin/presentation-core-interop";

const schemaContext = new SchemaContext();
const formatter = createValueFormatter({ schemaContext, unitSystem: "metric" });
const formattedValue = await formatter({ type: "Double", value: 1.234, koqName: "MySchema.LengthKindOfQuantity" });
```

### `registerTxnListeners`

Registers a number of transaction listeners on either the backend [TxnManager](https://www.szewtwinjs.org/reference/core-backend/ivaults/txnmanager/) or the frontend [BriefcaseTxns](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/briefcasetxns/) and calls the given `onChange` function whenever there's a change in an iVault holding the transaction manager.

Example:

```ts
import { BriefcaseDb } from "@szewtwin/core-backend";
import { registerTxnListeners } from "@szewtwin/presentation-core-interop";
import { HierarchyProvider } from "@szewtwin/presentation-hierarchies";

// get iVault and hierarchy provider from arbitrary sources
const db: BriefcaseDb = getIVault();
const provider: HierarchyProvider = getHierarchyProvider();

// register the listeners
const unregister = registerTxnListeners(db.txns, () => {
  // notify provided about the changed data
  provider.notifyDataSourceChanged();
  // TODO: force the components using `provider` to reload
});

// clean up on iVault close
db.onClosed.addOnce(() => unregister());
```

### `createLogger`

Maps the `szewtwinjs-core` [Logger](https://www.szewtwinjs.org/reference/core-szewec/logging/logger/) class to an `ILogger` interface used by Presentation packages.

Example:

```ts
import { Logger as CoreLogger } from "@szewtwin/core-szewec";
import { createLogger as createPresentationLogger } from "@szewtwin/presentation-core-interop";
import { setLogger as setPresentationLogger } from "@szewtwin/presentation-hierarchies";

setPresentationLogger(createPresentationLogger(CoreLogger));
```
