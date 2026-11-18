# search-sensitive — 敏感词搜索工具

在指定目录中按词搜索，生成"词 × 文件"交叉表。参照 `extract-brand-words.mjs` 架构，支持任意词列表。

两维度搜索：
- **文件内容** — 子串匹配（默认）或标识符边界匹配（`--whole-word`）
- **路径名称** — 目录名/文件名语义分词匹配（默认启用）

## 快速开始

```bash
# 基本搜索
node name-replacer/search-sensitive.mjs -d <目录> -w "词1,词2,词3"

# 从文件读取搜索词（词多时不需手打）
node name-replacer/search-sensitive.mjs -d ./src --words-file sensitive-words.txt

# 文件 + 命令行合并
node name-replacer/search-sensitive.mjs -d ./src --words-file words.json -w "额外词"

# 仅搜索文件内容（跳过路径名称）
node name-replacer/search-sensitive.mjs -d ./src -w "dgn,DgnDb" --no-paths

# 导出简洁 JSON（仿 brand-words.json）
node name-replacer/search-sensitive.mjs -d ./src -w "dgn,DgnDb" --concise -o result.json

# 导出完整 JSON（含行号 + 上下文 + 路径匹配）
node name-replacer/search-sensitive.mjs -d ./src -w "dgn,DgnDb" -o result.json
```

## 搜索词文件（`--words-file`）

词少时用 `-w` 手打，词多时用文件管理，方便复用和版本控制。

### 文件格式

支持 **JSON**（推荐）和 **纯文本** 两种格式，每种都支持精确匹配标记。

#### JSON 格式（推荐，支持精确匹配）

```json
[
    "dgn",
    "itwin",
    "imodel",
    {"word": "Bentley", "exact": true},
    {"word": "OpenPlant", "exact": true},
    {"word": "MicroStation", "exact": true},
    {"word": "ProjectWise", "exact": true},
    {"word": "RAM", "exact": true},
    {"word": "STAAD", "exact": true},
    {"word": "SPPM", "exact": true},
    "OpenBridge",
    "OpenRoads",
    "OpenBuildings",
    "AutoPLANT",
    "ProStructures",
    "AECOsim",
    "Speedikon",
    "AutoPIPE",
    "Structural synchronizer"
]
```

- 普通字符串 `"dgn"` → 默认模式：生成全部大小写变体（`dgn`/`DGN`/`Dgn`/...）
- 对象 `{"word":"Bentley","exact":true}` → 精确模式：大小写不敏感字面匹配（`Bentley`/`bentley`/`BENTLEY`），不生成变体

#### 纯文本格式（`.txt`）

```bash
# 品牌词（精确匹配 - 大小写敏感）
!Bentley
!MicroStation
!ProjectWise
!RAM
!STAAD
!SPPM
!OpenPlant

# 通用词（默认匹配 - 忽略大小写）
dgn
itwin
imodel
OpenBridge
OpenRoads
AutoPLANT
Structural synchronizer
```

- `#` 开头 = 注释，跳过
- `!` 前缀 = 精确匹配（大小写敏感）
- 无前缀 = 默认匹配（大小写不敏感）
- 逗号/分号分隔也支持：`dgn, itwin, imodel`

### 完整示例

创建 `sensitive-words.json`：

```json
[
    "dgn",
    "itwin",
    "imodel",
    {"word": "Bentley", "exact": true},
    {"word": "MicroStation", "exact": true},
    {"word": "ProjectWise", "exact": true},
    {"word": "OpenPlant", "exact": true},
    {"word": "RAM", "exact": true},
    {"word": "STAAD", "exact": true},
    {"word": "SPPM", "exact": true},
    "OpenBridge",
    "OpenRoads",
    "OpenBuildings",
    "AutoPLANT",
    "ProStructures",
    "AECOsim",
    "Speedikon",
    "AutoPIPE",
    "Structural synchronizer"
]
```

使用：

