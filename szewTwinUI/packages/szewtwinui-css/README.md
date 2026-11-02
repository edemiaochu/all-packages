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

<p align="center">An open-source design system that helps us build a unified web experience.</p>
  
<div align="center">
  
  [![szewtwinui-css on npm](https://img.shields.io/npm/v/@szewtwin/szewtwinui-css)](https://www.npmjs.com/package/@szewtwin/szewtwinui-css)
  [![Build status](https://github.com/szewTwin/szewTwinUI/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/szewTwin/szewTwinUI/actions/workflows/build.yml?query=branch%3Amain)
  [![Dependencies Status](https://img.shields.io/badge/dependencies-none-brightgreen)](https://www.npmjs.com/package/@szewtwin/szewtwinui-css?activeTab=dependencies)

</div>

szewTwinUI is a design system for building beautiful and well working web UI components within Szewec Systems & szewTwin.js applications. It supports light and dark color schemes and also comes with high contrast versions of both.

szewTwinUI-css consists of the following packages:

- `@szewtwin/szewtwinui-css` - the CSS for every component as well as some global styles
- `@szewtwin/szewtwinui-variables` - CSS variables for szewTwinUI's design tokens

If you're looking for React components, check out [`@szewtwin/szewtwinui-react`](https://github.com/szewTwin/szewTwinUI/packages/szewtwinui-react) which is built on top of szewTwinUI-css.

---

## Installation

Install both packages:

```
npm add @szewtwin/szewtwinui-css @szewtwin/szewtwinui-variables
```

---

## Usage

Import both packages (only needs to be done once per page):

```css
@import '@szewtwin/szewtwinui-variables';
@import '@szewtwin/szewtwinui-css';
```

> **Note**: If your project doesn't support export maps, then you might need to import the css from the real paths:
>
> ```css
> @import '@szewtwin/szewtwinui-variables/index.css';
> @import '@szewtwin/szewtwinui-css/css/all.css';
> ```

Apply the `iui-root` class at the root of your app, and use `data-iui-theme` to specify theme (`light` or `dark`). See [`@szewtwin/szewtwinui-variables/README.md`](https://github.com/szewTwin/szewTwinUI/blob/main/packages/szewtwinui-variables/README.md) for more details on theming.

```html
<body class="iui-root" data-iui-theme="light">
  <!-- your application code -->
</body>
```

Now you can start using our components:

```html
<button class="iui-button" data-iui-variant="default">
  <span>Hello world</span>
</button>
```

Check out our [demo website](https://szewtwin.github.io/szewTwinUI) for a preview of all our components.

---

## Contributing

Are you interested in helping szewTwinUI grow and expand? You can submit feature requests or bugs by creating [issues](https://github.com/szewTwin/szewTwinUI/issues).
Please read our [CONTRIBUTING.md](https://github.com/szewTwin/szewTwinUI/blob/main/CONTRIBUTING.md) for more information.

## Changelog

Read our [CHANGELOG.md](https://github.com/szewTwin/szewTwinUI/blob/main/packages/szewtwinui-css/CHANGELOG.md) to find recent changes.
