# Change Log - @szewtwin/ivault-browser-react

This log was last generated on Thu, 18 Jun 2026 17:36:51 GMT and should not be manually modified.

## 4.3.3
Thu, 18 Jun 2026 17:36:51 GMT

### Patches

- Prevent concurrent szewTwin API fetches

## 4.3.2
Wed, 17 Jun 2026 17:52:45 GMT

### Patches

- Prevent Stratakit grid-level props from being passed to cards

## 4.3.1
Tue, 16 Jun 2026 18:38:57 GMT

### Patches

- Update Stratakit card aspect ratio and title style

## 4.3.0
Fri, 12 Jun 2026 14:00:59 GMT

### Minor changes

- Add Stratakit MUI components

## 4.2.0
Wed, 29 Apr 2026 20:47:51 GMT

### Minor changes

- Display last modified date in iVault table instead of created date

## 4.1.0
Wed, 04 Feb 2026 22:37:11 GMT

### Minor changes

- Add option to provide callback function to iVault action disable prop

## 4.0.0
Tue, 20 Jan 2026 13:43:21 GMT

### Breaking changes

- Fix sort in iVault/szewTwin grid tables

## 3.8.0
Thu, 04 Dec 2025 12:32:04 GMT

### Minor changes

- Added callback to fetch the data while providing the data from consumer's end

## 3.7.0
Fri, 21 Nov 2025 15:41:38 GMT

### Minor changes

- use `hideFavoriteIcon` option to disable fetching favorite iVaults

## 3.6.0
Wed, 12 Nov 2025 15:33:21 GMT

### Minor changes

- Added hide columns option for szewTwinGrid and iVaultGrid while in cells view.

## 3.5.1
Thu, 06 Nov 2025 14:59:15 GMT

### Patches

- Fix: favorite icon shift on hover

## 3.5.0
Tue, 04 Nov 2025 17:20:33 GMT

### Minor changes

- Feat: Add iVault recents and favorites functionality

## 3.4.3
Fri, 10 Oct 2025 18:56:16 GMT

### Patches

- Fixed bug where fetching never happens when access token has not yet loaded

## 3.4.2
Thu, 09 Oct 2025 13:32:32 GMT

### Patches

- Fix: Cursor pointer on clickable rows in table

## 3.4.1
Wed, 08 Oct 2025 16:14:50 GMT

### Patches

- Add `fullWidth` prop to tiles

## 3.4.0
Wed, 08 Oct 2025 14:40:05 GMT

### Minor changes

- Updated szewtwinui to 3.19.4 and prevent clicks on row menu items from propagating up to the row

## 3.3.1
Fri, 19 Sep 2025 15:25:03 GMT

### Patches

- Fix iVaultGrid Filtering via postProcessCallback to Show Complete Results Across All Data

## 3.3.0
Thu, 11 Sep 2025 13:34:59 GMT

### Minor changes

- Add option to pass $orderby API query param

## 3.2.2
Tue, 09 Sep 2025 16:36:14 GMT

### Patches

- Update szewTwinFull type definition

## 3.2.1
Wed, 23 Jul 2025 11:03:45 GMT

### Patches

- Show Tile Metadata if provided

## 3.2.0
Tue, 15 Jul 2025 19:19:08 GMT

### Minor changes

- Add cellOverrides option to iVaultGrid and szewTwinGrid

## 3.1.2
Thu, 10 Jul 2025 23:35:54 GMT

### Patches

- Fix iVault opening when opening action dropdown

## 3.1.1
Thu, 10 Jul 2025 16:59:48 GMT

### Patches

- Refactor IVaultTile component to allow hovering over name label

## 3.1.0
Fri, 27 Jun 2025 06:46:50 GMT

### Minor changes

- Add getBadge property on iVaultTile in order to set badge based on iVault props

## 3.0.7
Fri, 06 Jun 2025 18:58:31 GMT

### Patches

- Integrated the pageSize property to the iVaultGrid to allow developer to select the size of the models for each request

## 3.0.6
Mon, 19 May 2025 12:15:34 GMT

### Patches

- Added data-testid's to tiles

## 3.0.5
Thu, 24 Apr 2025 20:04:45 GMT

### Patches

- fix ivault search

## 3.0.4
Tue, 22 Apr 2025 16:41:13 GMT

### Patches

- fix favorite opening szewtwin on click

