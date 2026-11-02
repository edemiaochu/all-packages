# desktop-viewer-test 包依赖关系（含传递依赖）

> 基于 `pnpm-lock.yaml` 解析，更新于 2026-05-12。

## 一、概览

| 类别 | 数量 |
|------|------|
| 一级生产依赖（直接声明） | 43 |
| 一级开发依赖 | 19 |
| Workspace 本地包 | 2 |

---

## 二、Workspace 本地包依赖链

```
@iproject/desktop-viewer-test
├── @localszew/desktop-viewer-react (workspace:*)
│   └── @localszew/viewer-react (workspace:*)
│       ├── @localszew/icons-webfont
│       ├── @iproject/presentation-core-interop
│       ├── @iproject/presentation-shared
│       ├── @iproject/iprojectui-illustrations-react
│       ├── @iproject/iprojectui-react
│       ├── @iproject/reality-data-client
│       ├── @iproject/unified-selection
│       └── lodash.isequal
└── @localszew/icons-webfont (workspace:*)
```

---

## 三、生产依赖及传递依赖（逐包展开）

### 3.1 iProject.js Core 核心层

<details open>
<summary><b>@iproject/core-szew</b> (5.0.4) — 基础工具库</summary>

- **无传递依赖**

</details>

<details open>
<summary><b>@iproject/core-geometry</b> (5.0.4) — 几何计算</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| flatbuffers | 1.12.0 |

</details>

<details open>
<summary><b>@iproject/core-common</b> (5.0.4) — 通用类型/RPC</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| flatbuffers | 1.12.0 |
| js-base64 | 3.7.7 |

</details>

<details open>
<summary><b>@iproject/core-backend</b> (5.0.4) — 后端服务</summary>

| 二级依赖 | 版本 |
|----------|------|
| @szew/iworkjs-native | 5.0.114 |
| @iproject/cloud-agnostic-core | 2.3.0 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| @iproject/ecschema-metadata | 5.0.4 |
| @iproject/object-storage-azure | 2.3.0 |
| @iproject/object-storage-core | 2.3.0 |
| form-data | 4.0.4 |
| fs-extra | 8.1.0 |
| inversify | 6.0.3 |
| json5 | 2.2.3 |
| linebreak | 1.1.0 |
| multiparty | 4.2.3 |
| reflect-metadata | 0.1.14 |
| semver | 7.7.2 |
| touch | 3.1.1 |
| ws | 7.5.10 |

</details>

<details open>
<summary><b>@iproject/core-frontend</b> (5.0.4) — 前端渲染</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/appui-abstract | 5.0.4 |
| @iproject/cloud-agnostic-core | 2.3.0 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| @iproject/core-i18n | 5.0.4 |
| @iproject/core-orbitgt | 5.0.4 |
| @iproject/core-quantity | 5.0.4 |
| @iproject/ecschema-metadata | 5.0.4 |
| @iproject/ecschema-rpcinterface-common | 5.0.4 |
| @iproject/object-storage-core | 2.3.0 |
| @iproject/webgl-compatibility | 5.0.4 |
| @loaders.gl/core | 3.4.15 |
| @loaders.gl/draco | 3.4.15 |
| fuse.js | 3.6.1 |
| wms-capabilities | 0.4.0 |

</details>

<details open>
<summary><b>@iproject/core-electron</b> (5.0.4) — Electron 集成</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-backend | 5.0.4 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-frontend | 5.0.4 |
| @openid/appauth | 1.3.2 |
| electron | 36.7.3 |
| open | 7.4.2 |
| username | 7.0.0 |

</details>

<details open>
<summary><b>@iproject/core-i18n</b> (5.0.4) — 国际化</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| i18next | 21.10.0 |
| i18next-browser-languagedetector | 6.1.8 |
| i18next-http-backend | 3.0.2 |

</details>

<details open>
<summary><b>@iproject/core-quantity</b> (5.0.4) — 单位/数量</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |

</details>

<details open>
<summary><b>@iproject/core-markup</b> (5.0.4) — 标记批注</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-frontend | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| @svgdotjs/svg.js | 3.0.16 |

</details>

<details open>
<summary><b>@iproject/core-orbitgt</b> (5.0.4) — OrbitGT 渲染</summary>

