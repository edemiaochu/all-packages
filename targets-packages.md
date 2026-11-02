# targets清单（name-replacer/targets copy.json）

共 **16 层**，替换+发布 **136** 个 + 仅替换 **14** 个。

## Layer 0 — 基础层：不依赖任何内部包，构建起点（38发布 + 1仅替换）

**替换+发布（39 个）**

| # | 目录 |
|---|---|
| 1 | `base/cif-bridge-schema` |
| 2 | `base/cif-common-schema` |
| 3 | `base/cif-geometric-rules-schema` |
| 4 | `base/cif-hydraulic-analysis-schema` |
| 5 | `base/cif-hydraulic-results-schema` |
| 6 | `base/cif-quantity-takeoffs-schema` |
| 7 | `base/cif-rail-schema` |
| 8 | `base/cif-roads-schema` |
| 9 | `base/cif-subsurface-conflict-analysis-schema` |
| 10 | `base/cif-subsurface-schema` |
| 11 | `base/process-functional-schema` |
| 12 | `base/process-physical-schema` |
| 13 | `eslint-plugin` |
| 14 | `object-storage/utils/common-config` |
| 15 | `base/aec-units-schema` |
| 16 | `base/architectural-physical-schema` |
| 17 | `base/bis-core-schema` |
| 18 | `base/bis-custom-attributes-schema` |
| 19 | `base/construction-schema` |
| 20 | `base/core-custom-attributes-schema` |
| 21 | `base/ecdb-map-schema` |
| 22 | `base/ecdb-schema-policies-schema` |
| 23 | `base/formats-schema` |
| 24 | `base/linear-referencing-schema` |
| 25 | `base/physical-material-schema` |
| 26 | `base/plant-custom-attributes-schema` |
| 27 | `base/quantity-takeoffs-aspects-schema` |
| 28 | `base/spatial-composition-schema` |
| 29 | `base/structural-physical-schema` |
| 30 | `base/units-schema` |
| 31 | `base/cif-units-schema` |
| 32 | `base/road-rail-units-schema` |
| 33 | `icons/itwinui-icons-react` |
| 34 | `icons/itwinui-illustrations-react` |
| 35 | `base/icons-generic-webfont` |
| 36 | `base/icons-generic` |
| 37 | `iTwinUI-layouts/packages/layouts-css` |
| 38 | `iTwinUI/packages/itwinui-variables` |
| 39 | `iTwinUI/packages/itwinui-css` |

## Layer 1 — 依赖 Layer 0~0（5发布 + 1仅替换）

**替换+发布（5 个）**

| # | 目录 |
|---|---|
| 1 | `itwinjs-core/tools/build` |
| 2 | `object-storage/cloud-agnostic/core` |
| 3 | `iTwinUI/packages/itwinui-react` |
| 4 | `imodels-clients/utils/imodels-client-common-config` |
| 5 | `iTwinUI-layouts/packages/layouts-react` |

## Layer 2 — 依赖 Layer 0~1（11发布 + 0仅替换）

**替换+发布（11 个）**

| # | 目录 |
|---|---|
| 1 | `object-storage/storage/core` |
| 2 | `itwinjs-core/core/bentley` |
| 3 | `itwinjs-core/tools/certa` |
| 4 | `admin-components-react/packages/modules/create-imodel` |
| 5 | `admin-components-react/packages/modules/delete-imodel` |
| 6 | `admin-components-react/packages/modules/delete-itwin` |
| 7 | `imodels-clients/clients/imodels-client-management` |
| 8 | `admin-components-react/packages/modules/imodel-browser` |
| 9 | `admin-components-react/packages/modules/manage-versions` |
| 10 | `itwinjs-core/tools/perf-tools` |
| 11 | `itwinjs-core/tools/internal` |

## Layer 3 — 依赖 Layer 0~2（8发布 + 3仅替换）

**替换+发布（10 个）**

