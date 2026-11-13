# replace-staged — 分阶段替换、发包与验证

按依赖顺序分批替换品牌词，每批替换后立即安装、构建、发布到 registry，最后从
registry 重新安装并跑测试。适用于 Rush / pnpm / yarn / npm 工作区。

> ⚠️ 该脚本会**直接修改仓库文件、目录名、`rush.json`、`.npmrc`、锁文件并发布包**。
> 执行前请先提交或 `git stash`，确认可以回滚。

---

## 工作流程

```
targets.json
   │
   ▼
┌─ 每一批 ──────────────────────────────────────────────┐
│ 1. 内容替换 + 叶子目录改名（applyReplacements）        │
│ 2. Rush: 清空/累加 rush.json，同步路径                 │
│ 3. 检查 registry 可用 + 写入 .npmrc                    │
│ 4. Rush: rush update --full + rush build               │
│ 5. 发布本批包（rush / pnpm / yarn / 独立项目）         │
└───────────────────────────────────────────────────────┘
   │
   ▼
┌─ 所有批次之后 ────────────────────────────────────────┐
│ 6. 重命名剩余含品牌词的中间目录                        │
│ 7. rush.json 最终同步                                  │
│ 8. 生成 targets-replaced.json                          │
│ 9. pnpm/yarn: 全量 install → build → publish           │
│ 10. 从 registry 重新安装 + 测试（消费方视角）          │
└───────────────────────────────────────────────────────┘
```

`--dry-run` 只执行第 1 步的扫描/预览，不写文件、不发布、不安装。

---

## 快速开始

```bash
# 1. 复制示例配置并按依赖关系修改
cp name-replacer/targets.example.json name-replacer/targets.json

# 2. 预览（不修改任何文件）
node name-replacer/replace-staged.mjs \
  --targets name-replacer/targets.json --dry-run

# 3. 正式执行（默认发布 + 构建 + 测试）
node name-replacer/replace-staged.mjs \
  --targets name-replacer/targets.json

# 4. 指定 registry（默认 http://localhost:4873/）
node name-replacer/replace-staged.mjs \
  --targets name-replacer/targets.json \
  --registry http://192.168.1.10:4873/

# 5. 快速替换单个目录（单批，不带 --targets）
node name-replacer/replace-staged.mjs \
  --dir appui/ui/core-react --dir appui/ui/components-react --dry-run

# 6. 只替换、不安装/构建/发布/测试
node name-replacer/replace-staged.mjs \
  --targets name-replacer/targets.json --replace-only
```

---

## 参数

| 参数 | 说明 |
|------|------|
| `--targets <file>` | 批次配置文件；与 `--dir` 同时出现时**只用 targets** |
| `--dir <path>` | 单批快速执行，可重复；没有 `--targets` 时才生效 |
| `--registry <url>` | 发布目标 registry，默认 `http://localhost:4873/` |
| `--publish-url <url>` | `--registry` 的别名 |
| `--publish-registry <url>` | `--registry` 的别名 |
| `--dry-run` | 只预览替换结果，不写文件、不发布、不安装、不测试 |
| `--replace-only` | **只替换**：不安装、不构建、不发布、不测试；不清空 `rush.json`、不改 `.npmrc`、不启动 Verdaccio |
| `--no-install` | 跳过所有 install（`rush update` / `pnpm install` / `yarn install`），且不清空 `rush.json`；其余步骤按参数执行 |
| `--no-build` | 跳过构建（仍安装、发布） |
| `--no-publish` | 跳过发布（替换、安装、构建、测试仍执行） |
| `--no-test` | 跳过最后的重新安装 + 测试 |
| `--no-clear-rush` | 不清空 `rush.json`，适合重复运行/续跑 |

`--registry` 也支持 `--registry=<url>`，可省略协议（`localhost:4873` 自动补 `http://`），
只接受 http/https。

---

## Registry 配置

优先级从高到低：

1. 命令行 `--registry <url>`
2. `targets.json` 顶层 `"registry"`
3. 环境变量 `REPLACE_STAGED_REGISTRY`
4. 默认 `http://localhost:4873/`

该地址会用于：

- `npm publish --registry`
- `npm dist-tag add ... rc --registry`
- registry 可用性检测
- 项目 `.npmrc`：**显式配置自定义 registry 时**，同步全局 `registry=` 和已有的
  `@scope:registry=` 行；Rush 项目还会补齐 `@iproject` / `@szew`
  （默认 localhost 流程不额外改写 `.npmrc`）
- pnpm 元数据缓存清理（自动按 registry 的 host + port 定位，不再写死 `localhost+4873`）

启动时会打印 `Registry: ...`；发布时会打印实际目标地址。

---

## targets 文件格式

### 对象形式（推荐，可配置 registry）

```json
{
  "registry": "http://localhost:4873/",
  "stages": [
    {
      "dirs": [
        "base/bis-core-schema",
        "base/formats-schema"
      ],
      "note": "第 1 批：无内部依赖的基础包"
    },
    {
      "dirs": [
        "appui/ui/core-react",
        "appui/ui/components-react"
      ],
      "replaceOnly": [
        "appui/ui/appui-react"
      ],
      "note": "第 2 批：UI 基础包"
    }
  ]
}
```

### 数组形式（兼容旧文件）