- **无传递依赖**

</details>

<details open>
<summary><b>@iproject/core-react</b> (5.11.2) — React 基础 UI</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/appui-abstract | 5.0.4 |
| @iproject/core-szew | 5.0.4 |
| @iproject/iprojectui-icons-react | 2.10.0 |
| @iproject/iprojectui-react | 3.19.1 |
| classnames | 2.5.1 |
| dompurify | 3.2.6 |
| lodash | 4.17.21 |
| react | 18.3.1 |
| react-autosuggest | 10.1.0 |
| react-dom | 18.3.1 |
| ts-key-enum | 2.0.13 |

</details>

<details open>
<summary><b>@iproject/webgl-compatibility</b> (5.0.4) — WebGL 兼容检测</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |

</details>

---

### 3.2 iProject.js AppUI 层

<details open>
<summary><b>@iproject/appui-abstract</b> (5.0.4) — AppUI 抽象层</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |

</details>

<details open>
<summary><b>@iproject/appui-react</b> (5.11.2) — AppUI React 组件</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/appui-abstract | 5.0.4 |
| @iproject/components-react | 5.11.2 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-frontend | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| @iproject/core-quantity | 5.0.4 |
| @iproject/core-react | 5.11.2 |
| @iproject/iwork-components-react | 5.11.2 |
| @iproject/iprojectui-icons-react | 2.10.0 |
| @iproject/iprojectui-illustrations-react | 2.1.0 |
| @iproject/iprojectui-react | 3.19.1 |
| classnames | 2.5.1 |
| immer | 10.1.1 |
| lodash | 4.17.21 |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| react-error-boundary | 5.0.0 |
| react-redux | 9.2.0 |
| react-transition-group | 4.4.5 |
| redux | 5.0.1 |
| rxjs | 7.8.2 |
| ts-key-enum | 2.0.13 |
| zustand | 4.5.7 |

</details>

<details open>
<summary><b>@iproject/components-react</b> (5.11.2) — 通用 UI 组件</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/appui-abstract | 5.0.4 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-react | 5.11.2 |
| @iproject/iprojectui-icons-react | 2.10.0 |
| @iproject/iprojectui-react | 3.19.1 |
| classnames | 2.5.1 |
| immer | 10.1.1 |
| linkify-it | 2.2.0 |
| lodash | 4.17.21 |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| react-window | 1.8.11 |
| rxjs | 7.8.2 |
| ts-key-enum | 2.0.13 |

</details>

<details open>
<summary><b>@iproject/iwork-components-react</b> (5.11.2) — iWork 专用组件</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/appui-abstract | 5.0.4 |
| @iproject/components-react | 5.11.2 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-frontend | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| @iproject/core-quantity | 5.0.4 |
| @iproject/core-react | 5.11.2 |
| @iproject/iprojectui-icons-react | 2.10.0 |
| @iproject/iprojectui-react | 3.19.1 |
| classnames | 2.5.1 |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| ts-key-enum | 2.0.13 |

</details>

---

### 3.3 iProject.js Editor 编辑器

<details open>
<summary><b>@iproject/editor-common</b> (5.3.3) — 编辑器通用</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |

</details>

<details open>
<summary><b>@iproject/editor-backend</b> (5.3.3) — 编辑器后端</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-backend | 5.0.4 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| @iproject/editor-common | 5.3.3 |

</details>

<details open>
<summary><b>@iproject/editor-frontend</b> (5.3.3) — 编辑器前端</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/appui-abstract | 5.0.4 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-frontend | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| @iproject/editor-common | 5.3.3 |

</details>

---

### 3.4 iProject.js Presentation 展示层

<details open>
<summary><b>@iproject/presentation-common</b> (5.0.4) — 展示层通用</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-quantity | 5.0.4 |
| @iproject/ecschema-metadata | 5.0.4 |
| @iproject/presentation-shared | 1.2.2 |

</details>

<details open>
<summary><b>@iproject/presentation-backend</b> (5.0.4) — 展示层后端</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-backend | 5.0.4 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-quantity | 5.0.4 |
| @iproject/ecschema-metadata | 5.0.4 |
| @iproject/presentation-common | 5.0.4 |
| @iproject/presentation-shared | 1.2.2 |
| object-hash | 1.3.1 |
| rxjs | 7.8.2 |
| rxjs-for-await | 1.0.0 |
| semver | 7.7.2 |