## 3.0.3
Thu, 17 Apr 2025 16:41:30 GMT

### Patches

- fix error when searching szewtwin

## 3.0.2
Thu, 17 Apr 2025 14:42:55 GMT

### Patches

- Fix iVaultBrowser menu items opening the iVault in table view

## 3.0.1
Mon, 14 Apr 2025 18:32:24 GMT

### Patches

- Fixed ivault descriptions not visible in iVaultGrid

## 3.0.0
Wed, 09 Apr 2025 20:07:16 GMT

### Breaking changes

- Updated ivault-browser-react to szewtwinui-react 3.17.3
 Removed support for react 17.x

## 2.3.2
Wed, 05 Feb 2025 12:32:34 GMT

### Patches

- Fix iVault browser skipping pages

## 2.3.1
Thu, 16 Jan 2025 14:25:11 GMT

### Patches

- added accessibility to grid tiles

## 2.3.0
Wed, 15 Jan 2025 16:32:32 GMT

### Minor changes

- add SZEWTwinSubClass "All" option to fetch all szewtwins regardless of subclass

## 2.2.2
Fri, 10 Jan 2025 14:12:35 GMT

### Patches

- added accessibility to grid tiles

## 2.2.1
Thu, 09 Jan 2025 03:49:28 GMT

### Patches

- Fixed race conditions in useIVaultData

## 2.2.0
Tue, 07 Jan 2025 19:47:55 GMT

### Minor changes

- provide option to refresh the grid after an szewtwin/ivault action

## 2.1.2
Mon, 09 Dec 2024 19:40:38 GMT

### Patches

- Avoid unnecessary refetchs to API

## 2.1.1
Wed, 04 Dec 2024 19:08:30 GMT

### Patches

- Fix szewTwin favorites and hide actions dropdown in szewTwin/iVault browser when no actions defined

## 2.1.0
Thu, 21 Nov 2024 22:19:39 GMT

### Minor changes

- Add favorites functionality to SZEWTwinGrid and SZEWTwinTile components

## 2.0.3
Fri, 15 Nov 2024 16:36:26 GMT

### Patches

- Fix sorting in iVault grid

## 2.0.2
Mon, 04 Nov 2024 21:47:34 GMT

### Patches

- fix list not loading extra content when reaching the bottom

## 2.0.1
Mon, 16 Sep 2024 18:48:30 GMT

### Patches

- SZEWTwinGrid and IVaultGrid 'accessToken' prop accepts a function so the token can renew.

## 2.0.0
Wed, 11 Sep 2024 12:52:00 GMT

### Breaking changes

- Added support for react 18 and removed support for react 16

## 1.3.1
Thu, 27 Jun 2024 13:24:37 GMT

### Patches

- Added a check to ensure that no search result UI is not prematurely shown while data is still being fetched.

## 1.3.0
Wed, 19 Jun 2024 14:36:27 GMT

### Minor changes

- Updated no search results UI for IVaultGrid component

### Patches

- Adding `Search` parameter to get iVaults instead of `Name`. `Search` allows user to search without need to put the exact iVault name.

## 1.2.2
Thu, 14 Dec 2023 17:57:25 GMT

### Patches

- Revert szewTwinUI v3

## 1.2.1
Fri, 08 Dec 2023 15:10:09 GMT

### Patches

- Implement menu option close functionality

## 1.2.0
Wed, 06 Dec 2023 19:34:14 GMT

### Minor changes

- Updated szewtwinui-react to 3.x

## 1.1.1
Thu, 14 Sep 2023 16:51:06 GMT

### Patches

- Adding default iVault thumbnail for iVault grids in case API fails.

## 1.1.0
Thu, 07 Sep 2023 20:13:33 GMT

### Minor changes

- Ability to limit iVault tiles
- Added table view for szewtwin grid

## 1.0.1
Wed, 02 Aug 2023 21:41:58 GMT

### Patches

- ThemeProvider fix for Table view

## 1.0.0
Wed, 21 Jun 2023 16:43:17 GMT

### Breaking changes

- Upgraded projects api to szewTwins api

### Minor changes

- Added cells view for iVault grid.

## 0.13.3
Thu, 30 Mar 2023 16:02:00 GMT

### Patches

- ProjectGrid - Bug fix for loading skeleton when passing data as props

## 0.13.2
Tue, 21 Feb 2023 20:11:46 GMT

