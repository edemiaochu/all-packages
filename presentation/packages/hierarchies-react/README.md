# @szewtwin/presentation-hierarchies-react

Copyright © Szewec Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

The `@szewtwin/presentation-hierarchies-react` package provides APIs for building a headless UI for rendering tree components based on data in an [szewTwin.js iVault](https://www.szewtwinjs.org/learning/ivaults/#ivault-overview). In addition, it delivers a set of [szewTwinUI](https://szewtwinui.szewec.com/)-based components for rendering the tree.

## Entry points

Because `@szewtwin/szewtwinui-react` is an optional peer dependency, the package exposes three entry points:

| Entry point                                     | Requires `@szewtwin/szewtwinui-react` | Description                                                                                      |
| ----------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `@szewtwin/presentation-hierarchies-react`         | ✔️                              | Full API — all hooks, utilities, and szewTwinUI-based components. Kept for backwards compatibility. |
| `@szewtwin/presentation-hierarchies-react/core`    | ❌                              | Hooks and utilities only, safe to use without `@szewtwin/szewtwinui-react`.                            |
| `@szewtwin/presentation-hierarchies-react/szewtwinui` | ✔️                              | szewTwinUI-based components only (`TreeRenderer`, `TreeNodeRenderer`).                              |

## Headless UI

### Tree state hooks

The package provides different flavors of the same hook for creating and managing state of a tree component:

| Feature \ Hook                                                                                       | `useTree` | `useIVaultTree` | `useUnifiedSelectionTree` | `useIVaultUnifiedSelectionTree` |
| ---------------------------------------------------------------------------------------------------- | --------- | --------------- | ------------------------- | ------------------------------- |
| Supported data source                                                                                | any       | iVault          | any                       | iVault                          |
| Integration with [Unified Selection](https://www.szewtwinjs.org/presentation/unified-selection/) system | ❌        | ❌              | ✔️                        | ✔️                              |

All these hooks return the same state object, which contains properties and functions to manage the tree component:

- `isLoading` is a boolean indicating whether the root tree nodes are being loaded. Set to `true` on initial load and on reload (e.g. when iVault data changes).

- `rootNodes` is an array of root tree nodes and is what the component should render. There are several types of nodes:
  - A `PresentationHierarchyNode` is the primary type of node, created based on the hierarchy definition. The `isPresentationHierarchyNode` type guard utility may be used to check if a node is of this type.
  - A `PresentationInfoNode` is a non-expandable, non-selectable informational type of node, generally created when for some reason we don't have any real nodes to show. There may be different reasons like filtered-out nodes, too large result set, a network error, etc. The `type` attribute of the node indicates that.

- `expandNode` function to expand or collapse a node.

- `isNodeSelected` and `selectNodes` function to inspect and change tree selection.

- `getNode` function to get node by its id.

- `getHierarchyLevelDetails` function to access details of a specific hierarchy level. The returned object provides access to:
  - hierarchy level size limit,
  - hierarchy level instance filter,
  - instance keys of the nodes in the hierarchy level.

- `reloadTree` function to reload part of the tree, optionally keeping its state.

- `setFormatter` function to set active node label formatter.

#### `useTree` props

The hook takes a single required prop:

- `getHierarchyProvider` is a factory function that creates a hierarchy provider, returning the hierarchy the tree component will render. The `@szewtwin/presentation-hierarchies` package describes the concept of hierarchy provider [in more detail](https://github.com/szewTwin/presentation/blob/master/packages/hierarchies/README.md#hierarchy-providers).

#### `useUnifiedSelectionTree` props

In addition to [props required by `useTree`](#usetree-props), the hook additionally requires:

- `selectionStorage` - unified selection storage used across different app's components, allowing them all to share selection state.
- `sourceName` - a string that distinguishes selection changes being made by different components. The value should be unique for each component.

#### `useIVaultTree` props

The hook takes 2 required properties:

- `ivaultAccess` provides access to iVault's data and metadata, required to build the hierarchy. Generally, `@szewtwin/presentation-core-interop` and `@szewtwin/presentation-shared` packages are used to create this object:

  <!-- [[include: [Presentation.HierarchiesReact.iVaultAccess.Imports, Presentation.HierarchiesReact.iVaultAccess], tsx]] -->
  <!-- BEGIN EXTRACTION -->

  ```tsx
  import { IVaultConnection } from "@szewtwin/core-frontend";
  import { SchemaContext } from "@szewtwin/dmschema-metadata";
  import { DMSchemaRpcLocater } from "@szewtwin/dmschema-rpcinterface-common";
  import { createCachingDMClassHierarchyInspector } from "@szewtwin/presentation-shared";
  import { createDMSchemaProvider, createDMSqlQueryExecutor, createIVaultKey } from "@szewtwin/presentation-core-interop";
  import {
    createLimitingDMSqlQueryExecutor,
    createNodesQueryClauseFactory,
    HierarchyDefinition,
  } from "@szewtwin/presentation-hierarchies";

  // Not really part of the package, but we need SchemaContext to create the tree state. It's
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
      ivaultKey: createIVaultKey(ivault),
      ...schemaProvider,
      // while caching for hierarchy inspector is not mandatory, it's recommended to use it to improve performance
      ...createCachingDMClassHierarchyInspector({ schemaProvider, cacheSize: 100 }),
      // the second argument is the maximum number of rows the executor will return - this allows us to
      // avoid creating hierarchy levels of insane size (expensive to us and useless to users)
      ...createLimitingDMSqlQueryExecutor(createDMSqlQueryExecutor(ivault), 1000),
    };
  }
  ```

  <!-- END EXTRACTION -->

- `getHierarchyDefinition` is a factory function that creates a hierarchy definition, describing the hierarchy the tree component will render. The `@szewtwin/presentation-hierarchies` package describes the concept of hierarchy definitions [in more detail](https://github.com/szewTwin/presentation/blob/master/packages/hierarchies/learning/ivault/HierarchyDefinition.md).

#### `useIVaultUnifiedSelectionTree` props

In addition to [props required by `useIVaultTree`](#useivaulttree-props), the hook additionally requires:

- `selectionStorage` - unified selection storage used across different app's components, allowing them all to share selection state.
- `sourceName` - a string that distinguishes selection changes being made by different components. The value should be unique for each component.

### `useSelectionHandler` hook

This is a React hook that helps implement different selection modes in a tree, whose state is managed through one of the [tree state hooks](#tree-state-hooks).

It takes 3 required properties:

- `rootNodes` and `selectNodes` are the corresponding properties from the tree state object, created using one of the [tree state hooks](#tree-state-hooks).

- `selectionMode` is a string that defines the selection mode. It can be one of the following values:
  - `none` - no selection is allowed,
  - `single` - only one node can be selected at a time,
  - `extended` - multiple nodes can be selected using shift and ctrl keys,
  - `multiple` - multiple nodes can be selected without using shift or ctrl keys.

The returned object contains 2 functions, that should be called by the node renderer: `onNodeClick` and `onNodeKeyDown`.

Our [tree renderer implementation](#treerenderer) calls this hook and passes the callbacks to the [node renderer](#treenoderenderer), so there's no need to use it unless implementing a custom tree renderer.

## szewTwinUI components

The package delivers a set of [szewTwinUI](https://szewtwinui.szewec.com/)-based components for rendering the tree, covering the majority of use cases. These components are available via the `@szewtwin/presentation-hierarchies-react/szewtwinui` entry point, or the root entry point. They require `@szewtwin/szewtwinui-react` to be installed — see [Entry points](#entry-points).

### `TreeRenderer`

The component is based on [szewTwinUI Tree component](https://szewtwinui.szewec.com/docs/tree) and uses our [`TreeNodeRenderer`](#treenoderenderer) to render the nodes. In addition, it makes use of the [`useSelectionHandler` hook](#useselectionhandler-hook) to add selection modes' support.

The szewTwinUI Tree component requires a `getNode` function that maps nodes to `NodeData<TNode>` objects. Our `TreeRenderer` uses `createRenderedTreeNodeData` function for this purpose, and it's available for consumers as well, in case a custom szewTwinUI Tree component implementation is being written.

### `TreeNodeRenderer`

The component is based on `TreeNode` component from szewTwinUI library and supports the following features:

- Rendering informational type of nodes (e.g. "No filter matches", "Too many nodes in a hierarchy level", etc.).
- Reporting click and key down events for use with [`useSelectionHandler` hook](#useselectionhandler-hook).
- Icons, selection, expand / collapse.
- Action buttons to clear / set hierarchy level instance filter.

## Full example

<!-- [[include: [Presentation.HierarchiesReact.iVaultAccess.Imports, Presentation.HierarchiesReact.CustomTreeExample.Imports, Presentation.HierarchiesReact.SelectionStorage.Imports, Presentation.HierarchiesReact.iVaultAccess, Presentation.HierarchiesReact.SelectionStorage, Presentation.HierarchiesReact.CustomTreeExample], tsx]] -->
<!-- BEGIN EXTRACTION -->

```tsx
import { IVaultConnection } from "@szewtwin/core-frontend";
import { SchemaContext } from "@szewtwin/dmschema-metadata";
import { DMSchemaRpcLocater } from "@szewtwin/dmschema-rpcinterface-common";
import { createCachingDMClassHierarchyInspector } from "@szewtwin/presentation-shared";
import { createDMSchemaProvider, createDMSqlQueryExecutor, createIVaultKey } from "@szewtwin/presentation-core-interop";
import {
  createLimitingDMSqlQueryExecutor,
  createNodesQueryClauseFactory,
  HierarchyDefinition,
} from "@szewtwin/presentation-hierarchies";

import { createBisInstanceLabelSelectClauseFactory, Props } from "@szewtwin/presentation-shared";

import { useIVaultUnifiedSelectionTree } from "@szewtwin/presentation-hierarchies-react";
import { TreeRenderer } from "@szewtwin/presentation-hierarchies-react/szewtwinui";
import { createStorage, SelectionStorage } from "@szewtwin/unified-selection";
import { useEffect, useState } from "react";

// Not really part of the package, but we need SchemaContext to create the tree state. It's
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
    ivaultKey: createIVaultKey(ivault),
    ...schemaProvider,
    // while caching for hierarchy inspector is not mandatory, it's recommended to use it to improve performance
    ...createCachingDMClassHierarchyInspector({ schemaProvider, cacheSize: 100 }),
    // the second argument is the maximum number of rows the executor will return - this allows us to
    // avoid creating hierarchy levels of insane size (expensive to us and useless to users)
    ...createLimitingDMSqlQueryExecutor(createDMSqlQueryExecutor(ivault), 1000),
  };
}

// Not part of the package - this should be created once and reused across different components of the application.
const unifiedSelectionStorage = createStorage();

/** Component providing the selection storage and access to iVault. Usually this is done in a top-level component. */
function MyTreeComponent({ ivault }: { ivault: IVaultConnection }) {
  const [ivaultAccess, setIVaultAccess] = useState<IVaultAccess>();
  useEffect(() => {
    setIVaultAccess(createIVaultAccess(ivault));
  }, [ivault]);

  if (!ivaultAccess) {
    return null;
  }

  return <MyTreeComponentInternal ivaultAccess={ivaultAccess} selectionStorage={unifiedSelectionStorage} />;
}

type IVaultAccess = Props<typeof useIVaultUnifiedSelectionTree>["ivaultAccess"];

// The hierarchy definition describes the hierarchy using DMSQL queries; here it just returns all `BisCore.PhysicalModel` instances
function getHierarchyDefinition({ ivaultAccess }: { ivaultAccess: IVaultAccess }): HierarchyDefinition {
  // Create a factory for building labels SELECT query clauses according to BIS conventions
  const labelsQueryFactory = createBisInstanceLabelSelectClauseFactory({
    classHierarchyInspector: ivaultAccess,
  });
  // Create a factory for building nodes SELECT query clauses in a format understood by the provider
  const nodesQueryFactory = createNodesQueryClauseFactory({
    ivaultAccess,
    instanceLabelSelectClauseFactory: labelsQueryFactory,
  });
  return {
    defineHierarchyLevel: async () => [
      {
        fullClassName: "BisCore.PhysicalModel",
        query: {
          dmsql: `
            SELECT
              ${await nodesQueryFactory.createSelectClause({
                dmClassId: { selector: "this.DMClassId" },
                dmInstanceId: { selector: "this.DMInstanceId" },
                nodeLabel: {
                  selector: await labelsQueryFactory.createSelectClause({
                    classAlias: "this",
                    className: "BisCore.PhysicalModel",
                  }),
                },
                hasChildren: false,
              })}
            FROM BisCore.PhysicalModel this
          `,
        },
      },
    ],
  };
}

/** Internal component that creates and renders tree state. */
function MyTreeComponentInternal({
  ivaultAccess,
  selectionStorage,
}: {
  ivaultAccess: IVaultAccess;
  selectionStorage: SelectionStorage;
}) {
  const { rootNodes, setFormatter, isLoading, ...state } = useIVaultUnifiedSelectionTree({
    // the unified selection storage used by all app components let them share selection state
    selectionStorage,
    // the source name is used to distinguish selection changes being made by different components
    sourceName: "MyTreeComponent",
    // iVault access is used to build the hierarchy
    ivaultAccess,
    // supply the hierarchy definition
    getHierarchyDefinition,
  });
  if (!rootNodes) {
    return "Loading...";
  }
  return <TreeRenderer {...state} rootNodes={rootNodes} />;
}
```

<!-- END EXTRACTION -->

## Localization

Localization can be enabled for `TreeRenderer` component and [tree state hooks](#tree-state-hooks) by providing an object with localized strings that will be used instead of the default English ones.

Example:

<!-- [[include: [Presentation.HierarchiesReact.Localization.CommonImports, Presentation.HierarchiesReact.Localization.Tree.Imports, Presentation.HierarchiesReact.Localization.Strings, Presentation.HierarchiesReact.Localization.Tree], tsx]] -->
<!-- BEGIN EXTRACTION -->

```tsx
import { Props } from "@szewtwin/presentation-shared";

import { useIVaultUnifiedSelectionTree } from "@szewtwin/presentation-hierarchies-react";

type IVaultAccess = Props<typeof useIVaultUnifiedSelectionTree>["ivaultAccess"];

const localizedStrings = {
  // strings for the `useIVaultUnifiedSelectionTree` hook
  unspecified: "Unspecified",
  other: "Other",

  // strings for `TreeRenderer` and `TreeNodeRenderer`
  loading: "Loading...",
  filterHierarchyLevel: "Apply hierarchy filter",
  clearHierarchyLevelFilter: "Clear active filter",
  noFilteredChildren: "No child nodes match current filter",
  resultLimitExceeded: "There are more items than allowed limit of {{limit}}.",
  resultLimitExceededWithFiltering:
    "Please provide <link>additional filtering</link> - there are more items than allowed limit of {{limit}}.",
  increaseHierarchyLimit: "<link>Increase the hierarchy level size limit to {{limit}}.</link>",
  increaseHierarchyLimitWithFiltering: "Or, <link>increase the hierarchy level size limit to {{limit}}.</link>",
};

function MyTreeComponent({ ivaultAccess }: { ivaultAccess: IVaultAccess }) {
  const { rootNodes, expandNode } = useIVaultUnifiedSelectionTree({
    sourceName: "MyTreeComponent",
    ivaultAccess,
    localizedStrings,
    getHierarchyDefinition,
  });
  if (!rootNodes) {
    return localizedStrings.loading;
  }
  return (
    <TreeRenderer
      rootNodes={rootNodes}
      expandNode={expandNode}
      localizedStrings={localizedStrings}
      onFilterClick={() => {}}
    />
  );
}
```

<!-- END EXTRACTION -->

In case the `TreeNodeRenderer` component is used within a custom tree renderer, the tree component should supply localized strings through `LocalizationContextProvider`:

<!-- [[include: [Presentation.HierarchiesReact.Localization.CommonImports, Presentation.HierarchiesReact.Localization.TreeRenderer.Imports, Presentation.HierarchiesReact.Localization.TreeRenderer], tsx]] -->
<!-- BEGIN EXTRACTION -->

```tsx
import { Props } from "@szewtwin/presentation-shared";

import { ComponentPropsWithoutRef, useCallback } from "react";
import { Tree } from "@szewtwin/szewtwinui-react";
import { LocalizationContextProvider } from "@szewtwin/presentation-hierarchies-react";
import {
  createRenderedTreeNodeData,
  RenderedTreeNode,
  TreeNodeRenderer,
  TreeRenderer,
} from "@szewtwin/presentation-hierarchies-react/szewtwinui";

type TreeProps = ComponentPropsWithoutRef<typeof Tree<RenderedTreeNode>>;
type TreeRendererProps = Props<typeof TreeRenderer>;

function MyTreeRenderer({ rootNodes }: TreeRendererProps) {
  const nodeRenderer = useCallback<TreeProps["nodeRenderer"]>((nodeProps) => {
    return <TreeNodeRenderer {...nodeProps} onFilterClick={() => {}} expandNode={() => {}} />;
  }, []);

  const getNode = useCallback<TreeProps["getNode"]>((node) => createRenderedTreeNodeData(node, () => false), []);

  return (
    <LocalizationContextProvider localizedStrings={localizedStrings}>
      <Tree<RenderedTreeNode>
        data={rootNodes}
        nodeRenderer={nodeRenderer}
        getNode={getNode}
        enableVirtualization={true}
      />
    </LocalizationContextProvider>
  );
}
```

<!-- END EXTRACTION -->
