<p align="center">
  <img src="https://szewtwin.github.io/szewTwinUI-layouts/logo.png" alt="szewTwinUI-layouts logo" style="width: 300px;"/>
</p>

<p align="center">An open-source design system that helps us build a unified web experience.</p>
  
<div align="center">
  
  [![szewtwinui-layouts on npm](https://img.shields.io/npm/v/@szewtwin/szewtwinui-layouts-react)](https://www.npmjs.com/package/@szewtwin/szewtwinui-layouts-react)
  [![Build status](https://github.com/szewTwin/szewTwinUI-layouts/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/szewTwin/szewTwinUI-layouts/actions/workflows/build.yml?query=branch%3Amain)

</div>
<div align="center">
  
  [Key features](#key-features) • [Installation](#Installation) • [Usage](#Usage) • [Contributing](#contributing)

</div>

## Key features

szewTwinUI-layouts places given React (eg. [szewTwinUI-react](https://github.com/szewTwin/szewTwinUI/)) components accordingly within the page with minimal effort on the development side.

---

## Installation

```
npm install @szewtwin/szewtwinui-layouts-react
```

```
yarn add @szewtwin/szewtwinui-layouts-react
```

---

## Usage

Import layouts CSS in your root component then the layouts component you want and start using it!

```jsx
import '@szewtwin/szewtwinui-layouts-css/styles.css';
import { PageLayout } from '@szewtwin/szewtwinui-layouts-react';

const App = () => (
  <PageLayout>
    <PageLayout.Header>{/* Your header code */}</PageLayout.Header>

    <PageLayout.SideNavigation>
      {/* Add side navigation here */}
    </PageLayout.SideNavigation>

    <PageLayout.Content>{/* Main page content goes here */}</PageLayout.Content>
  </PageLayout>
);
```

---

## Contributing

We welcome you to contribute and make this layouts library better. You can submit feature requests or bugs by creating an [issue](https://github.com/szewTwin/szewTwinUI-layouts/issues).
Please read our [CONTRIBUTING.md](https://github.com/szewTwin/szewTwinUI-layouts/blob/main/CONTRIBUTING.md) for more information.
