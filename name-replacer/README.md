# name-replacer — 品牌词替换工具链

扫描源码中的品牌词 → 合并词表 → Web 配置替换映射 → 分阶段替换 / 发包 / 测试。

## 工具链

```text
search-ec.mjs / search-sensitive.mjs
        │  --concise -o *.json
        ▼
  ec-result.json / result.json
        │  merge-ids.mjs
        ▼
     all-ids.json
        │  replace-server.mjs（Web UI）
        ▼
  name-replacer/all-ids-mapping.json
        │  merge-mapping.mjs（可选）
        ▼
   all-mapping.json / name-mapping.json
        │  replace-staged.mjs
        ▼
  内容替换 → 目录改名 → 构建 → 发布 → 安装测试
```

## 两种使用方式

- **快速方式**：一条命令完成搜索、合并并打开配置界面
- **完整流程**：逐步执行每个环节，适合自定义参数、复用已有结果或只跑部分步骤

---

## 快速方式：一键启动

```bash
node name-replacer/start-ui.mjs
```

自动执行：

1. `search-sensitive.mjs` → `result.json`
2. `search-ec.mjs` → `ec-result.json`
3. `merge-ids.mjs` → `all-ids.json`
4. 启动 `replace-server.mjs`，并自动打开 `http://localhost:3457`

**一键启动只做到这里：停在「第 3 步：配置替换映射」的 Web 界面。**
它不会替你保存映射，也不会执行任何代码替换或发包。

之后需要手动继续：

1. 在网页里配置替换词，点击「保存并更新映射表」
   → 生成 `name-replacer/all-ids-mapping.json`
2. （可选）合并映射：
   ```bash
   node name-replacer/merge-mapping.mjs
   ```
3. 先处理 bim 文件格式词：
   ```bash
   node name-replacer/replace-bim.mjs --targets name-replacer/targets.json
   ```
4. 分阶段替换、构建、发包、安装测试：
   ```bash
   node name-replacer/replace-staged.mjs --targets name-replacer/targets.json
   ```

如果只想做内容替换、不构建/发包，第 4 步可改用 `apply-replace.mjs`。

常用参数：

```bash
# 指定搜索目录（可重复）
node name-replacer/start-ui.mjs -d ./itwinjs-core

# 按 targets.json 的目录提取（stages[].dirs + replaceOnly）
# 省略路径时用 name-replacer/targets.json；可与 -d 叠加
node name-replacer/start-ui.mjs --targets

# 指定敏感词文件和端口
node name-replacer/start-ui.mjs --words-file base-words.json -p 3458

# 不重复搜索，直接用已有的 all-ids.json
node name-replacer/start-ui.mjs --skip-search

# 指定合并词表，不打开浏览器
node name-replacer/start-ui.mjs --input all-ids.json --no-open

# search-ec 启用融合词匹配
node name-replacer/start-ui.mjs --fused
```

默认搜索整个仓库根目录；`--targets` 时只扫描 targets 里列出的目录（多个目录会逐个扫描后合并）。生成文件写在仓库根目录。

> 一键方式使用默认目录、输出文件和端口。需要自定义每一步、复用已有结果或只执行部分步骤时，使用下面的完整流程。

---

## 完整流程（分步执行）

以下每一步都可以单独运行，按需组合。

### 命令速查

| 步骤 | 工具 | 说明 | 详细文档 |
|------|------|------|---------|
| 1. 搜索 | `search-sensitive.mjs` / `search-ec.mjs` | 扫描标识符，输出 `result.json` / `ec-result.json` | [search-sensitive.md](search-sensitive.md) / [search-ec.md](search-ec.md) |
| 2. 合并词表 | `merge-ids.mjs` | 多个搜索结果合并成 `all-ids.json` | [merge-ids.md](merge-ids.md) |
| 3. 配置映射 | `replace-server.mjs` | Web UI 配置替换词，生成 `*-mapping.json` | [replace-server.md](replace-server.md) |
| 4. 合并映射 | `merge-mapping.mjs` | 把多份映射合并成一份总表（可选） | [merge-mapping.md](merge-mapping.md) |
| 5. bim 词族 | `replace-bim.mjs` | 先处理 `.bim` / `ibim` / `bims` 等文件格式词，再发包 | 本文 |
| 6. 分阶段替换 | `replace-staged.mjs` | 替换 + 构建 + 发包 + 安装测试（推荐） | [replace-staged.md](replace-staged.md) |
| 7. 直接替换 | `apply-replace.mjs` | 只做内容替换和目录改名 | 本文 |