```bash
node name-replacer/search-sensitive.mjs \
  -d ./itwinjs-core \
  --words-file sensitive-words.json \
  --concise -o result.json
```
dgn
DgnDb
openDgnDb
dgn_View
DgnCore
```

## 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-w, --words <list>` | 搜索词，逗号/分号分隔（可多次指定） | 无 |
| `--words-file <path>` | 从文件读取搜索词 | 无 |
| `-d, --dir <path>` | 搜索目录 | `.` |
| `-o, --output <path>` | JSON 输出文件路径 | 无（不写文件） |
| `--json` | 终端输出 JSON（不显示表格） | 关闭 |
| `--concise` | 简洁 JSON（仅标识符列表 + 计数） | 关闭 |
| `--whole-word` | 仅匹配标识符边界 | 关闭（子串匹配） |
| `--no-paths` | 禁用路径名称搜索（仅搜索文件内容） | 关闭（默认启用） |
| `--ext <exts>` | 只扫描这些扩展名，逗号分隔 | 全部扩展名 |
| `--ext-file <path>` | 从文件读取扩展名列表（与 `--ext` 等效，二者并用时合并） | 无 |
| `--include-ext <exts>` | 强制包含被配置排除的扩展名（如 `svg`） | 无 |
| `--include-dirs <names>` | 强制进入被配置排除的目录（如 `dist,lib`） | 无 |
| `--context <n>` | 上下文字符数 | `40` |
| `--limit-files <n>` | 终端详情最多显示文件数 | `200` |

## 基础替换词保护（自动生效）

已经定稿的新词内部不再命中搜索词，避免把替换结果再当成品牌词提取：
`base-mapping.json` 的值、`replace-server-config.json` 的 `baseName`、
`exclude-list.json` 的条目自动加入保护；额外的手工保护词写在
`name-replacer/protected-words.json`（可选，数组或 `{ "words": [...] }`）。

例如搜索 `ec` 时，`szewec`、`szewEC` 不再命中；但 `szewecBentley` 里的
`Bentley` 仍会正常命中（只跳过受保护片段内部的命中）。

## 保护区域（自动生效）

`name-replacer/protected-files.json` 支持两种保护区域，命中的标识符不参与提取：

- `files`：整份文件（密码保护模块等）
- `snippets`：文件里的一段代码（直接贴原文）

`files` 整份不提取；`snippets` 只排除片段里**会被当前搜索词命中**的标识符
（搜 `Bentley` 时只排除片段里的 Bentley 相关词，其它词不受影响）。
被排除的标识符在其他文件里也不再提取——否则同名代码在别处被替换后，
保护区域里的代码会跟着改掉。

```bash
# 查看当前生效的保护区域
node name-replacer/protected-files.mjs

# 临时关闭 / 指定其他配置
node name-replacer/search-sensitive.mjs -d . -w "EC" --no-protected-files
node name-replacer/search-sensitive.mjs -d . -w "EC" --protected-files my.json
```

写法与匹配规则见 [protected-files.md](protected-files.md)。

## 排除配置与覆盖

默认扫描指定目录下的**所有文件夹 + 所有扩展名**。排除项只来自
`name-replacer/scan-exclude.json`（与 `search-ec`、`apply-replace`、`replace-staged` 共用）：

```json
{
  "dirs":  ["node_modules", ".git", "**/common/temp", ".claude*"],
  "exts":  [".png", ".woff2", "*.zip"],
  "files": ["pnpm-lock.yaml", "*-mapping.json"]
}
```

- 不含 `/` 的条目按名称匹配，含 `/` 的按相对扫描根的路径匹配；支持 `*` / `**` / `?`
- 配置文件缺失时**不排除任何内容**
- 兜底保护：文件 > 5MB 或前 4KB 含 `\0` 字节（二进制）自动跳过

覆盖方式：