</details>

<details open>
<summary><b>@iproject/presentation-frontend</b> (5.0.4) — 展示层前端</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-frontend | 5.0.4 |
| @iproject/core-quantity | 5.0.4 |
| @iproject/ecschema-metadata | 5.0.4 |
| @iproject/presentation-common | 5.0.4 |
| @iproject/unified-selection | 1.4.2 |
| rxjs | 7.8.2 |
| rxjs-for-await | 1.0.0 |

</details>

<details open>
<summary><b>@iproject/presentation-components</b> (5.12.4) — 展示层 React 组件</summary>

| 二级依赖 | 版本 | | 二级依赖 | 版本 |
|----------|------|---|----------|------|
| @iproject/appui-abstract | 5.0.4 | | @iproject/iprojectui-react | 3.19.1 |
| @iproject/components-react | 5.11.2 | | @iproject/presentation-common | 5.0.4 |
| @iproject/core-szew | 5.0.4 | | @iproject/presentation-core-interop | 1.3.3 |
| @iproject/core-common | 5.0.4 | | @iproject/presentation-frontend | 5.0.4 |
| @iproject/core-frontend | 5.0.4 | | @iproject/presentation-shared | 1.2.2 |
| @iproject/core-quantity | 5.0.4 | | @iproject/unified-selection | 1.4.2 |
| @iproject/core-react | 5.11.2 | | @iproject/unified-selection-react | 1.0.1 |
| @iproject/ecschema-metadata | 5.0.4 | | classnames | 2.5.1 |
| @iproject/iwork-components-react | 5.11.2 | | fast-deep-equal | 3.1.3 |
| @iproject/iprojectui-icons-react | 2.10.0 | | fast-sort | 3.4.1 |
| @iproject/iprojectui-illustrations-react | 2.1.0 | | micro-memoize | 4.1.3 |
| | | | react / react-dom / react-error-boundary / rxjs | … |

</details>

---

### 3.5 iProject.js ECSchema 元数据

<details open>
<summary><b>@iproject/ecschema-metadata</b> (5.0.4)</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/core-quantity | 5.0.4 |

</details>

<details open>
<summary><b>@iproject/ecschema-rpcinterface-common</b> (5.0.4)</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| @iproject/ecschema-metadata | 5.0.4 |

</details>

<details open>
<summary><b>@iproject/ecschema-rpcinterface-impl</b> (5.0.4)</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-backend | 5.0.4 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-geometry | 5.0.4 |
| @iproject/ecschema-metadata | 5.0.4 |
| @iproject/ecschema-rpcinterface-common | 5.0.4 |

</details>

---

### 3.6 iProject.js iWorks 访问层

<details open>
<summary><b>@iproject/iworks-access-backend</b> (6.0.1)</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-backend | 5.0.4 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/iworks-access-common | 6.0.1 |
| @iproject/iworks-client-authoring | 6.0.1 |
| @iproject/iworks-client-management | 6.0.1 |
| @iproject/object-storage-azure | 3.0.2 |
| @iproject/object-storage-core | 3.0.2 |
| @iproject/object-storage-google | 3.0.2 |
| axios | 1.11.0 |

</details>

<details open>
<summary><b>@iproject/iworks-access-frontend</b> (6.0.1)</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/core-frontend | 5.0.4 |
| @iproject/iworks-access-common | 6.0.1 |
| @iproject/iworks-client-management | 6.0.1 |

</details>

<details open>
<summary><b>@iproject/iworks-client-authoring</b> (6.0.1)</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/iworks-client-management | 6.0.1 |
| @iproject/object-storage-core | 3.0.2 |

</details>

---

### 3.7 iProject.js UI 组件库（@iproject/iprojectui-*）

<details open>
<summary><b>@iproject/iprojectui-react</b> (3.19.1) — 主组件库</summary>

| 二级依赖 | 版本 |
|----------|------|
| @floating-ui/react | 0.27.14 |
| @iproject/iprojectui-illustrations-react | 2.1.0 |
| @swc/helpers | 0.5.17 |
| @tanstack/react-virtual | 3.13.12 |
| classnames | 2.5.1 |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| react-table | 7.8.0 |

