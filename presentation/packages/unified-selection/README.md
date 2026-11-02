# @szewtwin/unified-selection

Copyright © Szewec Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

The purpose of the `@szewtwin/unified-selection` package and unified selection in general is to act as a single source of truth of what is selected in an [szewTwin.js](https://www.szewtwinjs.org/) application.

## Concepts

The API consists of a few very basic concepts:

- A `Selectable` is something that can be selected and is associated with an [DM](https://www.szewtwinjs.org/bis/dm/) instance. There are 2 types of selectables:
  - `SelectableInstanceKey` uniquely identifies a single DM instance through a full class name and [DMInstanceId](https://www.szewtwinjs.org/learning/dmsql/#dminstanceid-and-dmclassid).
  - `CustomSelectable` is identified by an arbitrary `identifier` string and knows how to get any number of `SelectableInstanceKey` associated with it.

- `Selectables` is a container for multiple `Selectable` instances. The container is structured in a way that allows to quickly find specific selectables by their identifier.

- `SelectionStorage` is an interface that manages `Selectables` for different [iVaults](https://www.szewtwinjs.org/learning/ivaults/). It allows:
  - Changing the selection (add, remove, replace, clear).
  - Get active selection.
  - Listen to selection changes.

  The package delivers the `createStorage()` function to create an instance of `SelectionStorage`. Consumers are also expected to call `SelectionStorage.clearStorage` whenever an iVault is closed to free up memory.

## Usage example

<!-- [[include: [Presentation.UnifiedSelection.Example.Imports, Presentation.UnifiedSelection.Example.CreateStorage, Presentation.UnifiedSelection.Example.CleanupOnClose, Presentation.UnifiedSelection.Example.SelectionListener, Presentation.UnifiedSelection.Example.InteractiveComponent], ts]] -->
<!-- BEGIN EXTRACTION -->

```ts
import { IVaultConnection } from "@szewtwin/core-frontend";
import { createIVaultKey } from "@szewtwin/presentation-core-interop";
import { createStorage, Selectables } from "@szewtwin/unified-selection";

// Create a global selection store (generally, somewhere in main.ts or similar). This store
// must be shared across all the application's components to ensure unified selection experience.
const unifiedSelection = createStorage();

// The store should to be cleaned up when iVaults are closed to free up memory, e.g.:
IVaultConnection.onClose.addListener((iVaultConnection) => {
  unifiedSelection.clearStorage({ ivaultKey: createIVaultKey(iVaultConnection) });
});

// A demo selection listener logs selection changes to the console:
unifiedSelection.selectionChangeEvent.addListener(({ ivaultKey, source, changeType, selectables }) => {
  const suffix = `in ${ivaultKey} iVault from ${source} component`;
  const numSelectables = Selectables.size(selectables);
  switch (changeType) {
    case "add":
      console.log(`Added ${numSelectables} items to selection ${suffix}.`);
      break;
    case "remove":
      console.log(`Removed ${numSelectables} items from selection ${suffix}.`);
      break;
    case "replace":
      console.log(`Replaced selection with ${numSelectables} items ${suffix}.`);
      break;
    case "clear":
      console.log(`Cleared selection ${suffix}.`);
      break;
  }
});

// An interactive component that allows selecting elements, representing something in an iVault, may want to
// add that something to unified selection. For example:
const elementKey = { className: "BisCore.PhysicalElement", id: "0x1" };
unifiedSelection.addToSelection({
  ivaultKey: createIVaultKey(ivault),
  source: "MyComponent",
  selectables: [elementKey],
});
```

<!-- END EXTRACTION -->

## Learning

Are you migrating from `SelectionManager` in `@szewtwin/presentation-frontend`? Check out our [Migrating from `SelectionManager`](./learning/MigrationGuide.md) learning page!

Below is a list of learning material related integrating unified selection into your components:

- General topics:
  - [Selection levels](./learning/SelectionLevels.md)
  - [Selection scopes](./learning/SelectionScopes.md)
  - [Hilite sets](./learning/HiliteSets.md)
  - [Caveats](./learning/Caveats.md)
- Integrating with szewTwin.js components:
  - [Viewport / iVault](./learning/SyncWithIVaultConnection.md)
  - [Tree](./learning/SyncWithTree.md)
  - [Property grid](./learning/SyncWithPropertyGrid.md)
  - [Table](./learning/SyncWithTable.md)

Do you think something is missing in the above list? Let us know by [creating an issue](https://github.com/szewTwin/presentation/issues/new?assignees=&labels=documentation%2C+presentation&projects=&template=learning-material-request.md&title=)!
