# name-replacer 操作流程

品牌词替换工具链：提取 → 配置映射 → 预览 → 执行。

## 命令速查

| 步骤 | 命令 | 说明 |
|------|------|------|
| 1. 提取 | `node name-replacer/extract-brand-words.mjs` | 扫描全仓库，提取含 iTwin/iModel/Bentley 的标识符，输出 `brand-words.json` |
| 2. 配置 | `node name-replacer/server.mjs` | 启动 Web 配置界面 `http://localhost:3456`，调整替换映射后保存 |
| 3. 预览 | `node name-replacer/apply-replace.mjs --dry-run [--target <dir>]` | 预览哪些文件会被修改，不实际写入 |
| 4. 执行 | `node name-replacer/apply-replace.mjs [--target <dir>]` | 正式执行全文替换 |

---

## 详细说明

### 1. 提取品牌词

```bash
node name-replacer/extract-brand-words.mjs
```

- 递归扫描仓库中所有源码文件（`.ts/.tsx/.js/.jsx/.md/.json/.html/.css/.scss/.py/.sh` 等）
- 跳过 `node_modules`、`.git`、`dist`、`build`、`lib` 等目录
- 用正则匹配 iTwin（5 种大小写变体）、iModel（5 种）、Bentley（3 种）
- 输出 `name-replacer/brand-words.json`，包含：
  - `identifiers`：按品牌分组的唯一标识符列表（2090 个）
  - `mentions`：每次出现的文件、上下文、品牌标签
  - `summary`：扫描文件数、命中数等统计

可选参数：
- `--repo-root=<path>` 指定仓库根目录
- `--output=<path>` 指定输出路径

### 2. 配置替换映射

```bash
node name-replacer/server.mjs
```

- 启动本地 HTTP 服务，浏览器打开 `http://localhost:3456`
- 三个品牌卡片（iTwin / iModel / Bentley），每个可设置基准替换词
- 自动推导大小写变体（如 Twin → TWIN / Twin / twin / TWin …），每个变体可单独覆盖
- 「预览变更」按钮弹窗展示全部 2090 条映射，支持品牌筛选和搜索
- 保存后自动更新 `name-replacer/name-mapping.json`

### 3. 预览替换

```bash
# 全项目预览
node name-replacer/apply-replace.mjs --dry-run

# 仅预览指定文件夹
node name-replacer/apply-replace.mjs --dry-run --target packages/appui
```

- 读取 `name-mapping.json`，构建组合正则（`\b` 单词边界 + 最长优先排序）
- 遍历目标目录文件，打印会被修改的文件路径
- **不写入任何文件**
- `--target` 为项目根目录下的相对路径，不传则遍历全项目

输出示例：
```
映射规则: 2090 条
目标目录: D:\01Work\iTwin2026
模式: 仅预览 (--dry-run)

  packages/appui/src/SomeFile.ts
  packages/viewer/src/AnotherFile.tsx
  ...

扫描文件: 8521 | 替换文件: 342 | 耗时: 12.3s
(预览模式，未实际修改文件。去掉 --dry-run 参数以执行替换)
```

### 4. 执行替换

```bash
# 全项目替换
node name-replacer/apply-replace.mjs

# 仅替换指定文件夹
node name-replacer/apply-replace.mjs --target packages/appui
```

- 与预览逻辑完全相同，但会实际写入文件
- `--target` 用法同上
- 默认扫描目标目录下所有文件夹 + 所有扩展名；排除项统一由 `scan-exclude.json` 控制（目录 / 扩展名 / 文件名），真二进制（含 `\0`）和超 5MB 文件自动跳过
- 建议执行前先 `git stash` 或提交当前更改，以便回滚

### 5. 扫描排除配置（scan-exclude.json）

**默认行为：扫描指定目录下的所有文件夹 + 所有扩展名**。只有写进
`name-replacer/scan-exclude.json` 的目录 / 扩展名 / 文件名才会被排除。
`search-sensitive`、`search-ec`、`apply-replace`、`replace-staged` 共用这一份配置。

```json
{
  "dirs":  ["node_modules", ".git", "**/common/temp", ".claude*"],
  "exts":  [".png", ".woff2", "*.zip"],
  "files": ["pnpm-lock.yaml", "*-mapping.json"]
}
```

- `dirs` / `files` 不含 `/` 时按名称匹配，含 `/` 时按相对扫描根的路径匹配；支持 `*` / `**` / `?`
- `exts` 写法支持 `"png"` / `".png"` / `"*.PNG"`，统一按小写 `.png` 匹配
- 配置文件缺失时：**不排除任何内容**
- 兜底保护（不受配置影响）：文件 > 5MB 或前 4KB 含 `\0` 字节自动跳过，防止误读真二进制文件
- 搜索脚本可用 `--include-dirs dist` / `--include-ext svg` 强制放行被排除的目录 / 扩展名

需要恢复旧行为（常见二进制扩展名全跳过）可填入：

```json
[".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".bmp", ".webp", ".woff", ".woff2", ".ttf", ".eot", ".otf", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".tar", ".gz", ".7z", ".rar", ".bz2", ".exe", ".dll", ".so", ".dylib", ".bin", ".dat", ".db", ".sqlite", ".mp3", ".mp4", ".avi", ".mov", ".webm", ".wav", ".ogg", ".wasm", ".node"]
```

---

## 附：分阶段替换

全量替换风险大，推荐按依赖关系分批次执行。用户自行规划替换顺序，每批验证通过后再继续。

`replace-staged` 的内容替换与目录改名同样默认覆盖目标下的**所有文件夹和所有扩展名**，
排除项只来自 `scan-exclude.json`（与两个搜索脚本共用）。

### 用法

```bash
# 用 targets.json 指定分批替换顺序
node name-replacer/replace-staged.mjs --targets name-replacer/targets.json

# 预览模式
node name-replacer/replace-staged.mjs --targets name-replacer/targets.json --dry-run

# 跳过 Rush 清空（重新运行时保留 rush.json）
node name-replacer/replace-staged.mjs --targets name-replacer/targets.json --no-clear-rush

# 快速替换单个目录
node name-replacer/replace-staged.mjs --dir itwinjs-core/core/bentley --dir appui/ui/core-react
```

### targets.json 格式

```json
[
  { "dirs": ["itwinjs-core/core/bentley"], "note": "基础层 — 无内部依赖" },
  { "dirs": ["itwinjs-core/core/frontend", "appui/ui/core-react"], "note": "依赖基础层" }
]
```

每批（数组元素）内的 `dirs` 会被一起替换，替换完后建议 build + test 验证，然后继续下一批。

### 建议流程

1. 用 `extract-dep-graph.mjs` + `dep-graph.html` 分析依赖关系
2. 按依赖层（无依赖 → 深层依赖）规划 targets.json
3. `--dry-run` 预览 → 执行 → build/test → 下一批

---

## 附：语义级重命名（generate-name-map.mjs）

```bash
node generate-name-map.mjs
```

这是一个**独立工具**，比品牌词替换范围更大——它重命名所有语义化标识符（不只是品牌词）：

- 剥离注释和字符串字面量后提取 class / interface / enum / type / function / variable
- 基于内置语义映射表替换通用词（如 `backend→server`、`render→draw`、`manager→coordinator`）
- 每种标识符类型追加后缀（class→Object, interface→Contract, enum→Choices…）
- 文件名也参与重命名
- 冲突检测 + 自动变体名（Amber/Beryl/Cobalt… 轮转）
- 输出 `name-map.json`

⚠️ 此工具与品牌词替换**独立运行**，互不影响。产出的 `name-map.json` 需人工审查后再用。