### Patches

- Update @szewtwin/szewtwinui-react version

## 0.13.1
Wed, 15 Feb 2023 17:36:15 GMT

### Patches

- Added registeredBy to ProjectFull

## 0.13.0
Fri, 23 Dec 2022 09:19:54 GMT

### Minor changes

- Added new optional property in iVaultGrid props to override default no state component

## 0.12.3
Fri, 03 Jun 2022 16:33:25 GMT

### Patches

- Fix trailing ghost cards when using `apiOverrides.data` prop.

## 0.12.2
Fri, 28 Jan 2022 10:41:27 GMT

### Patches

- Upgrade to React 17

## 0.12.1
Wed, 11 Aug 2021 20:01:30 GMT

### Patches

- Use @szewtwin/szewtwinui-icons-react instead of @szewec/icons-generic-webfont

## 0.12.0
Tue, 10 Aug 2021 13:28:56 GMT

### Minor changes

- Add `postProcessingCallback` property to `*Grid` components

## 0.11.0
Fri, 06 Aug 2021 13:03:18 GMT

### Minor changes

- iVaults API change: property `state` replaces `initialized`

- BREAKING: IVaultGrid only support rest API features to reduce complexity; Now only supports `sortOptions` with `sortType: 'name'` (function or other types no longer available), removed `assetId`, `filterOptions`, `iVaultOptions` (previously replaced by `iVaultActions`)
- IVaultGrid will now fetch all iVaults with infinite scrolling (previously only top 100)
- BREAKING: ProjectGrid only support rest API features to reduce complexity; Now only supports `filterOptions` with a string (function no longer available), removed `sortOptions`, `projectOptions` (previously replaced by `projectActions`)
- ProjectGrid will now fetch all projects with infinite scrolling (previously only top 100)

## 0.10.4
Wed, 04 Aug 2021 15:08:37 GMT

### Patches

- Disable iVault thumbnail caching and leave it to the network

## 0.10.3
Tue, 08 Jun 2021 16:27:51 GMT

### Patches

- Update serverEnvironmentPrefix to not require the "-"

## 0.10.2
Thu, 27 May 2021 18:16:45 GMT

### Patches

- Add `IVaultThumbnail` `classname` prop, remove default `iui-picture` class.

## 0.10.1
Thu, 20 May 2021 18:18:30 GMT

### Patches

- Support progressive Project status API changes

## 0.10.0
Tue, 18 May 2021 20:16:18 GMT

### Minor changes

- Rename iVaultOptions and projectOptions to iVaultActions and projectActions

## 0.9.0
Fri, 30 Apr 2021 00:07:09 GMT

### Minor changes

- Fix `ProjectGrid`.`onThumbnailClick` argument type.

## 0.8.1
Wed, 21 Apr 2021 19:27:23 GMT

### Patches

- Only download thumbnails if tile is in view
- Abort `fetch` request when unmounting components

## 0.8.0
Tue, 20 Apr 2021 16:34:50 GMT

### Minor changes

- Updated dependency to use @szewtwin/szewTwinUi-* packages

## 0.7.0
Tue, 20 Apr 2021 13:30:06 GMT

### Minor changes

- Add `ProjectGrid` (same features as IVaultGrid)

## 0.6.0
Fri, 16 Apr 2021 13:59:05 GMT

### Minor changes

- Add `IVaultGrid` filter options

## 0.5.0
Wed, 14 Apr 2021 17:50:21 GMT

### Minor changes

- Add `IVaultGrid` sort options

## 0.4.0
Tue, 13 Apr 2021 19:09:57 GMT

### Minor changes

- Add possibility to configure each Tiles in the `IVaultGrid`
- Add possibility to configure `Tile` used by `IVaultTile` with `tileProps` new prop

## 0.3.0
Fri, 09 Apr 2021 15:38:33 GMT

### Minor changes

- Made `IVaultGrid` props `accessToken`, `projectId` and `assetId` not required

## 0.2.1
Thu, 08 Apr 2021 18:18:13 GMT

### Patches

- Add comment

## 0.2.0
Wed, 07 Apr 2021 20:49:45 GMT

### Minor changes

- Add empty state messages to `IVaultGrid`
- Add `NoResults` component
- Add `IVaultGhostTile` component

## 0.1.1
Wed, 07 Apr 2021 17:37:55 GMT

### Patches

- Initial publish

