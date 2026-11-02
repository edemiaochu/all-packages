# iTwin2026 包依赖分层总览

> 生成时间：2026-06-17T03:12:34.973Z
> 共 151 个内部包 + 8 个外部引用，943 条依赖边，12 层
> 
> **Layer 0 = 基础层（不依赖任何内部包），Layer 11 = 应用层（依赖最深）**

---

## Layer 0 — 47 个包（内部 39 + 外部 8）

> ⬆ 基础层：不依赖任何内部包，是整个仓库构建的起点

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @bentley/aec-units-schema | base/aec-units-schema | base | 1.0.3 | 内部 |
| 2 | @bentley/architectural-physical-schema | base/architectural-physical-schema | base | 1.0.3 | 内部 |
| 3 | @bentley/bis-core-schema | base/bis-core-schema | base | 1.0.15 | 内部 |
| 4 | @bentley/bis-custom-attributes-schema | base/bis-custom-attributes-schema | base | 1.0.0 | 内部 |
| 5 | @bentley/cif-bridge-schema | base/cif-bridge-schema | base | 1.0.5 | 内部 |
| 6 | @bentley/cif-common-schema | base/cif-common-schema | base | 1.0.3 | 内部 |
| 7 | @bentley/cif-geometric-rules-schema | base/cif-geometric-rules-schema | base | 1.0.1 | 内部 |
| 8 | @bentley/cif-hydraulic-analysis-schema | base/cif-hydraulic-analysis-schema | base | 1.0.3 | 内部 |
| 9 | @bentley/cif-hydraulic-results-schema | base/cif-hydraulic-results-schema | base | 1.0.3 | 内部 |
| 10 | @bentley/cif-quantity-takeoffs-schema | base/cif-quantity-takeoffs-schema | base | 1.0.1 | 内部 |
| 11 | @bentley/cif-rail-schema | base/cif-rail-schema | base | 1.0.2 | 内部 |
| 12 | @bentley/cif-roads-schema | base/cif-roads-schema | base | 1.0.1 | 内部 |
| 13 | @bentley/cif-subsurface-conflict-analysis-schema | base/cif-subsurface-conflict-analysis-schema | base | 1.0.3 | 内部 |
| 14 | @bentley/cif-subsurface-schema | base/cif-subsurface-schema | base | 1.0.3 | 内部 |
| 15 | @bentley/cif-units-schema | base/cif-units-schema | base | 1.0.7 | 内部 |
| 16 | @bentley/construction-schema | base/construction-schema | base | 1.0.4 | 内部 |
| 17 | @bentley/core-custom-attributes-schema | base/core-custom-attributes-schema | base | 1.0.4 | 内部 |
| 18 | @bentley/ecdb-map-schema | base/ecdb-map-schema | base | 2.0.1 | 内部 |
| 19 | @bentley/ecdb-schema-policies-schema | base/ecdb-schema-policies-schema | base | 1.0.1 | 内部 |
| 20 | @bentley/formats-schema | base/formats-schema | base | 1.0.0 | 内部 |
| 21 | @bentley/icons-generic | base/icons-generic | base | 1.0.34 | 内部 |
| 22 | @bentley/icons-generic-webfont | base/icons-generic-webfont | base | 1.0.34 | 内部 |
| 23 | @bentley/linear-referencing-schema | base/linear-referencing-schema | base | 2.0.3 | 内部 |
| 24 | @bentley/physical-material-schema | base/physical-material-schema | base | 1.0.2 | 内部 |
| 25 | @bentley/plant-custom-attributes-schema | base/plant-custom-attributes-schema | base | 1.0.1 | 内部 |
| 26 | @bentley/process-functional-schema | base/process-functional-schema | base | 1.0.1 | 内部 |
| 27 | @bentley/process-physical-schema | base/process-physical-schema | base | 1.0.2 | 内部 |
| 28 | @bentley/quantity-takeoffs-aspects-schema | base/quantity-takeoffs-aspects-schema | base | 1.0.1 | 内部 |
| 29 | @bentley/road-rail-units-schema | base/road-rail-units-schema | base | 1.0.3 | 内部 |
| 30 | @bentley/spatial-composition-schema | base/spatial-composition-schema | base | 1.0.1 | 内部 |
| 31 | @bentley/structural-physical-schema | base/structural-physical-schema | base | 1.0.1 | 内部 |
| 32 | @bentley/units-schema | base/units-schema | base | 1.0.10 | 内部 |
| 33 | @itwin/eslint-plugin | eslint-plugin | eslint-plugin | 6.1.0 | 内部 |
| 34 | @itwin/object-storage-common-config | object-storage/utils/common-config | object-storage | 0.0.0 | 内部 |
| 35 | @itwin/itwinui-icons-react | icons/itwinui-icons-react | icons | 2.11.1 | 内部 |
| 36 | @itwin/itwinui-illustrations-react | icons/itwinui-illustrations-react | icons | 2.1.4 | 内部 |
| 37 | @itwin/itwinui-css | iTwinUI/packages/itwinui-css | iTwinUI | 3.0.0-dev.1 | 内部 |
| 38 | @itwin/itwinui-layouts-css | iTwinUI-layouts/packages/layouts-css | iTwinUI-layouts | 0.4.0 | 内部 |
| 39 | @itwin/itwinui-variables | iTwinUI/packages/itwinui-variables | iTwinUI | 3.3.1 | 内部 |
| 40 | @bentley/bentleyjs-core | (外部 npm 包) | external | | 外部·边缘 |
| 41 | @bentley/frontend-authorization-client | (外部 npm 包) | external | | 外部·边缘 |
| 42 | @bentley/imodeljs-native | (外部 npm 包) | external | | 外部·边缘 |
| 43 | @bentley/itwin-client | (外部 npm 包) | external | | 外部·边缘 |
| 44 | @itwin/appui-layout-react | (外部 npm 包) | external | | 外部·边缘 |
| 45 | @itwin/core-telemetry | (外部 npm 包) | external | | 外部·边缘 |
| 46 | @itwin/insights-client | (外部 npm 包) | external | | 外部 |
| 47 | @itwin/itwinui-icons-color-react | (外部 npm 包) | external | | 外部 |