完整执行顺序见 [replace-programm-use.md](replace-programm-use.md)。

---

### 1. 搜索标识符

```bash
# 敏感词：iTwin / iModel / Bentley / DGN / 产品名等
node name-replacer/search-sensitive.mjs \
  -d . --words-file base-words.json --concise -o result.json

# EC / ECSchema 等前缀词
node name-replacer/search-ec.mjs \
  -d . --concise -o ec-result.json
```

- 默认扫描 `-d` 下**所有目录、所有扩展名**，排除项由 `scan-exclude.json` 控制
- `--concise` 只输出标识符和统计，不生成替换后文件
- `--include-dirs` / `--include-ext` 可临时放行被排除的目录 / 扩展名

### 2. 合并词表

```bash
node name-replacer/merge-ids.mjs ec-result.json result.json -o all-ids.json
```

- 支持合并任意多个搜索结果
- `identifiers` 无论是数组还是按词分组的对象都能识别
- 合并结果供 `replace-server` 使用

### 3. 配置替换映射

```bash
node name-replacer/replace-server.mjs --input all-ids.json
# 浏览器打开 http://localhost:3457
```

- **单词模式**：输入文件只有一个词，或使用 `--word` 指定
- **多词模式**：一次配置全部词，保存时生成逐词链式替换的合并映射
- 输出：
  - 映射表：`name-replacer/all-ids-mapping.json`
  - 配置：`name-replacer/replace-server-config.json`
- 保存是**整体覆盖**，不是追加；确认/忽略结果保存在配置文件的 `_manual` / `_manualTokens` / `_manualSkip`

### 4. 合并映射（可选）

```bash
# 默认：base-mapping.json + all-ids-mapping.json → 根目录 all-mapping.json
node name-replacer/merge-mapping.mjs

# 合并任意多个文件，后面的文件优先
node name-replacer/merge-mapping.mjs base.json extra.json -o all-mapping.json

# 合并进已有总表，保留目标独有条目
node name-replacer/merge-mapping.mjs --into all-mapping.json base.json extra.json
```

### 5. 上下文感知的 bim 词族（replace-bim）

只替换文件后缀 / 扩展名 / 格式字面量相关的 `bim`、`ibim`、`bims`，
不会替换普通标识符、路径段或中文语境里的 `bim`：

```bash
node name-replacer/replace-bim.mjs --dry-run --targets name-replacer/targets.json
node name-replacer/replace-bim.mjs --targets name-replacer/targets.json
```

**必须在 `replace-staged` 之前运行**，这样构建、发包出去的包里已经是 `.dtw` / `.idtw`。
等包发完再替换就晚了。

### 6. 分阶段替换、发包与测试

```bash
# 复制示例后按依赖顺序修改
cp name-replacer/targets.example.json name-replacer/targets.json

# 预览
node name-replacer/replace-staged.mjs \
  --targets name-replacer/targets.json --dry-run

# 正式执行（替换 + 构建 + 发布 + 安装测试）
node name-replacer/replace-staged.mjs \
  --targets name-replacer/targets.json

# 指定 registry（默认 http://localhost:4873/）
node name-replacer/replace-staged.mjs \
  --targets name-replacer/targets.json \
  --registry http://192.168.1.10:4873/

# 只替换，不安装 / 构建 / 发布 / 测试
node name-replacer/replace-staged.mjs \
  --targets name-replacer/targets.json --replace-only
```

`targets.json` 支持两种格式：

```json
[
  { "dirs": ["base/units-schema"], "note": "第 1 批" }
]
```

```json
{
  "registry": "http://localhost:4873/",
  "stages": [
    { "dirs": ["appui/ui/core-react"], "replaceOnly": ["appui/ui/appui-react"], "note": "第 2 批" }
  ]
}
```

