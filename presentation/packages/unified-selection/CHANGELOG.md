# @szewtwin/unified-selection

## 1.7.0

### Minor Changes

- [#1285](https://github.com/szewTwin/presentation/pull/1285): Make `ivaultKey` prop optional when calling `SelectionStorage` methods.

  While the package is designed to work with iVaults' selection as the first class citizen, it can be used in other contexts as well. In those cases, the `ivaultKey` prop is not relevant and should not be required. This change makes it optional and defaults to an empty string when not supplied.

### Patch Changes

- [#1286](https://github.com/szewTwin/presentation/pull/1286): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.11

## 1.6.8

### Patch Changes

- [#1242](https://github.com/szewTwin/presentation/pull/1242): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.10

## 1.6.7

### Patch Changes

- [#1215](https://github.com/szewTwin/presentation/pull/1215): Update dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.9

## 1.6.6

### Patch Changes

- [#1208](https://github.com/szewTwin/presentation/pull/1208): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.8

## 1.6.5

### Patch Changes

- [#1168](https://github.com/szewTwin/presentation/pull/1168): Bump dependencies.
- [#1161](https://github.com/szewTwin/presentation/pull/1161): Bump szewTwin.js dependencies to `^5.5.0`.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.7

## 1.6.4

### Patch Changes

- [#1152](https://github.com/szewTwin/presentation/pull/1152): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.6

## 1.6.3

### Patch Changes

- [#1139](https://github.com/szewTwin/presentation/pull/1139): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.5

## 1.6.2

### Patch Changes

- [#1124](https://github.com/szewTwin/presentation/pull/1124): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.4

## 1.6.1

### Patch Changes

- [#1088](https://github.com/szewTwin/presentation/pull/1088): Fix restart tokens not being unique when they need to, causing queries to be cancelled.

## 1.6.0

### Minor Changes

- [#1083](https://github.com/szewTwin/presentation/pull/1083): Added optional `componentId` to `ComputeSelectionProps`. This id is used as part of a `restartToken` when executing DMSQL queries inside the function. Restart token is used to cancel duplicate queries. The provided `componentId` should be unique and not shared across different components.

## 1.5.2

### Patch Changes

- [#1077](https://github.com/szewTwin/presentation/pull/1077): Fix `enableUnifiedSelectionSyncWithIVault` not updating selection & hilite sets, after selection set is changed directly in a way that doesn't cause a selection storage change.

  A specific example:

  1. `enableUnifiedSelectionSyncWithIVault` is set up to use `assembly` selection scope.
  2. User clicks on an assembly part in the graphics view, causing its parent element (assembly) to be added to selection storage, and selection & hilite sets to be updated with all assembly parts.
  3. User clicks on another part of the same assembly, causing selection storage to remain unchanged (still contains the assembly), and selection & hilite sets to NOT be updated with all assembly parts. As a result, the latter sets now contain only the newly clicked part, which is incorrect.

## 1.5.1

### Patch Changes

- [#1039](https://github.com/szewTwin/presentation/pull/1039): Bump szewTwin.js core dependencies to `^5.1.1`.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.3

## 1.5.0

### Minor Changes

- [#1018](https://github.com/szewTwin/presentation/pull/1018): Fixed `enableUnifiedSelectionSyncWithIVault` not using (and not being able to use) the underlying hilite set provider of the given custom `CachingHiliteSetProvider`, causing selection synchronization to work incorrectly in cases when items were added or removed to iVault's selection set.

  - Introduced `IVaultHiliteSetProvider` interface and a factory function `createIVaultHiliteSetProvider` that creates an instance of it. Functionality-wise these are very similar to `CachingHiliteSetProvider` and `createCachingHiliteSetProvider` but the new type provides access to the underlying hilite set provider of the given iVault. And the naming better represents the purpose of the type.
  - Deprecated `CachingHiliteSetProvider` and `createCachingHiliteSetProvider` in favor of the above.
  - For the `enableUnifiedSelectionSyncWithIVault` function, deprecated the `cachingHiliteSetProvider` prop in favor of the newly added `ivaultHiliteSetProvider`.

  The migration is straightforward:

  ```typescript
  // before:
  enableUnifiedSelectionSyncWithIVault({
    ivaultAccess,
    selectionStorage,
    activeScopeProvider,
    cachingHiliteSetProvider: createCachingHiliteSetProvider({
      selectionStorage,
      ivaultProvider: () => ivaultAccess,
      createHiliteSetProvider: () =>
        createMyCustomHiliteSetProvider({ ivaultAccess }),
    }),
  });

  // after:
  enableUnifiedSelectionSyncWithIVault({
    ivaultAccess,
    selectionStorage,
    activeScopeProvider,
    ivaultHiliteSetProvider: createIVaultHiliteSetProvider({
      selectionStorage,
      ivaultProvider: () => ivaultAccess,
      createHiliteSetProvider: () =>
        createMyCustomHiliteSetProvider({ ivaultAccess }),
    }),
  });
  ```

## 1.4.2

### Patch Changes

- [#982](https://github.com/szewTwin/presentation/pull/982): Update szewtwinjs-core dependencies to v5.0.0
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.2

## 1.4.1

### Patch Changes

- [#909](https://github.com/szewTwin/presentation/pull/909): Do not use `dev` versions of `@szewtwin/*` packages.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.1

## 1.4.0

### Minor Changes

- [#901](https://github.com/szewTwin/presentation/pull/901): Export `SelectionScope` type to make it easier for consumers to define "active scope" type.

  APIs that use this type:

  - The `scope` prop of `computeSelection` function.
  - Return type of `activeScopeProvider` callback prop of `enableUnifiedSelectionSyncWithIVault` function.

- [#895](https://github.com/szewTwin/presentation/pull/895): `createCachingHiliteSetProvider`: Added a `createHiliteSetProvider` prop to allow using custom hilite sets for given iVault selections.

### Patch Changes

- [#884](https://github.com/szewTwin/presentation/pull/884): Fix `enableUnifiedSelectionSyncWithIVault` not properly syncing `SelectionSet` and `SelectionStorage` with 4.x `szewtwinjs-core`.

  When the selection change was made by a tool in graphics view (through the `SelectionSet`), the `SelectionStorage` was updated correctly, but the `IVaultConnection.hiliteSet` - wasn't. As a result, clearing selection through graphics view wouldn't clear the hilite set and keep the elements hilited.

## 1.3.0

### Minor Changes

- [#841](https://github.com/szewTwin/presentation/pull/841): Add `Selectables.load` function to load instance keys from the `Selectables` object.

  Example usage:

  ```ts
  const selectables = Selectables.create([
    // add instance key
    { className: "BisCore:Element", id: "0x1" },

    // add custom selectable
    {
      identifier: "custom",
      async *loadInstanceKeys() {
        yield { className: "BisCore:Element", id: "0x2" };
      },
    },
  ]);

  // logs: { className: "BisCore:Element", id: "0x1" }, { className: "BisCore:Element", id: "0x2" }
  for await (const key of Selectables.load(selectables)) {
    console.log(key);
  }
  ```

## 1.2.1

### Patch Changes

- [#828](https://github.com/szewTwin/presentation/pull/828): Polyfill `Symbol.dispose` and `Symbol.asyncDispose` to make sure that code using the upcoming JS recource management API works in all environments.

## 1.2.0

### Minor Changes

- [#800](https://github.com/szewTwin/presentation/pull/800): Add support for Models and SubCategories selection that's going to be available in `@szewtwin/core-frontend` version `5`.

  The changes in `@szewtwin/core-frontend` allow us to stop manually syncing `HiliteSet` with `SelectionSet` and rely on automatic syncing instead.

- [#800](https://github.com/szewTwin/presentation/pull/800): `computeSelection`: Broadened the type of `elementIds` prop from `Id64String[]` to `Id64Arg`.
- [#802](https://github.com/szewTwin/presentation/pull/802): Prefer `Symbol.dispose` over `dispose` for disposable objects.

  The package contained a number of types for disposable objects, that had a requirement of `dispose` method being called on them after they are no longer needed. In conjunction with the `using` utility from `@szewtwin/core-szewec`, usage of such objects looked like this:

  ```ts
  class MyDisposable() {
    dispose() {
      // do some cleanup
    }
  }
  using(new MyDisposable(), (obj) => {
    // do something with obj, it'll get disposed when the callback returns
  });
  ```

  In version `5.2`, TypeScript [introduced](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#using-declarations-and-explicit-resource-management) `Disposable` type and `using` declarations (from the upcoming [Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management) feature in ECMAScript). Now we're making use of those new utilities in this package (while still supporting the old `dispose` method), which allows using `MyDisposable` from the above snippet like this:

  ```ts
  using obj = new MyDisposable();
  // do something with obj, it'll get disposed when it goes out of scope
  ```

## 1.1.2

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.0

## 1.1.1

### Patch Changes

- [#765](https://github.com/szewTwin/presentation/pull/765): Fixed transient element keys handling in unified selection storage.

## 1.1.0

### Minor Changes

- [#740](https://github.com/szewTwin/presentation/pull/740): Define `type` and `exports` attributes in `package.json`.

  The change moves this package a step closer towards dropping CommonJS support - it's now transpiled from ESM to CommonJS instead of the opposite.

  In addition, the `exports` attribute has been added to `package.json` to prohibit access to APIs that are not intended to be used by external consumers.

### Patch Changes

- [#758](https://github.com/szewTwin/presentation/pull/758): Promote `@beta` APIs to `@public`.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.1.0

## 1.0.1

### Patch Changes

- [#730](https://github.com/szewTwin/presentation/pull/730): Fix provider returned by `createHiliteSetProvider` in some cases not caching class hierarchy check results, resulting in duplicate checks for the same classes.

## 1.0.0

### Major Changes

- [#727](https://github.com/szewTwin/presentation/pull/727): 1.0 release.

  The APIs are now considered stable and ready for production use.

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@1.0.0

## 0.5.1

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.5.0

## 0.5.0

### Minor Changes

- [#693](https://github.com/szewTwin/presentation/pull/693): Selection events API cleanup:
  - Remove the second `StorageSelectionChangesListener` argument, which represented the `SelectionStorage` where the selection change happened. As a replacement, added it as a property to `StorageSelectionChangeEventArgs`, which is the first and now the only argument of the listener.
  - Remove `SelectionChangeEvent` interface in favor of `Event<StorageSelectionChangesListener>`.

### Patch Changes

- [#693](https://github.com/szewTwin/presentation/pull/693): API documentation improvements:

  - Add warnings to interfaces which are not supposed to be extended or implemented by consumers. Objects of such interfaces are only supposed to be created by functions in this package. As such, adding required members to these interfaces is not considered a breaking change.
  - Changed `string` to `Id64String` where appropriate, to make it clear that the string is expected to be a valid Id64 string. Note that this is not a breaking change, as `Id64String` is just a type alias for `string`.

- [#695](https://github.com/szewTwin/presentation/pull/695): Bump `szewTwin.js` core package dependency versions to `4.8.0`
- Updated dependencies:
  - @szewtwin/presentation-shared@0.4.1

## 0.4.6

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.4.0

## 0.4.5

### Patch Changes

- [#657](https://github.com/szewTwin/presentation/pull/657): Updated `enableUnifiedSelectionSyncWithIVault` to batch iVault selection changes before synchronizing with `SelectionStorage`.
- [#655](https://github.com/szewTwin/presentation/pull/655): Remove exposed internal APIs.
- Updated dependencies:
  - @szewtwin/presentation-shared@0.3.2

## 0.4.4

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.3.1

## 0.4.3

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.3.0

## 0.4.2

### Patch Changes

- [#581](https://github.com/szewTwin/presentation/pull/581): Bump `szewtwinjs-core` dependencies to `^4.6.0`
- [#570](https://github.com/szewTwin/presentation/pull/570): Reduced main thread blocking when computing hilite sets and selection based on selection scope.
- Updated dependencies:
  - @szewtwin/presentation-shared@0.2.0

## 0.4.1

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.1.1

## 0.4.0

### Minor Changes

- [#558](https://github.com/szewTwin/presentation/pull/558): Switched from `DMSchemaProvider` to `DMClassHierarchyInspector`, where appropriate.

  Some of the APIs were accepting `DMSchemaProvider` as a parameter and used it to only inspect class hierarchy. This change switches them to accept `DMClassHierarchyInspector` instead - this reduces the surface area of the API and makes it more clear that only class hierarchy is being inspected, while also possibly improving performance.

  This is a breaking change for the following APIs:

  - `createHiliteSetProvider` prop `ivaultAccess`.
  - `createCachingHiliteSetProvider` prop `ivaultProvider`.
  - `enableUnifiedSelectionSyncWithIVault` prop `ivaultAccess`.

  Migration example:

  ```ts
  import {
    createDMSqlQueryExecutor,
    createDMSchemaProvider,
  } from "@szewtwin/presentation-core-interop";
  import { createCachingDMClassHierarchyInspector } from "@szewtwin/presentation-shared";
  import { createHiliteSetProvider } from "@szewtwin/unified-selection";

  // before:
  const hiliteProvider = createHiliteSetProvider({
    ivaultAccess: {
      ...createDMSqlQueryExecutor(ivault),
      ...createDMSchemaProvider(MyAppFrontend.getSchemaContext(ivault)),
    },
  });

  // after:
  const hiliteProvider = createHiliteSetProvider({
    ivaultAccess: {
      ...createDMSqlQueryExecutor(ivault),
      ...createCachingDMClassHierarchyInspector({
        schemaProvider: createDMSchemaProvider(
          MyAppFrontend.getSchemaContext(ivault)
        ),
        cacheSize: 100,
      }),
    },
  });
  ```

### Patch Changes

- [#557](https://github.com/szewTwin/presentation/pull/557): Fixed `computeSelection` returning duplicate selectables when using `Functional` selection scope and non-3D elements.

## 0.3.0

### Minor Changes

- [#530](https://github.com/szewTwin/presentation/pull/530): Added `enableUnifiedSelectionSyncWithIVault` for enabling synchronization between iVault's tool selection and unified selection storage.
- [#544](https://github.com/szewTwin/presentation/pull/544): Breaking API changes

  - The type of DMSQL query executor's `createQueryReader` function was changed from:

    ```ts
    // createQueryReader(dmsql: string, bindings?: DMSqlBinding[], config?: DMSqlQueryReaderOptions): DMSqlQueryReader;
    // usage:
    const reader = executor.createQueryReader(
      `
        WITH RECURSIVE
        ChildElements(DMInstanceId) AS (
          SELECT DMInstanceId FROM bis.Element WHERE Parent.Id = ?
          UNION ALL
          SELECT c.DMInstanceId FROM bis.Element c JOIN ChildElements p ON c.Parent.Id = p.DMInstanceId
        )
        SELECT * FROM ChildElements
      `,
      [{ type: "id", value: "0x1" }],
      { rowFormat: "Indexes" }
    );
    ```

    to:

    ```ts
    // createQueryReader(query: { ctes?: string; dmsql: string; bindings?: DMSqlBinding[] }, config?: DMSqlQueryReaderOptions): DMSqlQueryReader;
    // usage:
    const reader = executor.createQueryReader(
      {
        ctes: [
          `
          ChildElements(DMInstanceId) AS (
              SELECT DMInstanceId FROM bis.Element WHERE Parent.Id = ?
              UNION ALL
              SELECT c.DMInstanceId FROM bis.Element c JOIN ChildElements p ON c.Parent.Id = p.DMInstanceId
          )
        `,
        ],
        dmsql: "SELECT * FROM ChildElements",
        bindings: [{ type: "id", value: "0x1" }],
      },
      { rowFormat: "Indexes" }
    );
    ```

    This makes the API consistent with other Presentation packages and allows additional manipulation on DMSQL, which was not possible previously when DMSQL contained CTEs.

    The change affects the following public APIs:

    - `computeSelection` (`queryExecutor` prop),
    - `createHiliteSetProvider` (previously `queryExecutor` prop, now `ivaultAccess` prop),
    - `createCachingHiliteSetProvider` (`iVaultProvider` prop).

  - `createHiliteSetProvider` function props `queryExecutor` and `schemaProvider` were merged into a single `ivaultAccess` prop with merged type.

    Previously:

    ```ts
    createHiliteSetProvider({
      queryExecutor: createDMSqlQueryExecutor(iVault),
      schemaProvider: createDMSchemaProvider(iVault),
    });
    ```

    Now:

    ```ts
    createHiliteSetProvider({
      ivaultAccess: {
        ...createDMSqlQueryExecutor(iVault),
        ...createDMSchemaProvider(iVault),
      },
    });
    ```

  - `createCachingHiliteSetProvider` function prop `iVaultProvider` was changed to return an object of merged type `DMSchemaProvider & DMSqlQueryExecutor` rather than `{ queryExecutor: DMSqlQueryExecutor; schemaProvider: DMSchemaProvider }`.

    Previously:

    ```ts
    createCachingHiliteSetProvider({
      selectionStorage,
      iVaultProvider: (key) => ({
        queryExecutor: createDMSqlQueryExecutor(iVault),
        schemaProvider: createDMSchemaProvider(iVault),
      }),
    });
    ```

    Now:

    ```ts
    createCachingHiliteSetProvider({
      selectionStorage,
      iVaultProvider: (key) => ({
        ...createDMSqlQueryExecutor(iVault),
        ...createDMSchemaProvider(iVault),
      }),
    });
    ```

- [#551](https://github.com/szewTwin/presentation/pull/551): Changed `iVault` in attribute names to `ivault`. The change was made to be consistent with other Presentation packages and affects the following APIs:

  - `SelectionStorage` methods now accept `ivaultKey` prop rather than `iVaultKey`. It's `selectionChangeEvent` is also now raised with `ivaultKey` prop in `StorageSelectionChangeEventArgs`.
  - `CachingHiliteSetProvider.getHiliteSet` now accepts an `ivaultKey` prop rather than `iVaultKey`.
  - `createCachingHiliteSetProvider` props now accept `ivaultProvider` callback rather than `iVaultProvider`.

- [#553](https://github.com/szewTwin/presentation/pull/553): Expose types from `@szewtwin/presentation-shared` rather than having our own copies.

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.1.0

## 0.2.0

### Minor Changes

- [#488](https://github.com/szewTwin/presentation/pull/488): Added API for getting hilite sets for `Selectables` and active `SelectionStorage` selection.

### Patch Changes

- [#495](https://github.com/szewTwin/presentation/pull/495): Added license field to `package.json`.

## 0.1.0

### Minor Changes

- [#491](https://github.com/szewTwin/presentation/pull/491): Initial package release.