## Layer 1 — 6 个包（内部 6 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/build-tools | itwinjs-core/tools/build | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 2 | @itwin/cloud-agnostic-core | object-storage/cloud-agnostic/core | object-storage | 3.1.1 | 内部 |
| 3 | @itwin/itwinui-react | iTwinUI/packages/itwinui-react | iTwinUI | 3.21.2 | 内部 |
| 4 | @itwin/imodels-client-common-config | imodels-clients/utils/imodels-client-common-config | imodels-clients | 0.0.0 | 内部 |
| 5 | @itwin/itwinui-layouts-react | iTwinUI-layouts/packages/layouts-react | iTwinUI-layouts | 0.4.1 | 内部 |
| 6 | @itwin/storybook-auth-addon | admin-components-react/packages/modules/storybook-auth-addon | admin-components-react | 0.1.0 | 内部 |

## Layer 2 — 11 个包（内部 11 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/core-bentley | itwinjs-core/core/bentley | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 2 | @itwin/object-storage-core | object-storage/storage/core | object-storage | 3.1.1 | 内部 |
| 3 | @itwin/certa | itwinjs-core/tools/certa | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 4 | @itwin/create-imodel-react | admin-components-react/packages/modules/create-imodel | admin-components-react | 2.2.1 | 内部 |
| 5 | @itwin/delete-imodel-react | admin-components-react/packages/modules/delete-imodel | admin-components-react | 2.1.0 | 内部 |
| 6 | @itwin/delete-itwin-react | admin-components-react/packages/modules/delete-itwin | admin-components-react | 2.0.0 | 内部 |
| 7 | @itwin/imodels-client-management | imodels-clients/clients/imodels-client-management | imodels-clients | 6.2.0 | 内部 |
| 8 | @itwin/imodel-browser-react | admin-components-react/packages/modules/imodel-browser | admin-components-react | 4.2.0 | 内部 |
| 9 | @itwin/manage-versions-react | admin-components-react/packages/modules/manage-versions | admin-components-react | 2.2.4 | 内部 |
| 10 | @itwin/perf-tools | itwinjs-core/tools/perf-tools | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 11 | internal-tools | itwinjs-core/tools/internal | itwinjs-core | 3.0.0-dev.69 | 内部 |

