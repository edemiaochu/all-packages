# Hilite sets

> **Note:** hilite = highlight

`@szewtwin/core-frontend` contains a concept called the [HiliteSet](https://www.szewtwinjs.org/reference/core-frontend/selectionset/hiliteset/). This concept is tightly related to unified selection, because, generally, we want selected elements to be highlighted in the application's graphics views. The `HiliteSet` object contains IDs of 3 types of elements: [GeometricModel](https://www.szewtwinjs.org/reference/core-backend/models/geometricmodel/), [SubCategory](https://www.szewtwinjs.org/reference/core-backend/ivaults/subcategory/) and [GeometricElement](https://www.szewtwinjs.org/reference/core-backend/elements/geometricelement/). On the other hand, the unified selection API allows selecting other kinds of elements too, so IDs of these elements need to be mapped to the supported ones. The rules are as follows:

- for `BisCore.Subject` return IDs of all geometric models that are recursively under that Subject,
- for `BisCore.Model` just return its ID,
- for `BisCore.PhysicalPartition` just return ID of a model that models it,
- for `BisCore.Category` return IDs of all its _SubCategories_,
- for `BisCore.SubCategory` just return its ID,
- for `BisCore.GeometricElement` return ID of its own and all its child elements recursively.

So for example when unified selection contains a Subject, the hilite set for it will contain all models under that Subject, it's child Subjects, their child Subjects, etc. Given such hilite set, the viewport component hilites all elements in those models.

The `@szewtwin/unified-selection` package delivers APIs for creating a `HiliteSet` or retrieving it for _current_ selection in a `SelectionStorage`.

- The first option is to use a provider that can create a hilite set from arbitrary selection. This is done via the `createHiliteSetProvider` function:

   <!-- [[include: [Presentation.UnifiedSelection.HiliteSets.BasicProviderImports, Presentation.UnifiedSelection.HiliteSets.BasicProvider], ts]] -->
   <!-- BEGIN EXTRACTION -->

  ```ts
  import { createDMSchemaProvider, createDMSqlQueryExecutor } from "@szewtwin/presentation-core-interop";
  import { createCachingDMClassHierarchyInspector } from "@szewtwin/presentation-shared";
  import { createHiliteSetProvider } from "@szewtwin/unified-selection";

  const schemaProvider = createDMSchemaProvider(getIVaultConnection().schemaContext);
  const hiliteProvider = createHiliteSetProvider({
    ivaultAccess: {
      ...schemaProvider,
      ...createCachingDMClassHierarchyInspector({ schemaProvider }),
      ...createDMSqlQueryExecutor(ivault),
    },
  });
  const hiliteSetIterator = hiliteProvider.getHiliteSet({ selectables });
  ```

   <!-- END EXTRACTION -->

- The second option is to use an iVault-specific provider that retrieves the hilite set for iVault's current selection and caches it until selection changes. This is done via the `createIVaultHiliteSetProvider` function:

   <!-- [[include: [Presentation.UnifiedSelection.HiliteSets.IVaultProviderImports, Presentation.UnifiedSelection.HiliteSets.IVaultProvider], ts]] -->
   <!-- BEGIN EXTRACTION -->

  ```ts
  import { createIVaultHiliteSetProvider } from "@szewtwin/unified-selection";
  import { createIVaultKey } from "@szewtwin/presentation-core-interop";

  // Note the use of `using` keyword here. The caching provider registers a selection change listener and should be disposed, in case
  // its lifetime is shorter than that of `SelectionStorage`, to unregister the listener. The `using` keyword ensures that the provider
  // is disposed when it goes out of scope.
  using selectionHiliteProvider = createIVaultHiliteSetProvider({
    selectionStorage,
    // this is called to get iVault accessor based on the iVault key
    ivaultProvider: (ivaultKey) => getIVaultByKey(ivaultKey),
  });
  const hiliteSetIterator = selectionHiliteProvider.getCurrentHiliteSet({ ivaultKey: createIVaultKey(ivault) });
  ```

   <!-- END EXTRACTION -->

See [iVault selection synchronization with unified selection](./SyncWithIVaultConnection.md) for an example of how to easily enable automatic synchronization of iVault's hilite set with a `SelectionStorage`.
