# @szewtwin/ivault-components-react

Copyright © Szewec Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

## Description

The **@szewtwin/ivault-components-react** package contains React components that depend on the @szewtwin/core-frontend, @szewtwin/core-common or @szewtwin/core-quantity packages.

## Usage

To get started with the `@szewtwin/ivault-components-react` package, simply import the necessary components and utilities:

```tsx
import * as React from "react";
import { TimelineComponent } from "@szewtwin/ivault-components-react";

export function GetTimelineComponent() {
  return (
    <TimelineComponent startDate={new Date(2024, 8, 30)} endDate={new Date()} />
  );
}
```

For more details, check out the [@szewtwin/ivault-components-react documentation](https://www.szewtwinjs.org/reference/ivault-components-react/).