## Layer 3 — 11 个包（内部 11 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/core-geometry | itwinjs-core/core/geometry | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 2 | @itwin/core-quantity | itwinjs-core/core/quantity | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 3 | @itwin/ecsql-common | itwinjs-core/core/ecsql/common | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 4 | @itwin/object-storage-tests-backend | object-storage/tests/backend-storage | object-storage | 0.0.0 | 内部 |
| 5 | @itwin/object-storage-tests-backend-unit | object-storage/tests/backend-storage-unit | object-storage | 0.0.0 | 内部 |
| 6 | @itwin/object-storage-tests-frontend | object-storage/tests/frontend-storage | object-storage | 0.0.0 | 内部 |
| 7 | @itwin/appui-abstract | itwinjs-core/ui/appui-abstract | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 8 | @itwin/core-orbitgt | itwinjs-core/core/orbitgt | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 9 | @itwin/webgl-compatibility | itwinjs-core/core/webgl-compatibility | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 10 | @itwin/presentation-shared | presentation/packages/shared | presentation | 1.2.15 | 内部 |
| 11 | @itwin/imodels-client-authoring | imodels-clients/clients/imodels-client-authoring | imodels-clients | 6.2.0 | 内部 |

## Layer 4 — 7 个包（内部 7 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/core-common | itwinjs-core/core/common | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 2 | @itwin/ecschema-metadata | itwinjs-core/core/ecschema-metadata | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 3 | @itwin/object-storage-azure | object-storage/storage/azure | object-storage | 3.1.1 | 内部 |
| 4 | @itwin/unified-selection | presentation/packages/unified-selection | presentation | 1.7.5 | 内部 |
| 5 | @itwin/imodels-access-common | imodels-clients/itwin-platform-access/imodels-access-common | imodels-clients | 6.1.1 | 内部 |
| 6 | @itwin/object-storage-google | object-storage/storage/google | object-storage | 3.1.1 | 内部 |
| 7 | @itwin/object-storage-s3 | object-storage/storage/s3 | object-storage | 3.1.1 | 内部 |

## Layer 5 — 19 个包（内部 19 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/ecschema-locaters | itwinjs-core/core/ecschema-locaters | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 2 | @itwin/core-i18n | itwinjs-core/core/i18n | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 3 | @itwin/ecschema-rpcinterface-common | itwinjs-core/core/ecschema-rpc/common | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 4 | @itwin/browser-authorization | auth-clients/packages/browser | auth-clients | 2.0.2 | 内部 |
| 5 | @itwin/electron-authorization | auth-clients/packages/electron | auth-clients | 0.22.3 | 内部 |
| 6 | @itwin/presentation-common | itwinjs-core/presentation/common | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 7 | @itwin/presentation-core-interop | presentation/packages/core-interop | presentation | 1.3.13 | 内部 |
| 8 | @itwin/unified-selection-react | presentation/packages/unified-selection-react | presentation | 1.1.0 | 内部 |
| 9 | @itwin/service-authorization | auth-clients/packages/service | auth-clients | 2.1.1 | 内部 |
| 10 | @itwin/ecschema-editing | itwinjs-core/core/ecschema-editing | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 11 | @itwin/editor-common | itwinjs-core/editor/common | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 12 | @itwin/imodels-client-test-utils | imodels-clients/utils/imodels-client-test-utils | imodels-clients | 0.0.0 | 内部 |
| 13 | @itwin/imodels-access-common-tests | imodels-clients/tests/imodels-access-common-tests | imodels-clients | 0.0.0 | 内部 |
| 14 | @itwin/linear-referencing-common | itwinjs-core/domains/linear-referencing/common | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 15 | @itwin/node-cli-authorization | auth-clients/packages/node-cli | auth-clients | 3.0.3 | 内部 |
| 16 | @itwin/object-storage-minio | object-storage/storage/minio | object-storage | 3.1.1 | 内部 |
| 17 | @itwin/object-storage-oss | object-storage/storage/oss | object-storage | 3.1.1 | 内部 |
| 18 | @itwin/object-storage-samples | object-storage/samples | object-storage | 0.0.0 | 内部 |
| 19 | @itwin/presentation-hierarchies | presentation/packages/hierarchies | presentation | 1.7.15 | 内部 |

