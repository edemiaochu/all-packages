# MUI Migration Notes

This file tracks migration notes for the MUI/Stratakit components.

A new `src/mui/index.ts` barrel re-exports MUI components under legacy-aligned names (e.g. `IVaultGridMUI as IVaultGrid`). This is built as a separate rollup entry point.

## Styling approach

All MUI components use **inline `sx` props** instead of CSS module (`.module.scss`) files. This avoids injecting `<style>` tags at runtime, which are blocked by Content Security Policy (CSP) in Electron-hosted apps.

The legacy (szewtwinui) components retain their SCSS modules — only the `*MUI` variants were converted.

## `IVaultTile` -> `IVaultTileMUI`

- `tileProps` fields become first-class props on `IVaultTileMUI`.
- State props are renamed to match MUI conventions (`isLoading` → `loading`, `isDisabled` → `disabled`).
- Click interaction replaced: `onThumbnailClick` → `actions` (data-driven action tuples).
- Context menu items use `MoreActionsMenuItemMUI` via `moreActions` (data-driven tuples, not ReactNode).

### Action types

Both `actions` and `moreActions` use symmetric builder types with entity-aware callbacks:

```ts
// Card footer actions
interface CardActionsItemMUI<T> {
  key: string;
  label: string | ((value: T) => string);
  onClick?: (value: T, refetchData?: () => void) => void;
  visible?: boolean | ((value: T) => boolean);
  disabled?: boolean | ((value: T) => boolean);
}

// Three-dot menu actions
interface MoreActionsMenuItemMUI<T> {
  key: string;
  label: string | ((value: T) => string);
  icon?: string; // SVG href for Stratakit Icon
  onClick?: (value: T, refetchData?: () => void) => void;
  visible?: boolean | ((value: T) => boolean);
  disabled?: boolean | ((value: T) => boolean);
}
```

### Prop mapping

| `IVaultTile`              | `IVaultTileMUI`       | Change type             | Notes                                                                                                                                      |
| ------------------------- | --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `iVault`                  | `iVault`              | Unchanged               |                                                                                                                                            |
| `accessToken`             | `accessToken`         | Unchanged               | Used for thumbnail fetching.                                                                                                               |
| `iVaultOptions`           | `moreActions`         | Renamed + type changed  | Type changes from `ContextMenuBuilderItem<IVaultFull>[]` to `MoreActionsMenuItemMUI<IVaultFull>[]`.                                        |
| `onThumbnailClick`        | `actions`             | Replaced                | Pass `CardActionsItemMUI<IVaultFull>[]`. Callbacks receive the entity. The first action drives the clickable title; with multiple actions all are also rendered as footer buttons. |
| `tileProps.isSelected`    | —                     | Removed                 |                                                                                                                                            |
| `tileProps.isLoading`     | `loading`             | Renamed                 | Flattened to a top-level prop.                                                                                                             |
| `tileProps.isDisabled`    | `disabled`            | Renamed                 | Flattened to a top-level prop.                                                                                                             |
| `tileProps.name`          | `title`               | Renamed                 | `title` defaults to `iVault.displayName`.                                                                                                  |
| `tileProps.thumbnail`     | `thumbnail`           | Moved                   | Flattened to a top-level prop.                                                                                                             |
| `tileProps.leftIcon`      | `thumbnailTopLeft`    | Renamed                 | Flattened to a top-level `BaseCard` slot prop.                                                                                             |
| `tileProps.rightIcon`     | —                     | Removed                 | MUI renders the "more actions" menu trigger here automatically.                                                                            |
| `tileProps.badge`         | `thumbnailBottomRight`| Renamed                 | Flattened to a top-level prop. Overlay slot in the bottom-right of the thumbnail.                                                        |
| `tileProps.getBadge`      | —                     | Removed                 | Use `thumbnailBottomRight` directly.                                                                                                     |
| `tileProps.buttons`       | `actions`             | Renamed + type changed  | Type changes from `ReactNode` to `CardActionsItemMUI<IVaultFull>[]`.                                                                       |
| `tileProps.moreOptions`   | `moreActions`         | Renamed + type changed  | Combined with `moreActions`                                                                                                                |
| `tileProps.iVaultActions` | `moreActions`         | Renamed + type changed  | Combined with `moreActions`                                                                                                                |
| `tileProps.className`     | `className`           | Moved                   | Comes from `CardProps`.                                                                                                                    |
| `tileProps.metadata`      | `subheader`           | Approximate replacement | Maps to MUI `CardHeader` `subheader` slot. Pass-through prop — consumers must supply the value.                                            |
| `tileProps.status`        | `status`              | Moved + type changed    | Flattened to a top-level prop. Type changes from szewtwinui status to `"positive" \| "warning" \| "negative"`.                                |
| `apiOverrides`            | `apiOverrides`        | Unchanged               |
| `refetchIVaults`          | `refetchIVaults`      | Unchanged               |                                                                                                                                            |
| `hideFavoriteIcon`        | `hideFavoriteIcon`    | Unchanged               |                                                                                                                                            |
| `fullWidth`               | —                     | Removed                 |                                                                                                                                            |
| `tileProps.isNew`         | —                     | Removed                 | Removed for now.                                                                                                                           |
| `tileProps.onClick`       | —                     | Removed                 | Replaced by `actions`.                                                                                                                     |
| `tileProps.children`      | —                     | Removed                 |                                                                                                                                            |
|                           | `description`         | Added                   | Defaults to `iVault.description`.                                                                                                          |
|                           | `thumbnailTopLeft`    | Added                   | Overlay slot in the top-left of the thumbnail.                                                                                             |
|                           | `thumbnailBottomLeft` | Added                   | Overlay slot in the bottom-left of the thumbnail.                                                                                          |
|                           | `thumbnailBottomRight`| Added                   | Overlay slot in the bottom-right of the thumbnail.                                                                                         |
|                           | `statusIconHref`      | Added                   | SVG href rendered as an icon to the left of the content area. Auto-set to `ivault.svg`.                                                    |

