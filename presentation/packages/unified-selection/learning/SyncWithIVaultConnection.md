# iVault selection synchronization with unified selection

A Viewport is used to display `BisCore.GeometricElement` _DMInstances_ simply called _Elements_. It uses a container called the highlight (or often - just "hilite") set to represent selected elements. That container is maintained by [IVaultConnection](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/ivaultconnection/), containing the displayed elements. As a result, all viewports associated with the same `IVaultConnection` share the same hilite set.

The rules for interacting with unified selection are:

- when unified selection changes at the 0th level, we create a [hilite set](./HiliteSets.md) for the current selection and ask the iVault to hilite it,
- when an element is selected in the viewport, we compute the selection based on [selection scope](./SelectionScopes.md) and add that to our unified selection storage at the 0th level.

## Reference

The `@szewtwin/unified-selection` package delivers an `enableUnifiedSelectionSyncWithIVault` function to enable automatic selection synchronization between `SelectionStorage` and an iVault with all its Viewports. When called, it returns a cleanup function that should be used to disable the synchronization.

For example, in a React application this function could be used inside a `useEffect` hook in a component that maintains an iVault:

<!-- [[include: [Presentation.UnifiedSelection.IVaultSelectionSync.Imports, Presentation.UnifiedSelection.IVaultSelectionSync.Example], ts]] -->
<!-- BEGIN EXTRACTION -->

```ts
import { createDMSchemaProvider, createDMSqlQueryExecutor } from "@szewtwin/presentation-core-interop";
import { createCachingDMClassHierarchyInspector } from "@szewtwin/presentation-shared";
import { enableUnifiedSelectionSyncWithIVault, SelectionStorage } from "@szewtwin/unified-selection";

/** An iVault-based component that handles iVault selection directly, through its `SelectionSet` */
function IVaultComponent({ selectionStorage }: { selectionStorage: SelectionStorage }) {
  // get the active iVault connection (implementation is outside the scope of this example)
  const iVaultConnection: IVaultConnection = useActiveIVaultConnection();

  // enable unified selection sync with the iVault
  useEffect(
    () =>
      enableUnifiedSelectionSyncWithIVault({
        // Unified selection storage to synchronize iVault's tool selection with. The storage should be shared
        // across all components in the application to ensure unified selection experience.
        selectionStorage,

        // `ivaultAccess` provides access to different iVault's features: query executing, class hierarchy,
        // selection and hilite sets
        ivaultAccess: {
          ...createDMSqlQueryExecutor(iVaultConnection),
          ...createCachingDMClassHierarchyInspector({
            schemaProvider: createDMSchemaProvider(iVaultConnection.schemaContext),
          }),
          key: createIVaultKey(iVaultConnection),
          hiliteSet: iVaultConnection.hilited,
          selectionSet: iVaultConnection.selectionSet,
        },

        // a function that returns the active selection scope (see "Selection scopes" section in README)
        activeScopeProvider: () => "model",
      }),
    [iVaultConnection, selectionStorage],
  );

  return <button onClick={() => iVaultConnection.selectionSet.add(geometricElementId)}>Select element</button>;
}
```

<!-- END EXTRACTION -->

There should only be one active synchronization between a single iVault and a `SelectionStorage` at a given time.
