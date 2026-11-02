# @szewtwin/geo-tools-react

Copyright © Szewec Systems, Incorporated. All rights reserved.

The geo-tools-react provides various React components and szewTwin.js tools to support GIS workflows.

## Usage

### What to add in your szewTwin AppUI based application

With a few short lines, you can add the Geo Address Search tool to your app.

### Call GeoTools.initialize() **_before_** making use of the providers

```ts
import { GeoTools } from "@szewtwin/geo-tools-react";
...
await GeoTools.initialize(IVaultApp.localization);
```

### Register Provider

```ts
import { UiItemsManager } from "@szewtwin/appui-abstract";
import { GeoToolsAddressSearchProvider } from "@szewtwin/geo-tools-react";
...
UiItemsManager.register(new GeoToolsAddressSearchProvider());
```