---

## `SZEWTwinTile` -> `SZEWTwinTileMUI`

- `tileProps` fields become first-class props on `SZEWTwinTileMUI`.
- State props are renamed to match MUI conventions (`isSelected` → `selected`, `isLoading` → `loading`, `isDisabled` → `disabled`).
- Click interaction replaced: `onThumbnailClick` → `actions` (data-driven action tuples).
- Context menu items use `MoreActionsMenuItemMUI` via `moreActions` (data-driven tuples).

### Prop mapping

| Existing `SZEWTwinTile`     | `SZEWTwinTileMUI`         | Change type             | Notes                                                                                                                                     |
| ------------------------ | ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `szewTwin`                  | `szewTwin`                | Unchanged               |                                                                                                                                           |
| `szewTwinOptions`           | `moreActions`          | Renamed + type changed  | Type changes from `ContextMenuBuilderItem<SZEWTwinFull>[]` to `MoreActionsMenuItemMUI<SZEWTwinFull>[]`.                                         |
| `onThumbnailClick`       | `actions`              | Replaced                | Pass `CardActionsItemMUI<SZEWTwinFull>[]`. Callbacks receive the entity. The first action drives the clickable title; with multiple actions all are also rendered as footer buttons. |
| `tileProps` object       | Top-level props`       | Structural change       | `tileProps` are now top-level`.                                                                                                           |
| `tileProps.isSelected`   | —                      | Removed                 |                                                                                                                                           |
| `tileProps.isLoading`    | `loading`              | Renamed                 | Flattened to a top-level prop.                                                                                                            |
| `tileProps.isDisabled`   | `disabled`             | Renamed                 | Flattened to a top-level prop.                                                                                                            |
| `tileProps.name`         | `title`                | Renamed                 | `title` defaults to `szewTwin.displayName`.                                                                                                  |
| `tileProps.description`  | `description`          | Moved                   | Flattened; defaults to `szewTwin.number`.                                                                                                    |
| `tileProps.thumbnail`    | `thumbnail`            | Moved                   | Flattened. Default changes from szewtwinui `SvgSZEWtwin` icon to Stratakit `Icon` with `szewtwin.svg`.                                             |
| `tileProps.leftIcon`     | `thumbnailTopLeft`     | Renamed                 | Flattened to a top-level `BaseCard` slot prop.                                                                                            |
| `tileProps.rightIcon`    | —                      | Removed                 | MUI renders the favorite and context menu trigger here automatically.                                                                     |
| `tileProps.badge`        | `thumbnailBottomRight` | Renamed                 | MUI auto-renders a `StatusBadge` here when `szewTwin.status` is not "active". Override with any ReactNode.                                 |
| `tileProps.buttons`      | `actions`              | Renamed + type changed  | Type changes from `ReactNode` to `CardActionsItemMUI<SZEWTwinFull>[]`.                                                                       |
| `tileProps.moreOptions`  | `moreActions`          | Renamed + type changed  |                                                                                                                                           |
| `tileProps.szewTwinActions` | `moreActions`          | Renamed + type changed  |                                                                                                                                           |
| `tileProps.children`     | —                      | Removed                 |                                                                                                                                           |
| `tileProps.className`    | `className`            | Moved                   | Comes from `CardProps`.                                                                                                                   |
| `tileProps.status`       | `status`               | Moved + type changed    | Flattened. Type changes from szewtwinui status to `"positive" \| "warning" \| "negative"`.                                                   |
| `tileProps.metadata`     | `subheader`            | Approximate replacement | Maps to MUI `CardHeader` `subheader` slot. Auto-populated from `szewTwin.lastModifiedDateTime` (formatted as `toDateString()`).              |
| `stringsOverrides`       | `stringsOverrides`     | Unchanged               | Same keys: `trialBadge`, `inactiveBadge`, `addToFavorites`, `removeFromFavorites`.                                                        |
| `isFavorite`             | `isFavorite`           | Unchanged               |                                                                                                                                           |
| `addToFavorites`         | `addToFavorites`       | Unchanged               |                                                                                                                                           |
| `removeFromFavorites`    | `removeFromFavorites`  | Unchanged               |                                                                                                                                           |
| `refetchSZEWTwins`          | `refetchSZEWTwins`        | Unchanged               |                                                                                                                                           |
| `hideFavoriteIcon`       | `hideFavoriteIcon`     | Unchanged               |                                                                                                                                           |
| `fullWidth`              |                        | Removed                 | No direct replacement. Grid layout is now CSS grid via parent.                                                                            |
| `tileProps.isNew`        |                        | Removed                 | No direct replacement currently.                                                                                                          |
| `tileProps.onClick`      |                        | Removed                 | Replaced by `actions`.                                                                                                                    |
|                          | `thumbnailTopLeft`     | Added                   | Overlay slot in the top-left of the thumbnail.                                                                                            |
|                          | `thumbnailBottomLeft`  | Added                   | Overlay slot in the bottom-left of the thumbnail.                                                                                         |
|                          | `thumbnailBottomRight` | Added                   | Overlay slot in the bottom-right of the thumbnail. Defaults to a status badge (`Trial`/`Inactive`).                                       |
|                          | `statusIconHref`       | Added                   | SVG href rendered as an icon to the left of the content area. Auto-set to `szewtwin.svg`.                                                    |

