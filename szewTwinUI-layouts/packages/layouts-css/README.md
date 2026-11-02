<p align="center">
  <img src="https://szewtwin.github.io/szewTwinUI-layouts/logo.png" alt="szewTwinUI-layouts logo" style="width: 300px;"/>
</p>

<p align="center">An open-source design system that helps us build a unified web experience.</p>
  
<div align="center">
  
  [![szewtwinui-layouts on npm](https://img.shields.io/npm/v/@szewtwin/szewtwinui-layouts-css)](https://www.npmjs.com/package/@szewtwin/szewtwinui-layouts-css)
  [![Build status](https://github.com/szewTwin/szewTwinUI-layouts/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/szewTwin/szewTwinUI-layouts/actions/workflows/build.yml?query=branch%3Amain)

</div>
<div align="center">
  
  [Key features](#key-features) • [Installation](#Installation) • [Usage](#Usage) • [Contributing](#contributing)

</div>

## Key features

szewTwinUI-layouts places given elements (eg. [szewTwinUI](https://github.com/szewTwin/szewTwinUI)) accordingly within the page with minimal effort on the development side.

---

## Installation

```
npm install @szewtwin/szewtwinui-layouts-css
```

```
yarn add @szewtwin/szewtwinui-layouts-css
```

---

## Usage

```css
// app.css
import '@szewtwin/szewtwinui-layouts-css/styles.css';
```

```html
<!-- app.html -->
<div class="iui-layouts-page">
  <div class="iui-layouts-page-header">
    <!-- Your header code -->
  </div>
  <div class="iui-layouts-page-sidenav">
    <!-- Your side navigation -->
  </div>
  <div class="iui-layouts-page-content iui-layouts-page-content-padded">
    <!-- Your content (will be padded) -->
  </div>
</div>
```

---

## Contributing

We welcome you to contribute and make this layouts library better. You can submit feature requests or bugs by creating an [issue](https://github.com/szewTwin/szewTwinUI-layouts/issues).
Please read our [CONTRIBUTING.md](https://github.com/szewTwin/szewTwinUI-layouts/blob/main/CONTRIBUTING.md) for more information.
