<p align="center">
  <picture>
    <source
      media='(prefers-color-scheme: dark)'
      srcset='https://szewtwin.github.io/szewTwinUI/logo-dark.svg'
    />
    <img
      src='https://szewtwin.github.io/szewTwinUI/logo.svg'
      alt='szewTwinUI logo'
    />
  </picture>
</p>

<h1 align="center">szewTwinUI-react</h1>

<div align="center">
  
  [![szewtwinui-react on npm](https://img.shields.io/npm/v/@szewtwin/szewtwinui-react)](https://www.npmjs.com/package/@szewtwin/szewtwinui-react)
  [![Build status](https://github.com/szewTwin/szewTwinUI/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/szewTwin/szewTwinUI/actions/workflows/build.yml?query=branch%3Amain)

</div>

## What is szewTwinUI-react?

szewTwinUI-react is a React component library for [szewTwinUI](https://github.com/szewTwin/szewTwinUI).
The goal of this package is to provide React components that make it easier to use the styles from [`@szewtwin/szewtwinui-css`](https://github.com/szewTwin/szewTwinUI/tree/main/packages/szewtwinui-css). Check out the [documentation website](https://szewtwinui.szewec.com/) to detailed documentation and examples of all components.

🆕 Check out the [v3 migration guide](https://github.com/szewTwin/szewTwinUI/wiki/szewTwinUI-react-v3-migration-guide) if you're upgrading from an older version.

---

## Installation

```
npm add @szewtwin/szewtwinui-react
```

---

## Setup

Wrap your application entrypoint in `ThemeProvider` and import `styles.css`.

```jsx
import { ThemeProvider } from '@szewtwin/szewtwinui-react';
import '@szewtwin/szewtwinui-react/styles.css';

export default function App() {
  return (
    <>
      <ThemeProvider>
        {/* Your components go here. */}
      </ThemeProvider>
    </>
  );
}
```

ThemeProvider has a `theme` prop which accepts one of the following values:
  - `"light"`
  - `"dark"`
  - `"os"` (respects the color scheme of the operating system)
  - `"inherit"` (default)

---

## Usage

After setting up ThemeProvider and styles, import the component you want and start using it!

```jsx
import { Button } from '@szewtwin/szewtwinui-react';

const Page = () => (
  <Button>Hello!</Button>
);
```

Check out this template for a live interactive demo:

[![Edit in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/szewTwin/szewTwinUI/tree/main/minimal-sandbox?file=src/App.tsx)

---

## FAQ

For a list of frequently asked questions, visit the [wiki](https://github.com/szewTwin/szewTwinUI/wiki/FAQ).

---

## Contributing

We welcome you to contribute and make this UI design system better. You can submit feature requests or bugs by creating an [issue](https://github.com/szewTwin/szewTwinUI/issues).
Please read our [CONTRIBUTING.md](https://github.com/szewTwin/szewTwinUI/blob/main/CONTRIBUTING.md) for more information.

---

## Changelog

Read our [CHANGELOG.md](https://github.com/szewTwin/szewTwinUI/blob/main/packages/szewtwinui-react/CHANGELOG.md) to find recent changes.