## Layer 6 — 9 个包（内部 9 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/core-backend | itwinjs-core/core/backend | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 2 | @itwin/core-react | appui/ui/core-react | appui | 5.32.0 | 内部 |
| 3 | @itwin/core-frontend | itwinjs-core/core/frontend | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 4 | @itwin/oidc-signin-tool | auth-clients/packages/oidc-signin-tool | auth-clients | 5.1.3 | 内部 |
| 5 | @itwin/imodels-clients-tests | imodels-clients/tests/imodels-clients-tests | imodels-clients | 0.0.0 | 内部 |
| 6 | @itwin/imodels-clients-tests-browser | imodels-clients/tests/imodels-clients-tests-browser | imodels-clients | 0.0.0 | 内部 |
| 7 | @itwin/presentation-hierarchies-react | presentation/packages/hierarchies-react | presentation | 1.11.0 | 内部 |
| 8 | @itwin/presentation-models-tree | presentation/packages/models-tree | presentation | 0.0.0 | 内部 |
| 9 | @itwin/presentation-opentelemetry | presentation/packages/opentelemetry | presentation | 4.2.5 | 内部 |

## Layer 7 — 28 个包（内部 28 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/analytical-backend | itwinjs-core/domains/analytical/backend | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 2 | @itwin/components-react | appui/ui/components-react | appui | 5.32.0 | 内部 |
| 3 | @itwin/cesium-renderer | itwinjs-core/extensions/cesium-renderer | itwinjs-core | 5.2.0-dev.26 | 内部 |
| 4 | @itwin/core-electron | itwinjs-core/core/electron | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 5 | @itwin/core-extension | itwinjs-core/core/extension | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 6 | @itwin/core-markup | itwinjs-core/core/markup | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 7 | @itwin/core-mobile | itwinjs-core/core/mobile | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 8 | @itwin/presentation-frontend | itwinjs-core/presentation/frontend | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 9 | @itwin/imodels-access-frontend | imodels-clients/itwin-platform-access/imodels-access-frontend | imodels-clients | 6.1.1 | 内部 |
| 10 | @itwin/reality-data-client | reality-capture/typescript/packages/reality-data-client | reality-capture | 1.4.0 | 内部 |
| 11 | @itwin/ecschema-rpcinterface-impl | itwinjs-core/core/ecschema-rpc/impl | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 12 | @itwin/express-server | itwinjs-core/core/express-server | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 13 | @itwin/imodels-access-backend | imodels-clients/itwin-platform-access/imodels-access-backend | imodels-clients | 6.1.1 | 内部 |
| 14 | @itwin/itwins-client | itwins-client | itwins-client | 3.1.0 | 内部 |
| 15 | @itwin/ecschema2ts | itwinjs-core/tools/ecschema2ts | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 16 | @itwin/editor-backend | itwinjs-core/editor/backend | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 17 | @itwin/editor-frontend | itwinjs-core/editor/frontend | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 18 | @itwin/frontend-devtools | itwinjs-core/core/frontend-devtools | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 19 | @itwin/frontend-tiles | itwinjs-core/extensions/frontend-tiles | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 20 | @itwin/hypermodeling-frontend | itwinjs-core/core/hypermodeling | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 21 | @itwin/imodel-transformer | imodel-transformer/packages/transformer | imodel-transformer | 1.2.1-dev.1 | 内部 |
| 22 | @itwin/linear-referencing-backend | itwinjs-core/domains/linear-referencing/backend | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 23 | @itwin/map-layers-formats | itwinjs-core/extensions/map-layers-formats | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 24 | @itwin/map-layers-auth | itwinjs-core/extensions/map-layers-auth | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 25 | @itwin/physical-material-backend | itwinjs-core/domains/physical-material/backend | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 26 | @itwin/presentation-backend | itwinjs-core/presentation/backend | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 27 | @itwin/quantity-formatting-react | viewer-components-react/packages/itwin/quantity-formatting | viewer-components-react | 0.1.5 | 内部 |
| 28 | @itwin/workspace-editor | itwinjs-core/utils/workspace-editor | itwinjs-core | 5.11.0-dev.7 | 内部 |

