# @szewtwin/presentation-core-interop

## 1.3.11

### Patch Changes

- [#1286](https://github.com/szewTwin/presentation/pull/1286): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.11

## 1.3.10

### Patch Changes

- [#1242](https://github.com/szewTwin/presentation/pull/1242): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.10

## 1.3.9

### Patch Changes

- [#1215](https://github.com/szewTwin/presentation/pull/1215): Update dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.9

## 1.3.8

### Patch Changes

- [#1168](https://github.com/szewTwin/presentation/pull/1168): Bump dependencies.
- [#1161](https://github.com/szewTwin/presentation/pull/1161): Bump szewTwin.js dependencies to `^5.5.0`.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.7

## 1.3.7

### Patch Changes

- [#1152](https://github.com/szewTwin/presentation/pull/1152): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.6

## 1.3.6

### Patch Changes

- [#1139](https://github.com/szewTwin/presentation/pull/1139): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.5

## 1.3.5

### Patch Changes

- [#1124](https://github.com/szewTwin/presentation/pull/1124): Bump dependencies.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.4

## 1.3.4

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.3

## 1.3.3

### Patch Changes

- [#982](https://github.com/szewTwin/presentation/pull/982): Update szewtwinjs-core dependencies to v5.0.0
- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.2

## 1.3.2

### Patch Changes

- [#958](https://github.com/szewTwin/presentation/pull/958): Fix support for `szewtwinjs-core@5.0-rc`.

## 1.3.1

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.1

## 1.3.0

### Minor Changes

- [#834](https://github.com/szewTwin/presentation/pull/834): Updated peer dependencies to support szewTwin.js Core v5 packages.

## 1.2.0

### Minor Changes

- [#814](https://github.com/szewTwin/presentation/pull/814): Add a `createIVaultKey` function to safely create an identifier for an `IVault` in different situations.

  Example:

  ```ts
  import { IVaultConnection } from "@szewtwin/core-frontend";
  import { createIVaultKey } from "@szewtwin/presentation-core-interop";

  IVaultConnection.onOpen.addListener((ivault: IVaultConnection) => {
    const key = createIVaultKey(ivault);
    console.log(`IVault opened: "${key}"`);
  });
  ```

## 1.1.2

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@1.2.0

## 1.1.1

### Patch Changes

- [#760](https://github.com/szewTwin/presentation/pull/760): Added missing `package.json` file under `cjs` folder. It is needed for package to work as commonjs module.

## 1.1.0

### Minor Changes

- [#740](https://github.com/szewTwin/presentation/pull/740): Define `type` and `exports` attributes in `package.json`.

  The change moves this package a step closer towards dropping CommonJS support - it's now transpiled from ESM to CommonJS instead of the opposite.

  In addition, the `exports` attribute has been added to `package.json` to prohibit access to APIs that are not intended to be used by external consumers.

### Patch Changes

- [#758](https://github.com/szewTwin/presentation/pull/758): Promote `@beta` APIs to `@public`.
- Updated dependencies:
  - @szewtwin/presentation-shared@1.1.0

## 1.0.0

### Major Changes

- [#727](https://github.com/szewTwin/presentation/pull/727): 1.0 release.

  The APIs are now considered stable and ready for production use.

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@1.0.0

## 0.2.7

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.5.0

## 0.2.6

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.4.1

## 0.2.5

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.4.0

## 0.2.4

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.3.2

## 0.2.3

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.3.1

## 0.2.2

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.3.0

## 0.2.1

### Patch Changes

- [#623](https://github.com/szewTwin/presentation/pull/623): Avoid repeated schema requests from `SchemaContext` - otherwise we're downloading the same schema from the backend multiple times.

## 0.2.0

### Minor Changes

- [#582](https://github.com/szewTwin/presentation/pull/582): Updated `DMSqlQueryExecutor` to pass `restartToken` options to the underlying DMSql reader.

### Patch Changes

- [#585](https://github.com/szewTwin/presentation/pull/585): `createQueryReader`: Remove extra whitespace from executed queries
- [#592](https://github.com/szewTwin/presentation/pull/592): Do not publish source files to the npm
- Updated dependencies:
  - @szewtwin/presentation-shared@0.2.0

## 0.1.2

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.1.1

## 0.1.1

### Patch Changes

- [#558](https://github.com/szewTwin/presentation/pull/558): Fixed `createDMSchemaProvider` to create a provider that returns `undefined` instead of throwing, when the requested schema is not found.

## 0.1.0

### Minor Changes

- [#554](https://github.com/szewTwin/presentation/pull/554): Initial package release.

### Patch Changes

- Updated dependencies:
  - @szewtwin/presentation-shared@0.1.0
