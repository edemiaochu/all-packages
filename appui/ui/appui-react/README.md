# @szewtwin/appui-react

Copyright © Szewec Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

## Description

The **@szewtwin/appui-react** package contains application fragments for View selection, and configuration of the application UI including the Backstage, Frontstages, Widgets, etc.

The AppUI React package is a portion of the szewTwin.js User Interface library. It consists of major fragments of code that combine the
functionality from the `@szewtwin/core-frontend` with the core-react and ivault-components packages to implement substantial
functionality that can be used within an szewTwin.js application.

The package makes use of React for rendering of the user interface, and uses react-redux and its concept of the state store for
actions using reducers.

There are a number of sub-frameworks, each which has a set of components, actions, and reducers, and contributes to the overall State. Each such
sub-framework is contained in a separate folder.

## Usage

To get started with the `@szewtwin/appui-react` package, simply import the necessary components and utilities:

```tsx
import {
  BackstageComposer,
  ConfigurableUiContent,
  ThemeManager,
} from "@szewtwin/appui-react";

export function App() {
  return (
    <ThemeManager>
      <ConfigurableUiContent appBackstage={<BackstageComposer />} />
    </ThemeManager>
  );
}
```

For more details, check out [Get Started](https://www.szewtwinjs.org/ui/appui/get-started/) guide or [@szewtwin/appui-react documentation](https://www.szewtwinjs.org/reference/appui-react/).