| # | 目录 |
|---|---|
| 1 | `itwinjs-core/core/geometry` |
| 2 | `itwinjs-core/core/quantity` |
| 3 | `itwinjs-core/core/ecsql/common` |
| 4 | `itwinjs-core/ui/appui-abstract` |
| 5 | `itwinjs-core/core/webgl-compatibility` |
| 6 | `itwinjs-core/core/orbitgt` |
| 7 | `itwinjs-core/core/common` |
| 8 | `presentation/packages/test-utilities` |
| 9 | `presentation/packages/shared` |
| 10 | `imodels-clients/clients/imodels-client-authoring` |

**仅替换（3 个）**

| # | 目录 |
|---|---|
| 1 | `object-storage/tests/backend-storage` |
| 2 | `object-storage/tests/backend-storage-unit` |
| 3 | `object-storage/tests/frontend-storage` |

## Layer 4 — 依赖 Layer 0~3（7发布 + 0仅替换）

**替换+发布（6 个）**

| # | 目录 |
|---|---|
| 1 | `object-storage/storage/azure` |
| 2 | `itwinjs-core/core/ecschema-metadata` |
| 3 | `presentation/packages/unified-selection` |
| 4 | `imodels-clients/itwin-platform-access/imodels-access-common` |
| 5 | `object-storage/storage/google` |
| 6 | `object-storage/storage/s3` |

## Layer 5-1 — 依赖 Layer 0~4（18发布 + 1仅替换）

**替换+发布（7 个）**

| # | 目录 |
|---|---|
| 1 | `itwinjs-core/core/ecschema-locaters` |
| 2 | `itwinjs-core/core/i18n` |
| 3 | `itwinjs-core/core/ecschema-rpc/common` |
| 4 | `itwinjs-core/presentation/common` |
| 5 | `itwinjs-core/core/ecschema-editing` |
| 6 | `itwinjs-core/editor/common` |
| 7 | `itwinjs-core/domains/linear-referencing/common` |

## Layer 5-2 — 依赖 Layer 0~4（18发布 + 1仅替换）

**替换+发布（7 个）**

| # | 目录 |
|---|---|
| 1 | `auth-clients/packages/browser` |
| 2 | `auth-clients/packages/service` |
| 3 | `auth-clients/packages/electron` |
| 4 | `auth-clients/packages/node-cli` |
| 5 | `object-storage/storage/minio` |
| 6 | `object-storage/storage/oss` |
| 7 | `object-storage/samples` |

## Layer 5-3 — 依赖 Layer 0~4（18发布 + 1仅替换）

**替换+发布（3 个）**

| # | 目录 |
|---|---|
| 1 | `presentation/packages/core-interop` |
| 2 | `presentation/packages/unified-selection-react` |
| 3 | `presentation/packages/hierarchies` |

## Layer 5-4 — 依赖 Layer 0~4（18发布 + 1仅替换）

**替换+发布（1 个）**

| # | 目录 |
|---|---|
| 1 | `imodels-clients/utils/imodels-client-test-utils` |

**仅替换（1 个）**

| # | 目录 |
|---|---|
| 1 | `imodels-clients/tests/imodels-access-common-tests` |

## Layer 6 — 依赖 Layer 0~5（6发布 + 3仅替换）

**替换+发布（6 个）**

| # | 目录 |
|---|---|
| 1 | `itwinjs-core/core/backend` |
| 2 | `appui/ui/core-react` |
| 3 | `itwinjs-core/core/frontend` |
| 4 | `auth-clients/packages/oidc-signin-tool` |
| 5 | `presentation/packages/opentelemetry` |
| 6 | `presentation/packages/hierarchies-react` |

**仅替换（3 个）**

| # | 目录 |
|---|---|
| 1 | `imodels-clients/tests/imodels-clients-tests` |
| 2 | `imodels-clients/tests/imodels-clients-tests-browser` |
| 3 | `presentation/packages/models-tree` |

## Layer 7-1 — 依赖 Layer 0~6（27发布 + 1仅替换）

**替换+发布（20 个）**