- `dirs`：替换内容并发布
- `replaceOnly`：只替换内容，不发布
- `note`：批次说明
- registry 优先级：`--registry` > targets 顶层 `registry` > `REPLACE_STAGED_REGISTRY` > 默认 localhost
- 常用开关：`--no-build`、`--no-publish`、`--no-test`、`--no-clear-rush`
- 只替换：`--replace-only`（不安装、不构建、不发布、不测试，不清空 `rush.json`、
  不改 `.npmrc`、不启动 Verdaccio）；只跳过安装用 `--no-install`
- 目标目录不存在会明确提示并跳过；所有目标都不存在时不会执行后续全局改名
- 批次划分可参考 [dep-layers.md](dep-layers.md)

### 7. 直接内容替换（apply-replace）

只做替换、不构建/发布时使用：

```bash
# apply-replace 固定读取 name-mapping.json
cp name-replacer/all-ids-mapping.json name-replacer/name-mapping.json

# 预览
node name-replacer/apply-replace.mjs --target appui --dry-run

# 执行
node name-replacer/apply-replace.mjs --target appui

# 按 targets.json 的目录替换（stages[].dirs + replaceOnly）
node name-replacer/apply-replace.mjs --targets --dry-run
node name-replacer/apply-replace.mjs --targets
```

- `--target` 可重复；`--targets [file]` 从 targets.json 读取目录（省略路径时用
  `name-replacer/targets.json`），可与 `--target` 叠加，嵌套目录自动去重
- 两者都不传时扫描整个仓库
- 映射表固定读取 `name-replacer/name-mapping.json`
- `replace-staged.mjs` 内部调用的就是它
- 扫描范围与排除项同样来自 `scan-exclude.json`

### 8. 扫描排除配置（scan-exclude.json）

`search-sensitive`、`search-ec`、`apply-replace`、`replace-staged`、`replace-bim`
共用这一份配置。

```json
{
  "dirs": ["node_modules", ".git", "**/common/temp", "name-replacer", "dist", "build", "lib"],
  "includeDirs": ["base/icons-generic-webfont/dist"],
  "exts": [".png", ".woff2", ".zip", ".map"],
  "files": ["pnpm-lock.yaml", "*-mapping.json", "targets.json"]
}
```

- `dirs` / `files` 不含 `/` 时按名称匹配，含 `/` 时按相对路径匹配；支持 `*` / `**` / `?`
- `includeDirs` 是目录白名单，命中后无视 `dirs` 规则强制进入
- `exts` 支持 `"png"`、`".png"`、`"*.PNG"`，统一按小写匹配
- 配置文件缺失时**不排除任何内容**
- 兜底保护：文件 > 5MB 或前 4KB 含 `\0` 时自动跳过
- 搜索脚本可用 `--include-dirs` / `--include-ext` 临时放行

### 9. 基础替换词保护（protected-words）

已经定稿的新词不能再被当成品牌词提取或替换。例如 `szewec`（bentley 的替换词）
里含 `ec`，如果不保护，`szewEC` / `SzewECSchema` 会被 search-ec 当成 EC 提取，
replace-server 再按 EC→dm 生成映射就会得到 `szewdm` 这种脏数据。

保护词来源（自动读取，缺失时跳过）：

| 来源 | 说明 |
|------|------|
| `base-mapping.json` | 所有值（去掉 `$` 前缀），如 `szewec`、`dmschema`、`iVaultId` |
| `replace-server-config.json` | 各搜索词的 `baseName`，如 `szewtwin`、`bld`、`ivault` |
| `exclude-list.json` | 人工排除的标识符（如 `CorEcA`） |
| `protected-words.json` | 可选，手工补充；示例见 `protected-words.example.json`，需要时 `cp` 过去再填 |

生效范围：

- `search-ec` / `search-sensitive`：命中落在受保护串内部时**不报告**；
  同一标识符若还有不受保护的命中仍会保留（如 `szewEC_ECClass`）
- `replace-server`：生成映射时先把受保护串藏起来，所有词规则跑完再还原，
  已替换的部分不会被后续词二次改写（`szewEC_ECClass → szewEC_DMClass`）

无需额外参数，默认生效。查看当前生效的保护词：

