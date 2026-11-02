# @szewtwin/presentation-hierarchies

Copyright © Szewec Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

The `@szewtwin/presentation-hierarchies` package provides APIs for creating hierarchical data structures. While most of the delivered APIs are intended for the use case we anticipate the most - hierarchies based on data in an [szewTwin.js iVault](https://www.szewtwinjs.org/learning/ivaults/#ivault-overview), the package also supports generic hierarchies that are not based on any specific data source.

The package doesn't depend on any backend, frontend or UI specific packages. As such, it can be used in both backend and frontend applications, and in case of the latter, it can be used with any UI framework. For React-based frontend applications, please see the [`@szewtwin/presentation-hierarchies-react`](../hierarchies-react/README.md) package.

## Concepts

A hierarchy is an arrangement of items, called hierarchy nodes, which are represented as being "above", "below", or "at the same level as" one another:

![Sample hierarchy](./media/sample-hierarchy.png)

Here are definitions of some basic hierarchy-related concepts based on the above example:

- A hierarchy node is an item in the hierarchy, e.g. `Node 0`, `Node 1`, `Node 1-0` etc.
- A hierarchy level is a group of hierarchy nodes that are at the same level in the hierarchy. In the above example the root level contains `Node 0`, `Node 1` and `Node 2`. Child level of `Node 2` contains `Node 2-0`, `Node 2-1`.
- A hierarchy branch is a sub-hierarchy under specific parent node, including the parent itself. In the above example, the branch of `Node 2` contains `Node 2`, `Node 2-0`, `Node 2-1` and `Node 2-1-0`.

In the context of `@szewtwin/presentation-hierarchies` package, a hierarchy is built by requesting hierarchy levels from a [hierarchy provider](#hierarchy-providers). A couple of built-in hierarchy provider implementations are delivered with the package - see [hierarchy providers](#hierarchy-providers) section for more information.

### Hierarchy nodes

A `HierarchyNode` data structure in the package represents a single node in a hierarchy. It contains information about what the node represents (through it's `key` property), label and other properties. There are multiple types of nodes:

- A generic node is not based on any iVault data. Its `key` is a `GenericNodeKey` and has a consumer-supplied identifier with an optional `source` attribute identifying the hierarchy provider that created the node.
- An instances node is based on one or more DMInstance(s) in an iVault. Its `key` is an `InstancesNodeKey` and contains identifiers of those DMInstances, in addition to `ivaultKey` attribute that identifies the source iVault.
- A grouping node groups one or more instances nodes. Its `key` is a `GroupingNodeKey` and contains the grouping criteria, which depends on the type of grouping:
  - Label grouping node keys have a label.
  - Class grouping nodes have a full class name.
  - Property grouping nodes have a full class name containing the property and property name. Also, depending on whether the grouping is based on value or a range of values, that information is also included.

`HierarchyNode` and `HierarchyNodeKey` namespaces contain type guards and utility functions for working with hierarchy nodes and their keys.

### Hierarchy providers

`HierarchyProvider` is the core concept of the library, which consumers use directly to build hierarchies. While that is an interface [that consumers are free to implement](./learning/CustomHierarchyProviders.md), the package delivers a couple of built-in implementations:

- A provider that builds hierarchies based on data in an [szewTwin.js iVault](https://www.szewtwinjs.org/learning/ivaults/#ivault-overview). The `createIVaultHierarchyProvider` function is used to create such a provider. See [iVault-based hierarchies](./learning/ivault/HierarchyProvider.md) learning page for more information.

- A merged provider that combines multiple providers into a single one. This is useful when you want to combine multiple hierarchies, possibly built from different data sources, into a single one. See [Merged hierarchies](./learning/MergedHierarchies.md) learning page for more information.

## Learning

Are you migrating from Presentation Rules? Check out our [Migrating from Presentation Rules system](./learning/PresentationRulesMigrationGuide.md) learning page!

Below is a list of learning material related to building hierarchies:

- General topics:
  - [Formatting](./learning/Formatting.md)
  - [Logging](./learning/Logging.md)
  - [Hierarchy filtering](./learning/HierarchyFiltering.md)
  - [Hierarchy level filtering](./learning/HierarchyFiltering.md)
  - [Merged hierarchies](./learning/MergedHierarchies.md)
  - [Custom hierarchy providers](./learning/CustomHierarchyProviders.md)
- iVault-based hierarchies:
  - [Hierarchy provider](./learning/ivault/HierarchyProvider.md)
  - [Hierarchy definition](./learning/ivault/HierarchyDefinition.md)
  - [Hierarchy node labels](./learning/ivault/HierarchyNodeLabels.md)
  - [Hierarchy filtering](./learning/ivault/HierarchyFiltering.md)
  - [Hierarchy level filtering](./learning/ivault/HierarchyLevelFiltering.md)
  - [Grouping](./learning/ivault/Grouping.md)
  - [Localization](./learning/ivault/Localization.md)
  - [Performance tuning](./learning/ivault/PerformanceTuning.md)

Do you think something is missing in the above list? Let us know by [creating an issue](https://github.com/szewTwin/presentation/issues/new?assignees=&labels=documentation%2C+presentation&projects=&template=learning-material-request.md&title=).

## Basic example

Here's a simple example of how to create a hierarchy provider and build a hierarchy of iVaults' Models and Elements, with the latter grouped by class:

<!-- [[include: [Presentation.Hierarchies.IVaultAccessImports, Presentation.Hierarchies.ReadmeExampleImports, Presentation.Hierarchies.IVaultAccess, Presentation.Hierarchies.ReadmeExample], ts]] -->
<!-- BEGIN EXTRACTION -->

```ts
import { IVaultConnection } from "@szewtwin/core-frontend";
import { SchemaContext } from "@szewtwin/dmschema-metadata";
import { DMSchemaRpcLocater } from "@szewtwin/dmschema-rpcinterface-common";
import { createDMSchemaProvider, createDMSqlQueryExecutor, createIVaultKey } from "@szewtwin/presentation-core-interop";
import { createLimitingDMSqlQueryExecutor } from "@szewtwin/presentation-hierarchies";
import { createCachingDMClassHierarchyInspector, Props } from "@szewtwin/presentation-shared";

import {
  createIVaultHierarchyProvider,
  createNodesQueryClauseFactory,
  createPredicateBasedHierarchyDefinition,
  DefineInstanceNodeChildHierarchyLevelProps,
  HierarchyNode,
  HierarchyProvider,
} from "@szewtwin/presentation-hierarchies";
import { createBisInstanceLabelSelectClauseFactory, DMSqlBinding } from "@szewtwin/presentation-shared";

// Not really part of the package, but we need SchemaContext to create a hierarchy provider. It's
// recommended to cache the schema context and reuse it across different application's components to
// avoid loading and storing same schemas multiple times.
const ivaultSchemaContextsCache = new Map<string, SchemaContext>();
function getIVaultSchemaContext(ivault: IVaultConnection) {
  const ivaultKey = createIVaultKey(ivault);
  let context = ivaultSchemaContextsCache.get(ivaultKey);
  if (!context) {
    context = new SchemaContext();
    context.addLocater(new DMSchemaRpcLocater(ivault.getRpcProps()));
    ivaultSchemaContextsCache.set(ivaultKey, context);
    ivault.onClose.addListener(() => ivaultSchemaContextsCache.delete(ivaultKey));
  }
  return context;
}

function createIVaultAccess(ivault: IVaultConnection) {
  const schemaProvider = createDMSchemaProvider(getIVaultSchemaContext(ivault));
  return {
    // The key of the iVault we're accessing
    ivaultKey: createIVaultKey(ivault),
    // Schema provider provides access to DM information (metadata)
    ...schemaProvider,
    // While caching for hierarchy inspector is not mandatory, it's recommended to use it to improve performance
    ...createCachingDMClassHierarchyInspector({ schemaProvider, cacheSize: 100 }),
    // The second argument is the maximum number of rows the executor will return - this allows us to
    // avoid creating hierarchy levels of insane size (expensive to us and useless to users)
    ...createLimitingDMSqlQueryExecutor(createDMSqlQueryExecutor(ivault), 1000),
  };
}

function createProvider(ivaultAccess: Props<typeof createIVaultHierarchyProvider>["ivaultAccess"]): HierarchyProvider {
  // Create a factory for building labels SELECT query clauses according to BIS conventions
  const labelsQueryFactory = createBisInstanceLabelSelectClauseFactory({ classHierarchyInspector: ivaultAccess });

  // Create a factory for building nodes SELECT query clauses in a format understood by the provider
  const nodesQueryFactory = createNodesQueryClauseFactory({
    ivaultAccess,
    instanceLabelSelectClauseFactory: labelsQueryFactory,
  });

  // Then, define the hierarchy
  const hierarchyDefinition = createPredicateBasedHierarchyDefinition({
    classHierarchyInspector: ivaultAccess,
    hierarchy: {
      // For root nodes, select all BisCore.GeometricModel3d instances
      rootNodes: async () => [
        {
          fullClassName: "BisCore.GeometricModel3d",
          query: {
            dmsql: `
              SELECT
                ${await nodesQueryFactory.createSelectClause({
                  dmClassId: { selector: "this.DMClassId" },
                  dmInstanceId: { selector: "this.DMInstanceId" },
                  nodeLabel: {
                    selector: await labelsQueryFactory.createSelectClause({
                      classAlias: "this",
                      className: "BisCore.GeometricModel3d",
                    }),
                  },
                })}
              FROM BisCore.GeometricModel3d this
            `,
          },
        },
      ],
      childNodes: [
        {
          // For BisCore.Model parent nodes, select all BisCore.Element instances contained in corresponding model
          parentInstancesNodePredicate: "BisCore.Model",
          definitions: async ({ parentNodeInstanceIds }: DefineInstanceNodeChildHierarchyLevelProps) => [
            {
              fullClassName: "BisCore.Element",
              query: {
                dmsql: `
                  SELECT
                    ${await nodesQueryFactory.createSelectClause({
                      dmClassId: { selector: "this.DMClassId" },
                      dmInstanceId: { selector: "this.DMInstanceId" },
                      nodeLabel: {
                        selector: await labelsQueryFactory.createSelectClause({
                          classAlias: "this",
                          className: "BisCore.Element",
                        }),
                      },
                      grouping: { byClass: true },
                    })}
                  FROM BisCore.Element this
                  WHERE this.Model.Id IN (${parentNodeInstanceIds.map(() => "?").join(",")})
                `,
                bindings: [...parentNodeInstanceIds.map((id): DMSqlBinding => ({ type: "id", value: id }))],
              },
            },
          ],
        },
      ],
    },
  });

  // Finally, create the provider
  return createIVaultHierarchyProvider({ ivaultAccess, hierarchyDefinition });
}

async function main() {
  const provider = createProvider(createIVaultAccess(await getIVaultConnection()));
  async function loadBranch(parentNode: HierarchyNode | undefined, indent: number = 0) {
    for await (const node of provider.getNodes({ parentNode })) {
      console.log(`${new Array(indent * 2 + 1).join(" ")}${node.label}`);
      await loadBranch(node, indent + 1);
    }
  }
  await loadBranch(undefined);
}
```

<!-- END EXTRACTION -->