```json
[
  { "dirs": ["base/bis-core-schema"], "note": "第 1 批" },
  { "dirs": ["appui/ui/core-react"], "note": "第 2 批" }
]
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `dirs` | 本批要**替换内容并发布**的目录 |
| `replaceOnly` | 只替换内容、**不发布**；仍会被加入 `rush.json` 作为 workspace 成员，也会参与目录改名 |
| `note` | 批次说明，运行时打印 |
| `registry` | 仅对象形式支持，发布目标 registry |

可直接复制 [`targets.example.json`](targets.example.json) 修改。

---

## 每批具体做什么

### 1. 内容替换与目录改名

对 `dirs` + `replaceOnly` 中每个目录调用 `applyReplacements()`：

- 按 `name-mapping.json` 替换文件内容
- 重命名目标目录内的**叶子目录**
- 扫描范围与排除项由 `scan-exclude.json` 控制

中间目录（如 `core/ecsql` → `core/dmsql` 这类不在 `dirs` 里的父目录）不在本步改名，
统一放到所有批次结束后处理。

### 2. Rush 项目处理

启动时（非 dry-run）会备份 `rush.json` 的原始 projects：

- 默认**清空** `rush.projects`；加 `--no-clear-rush` 则保留
- 每批处理完把本批包重新加入 `rush.json`
- 安装前同步 `rush.json` 路径，避免中间目录改名后找不到 `package.json`
- 删除旧锁文件和 `common/temp/last-install.flag`，然后 `rush update --full`
- 非 `--no-build` 时执行 `rush build`

### 3. Registry 与 .npmrc

- 检查 registry 是否可访问；不可访问直接退出（码 1）
- 写入/更新项目 `.npmrc`：
  - 显式配置自定义 registry 时，全局 `registry=` 和已有的 `@scope:registry=` 行指向它
  - Rush 项目补齐 `@iproject` / `@szew` scope
  - 追加 `minimumReleaseAge=0`
- 自定义 registry 下，非 Rush 项目在每批安装前也会先更新 `.npmrc`，
  保证安装和发布使用同一个 registry；默认 localhost 流程保持原行为

### 4. 发布

- **Rush**：本批包已构建，直接发布
- **pnpm / yarn workspace**：按包过滤安装、构建后发布
  （pnpm 用 `--filter`，yarn 用 `workspaces focus`）；
  同时同步 `pnpm-workspace.yaml` 的 catalog 键和 workspace 引用
- **独立项目**：按自身包管理器 install → build → publish

发布前会把 `workspace:*` / `catalog:` 等协议版本临时解析成固定版本，
发布完成后恢复原始 `package.json`。

发布命令为 `npm publish --registry <url>`；失败时打印「可能已存在，继续」并继续处理，
不会中断整个批次。发布后会补 `rc` dist-tag，并清理 pnpm 元数据缓存。

### 5. 所有批次之后

- 递归重命名所有剩余含品牌词的目录（自底向上）
- 最终同步 `rush.json`
- 生成 `targets-replaced.json`（保留数组/对象格式，替换其中的目录名）
- pnpm/yarn 工作区执行全量 install → build → publish
- 除非 `--no-test`，从 registry 重新安装并测试：
  - Rush：`rush update --full` + `rush test`
  - pnpm：`pnpm install --no-frozen-lockfile` + `pnpm -r test`

---

## 执行结果

每批结束后打印扫描/替换/重命名统计，最后输出汇总：

```
#  扫描   替换   重命名  项目              备注
─  ─────  ─────  ─────  ────────────────  ────
1     123     45      3  base, appui     第 1 批
2     456    120      5  appui           第 2 批
─  ─────  ─────  ─────
∑     579    165      8
```

- registry 不可用、安装或构建失败会立即 `process.exit(1)`
- 单个 `npm publish` 失败只打印「可能已存在，继续」，不会中断本批
- 测试失败只会在汇总后打印 `⚠ 部分失败，请检查后继续`，脚本仍以 0 退出

---

## 注意事项

1. **先备份/提交**：目录改名和文件替换不可自动回滚
2. **批次顺序按依赖规划**：无内部依赖的包先跑，被依赖的包先发布
3. **重复运行**：上次运行可能已改名部分目录，建议加 `--no-clear-rush`
4. **同一版本重复发布**：脚本会清理 pnpm 元数据缓存，但 registry 端仍可能拒绝覆盖；
   必要时升级版本号
5. **Windows EBUSY**：安装/构建失败会自动重试（3s / 6s / 9s 退避）
6. **Yarn**：检测到 yarn 工作区但本机没有 yarn 时，会尝试 `npm install -g yarn`
7. `--dry-run` 不修改任何文件，适合先确认每批会处理哪些目录
8. 生成的 `targets-replaced.json` 可用于下一次运行或核对替换后的路径

---

## 与其他工具的关系

| 工具 | 关系 |
|------|------|
| `apply-replace.mjs` | `replace-staged` 复用它做内容替换和叶子目录改名 |
| `name-mapping.json` | 品牌词映射来源，必须存在 |
| `scan-exclude.json` | 扫描排除配置，与搜索脚本共用 |
| `merge-mapping.mjs` | 可把多份映射合并成 `all-mapping.json` 后再复用 |
| `replace-bim.mjs` | 处理 bim 文件格式词；应在 `replace-staged` **之前**运行，确保发包时已是 `.dtw` / `.idtw` |