</details>

<details open>
<summary><b>@iproject/iprojectui-css</b> (1.12.10)</summary>

- **无传递依赖**

</details>

<details open>
<summary><b>@iproject/iprojectui-variables</b> (2.1.2)</summary>

- **无传递依赖**

</details>

<details open>
<summary><b>@iproject/iprojectui-icons-react</b> (2.10.0)</summary>

| 二级依赖 | 版本 |
|----------|------|
| react | 18.3.1 |
| react-dom | 18.3.1 |

</details>

<details open>
<summary><b>@iproject/iprojectui-illustrations-react</b> (2.1.0)</summary>

| 二级依赖 | 版本 |
|----------|------|
| react | 18.3.1 |
| react-dom | 18.3.1 |

</details>

<details open>
<summary><b>@iproject/iprojectui-layouts-css</b> (0.2.0)</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/iprojectui-variables | **1.0.0** ⚠️ |

</details>

<details open>
<summary><b>@iproject/iprojectui-layouts-react</b> (0.2.0)</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/iprojectui-layouts-css | 0.2.0 |
| classnames | 2.5.1 |
| react | 18.3.1 |
| react-dom | 18.3.1 |

</details>

---

### 3.8 iProject.js 专用 Widget / 工具

<details open>
<summary><b>@iproject/property-grid-react</b> (1.19.2) — 属性面板</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/appui-abstract | 5.0.4 |
| @iproject/appui-react | 5.11.2 |
| @iproject/components-react | 5.11.2 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-frontend | 5.0.4 |
| @iproject/iprojectui-icons-react | 2.10.0 |
| @iproject/iprojectui-illustrations-react | 2.1.0 |
| @iproject/iprojectui-react | 3.19.1 |
| @iproject/presentation-common | 5.0.4 |
| @iproject/presentation-components | 5.12.4 |
| @iproject/presentation-core-interop | 1.3.3 |
| @iproject/presentation-frontend | 5.0.4 |
| @iproject/presentation-shared | 1.2.2 |
| @iproject/unified-selection | 1.4.2 |
| classnames | 2.5.1 |
| react / react-dom / react-error-boundary | … |

</details>

<details open>
<summary><b>@iproject/tree-widget-react</b> (3.11.0) — 树形控件</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/appui-abstract | 5.0.4 |
| @iproject/appui-react | 5.11.2 |
| @iproject/components-react | 5.11.2 |
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| @iproject/core-frontend | 5.0.4 |
| @iproject/ecschema-metadata | 5.0.4 |
| @iproject/iprojectui-icons-react | 2.10.0 |
| @iproject/iprojectui-illustrations-react | 2.1.0 |
| @iproject/iprojectui-react | 3.19.1 |
| @iproject/presentation-common | 5.0.4 |
| @iproject/presentation-components | 5.12.4 |
| @iproject/presentation-core-interop | 1.3.3 |
| @iproject/presentation-frontend | 5.0.4 |
| @iproject/presentation-hierarchies | 1.7.0 |
| @iproject/presentation-hierarchies-react | 1.7.2 |
| @iproject/presentation-shared | 1.2.2 |
| @iproject/unified-selection | 1.4.2 |
| classnames | 2.5.1 |
| react / react-dom / react-error-boundary / rxjs | … |

</details>

<details open>
<summary><b>@iproject/unified-selection</b> (1.4.2) — 统一选择</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/presentation-shared | 1.2.2 |
| rxjs | 7.8.2 |
| rxjs-for-await | 1.0.0 |

</details>

<details open>
<summary><b>@iproject/unified-selection-react</b> (1.0.1) — 统一选择 React</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/unified-selection | 1.4.2 |
| react | 18.3.1 |
| react-dom | 18.3.1 |

</details>

<details open>
<summary><b>@iproject/iwork-browser-react</b> (1.3.1) — iWork 浏览器</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/iprojectui-icons-react | 2.10.0 |
| @iproject/iprojectui-react | **2.12.26** ⚠️ |
| classnames | 2.5.1 |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| react-intersection-observer | 8.34.0 |