### Behavior changes

- Three-dot menu rendered via `MoreMenuMUI` in `CardHeader` action slot. Opens on click or right-click.
- `moreActions` are data-driven tuples (`MoreActionsMenuItemMUI`), not pre-built ReactNode.
- `subheader` is auto-populated from `szewTwin.lastModifiedDateTime` (formatted as `toDateString()`). Maps to MUI `CardHeader`'s `subheader` slot.
- `status` is forwarded to `BaseCard` to drive divider color.
- When `disabled` is true, `BaseCard` suppresses title click, context menu, and actions.

---

## `IVaultGrid` -> `IVaultGridMUI`

### High-level changes

- Click interaction replaced: `onThumbnailClick` → `actions` declarative array.
- Context menu items use `MoreActionsMenuItemMUI` via `moreActions`.
- `actions` is an `CardActionsItemMUI<IVaultFull>[]` array with entity-aware callbacks for `label`, `onClick`, `visible`, and `disabled`. The grid resolves these per-entity before passing to tiles or table rows. The first visible action drives tile title click and table row click. The grid wraps the first action with recents tracking (unless `disableAddToRecents`).

### Prop mapping

| `IVaultGrid`         | `IVaultGridMUI`      | Change type            | Notes                                                                                                                     |
| -------------------- | -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `onThumbnailClick`   | `actions`            | Replaced               | `CardActionsItemMUI<IVaultFull>[]`. First visible action = primary click. Grid wraps with recents tracking automatically. |
| `iVaultActions`      | `moreActions`        | Renamed + type changed | Type changes to `MoreActionsMenuItemMUI<IVaultFull>[]`.                                                                   |
| `useIndividualState` | `useIndividualState` | Type changed           | `IVaultTileProps` → `IVaultTileMUIProps`.                                                                                 |
| `tileOverrides`      | `tileOverrides`      | Type changed           | `Partial<IVaultTileProps>` → `Partial<IVaultTileMUIProps>`.                                                               |
| All other props      | Same                 | Unchanged              | `accessToken`, `szewTwinId`, etc. are unchanged.                                                                             |