```bash
# svg 在 dist 里，两者都被配置排除 → 用两个开关强制扫描
node name-replacer/search-sensitive.mjs \
  -d ./base \
  --words-file base-words.json \
  --include-ext svg --include-dirs dist \
  --concise -o complements.json

# 显式 --ext：只扫描指定扩展名（其余扩展名一律不看）
node name-replacer/search-sensitive.mjs -d ./base -w "bentley" --ext svg,woff

# 扩展名列表放文件里维护（--ext-file，与 --ext 等效）
node name-replacer/search-sensitive.mjs \
  -d ./base \
  --words-file base-words.json \
  --ext-file base-exts.json \
  --include-dirs dist \
  --concise -o complements.json
```

覆盖信息会打印在 stderr（`🔓 排除规则覆盖: ...`）并记入输出 JSON 的 `summary.skipOverrides`。

## 扩展名文件（`--ext-file`）

扩展名列表放文件维护，适合组合多来源扩展名、避免命令行过长。支持与 `--words-file` 相同的三种格式：

#### JSON 数组（推荐）

```json
[
    "ts",
    "tsx",
    "js",
    "svg"
]
```

#### JSON 对象

```json
{
    "extensions": ["ts", "tsx", "js", "svg"]
}
```

（`exts` 键也识别）

#### 纯文本

```bash
# 注释行
ts
tsx
js, svg
```

- 条目带不带前导点均可（`svg` / `.svg` 等价），统一归一化为小写 + 前导点
- **替换**默认的「全部扩展名」为包含白名单（等效 `--ext`）
- 与 `--ext` 并用时取**并集**；`--include-ext` 在两者之上继续追加
- 读取信息打印在 stderr（`📋 从文件读取扩展名: ...`），来源记入 `summary.skipOverrides.extFile`

### 默认扫描范围（scan-exclude.json）

未指定 `--ext` / `--ext-file` 时扫描**所有扩展名**。排除项来自
`name-replacer/scan-exclude.json` 的 `dirs` / `exts` / `files` 三段（见上）；
文件缺失时不排除任何内容。

## 匹配规则

### 文件内容匹配

- **默认**：大小写不敏感 + 子串匹配。通过生成全部大小写变体（2^n 种）做精确匹配，而非简单 `/i` 正则。
- `--whole-word`：仅在标识符边界匹配（前后不是 `a-z/A-Z/0-9/_/$`）。
- 搜索词 `dgn` 默认会匹配 `DgnDb`、`openDgnDb`、`ECSchemas/Dgn/`、`dgn_View` 等一切包含该子串的内容。

### 路径名称匹配

目录名/文件名先去扩展名 → `.` 和 `-` 替换为 `_` → 语义分词 → 对每个 token 做子串匹配：

| 路径 | 搜索词 | 分词结果 | 匹配？ |
|------|--------|---------|--------|
| `dgn-core/` | `dgn` | `["dgn","core"]` | ✅ 目录名 |
| `my-dgn-utils.ts` | `dgn` | `["my","dgn","utils"]` | ✅ 文件名 |
| `iModelHub.ts` | `iModel` | `["iModel","Hub"]` | ✅ 文件名 |
| `project/` | `ec` | `["project"]` | ❌ 无 token 匹配 |
| `AEC-proj/` | `ec` | `["AEC","proj"]` | ❌ AEC 是整体，ec 不是独立 token |

## 输出模式

### 1. 终端表格（默认）

上层交叉表 + 下层逐行详情 + 路径名称匹配：

```
File                                    │    dgn │  DgnDb │ openDgnDb
────────────────────────────────────────┼────────┼────────┼──────────
IModelDb.ts                             │     23 │     20 │         9
BriefcaseManager.ts                     │      4 │      4 │         2
...
TOTAL                                   │225(36f)│ 65(18f)│    26(6f)

📄 IModelDb.ts
   dgn         L  589:26165 │ public readonly [_nativeDb]: IModelJsNative.DgnDb;
   DgnDb       L  589:26165 │ public readonly [_nativeDb]: IModelJsNative.DgnDb;
   openDgnDb   L 1613:74391 │ public static openDgnDb(...);

📁 路径名称匹配 (语义分词)
──────────────────────────────────────────────────────────────────────
📂 目录名匹配 (3 个):
   core/dgn-core/                   → 词: dgn  分词: [dgn, core]
   ...

📄 文件名匹配 (5 个):
   core/common/src/DgnDb.ts         → 词: DgnDb  分词: [Dgn, Db]
   ...
```