</details>

<details open>
<summary><b>@iproject/electron-authorization</b> (0.21.1) — Electron 授权</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-szew | 5.0.4 |
| @iproject/core-common | **4.11.6** ⚠️ |
| @openid/appauth | 1.3.2 |
| electron | 36.7.3 |
| electron-store | 8.2.0 |
| username | 7.0.0 |

</details>

<details open>
<summary><b>@iproject/express-server</b> (5.0.4) — Express 服务</summary>

| 二级依赖 | 版本 |
|----------|------|
| @iproject/core-backend | 5.0.4 |
| @iproject/core-common | 5.0.4 |
| express | 4.21.2 |
| express-ws | 5.0.2 |

</details>

---

### 3.9 第三方运行时依赖

| 一级依赖 | 锁定版本 | 二级依赖 |
|----------|----------|----------|
| **react** | 18.3.1 | loose-envify |
| **react-dom** | 18.3.1 | loose-envify, react, scheduler |
| **react-redux** | 9.2.0 | @types/react, @types/use-sync-external-store, react, redux, use-sync-external-store |
| **react-router** | 6.30.1 | @remix-run/router, react |
| **react-router-dom** | 6.30.1 | @remix-run/router, react, react-dom, react-router |
| **redux** | 5.0.1 | — 无传递依赖 |
| **electron** | 36.7.3 | @electron/get, @types/node, extract-zip |
| **dotenv-flow** | 3.3.0 | dotenv |
| **minimist** | 1.2.8 | — 无传递依赖 |

---

## 四、开发依赖及传递依赖

<details open>
<summary><b>@iproject/build-tools</b> (4.11.6) — iProject 构建工具集</summary>

@microsoft/api-extractor, chalk, cpx2, cross-spawn, fs-extra, glob, mocha, mocha-junit-reporter, rimraf, tree-kill, typedoc, typedoc-plugin-merge-modules, typescript, wtfnode, yargs（共 15 个二级依赖）

</details>

<details open>
<summary><b>vite</b> (7.0.6)</summary>

| 二级依赖 | 版本 |
|----------|------|
| @types/node | 22.16.5 |
| esbuild | 0.25.8 |
| fdir | 6.4.6 |
| picomatch | 4.0.3 |
| postcss | 8.5.6 |
| rollup | 4.46.1 |
| sass | 1.89.2 |
| tinyglobby | 0.2.14 |

</details>

<details open>
<summary><b>@vitejs/plugin-react</b> (4.7.0)</summary>

@babel/core, @babel/plugin-transform-react-jsx-self, @babel/plugin-transform-react-jsx-source, @rolldown/pluginutils, @types/babel__core, react-refresh, vite（共 7 个二级依赖）

</details>

<details open>
<summary><b>vite-plugin-node-polyfills</b> (0.24.0)</summary>

@rollup/plugin-inject, node-stdlib-browser, vite（共 3 个二级依赖）

</details>

<details open>
<summary><b>vite-plugin-static-copy</b> (3.1.1)</summary>

chokidar, fs-extra, p-map, picocolors, tinyglobby, vite（共 6 个二级依赖）

</details>

<details open>
<summary><b>sass</b> (1.89.2)</summary>

chokidar, immutable, source-map-js（共 3 个二级依赖）

</details>

<details open>
<summary><b>其他开发依赖</b></summary>

| 开发依赖 | 版本 | 二级依赖 |
|----------|------|----------|
| typescript | 5.6.3 | — 无 |
| rimraf | 3.0.2 | glob |
| cpx2 | 4.2.0 | debounce, debug, duplexer, fs-extra, glob-gitignore, glob2base, ignore, minimatch, p-map, resolve, safe-buffer, shell-quote, subarg |
| cross-env | 7.0.3 | cross-spawn |
| npm-run-all | 4.1.5 | ansi-styles, chalk, cross-spawn, memorystream, minimatch, pidtree, read-pkg, shell-quote, string.prototype.padend |
| electron-devtools-installer | 2.2.4 | 7zip, cross-unzip, rimraf, semver |
| @types/node | 22.16.5 | undici-types |
| @types/react | 18.3.23 | @types/prop-types, csstype |
| @types/react-dom | 18.3.7 | @types/react |
| @types/dotenv-flow | 3.3.3 | — 无 |
| @types/minimist | 1.2.5 | — 无 |
| @types/electron-devtools-installer | 2.2.5 | — 无 |