### Behavior changes

- The "cells" (table) view mode uses MUI X DataGrid (Community edition) via `IVaultTableMUI`. See [cellOverrides → tableOverrides migration](#celloverrides--tableoverrides-migration) below.
- Infinite scroll loading indicators use `BaseCardLoading` instead of `IVaultGhostTile`.
- The table receives resolved `BaseCardActionItem[]` per-row (from the grid's `resolveCardActionsItemsMUI` call). Row click fires the first visible action's `onClick()`.

---

## `SZEWTwinGrid` -> `SZEWTwinGridMUI`

### High-level changes

- Click interaction replaced: `onThumbnailClick` → `actions` declarative array.
- Context menu items use `MoreActionsMenuItemMUI` via `moreActions`.
- `actions` is an `CardActionsItemMUI<SZEWTwinFull>[]` array with entity-aware callbacks. The first visible action drives tile title click and table row click.
- Grid tile type: `useIndividualState` and `tileOverrides` operate on `SZEWTwinTilePropsMUI` instead of `SZEWTwinTileProps`.
- Loading placeholders: `IVaultGhostTile` → `BaseCardLoading`.
- Grid container: `GridStructure` wrapper → MUI `Box` with CSS grid (`repeat(auto-fill, minmax(22.5rem, 1fr))`).
- Exports `IndividualSZEWTwinStateHookMUI` type alias (MUI counterpart to `IndividualSZEWTwinStateHook`).

### Prop mapping

| `SZEWTwinGrid`          | `SZEWTwinGridMUI`       | Change type            | Notes                                                                    |
| -------------------- | -------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `onThumbnailClick`   | `actions`            | Replaced               | `CardActionsItemMUI<SZEWTwinFull>[]`. First visible action = primary click. |
| `szewTwinActions`       | `moreActions`        | Renamed + type changed | Type changes to `MoreActionsMenuItemMUI<SZEWTwinFull>[]`.                   |
| `useIndividualState` | `useIndividualState` | Type changed           | `SZEWTwinTileProps` → `SZEWTwinTilePropsMUI`.                                  |
| `tileOverrides`      | `tileOverrides`      | Type changed           | `Partial<SZEWTwinTileProps>` → `Partial<SZEWTwinTilePropsMUI>`.                |
| All other props      | Same                 | Unchanged              | `accessToken`, `requestType`, `szewTwinSubClass`, etc. are unchanged.       |

### Behavior changes

- The "cells" (table) view mode uses MUI X DataGrid (Community edition) via `SZEWTwinTableMUI`. See [cellOverrides → tableOverrides migration](#celloverrides--tableoverrides-migration) below.
- The table receives resolved `BaseCardActionItem[]` per-row. Row click fires the first visible action's `onClick()`.

---

## `ContextMenuBuilderItem` -> `MoreActionsMenuItemMUI`

| Property   | `ContextMenuBuilderItem`                               | `MoreActionsMenuItemMUI`                                    | Notes                                                                                                                                              |
| ---------- | ------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extends    | `Omit<szewtwinui MenuItemProps, "onClick" \| ...>`        | Standalone (no base type)                                   | No longer extends MUI `MenuItemProps` — only declares the fields it uses.                                                                          |
| `key`      | `string`                                               | `string`                                                    | Unchanged.                                                                                                                                         |
| `children` | Positional (via szewtwinui `MenuItem`)                    | Removed — use `label`                                       | Renamed to `label` for symmetry with `CardActionsItemMUI`.                                                                                         |
| `label`    | N/A                                                    | `string \| ((value: T) => string)` (explicit, **required**) | Replaces `children`. Accepts a function to generate text per-entity (e.g. `(szewTwin) => \`View ${szewTwin.displayName}\``). String only — no ReactNode. |
| `icon`     | Inherited from szewtwinui `MenuItem`                      | `string?`                                                   | **SVG href string.** Passed to Stratakit `<Icon>` inside `<ListItemIcon>`. No pre-rendered JSX — just import the SVG.                              |
| `visible`  | `boolean \| ((value: T) => boolean)`                   | Same                                                        | Unchanged.                                                                                                                                         |
| `onClick`  | `((value?: T, refetchData?: () => void) => void)`      | `((value: T, refetchData?: () => void) => void)`            | `value` parameter is no longer optional.                                                                                                           |
| `disabled` | `MenuItemProps["disabled"] \| ((value: T) => boolean)` | `boolean \| ((value: T) => boolean)`                        | Simplified from MUI `MenuItemProps["disabled"]` union to plain `boolean`.                                                                          |

### Menu rendering

Context menus are rendered by the shared `MoreMenuMUI` component, which accepts `MoreMenuItem[]` data tuples:

```tsx
interface MoreMenuItem {
  key: string;
  label: string;
  icon?: string; // SVG href for Stratakit <Icon>
  onClick?: () => void;
  disabled?: boolean;
}
```

`MoreActionsMenuItemMUI<T>[]` is resolved to `MoreMenuItem[]` per entity via `resolveMoreActionsMenuItemsMUI()`. This resolution evaluates `visible`, `disabled`, `label`, and `onClick` functions against the entity value.

Similarly, `CardActionsItemMUI<T>[]` is resolved to `BaseCardActionItem[]` per entity via `resolveCardActionsItemsMUI()`.

---

## `TileFavoriteIcon` -> `FavoriteIconMUI`

| Property                | `TileFavoriteIcon``                         | `FavoriteIconMUI``                                 | Notes                                                    |
| ----------------------- | ------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `isFavorite`            | `boolean`                                   | `boolean`                                          | Unchanged.                                               |
| `onAddToFavorites`      | `() => Promise<void>`                       | `() => Promise<void> \| void`                      | MUI allows synchronous callbacks.                        |
| `onRemoveFromFavorites` | `() => Promise<void>`                       | `() => Promise<void> \| void`                      | MUI allows synchronous callbacks.                        |
| `addLabel`              | `string`                                    | `string`                                           | Unchanged.                                               |
| `removeLabel`           | `string`                                    | `string`                                           | Unchanged.                                               |
| `className`             | `string?`                                   | `string?`                                          | Unchanged.                                               |
| `disabled`              | N/A                                         | `boolean?`                                         | **New in MUI.** Disables the icon button.                |
| `sx`                    | N/A                                         | `SxProps?`                                         | **New in MUI.** MUI sx styling prop.                     |
| Icon rendering          | `SvgStar` / `SvgStarHollow` (szewtwinui icons) | `Icon href={pin.svg}` (Stratakit) with CSS classes | Visual change: star → pin icon. Filled/unfilled via CSS. |

### `IVaultThumbnail` -> `IVaultThumbnailMUI`

API is unchanged.

---

## `NoResults` -> `NoResultsMUI`

API is unchanged.

---

## Exports via MUI barrel (`src/mui/index.ts`)

New entry point that re-exports MUI components under **legacy-aligned names**:

| Export name                | Internal component            |
| -------------------------- | ----------------------------- |
| `IVaultGrid`               | `IVaultGridMUI`               |
| `IVaultGridProps`          | `IVaultGridMUIProps`          |
| `IVaultTile`               | `IVaultTileMUI`               |
| `IVaultTileProps`          | `IVaultTileMUIProps`          |
| `IVaultThumbnail`          | `IVaultThumbnailMUI`          |
| `IVaultThumbnailProps`     | `IVaultThumbnailMUIProps`     |
| `SZEWTwinGrid`                | `SZEWTwinGridMUI`                |
| `SZEWTwinGridProps`           | `SZEWTwinGridPropsMUI`           |
| `IndividualSZEWTwinStateHook` | `IndividualSZEWTwinStateHookMUI` |
| `SZEWTwinGridStrings`         | `SZEWTwinGridStrings`            |
| `SZEWTwinTile`                | `SZEWTwinTileMUI`                |
| `SZEWTwinTileProps`           | `SZEWTwinTilePropsMUI`           |
| `NoResults`                | `NoResultsMUI`                |
| `NoResultsProps`           | `NoResultsMUIProps`           |
| `IVaultGhostTile`          | `BaseCardLoading`             |
| `IVaultGhostTileProps`     | `BaseCardLoadingProps`        |
| `MoreActionsMenuItem`      | `MoreActionsMenuItemMUI`      |
| `CardActionsItem`          | `CardActionsItemMUI`          |
| `ThumbnailIconButton`      | `ThumbnailIconButton`         |
| `SvgThumbnail`             | `SvgThumbnail`                |
| `SvgThumbnailProps`        | `SvgThumbnailProps`           |

Also re-exports an explicit, framework-neutral subset of the shared domain
types (`IVaultFull`, `SZEWTwinFull`, `ApiOverrides`, `DataStatus`,
`IVaultCellColumn`, `SZEWTwinCellColumn`, sort/filter/view types, etc.). The
react-table–coupled `IVaultCellOverrides` / `SZEWTwinCellOverrides` types are
intentionally **not** re-exported from the MUI barrel.

Built via a separate rollup entry point → `cjs/src/mui/index.js` / `esm/src/mui/index.js`.

This allows consumers to swap imports from the legacy barrel to the MUI barrel with minimal rename churn.

### Not exported from either barrel

- `BaseCard` (internal building block)
- `FavoriteIconMUI` (internal)

### New exports (no legacy equivalent)

- `ThumbnailIconButton` — styled MUI `IconButton` with translucent background and backdrop blur, intended for use in thumbnail overlay slots (`thumbnailTopLeft`, `thumbnailTopRight`, etc.).
- `SvgThumbnail` (and `SvgThumbnailProps`) — wraps a Stratakit SVG href so it can be passed as a `thumbnail` with correct sizing/layout.

---

## cellOverrides → tableOverrides migration

The legacy `cellOverrides` API (used by `IVaultGrid` and `SZEWTwinGrid`) passes react-table `CellProps` render functions per column. The MUI variants replace this with a `tableOverrides` prop using a MUI-native API.

### Shape change

Legacy (`IVaultCellOverrides` / `SZEWTwinCellOverrides`):

```ts
cellOverrides: {
  name: (cellProps: CellProps<IVaultFull>) => <div>{cellProps.value}</div>,
  description: (cellProps) => <em>{cellProps.value}</em>,
  hideColumns: [IVaultCellColumn.LastModified],
}
```

MUI (`IVaultTableOverridesMUI` / `SZEWTwinTableOverridesMUI`):

```ts
tableOverrides: {
  columnOverrides: {
    [IVaultCellColumn.Name]: {
      renderCell: (params) => <div>{params.value}</div>,
    },
    [IVaultCellColumn.Description]: {
      renderCell: (params) => <em>{params.value}</em>,
      sortable: false,
    },
  },
  hideColumns: [IVaultCellColumn.LastModified],
}
```

### Key differences

| Aspect                 | Legacy                                                                  | MUI                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Override shape         | Flat keys (`name`, `description`, `lastModified`) with render functions | `columnOverrides` record keyed by `IVaultCellColumn` / `SZEWTwinCellColumn` enum                       |
| Render function params | react-table `CellProps<T>` (`{ value, row: { original } }`)             | MUI `GridRenderCellParams<T>` (`{ value, row, formattedValue, ... }`)                               |
| Override scope         | Render function only                                                    | Any `GridColDef` property (`renderCell`, `valueFormatter`, `width`, `sortable`, `headerName`, etc.) |
| Hide columns           | `hideColumns: CellColumn[]` (same)                                      | `hideColumns: CellColumn[]` (same)                                                                  |
| Prop name              | `cellOverrides`                                                         | `tableOverrides`                                                                                    |
| Type safety            | `as any` shims needed internally                                        | Fully typed — overrides are `Partial<GridColDef<T>>`                                                |

### Column enum mapping

**IVault columns** (`IVaultCellColumn`):

| Legacy key                         | Enum value                                                           | DataGrid field              |
| ---------------------------------- | -------------------------------------------------------------------- | --------------------------- |
| (favorites)                        | `IVaultCellColumn.Favorite`                                          | `id`                        |
| `name`                             | `IVaultCellColumn.Name`                                              | `name`                      |
| `description`                      | `IVaultCellColumn.Description`                                       | `description`               |
| `lastModified` / `createdDateTime` | `IVaultCellColumn.LastModified` / `IVaultCellColumn.CreatedDateTime` | `lastChangesetPushDateTime` |
| (options)                          | `IVaultCellColumn.Options`                                           | `actions`                   |

**SZEWTwin columns** (`SZEWTwinCellColumn`):

| Legacy key     | Enum value                     | DataGrid field         |
| -------------- | ------------------------------ | ---------------------- |
| (favorites)    | `SZEWTwinCellColumn.Favorite`     | `id`                   |
| `SZEWTwinNumber`  | `SZEWTwinCellColumn.Number`       | `number`               |
| `SZEWTwinName`    | `SZEWTwinCellColumn.Name`         | `displayName`          |
| `LastModified` | `SZEWTwinCellColumn.LastModified` | `lastModifiedDateTime` |
| (options)      | `SZEWTwinCellColumn.Options`      | `actions`              |

### Table component details

- Component: MUI X DataGrid (Community/free edition, `@mui/x-data-grid`)
- Localization: DataGrid locale text is overridable via `stringsOverrides` — see [DataGrid locale text overrides](#datagrid-locale-text-overrides) below.
- Built-in features: Pagination, column sorting, column resize.
- Row click: Fires `onOpen` callback with the clicked iVault/szewTwin.

---

## DataGrid locale text overrides

The MUI table views (`IVaultTableMUI`, `SZEWTwinTableMUI`) expose five DataGrid locale text keys through `stringsOverrides`, alongside the existing custom string keys. This lets consumers localize the DataGrid chrome without needing a separate MUI locale pack or `ThemeProvider`.

### Supported keys

The keys are picked from `GRID_DEFAULT_LOCALE_TEXT` via a shared `MuiDataGridStrings` type:

| Key                      | Type                                                      | Default (English)                    |
| ------------------------ | --------------------------------------------------------- | ------------------------------------ |
| `noRowsLabel`            | `string`                                                  | `"No rows"`                          |
| `noResultsOverlayLabel`  | `string`                                                  | `"No results found."`                |
| `paginationRowsPerPage`  | `string`                                                  | `"Rows per page:"`                   |
| `footerRowSelected`      | `(count: number) => ReactNode`                            | `"${count} row(s) selected"`         |
| `footerTotalVisibleRows` | `(visibleCount: number, totalCount: number) => ReactNode` | `"${visibleCount} of ${totalCount}"` |

### Usage

```tsx
<IVaultGridMUI
  stringsOverrides={{
    // custom strings
    tableColumnName: "Heiti iVault",
    tableColumnDescription: "Lýsing iVault",
    // DataGrid locale strings
    noRowsLabel: "Engar raðir",
    paginationRowsPerPage: "Raðir á síðu:",
    footerRowSelected: (count) =>
      count !== 1 ? `${count} raðir valdar` : `${count} röð valin`,
    footerTotalVisibleRows: (visibleCount, totalCount) =>
      `${visibleCount} af ${totalCount}`,
  }}
/>
```

### Implementation notes

- The `_mergeStrings` utility uses `Record<string, unknown>` (not `Record<string, string>`) to support function-typed values. `NoInfer<T>` on the overrides parameter prevents TypeScript from widening the generic to an index signature.
- Default values for the DataGrid keys are sourced from `GRID_DEFAULT_LOCALE_TEXT` at the grid component level (`IVaultGridMUI`, `SZEWTwinGridMUI`), then merged with consumer overrides and passed to the table component's `localeText` prop.

---

## TODO

- Rename `szewTwinActions` and `iVaultActions` to `contextMenuItems`?
- Do we need a replacement for `isNew` and `fullWidth`?
- Fix fallback icons — rendered differently currently
- Verify icons on top of different-colour thumbnails
- Investigate infinite scroll for MUI X DataGrid table view (Pro edition supports `onRowsScrollEnd`; Community does not)
- BaseCardLoading: calculate thumbnail size dynamically instead of hard-coding
- BaseCardLoading: i18n for loading text