| # | 目录 |
|---|---|
| 1 | `itwinjs-core/domains/analytical/backend` |
| 2 | `itwinjs-core/core/extension` |
| 3 | `itwinjs-core/core/mobile` |
| 4 | `itwinjs-core/core/markup` |
| 5 | `itwinjs-core/presentation/frontend` |
| 6 | `itwinjs-core/core/electron` |
| 7 | `itwinjs-core/core/ecschema-rpc/impl` |
| 8 | `itwinjs-core/core/express-server` |
| 9 | `itwinjs-core/tools/ecschema2ts` |
| 10 | `itwinjs-core/editor/backend` |
| 11 | `itwinjs-core/editor/frontend` |
| 12 | `itwinjs-core/core/frontend-devtools` |
| 13 | `itwinjs-core/extensions/frontend-tiles` |
| 14 | `itwinjs-core/core/hypermodeling` |
| 15 | `itwinjs-core/domains/linear-referencing/backend` |
| 16 | `itwinjs-core/extensions/map-layers-formats` |
| 17 | `itwinjs-core/extensions/map-layers-auth` |
| 18 | `itwinjs-core/domains/physical-material/backend` |
| 19 | `itwinjs-core/presentation/backend` |
| 20 | `itwinjs-core/utils/workspace-editor` |

**仅替换（1 个）**

| # | 目录 |
|---|---|
| 1 | `itwinjs-core/extensions/cesium-renderer` |

## Layer 7-2 — 依赖 Layer 0~6（27发布 + 1仅替换）

**替换+发布（7 个）**

| # | 目录 |
|---|---|
| 1 | `appui/ui/components-react` |
| 2 | `reality-capture/typescript/packages/reality-data-client` |
| 3 | `imodels-clients/itwin-platform-access/imodels-access-frontend` |
| 4 | `imodels-clients/itwin-platform-access/imodels-access-backend` |
| 5 | `itwins-client` |
| 6 | `imodel-transformer/packages/transformer` |
| 7 | `viewer-components-react/packages/itwin/quantity-formatting` |

## Layer 8 — 依赖 Layer 0~7（4发布 + 2仅替换）

**替换+发布（4 个）**

| # | 目录 |
|---|---|
| 1 | `appui/ui/imodel-components-react` |
| 2 | `itwinjs-core/full-stack-tests/ecschema-rpc-interface` |
| 3 | `reality-capture/typescript/packages/reality-capture` |
| 4 | `itwinjs-core/full-stack-tests/rpc-interface` |

**仅替换（2 个）**

| # | 目录 |
|---|---|
| 1 | `imodels-clients/tests/imodels-access-backend-tests` |
| 2 | `imodels-clients/tests/imodels-access-frontend-tests` |

## Layer 9 — 依赖 Layer 0~8（2发布 + 0仅替换）

**替换+发布（3 个）**

| # | 目录 |
|---|---|
| 1 | `appui/ui/appui-react` |
| 2 | `presentation/packages/components` |
| 3 | `presentation/packages/testing` |

## Layer 10 — 依赖 Layer 0~9（10发布 + 1仅替换）

**替换+发布（5 个）**

| # | 目录 |
|---|---|
| 1 | `viewer/packages/modules/viewer-react` |
| 2 | `viewer-components-react/packages/itwin/geo-tools` |
| 3 | `viewer-components-react/packages/itwin/measure-tools` |
| 4 | `viewer-components-react/packages/itwin/property-grid` |
| 5 | `viewer-components-react/packages/itwin/tree-widget` |

**仅替换（1 个）**

| # | 目录 |
|---|---|
| 1 | `appui/apps/test-providers` |

## Layer 11 — 应用层：依赖链最深（2发布 + 0仅替换）

**替换+发布（2 个）**

| # | 目录 |
|---|---|
| 1 | `viewer/packages/modules/desktop-viewer-react` |
| 2 | `viewer/packages/modules/web-viewer-react` |

**仅替换（3 个）**

| # | 目录 |
|---|---|
| 1 | `viewer/packages/apps/desktop-viewer-test` |
| 2 | `viewer/packages/apps/web-viewer-test` |
| 3 | `itwinjs-core/test-apps/display-test-app` |