</details>

---

## 五、版本不一致警告 ⚠️

| 一级包 | 期望版本 | 引入的二级版本 | 说明 |
|--------|----------|---------------|------|
| @iproject/electron-authorization | @iproject/core-common 5.0.4 | **4.11.6** | 依赖了旧版 core-common |
| @iproject/iwork-browser-react | @iproject/iprojectui-react 3.x | **2.12.26** | 依赖了旧版 iprojectui-react |
| @iproject/iprojectui-layouts-css | @iproject/iprojectui-variables 2.x | **1.0.0** | 依赖了旧版 variables |

---

## 六、依赖层级示意图

```
┌─────────────────────────────────────────────────────────────────┐
│                    desktop-viewer-test                          │
├─────────────────────────────────────────────────────────────────┤
│  UI Layer          │  react, react-dom, react-router            │
│                    │  redux, react-redux                        │
│                    │  @iproject/iprojectui-react + icons + css        │
├─────────────────────────────────────────────────────────────────┤
│  App Framework     │  @iproject/appui-react                        │
│                    │  @iproject/components-react                   │
│                    │  @iproject/iwork-components-react            │
│                    │  @iproject/core-react                         │
├─────────────────────────────────────────────────────────────────┤
│  Feature Widgets   │  @iproject/property-grid-react                │
│                    │  @iproject/tree-widget-react                  │
│                    │  @iproject/iwork-browser-react               │
│                    │  @iproject/unified-selection-react            │
├─────────────────────────────────────────────────────────────────┤
│  Domain            │  @iproject/presentation-*                     │
│                    │  @iproject/editor-*                           │
│                    │  @iproject/ecschema-*                         │
│                    │  @iproject/iworks-*                          │
├─────────────────────────────────────────────────────────────────┤
│  Core Engine       │  @iproject/core-backend                       │
│                    │  @iproject/core-frontend                      │
│                    │  @iproject/core-common                        │
│                    │  @iproject/core-electron                      │
│                    │  @iproject/core-geometry                      │
│                    │  @iproject/core-szew                       │
├─────────────────────────────────────────────────────────────────┤
│  Workspace Local   │  @localszew/desktop-viewer-react           │
│                    │  @localszew/icons-webfont                  │
├─────────────────────────────────────────────────────────────────┤
│  Desktop Runtime   │  electron, @iproject/electron-authorization   │
│                    │  @iproject/express-server                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 七、高频共享依赖 Top 20

在直接依赖的二级/三级传递依赖中，出现频率最高的公共依赖：

| 排名 | 包名 | 被依赖次数 | 类型 |
|------|------|-----------|------|
| 1 | @iproject/core-szew | 20+ | iProject 核心 |
| 2 | react | 15+ | UI 框架 |
| 3 | react-dom | 12+ | UI 框架 |
| 4 | @iproject/core-common | 10+ | iProject 核心 |
| 5 | @iproject/core-frontend | 8+ | iProject 核心 |
| 6 | @iproject/core-geometry | 8+ | iProject 核心 |
| 7 | @iproject/appui-abstract | 7+ | AppUI |
| 8 | classnames | 7+ | 工具库 |
| 9 | @iproject/iprojectui-react | 6+ | UI 组件 |
| 10 | @iproject/core-react | 5+ | iProject UI |
| 11 | @iproject/iprojectui-icons-react | 5+ | 图标 |
| 12 | rxjs | 5+ | 响应式编程 |
| 13 | @iproject/ecschema-metadata | 5+ | 元数据 |
| 14 | @iproject/core-quantity | 5+ | 数量单位 |
| 15 | @iproject/presentation-common | 4+ | 展示层 |
| 16 | @iproject/presentation-shared | 4+ | 展示共享 |
| 17 | @iproject/unified-selection | 4+ | 选择 |
| 18 | @iproject/presentation-frontend | 4+ | 展示前端 |
| 19 | lodash | 3+ | 工具库 |
| 20 | ts-key-enum | 3+ | 按键枚举 |