## Layer 8 — 6 个包（内部 6 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/imodel-components-react | appui/ui/imodel-components-react | appui | 5.32.0 | 内部 |
| 2 | @itwin/ecschema-rpcinterface-tests | itwinjs-core/full-stack-tests/ecschema-rpc-interface | itwinjs-core | 5.11.0-dev.7 | 内部 |
| 3 | @itwin/imodels-access-backend-tests | imodels-clients/tests/imodels-access-backend-tests | imodels-clients | 0.0.0 | 内部 |
| 4 | @itwin/imodels-access-frontend-tests | imodels-clients/tests/imodels-access-frontend-tests | imodels-clients | 0.0.0 | 内部 |
| 5 | @itwin/reality-capture | reality-capture/typescript/packages/reality-capture | reality-capture | 1.5.0 | 内部 |
| 6 | @itwin/rpcinterface-full-stack-tests | itwinjs-core/full-stack-tests/rpc-interface | itwinjs-core | 5.11.0-dev.7 | 内部 |

## Layer 9 — 2 个包（内部 2 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/appui-react | appui/ui/appui-react | appui | 5.32.0 | 内部 |
| 2 | @itwin/presentation-components | presentation/packages/components | presentation | 5.16.0 | 内部 |

## Layer 10 — 11 个包（内部 11 + 外部 0）

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/appui-test-providers | appui/apps/test-providers | appui | 0.0.0 | 内部 |
| 2 | @itwin/viewer-react | viewer/packages/modules/viewer-react | viewer | 5.0.1 | 内部 |
| 3 | @itwin/ec3-widget-react | viewer-components-react/packages/itwin/ec3-widget | viewer-components-react | 0.10.2 | 内部 |
| 4 | @itwin/geo-tools-react | viewer-components-react/packages/itwin/geo-tools | viewer-components-react | 6.0.1 | 内部 |
| 5 | @itwin/grouping-mapping-widget | viewer-components-react/packages/itwin/grouping-mapping-widget | viewer-components-react | 0.37.0 | 内部 |
| 6 | @itwin/map-layers | viewer-components-react/packages/itwin/map-layers | viewer-components-react | 7.0.1 | 内部 |
| 7 | @itwin/measure-tools-react | viewer-components-react/packages/itwin/measure-tools | viewer-components-react | 0.33.0 | 内部 |
| 8 | @itwin/one-click-lca-react | viewer-components-react/packages/itwin/one-click-lca-widget | viewer-components-react | 0.8.0 | 内部 |
| 9 | @itwin/property-grid-react | viewer-components-react/packages/itwin/property-grid | viewer-components-react | 1.19.9 | 内部 |
| 10 | @itwin/reports-config-widget-react | viewer-components-react/packages/itwin/reports-config-widget | viewer-components-react | 0.9.0 | 内部 |
| 11 | @itwin/tree-widget-react | viewer-components-react/packages/itwin/tree-widget | viewer-components-react | 3.17.10 | 内部 |

## Layer 11 — 2 个包（内部 2 + 外部 0）

> ⬇ 应用层：依赖链最深

| # | 包名 | 目录 | 子项目 | 版本 | 类型 |
|---|------|------|--------|------|------|
| 1 | @itwin/desktop-viewer-react | viewer/packages/modules/desktop-viewer-react | viewer | 5.1.0 | 内部 |
| 2 | @itwin/web-viewer-react | viewer/packages/modules/web-viewer-react | viewer | 5.0.1 | 内部 |
