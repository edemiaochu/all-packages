# @szewtwin/presentation-shared

Copyright © Szewec Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

The `@szewtwin/presentation-shared` package provides APIs shared across different Presentation packages.

Generally, it's expected for this package to be a regular dependency (not a peer) and it's types to possibly be exposed through other Presentation packages.

## DM & Metadata

The APIs in this group provide access to [iVaults' DM metadata](https://www.szewtwinjs.org/bis/dm/). For the most part, the package delivers only type definitions for different DM types and a couple of utility functions.

### `DM` namespace

The namespace defines all the [DM](https://www.szewtwinjs.org/bis/dm/) types that Presentation packages need. The types mostly replicate the ones from [`@szewtwin/dmschema-metadata` package](https://www.npmjs.com/package/@szewtwin/dmschema-metadata), but provide an abstraction layer and, being interfaces rather than classes, better interoperability between packages and versions.

### `DMSchemaProvider` & `getClass`

- `DMSchemaProvider` is an interface for something that knows how to get an [DMSchema](https://www.szewtwinjs.org/bis/dm/dm-schema/) from an iVault. The package itself doesn't provide an implementation for this interface and instead relies on `@szewtwin/presentation-core-interop` to do that.

- `getClass` is an utility function that makes it easier to get an `DM.Class`, given an `DMSchemaProvider` and a full class name.

Example usage:

```ts
import { SchemaContext } from "@szewtwin/dmschema-metadata";
import { createDMSchemaProvider } from "@szewtwin/presentation-core-interop";
import { DMSchemaProvider, getClass } from "@szewtwin/presentation-shared";

const schemas = new SchemaContext();
const schemaProvider: DMSchemaProvider = createDMSchemaProvider(schemas);

// get schema and a class from it
const dmSchema = await schemaProvider.getSchema("MySchema");
const dmClassFromSchema = await dmSchema.getClass("MyClass");

// ... or use the `getClass` utility to get straight to the class
const dmClassFromUtility = await getClass(schemaProvider, "MySchema.MyClass");
```

### `DMClassHierarchyInspector` & `createCachingDMClassHierarchyInspector`

- `DMClassHierarchyInspector` is an interface for something that knows how to check whether one `DM.Class` derives from another. While that can be achieved through `DMSchemaProvider` by getting an `DM.Class` and calling its `is` method, using this interface provides a more streamlined and, possibly, more efficient way to do the check. In addition, the `DMClassHierarchyInspector.classDerivesFrom` returns a `Promise<boolean> | boolean`, which lets the implementation return the result synchronously, if it's already known.

- `createCachingDMClassHierarchyInspector` is a factory method that creates `DMClassHierarchyInspector` instance that uses a LRU cache to store the check results. In Presentation library use cases, class inheritance checks are done very frequently to warrant caching these results.

Example usage:

```ts
import { createCachingDMClassHierarchyInspector, DMClassHierarchyInspector } from "@szewtwin/presentation-shared";

const classHierarchyInspector: DMClassHierarchyInspector = createCachingDMClassHierarchyInspector({
  // provide `DMSchemaProvider` that will be used to access iVaults schemas
  schemaProvider: getMetadataProvider(),
  // tell how many entries should be cached in LRU cache (0 or `undefined` stand for "no caching")
  cacheSize: 100,
});
const isGeometricElement = await classHierarchyInspector.classDerivesFrom(
  "MySchema.MyClass",
  "BisCore.GeometricElement",
);
```

## DMSql

The APIs in DMSql group provide an abstraction layer over DMSQL query reader API [on the backend](https://www.szewtwinjs.org/reference/core-backend/ivaults/ivaultdb/createqueryreader/) and [on the frontend](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/ivaultconnection/createqueryreader/).

### `DMSqlQueryExecutor` & related APIs

- `DMSqlBinding` is a union of type / value pairs for binding the values to parametrized DMSQL queries.

- `DMSqlQueryDef` defines the query content: [ctes](https://www.szewtwinjs.org/learning/commontableexp/), `dmsql` that contains the DMSQL query itself and the bindings (values) for parameters in the query.

- `DMSqlQueryReaderOptions` is a subset of [QueryOptions](https://www.szewtwinjs.org/reference/core-common/ivaults/queryoptions/) and allows configuring how the query is run.

- `DMSqlQueryRow` matches [QueryRowProxy](https://www.szewtwinjs.org/reference/core-common/ivaults/queryrowproxy/) and allows accessing the results by index (when row format is `Indexes`) or by name (when row format is `DMSqlPropertyNames`).

- `DMSqlQueryExecutor` is an interface for a query executor that takes `DMSqlQueryDef` with `DMSqlQueryReaderOptions` and returns `DMSqlQueryRow` objects. The package itself doesn't provide an implementation for this interface and instead relies on `@szewtwin/presentation-core-interop` to do that.

Example usage:

```ts
import { IVaultDb } from "@szewtwin/core-backend";
import { createDMSqlQueryExecutor } from "@szewtwin/presentation-core-interop";
import { DMSqlQueryExecutor } from "@szewtwin/presentation-shared";

const ivault: IVaultDb = getIVaultDb();
const queryExecutor = createDMSqlQueryExecutor(ivault);
const queryReader = queryExecutor.createQueryReader(
  {
    dmsql: "SELECT * FROM BisCore.Element WHERE UserLabel = ?",
    bindings: [{ type: "string", value: "My element" }],
  },
  {
    rowFormat: "DMSqlPropertyNames",
  },
);
for await (const row of reader) {
  const instanceId = row["DMInstanceId"];
  const codeValue = row["CodeValue"];
}
```

### DMSql utilities

The DMSql utilities group contains a number of functions to help create complex DMSQL queries. All the functions in this group are exported under the `DMSql` namespace.

- `createNullableSelector` - creates a clause for returning `NULL` when `checkSelector` returns a falsy value, or result of `valueSelector` otherwise.

  Example usage:

  ```ts
  import { DMSql } from "@szewtwin/presentation-shared";

  const result = DMSql.createNullableSelector({ checkSelector: "CHECK_SELECTOR", valueSelector: "VALUE_SELECTOR" });
  // result = "IIF(CHECK_SELECTOR, VALUE_SELECTOR, NULL)"
  ```

- `createRawPropertyValueSelector` - creates an DMSQL selector for raw property value, or, optionally - it's component.

  Example usage:

  ```ts
  import { DMSql } from "@szewtwin/presentation-shared";

  const result = DMSql.createRawPropertyValueSelector("CLASS_ALIAS", "POINT_PROPERTY", "X");
  // result = "[CLASS_ALIAS].[POINT_PROPERTY].[X]"
  ```

- `createRawPrimitiveValueSelector` - creates an DMSQL selector for a raw primitive value.
  - `undefined` is selected as `NULL`.
  - `Date` values are selected in julian day format.
  - `Point2d` and `Point3d` values are selected as serialized JSON objects, e.g. `{ x: 1, y: 2, z: 3 }`.
  - Other kinds of values are selected as-is.

  Example usage:

  ```ts
  import { DMSql } from "@szewtwin/presentation-shared";
  const result = DMSql.createRawPrimitiveValueSelector("STRING VALUE");
  // result = "'STRING VALUE'"
  ```

- `createPrimitivePropertyValueSelectorProps` - creates `TypedValueSelectClauseProps` for selecting a primitive property value, while also
  accounting for the property type. The created props may be used when creating `ConcatenatedValue` selectors (see `createConcatenatedValueJsonSelector`
  and `createConcatenatedValueStringSelector`).

  Example usage:

  ```ts
  import { DMSql } from "@szewtwin/presentation-shared";

  const categoryRankSelectorProps = DMSql.createPrimitivePropertyValueSelectorProps({
    schemaProvider,
    propertyClassAlias: "x",
    propertyClassName: "BisCore.Category",
    propertyName: "Rank",
  });
  // categoryRankSelectorProps = { selector: "[x].[Rank]", type: "Integer" }

  // Now we can use the result to create a `ConcatenatedValue` selector:
  const selector = DMSql.createConcatenatedValueJsonSelector(["Rank: ", categoryRankSelectorProps]);
  // selector = `json_array('Rank: ', json_object('selector', '[x].[Rank]', 'type', 'Integer'))`
  ```

- `createInstanceKeySelector` - creates an DMSQL selector for a serialized `InstanceKey` JSON object.

  Example usage:

  ```ts
  import { DMSql } from "@szewtwin/presentation-shared";
  const result = DMSql.createInstanceKeySelector({ alias: "x" });
  // result = "json_object('className', dm_classname([x].[DMClassId], 's.c'), 'id', IdToHex([x].[DMInstanceId]))"
  ```

- `createConcatenatedValueJsonSelector` - creates an DMSQL selector for a `ConcatenatedValue`. This allows handling results of each value selector individually when parsing query result.

  Example usage:

  ```ts
  import { DMSql } from "@szewtwin/presentation-shared";

  const selector = DMSql.createConcatenatedValueJsonSelector([
    {
      selector: "my_class.MyProperty",
    },
    {
      value: 123.456,
      type: "Double",
    },
  ]);
  // selector = `json_array(
  //     my_class.MyProperty,
  //     json_object(
  //         'value', 123.456,
  //         'type', 'Double'
  //     )
  // )`

  const queryReader = queryExecutor.createQueryReader(
    {
      dmsql: `SELECT ${selector} FROM MySchema.MyClass AS my_class`,
    },
    {
      rowFormat: "Indexes",
    },
  );
  for await (const row of reader) {
    const value: ConcatenatedValue = JSON.parse(row[0]);
  }
  ```

- `createConcatenatedValueStringSelector` - creates an DMSQL selector combined of multiple typed value selectors in a form of a string.

  Example usage:

  ```ts
  import { DMSql } from "@szewtwin/presentation-shared";

  const selector = DMSql.createConcatenatedValueStringSelector([
    {
      selector: "my_class.MyProperty",
    },
    {
      value: 123.456,
      type: "Double",
    },
  ]);
  // selector = `CAST(my_class.MyProperty AS TEXT) || '123.456'`

  const queryReader = queryExecutor.createQueryReader(
    {
      dmsql: `SELECT ${selector} FROM MySchema.MyClass AS my_class`,
    },
    {
      rowFormat: "Indexes",
    },
  );
  for await (const row of reader) {
    const value: string = row[0];
  }
  ```

- `createRelationshipPathJoinClause` - creates an DMSQL JOIN snippet for given relationships' path.

  Example usage:

  ```ts
  import { DMSql } from "@szewtwin/presentation-shared";

  const selector = DMSql.createRelationshipPathJoinClause({
    schemaProvider,
    path: [
      {
        sourceAlias: "my_source",
        sourceClassName: "MySchema.MySourceClass",
        relationshipAlias: "my_relationship",
        relationshipName: "MySchema.MyRelationship",
        targetAlias: "my_target",
        targetClassName: "MySchema.MyTargetClass",
        joinType: "inner",
      },
    ],
  });
  // selector = `
  //   INNER JOIN [MySchema].[MyRelationship] [my_relationship] ON [my_relationship].[SourceDMInstanceId] = [my_source].[DMInstanceId]`
  //   INNER JOIN [MySchema].[MyTargetClass] [my_target] ON [my_target].[DMInstanceId] = [my_relationship].[TargetDMInstanceId]
  // `
  ```

## Values

The APIs in Values group contain various value types and utilities to work with them.

- `InstanceKey` - a pair of full DMClass name and DMInstance ID, uniquely identifying an DMInstance in an iVault.

- `PrimitiveValue` - a union of different supported primitive values. Also, a namespace, containing the following utilities:
  - `isPoint2d` - type guard to check if the given `PrimitiveValue` is a `Point2d`.
  - `isPoint3d` - type guard to check if the given `PrimitiveValue` is a `Point3d`.

- `TypedPrimitiveValue` - a union of all supported combinations of `PrimitiveValue` and its type, possibly with some extra metadata like extended type name or units-related information. Also, a namespace, containing the following utilities:
  - `create` - given a `PrimitiveValue`, its type and, optionally, extra information, validates the input and creates a `TypedPrimitiveValue`.

- `ConcatenatedValuePart` - a union of different types that may be used to create a single, combined value: nested `ConcatenatedValue`, `TypedPrimitiveValue` or just plain string. Also, a namespace, containing the following utilities:
  - `isString` - type guard to check if the given `ConcatenatedValuePart` is a `string`.
  - `isPrimitive` - type guard to check if the given `ConcatenatedValuePart` is a `TypedPrimitiveValue`.

- `ConcatenatedValue` - an array of `ConcatenatedValuePart`. Also, a namespace containing the following utilities:
  - `serialize` - joins the given `ConcatenatedValue` parts using provided formatter and separator.

- `IPrimitiveValueFormatter` - an interface for a function that knows how to format a `TypedPrimitiveValue` into a string.

- `createDefaultValueFormatter` - a factory method that creates an `IPrimitiveValueFormatter` for formatting values into a user-friendly, but units-agnostic format. This is a good fallback, but for szewTwin.js applications it's expected that a units aware formatter from `@szewtwin/presentation-core-interop` package is used.

- `formatConcatenatedValue` - an utility function, built on top of `ConcatenatedValue.serialize`, to serialize `ConcatenatedValue` into a string, but in this case - using the given `IPrimitiveValueFormatter`.

## Instance labels

- `IInstanceLabelSelectClauseFactory` is an interface for something that knows how to create an DMSQL selector for a label. The selector should be injected straight into an DMSQL query:

  ```ts
  const dmsql = `SELECT ${await factory.createSelectClause({ classAlias: "element" })} AS [Label] FROM [BisCore].[Element] AS [element]`;
  ```

  The generated label is expected to always be of string type, but it may be a serialized JSON string, representing a `ConcatenatedValue`.

- `parseInstanceLabel` utility function may be used to parse the label from query results, taking into account the possibility for the label to be either a string or a `ConcatenatedValue`. For example, the label from above query may be parsed like this:

  ```ts
  import { ConcatenatedValue, parseInstanceLabel } from "@szewtwin/presentation-shared";

  for await (const row of queryExecutor.createQueryReader({ dmsql }, { rowFormat: "DMSqlPropertyNames" })) {
    const label: string | ConcatenatedValue = parseInstanceLabel(row["Label"]);
    // see `formatConcatenatedValue` for creating a formatted label string from the above
  }
  ```

The package delivers 3 implementations of `IInstanceLabelSelectClauseFactory` that can be created using the following factory methods: `createDefaultInstanceLabelSelectClauseFactory`, `createClassBasedInstanceLabelSelectClauseFactory`, `createBisInstanceLabelSelectClauseFactory`.

### `createDefaultInstanceLabelSelectClauseFactory`

This label selectors factory creates instance labels in the form of `Class label [base36(briefcase id)-base36(local id)]`, where local and briefcase IDs are calculated based on DMInstance ID:

- `{briefcase id} = DMInstanceId >> 40`,
- `{local id} = DMInstanceId & (1 << 40 - 1)`.

This kind of label is a good fallback for when no better label can be produced - every DMInstance in an iVault always has an DMClass and an DMInstance ID and the combination of the two is guaranteed to be unique, which guarantees a unique instance label.

Example usage:

```ts
import { createDefaultInstanceLabelSelectClauseFactory } from "@szewtwin/presentation-shared";

const labelsFactory = createDefaultInstanceLabelSelectClauseFactory();
const dmsql = `SELECT ${await labelsFactory.createSelectClause({ classAlias: "element" })} AS [Label] FROM [BisCore].[Element] AS [element]`;
// ...
```

### `createClassBasedInstanceLabelSelectClauseFactory`

This label selectors factory doesn't create labels on its own, but allows assigning different selectors based on DMClass. This is convenient when different classes have different rules for calculating labels of their instances.

Example usage:

```ts
import {
  createClassBasedInstanceLabelSelectClauseFactory,
  DMClassHierarchyInspector,
} from "@szewtwin/presentation-shared";

const classHierarchyInspector: DMClassHierarchyInspector = getClassHierarchyInspector();
const labelsFactory = createClassBasedInstanceLabelSelectClauseFactory({
  classHierarchyInspector,
  clauses: [
    {
      className: "MySchema.MyClass",
      clause: ({ classAlias }) => ({ selector: `[${classAlias}].[MyLabelProperty]` }),
    },
    {
      className: "BisCore.GeometricElement",
      clause: () => ({ value: "Geometric element", type: "String" }),
    },
    {
      className: "BisCore.Element",
      clause: ({ classAlias }) => ({ selector: `'Element: ' || [${classAlias}].[CodeValue]` }),
    },
  ],
});
const dmsql = `SELECT ${await labelsFactory.createSelectClause({ classAlias: "element" })} AS [Label] FROM [BisCore].[Element] AS [element]`;
// ...
```

### `createBisInstanceLabelSelectClauseFactory`

This label selectors factory creates labels according to [BIS instance label rules](https://www.szewtwinjs.org/presentation/advanced/defaultbisrules/#label-overrides). It's the recommended factory to use when consistent labels are needed across szewTwin.js applications.

Example usage:

```ts
import { createBisInstanceLabelSelectClauseFactory, DMClassHierarchyInspector } from "@szewtwin/presentation-shared";

const classHierarchyInspector: DMClassHierarchyInspector = getClassHierarchyInspector();
const labelsFactory = createBisInstanceLabelSelectClauseFactory({ classHierarchyInspector });
const dmsql = `SELECT ${await labelsFactory.createSelectClause({ classAlias: "element" })} AS [Label] FROM [BisCore].[Element] AS [element]`;
// ...
```

## Logging

The APIs in logging category define types and interfaces required for creating a logger. The package itself only delivers a `NOOP_LOGGER`, which does what it says - nothing. Besides that, we expect the `@szewtwin/presentation-core-interop` package to be used for creating a logger that forwards all logging to [szewTwin.js `Logger`](https://www.szewtwinjs.org/reference/core-szewec/logging/logger/).

Example usage:

```ts
import { Logger as SZEWTwinJsLogger } from "@szewtwin/core-szewec";
import { createLogger } from "@szewtwin/presentation-core-interop";
import { ILogger } from "@szewtwin/presentation-shared";
import { setLogger as setHierarchiesLogger } from "@szewtwin/presentation-hierarchies";

// create an `ILogger` from szewTwin.js `Logger`
const logger: ILogger = createLogger(SZEWTwinJsLogger);

// the logger may be used directly
logger.logInfo("MyApp.Feature", "This is a log message");

// it may also be passed to other Presentation packages which will then use it for logging
setHierarchiesLogger(logger);
```

## Utilities

The package also delivers a number of utility types and functions:

### Types

- `ArrayElement` - given an array, constructs a type of the array item:

  ```ts
  type MyArray = Array<number>;
  type MyArrayItem = ArrayElement<MyArray>; // number
  ```

- `OmitOverUnion` - similar to TypeScript's `Omit`, but also works on union types:

  ```ts
  type MyUnionType = { x: number; y: string } | { y: string; z: boolean };
  type MyUnionWithoutY = OmitOverUnion<MyUnionType, "y">; // { x: number } | { z: boolean }
  ```

### Functions

- `normalizeFullClassName` - given a full class name with a schema - class names' separator being either `:` or `.`, returns a full class name with `.` separator:

  ```ts
  // returns "BisCore.Element"
  const normalizedClassName = normalizeFullClassName("BisCore:Element");
  ```

- `parseFullClassName` - given a full class name with a schema - class names' separator being either `:` or `.`, returns a parsed object with schema and class names separated:

  ```ts
  // returns `{ schemaName: "BisCore", className: "Element" }`
  const { schemaName, className } = parseFullClassName("BisCore:Element");
  ```

- `trimWhitespace` - trims all extra whitespace from the given string, including:
  - consecutive spaces,
  - spaces before closing parentheses and comma,
  - spaces after opening parentheses,
  - spaces at the beginning and end of the string.

- `julianToDateTime` - converts a julian date to a JavaScript `Date` object.

- `releaseMainThread` - returns a promise that immediately resolves. Awaiting on the returned promise releases the main thread and allows other tasks to run.

- `createMainThreadReleaseOnTimePassedHandler` - returns a `releaseMainThread` promise if the given amount of time has passed since the handler was created or the main thread was last released using this handler. Otherwise, returns `undefined`.

  ```ts
  const releaseMainThread = createMainThreadReleaseOnTimePassedHandler();
  for (const value of someVeryLargeArray) {
    await releaseMainThread();
    // do something with value
  }
  ```