```bash
node name-replacer/protected-words.mjs          # 表格：词 + 来源
node name-replacer/protected-words.mjs --json   # 机器可读
node name-replacer/protected-words.mjs --out protected-words.generated.json  # 导出快照
```

配置方式、验证命令和常见问题见 [protected-words.md](protected-words.md)。

### 10. 保护区域（protected-files）

密码保护、授权校验这类代码不能改名。`protected-files.json` 支持两种保护区域：

- `files`：整份文件
- `snippets`：文件里的一段代码（直接贴原文）

两种区域都是：**本来会被提取出来的标识符**不报告（`search-ec` / `search-sensitive`）；
这些被排除的标识符在其他文件里也不再提取——否则同名代码在别处被提取、替换后，
保护区域里的代码照样会改掉。

```bash
cp name-replacer/protected-files.example.json name-replacer/protected-files.json
```

```json
{
  "files": [
    "itwinjs-core/core/backend/src/PasswordProtection.ts",
    { "path": "base/units-schema/src/license/", "note": "整目录保护" }
  ],
  "snippets": [
    "return {...from, baseUri: `${process.env.OBJECT_STORAGE_URL ?? \"http://10.0.19.202:9000\"}/${from.accountName}`, accessToken: from.sasToken }",
    { "text": "const KEY = decrypt(ECLicense);", "note": "授权校验片段" }
  ]
}
```

- `files` 每条是一个路径：直接写路径字符串，需要备注时写 `{ "path", "note" }`
- 路径相对仓库根目录，也支持绝对路径；不含 `/` 时按文件名匹配；支持 `*` / `**` / `?`；
  目录条目保护整个目录；精确路径与 `-d` 无关，多目录分段扫描时依然全局生效
- `snippets` 每条是一段代码原文（不需要和源码逐字符一致）：先收集片段里的候选标识符，
  再用当前搜索规则筛（`search-ec` 按 EC 分词、`search-sensitive` 按搜索词），
  **只有本来会被提取的词**才排除——片段里的 `minio`、`azure`、`from` 不会进保护名单
- 标识符按「完整标识符、大小写不敏感」匹配：`ECSecretKey` 会排除 `ecsecretkey`，
  但不影响 `ECSecretKeyExtra`
- 临时关闭：`--no-protected-files`；换配置：`--protected-files <path>`
- ⚠️ 只管提取阶段：`base-mapping.json` 里已有的映射或子串替换仍可能改到它；
  需要连替换一起跳过时用 `exclude-list.json` 的 `{ "text": "...", "paths": ["..."] }`

验证当前生效的保护区域：

```bash
node name-replacer/protected-files.mjs          # 表格：保护区域概况
node name-replacer/protected-files.mjs --json   # 机器可读
```

详细说明见 [protected-files.md](protected-files.md)。

## 注意事项

1. 替换前先提交或 `git stash`，确保可以回滚
2. 正式执行前先跑 `--dry-run`
3. `replace-server` 保存映射表是整体覆盖；需要保留旧条目时用 `merge-mapping.mjs --into`
4. `apply-replace` 固定读取 `name-replacer/name-mapping.json`
5. `replace-staged` 的 targets 路径必须是当前磁盘上真实存在的目录
6. `scan-exclude.json` 已排除常见的搜索结果、映射表和 `targets.json` 等生成文件；新增的生成文件记得补进 `files`

## 文档索引

- [replace-programm-use.md](replace-programm-use.md) — 完整执行顺序
- [search-sensitive.md](search-sensitive.md) / [search-ec.md](search-ec.md) — 搜索参数
- [merge-ids.md](merge-ids.md) — 合并词表
- [replace-server.md](replace-server.md) — Web 配置界面
- [merge-mapping.md](merge-mapping.md) — 映射表合并
- [replace-staged.md](replace-staged.md) — 分阶段替换、发包、测试
- [protected-words.md](protected-words.md) — 基础替换词保护（使用说明、配置、验证）
- [protected-files.md](protected-files.md) — 保护区域（保护文件 / 代码片段，不参与提取）
- [replace-flow-training.html](replace-flow-training.html) — 流程培训演示网页（浏览器打开，含命令与参数说明）
- [dep-layers.md](dep-layers.md) — 依赖分层参考