### 2. 完整 JSON（`-o` 或 `--json`）

```json
{
  "generatedAt": "2026-07-27T...",
  "searchDir": "...",
  "summary": {
    "filesScanned": 306,
    "filesWithMatches": 36,
    "totalMatches": 323,
    "pathMatches": { "total": 8, "directories": 3, "fileNames": 5 }
  },
  "byWord": {
    "dgn": { "count": 225, "files": 36, "matches": [ { "file": "...", "line": 589, "col": 47, "matched": "Dgn", "context": "..." }, ... ] }
  },
  "identifiers": ["DgnDb", "openDgnDb", ...],
  "pathMatches": [
    { "path": "core/dgn-core/", "type": "directory", "name": "dgn-core", "matchedWord": "dgn", "matchedToken": "dgn" }
  ]
}
```

### 3. 简洁 JSON（`--concise`）

同 `brand-words.json` 结构：

```json
{
  "generatedAt": "2026-07-27T...",
  "searchDir": "...",
  "summary": {
    "totalFilesScanned": 306,
    "totalUniqueIdentifiers": 30,
    "filesWithMatches": 36,
    "byWord": { "dgn": 21, "DgnDb": 4 }
  },
  "identifiers": {
    "dgn": ["DGN","DgnCore","DgnDb","DgnDbWorker","dgn_View","openDgnDb", ...],
    "DgnDb": ["DgnDb","DgnDbWorker","openDgnDb","openDgnDbStub"]
  },
  "pathMatches": {
    "total": 8,
    "directories": ["core/dgn-core/", "core/dgn-backend/", ...],
    "fileNames": ["core/common/src/DgnDb.ts", ...]
  }
}
```

## 常用场景

### DGN 相关全貌

```bash
node name-replacer/search-sensitive.mjs \
  -d itwinjs-core/core/backend/src \
  -w "dgn,DgnDb,openDgnDb,dgn_View,DgnCore,dgnBoundaryType"
```

### 从文件读取大量搜索词

```bash
# 准备好敏感词列表文件
cat > dgn-words.txt << 'EOF'
# DGN 相关
dgn
DgnDb
openDgnDb
dgn_View
DgnCore
dgnBoundaryType
DgnCategory
DgnElement
EOF

# 一行命令搞定
node name-replacer/search-sensitive.mjs \
  -d itwinjs-core \
  --words-file dgn-words.txt
```

### 品牌词残留检查

```bash
node name-replacer/search-sensitive.mjs \
  -d ../NameReplaceTest \
  -w "Bentley,iModelHub,IModelDb,IModelConnection,BentleyError"
```

### 替换后验证（仅标识符，不搜注释/字符串中的子串）

```bash
node name-replacer/search-sensitive.mjs \
  -d ../NameReplaceTest \
  -w "Bentley,IModelDb" \
  --whole-word
```

### 导出给其他脚本处理

```bash
node name-replacer/search-sensitive.mjs \
  -d itwinjs-core \
  -w "iModel,ITwin,Bentley" \
  --concise -o brand-check.json
```

## 与 search-ec.mjs 的关系

| | search-sensitive | search-ec |
|---|---|---|
| 搜索词 | 任意词列表（`-w`） | 固定 "EC" |
| 匹配方式 | 大小写全排列 + 子串 | 语义分词 + token 匹配 |
| 路径名称搜索 | ✅ 语义分词 + 子串匹配 | ✅ 语义分词 + token 匹配 |
| 噪声过滤 | 目录/文件 + 字面量片段（`0x56EC000` 等） | 四层过滤（目录/文件/hex hash/base64）+ 字面量片段 |
| 输出 | 终端表格 + JSON（含路径匹配） | 终端表格 + JSON（含路径匹配） |
| 典型用途 | 品牌词残留检查 | EC 语义单元精确提取 |
