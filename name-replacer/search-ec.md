# search-ec — EC 语义关键词搜索工具

专门提取 "EC" 作为独立语义单元的代码标识符。与普通子串搜索不同，"EC" 必须在标识符中作为独立的 camelCase/PascalCase/snake_case 分词单元出现时才匹配。

两维度搜索：
- **文件内容** — 代码标识符中 "EC" 作为独立 token
- **路径名称** — 目录名/文件名中 "EC" 作为独立 token（默认启用）

架构参照 `search-sensitive.mjs`。

## 快速开始

```bash
# 基本搜索（含路径名称匹配）
node name-replacer/search-ec.mjs -d itwinjs-core

# 仅搜索文件内容（跳过路径名称）
node name-replacer/search-ec.mjs -d itwinjs-core --no-paths

# 导出完整 JSON
node name-replacer/search-ec.mjs -d itwinjs-core -o ec-result.json

# 导出简洁 JSON（仅标识符列表 + 计数）
node name-replacer/search-ec.mjs -d itwinjs-core --concise -o ec-result.json

# 含融合词（ECXML/ECSQLREADER 等全大写/全小写融合形态也会提取）
node name-replacer/search-ec.mjs -d itwinjs-core --concise --fused -o ec-result.json
```

## 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-d, --dir <path>` | 搜索目录 | `.` |
| `-o, --output <path>` | JSON 输出文件路径 | 无（不写文件） |
| `--json` | 终端输出 JSON（不显示表格） | 关闭 |
| `--concise` | 简洁 JSON（仅标识符列表 + 计数） | 关闭 |
| `--case-sensitive` | 大小写敏感（默认 Ec/ec/EC 都视为 EC） | 关闭 |
| `--no-paths` | 禁用路径名称搜索（仅搜索文件内容） | 关闭（默认启用） |
| `--fused` | 融合词匹配：整段（`_`/`.`/`-` 分隔）纯大写或纯小写的标识符做子串匹配，与 replace-server 的"融合词替换"对称 | 关闭 |
| `--ext <exts>` | 只扫描这些扩展名，逗号分隔 | 全部扩展名（按 `scan-exclude.json` 排除） |
| `--include-ext <exts>` | 强制包含被配置排除的扩展名 | 无 |
| `--include-dirs <names>` | 强制进入被配置排除的目录 | 无 |
| `--context <n>` | 上下文字符数 | `40` |
| `--limit-files <n>` | 终端详情最多显示文件数 | `200` |

## 匹配规则 — 语义分词

将标识符拆分为 camelCase / PascalCase / snake_case 的分词单元，"EC" 必须作为独立 token 出现才匹配。

### 文件内容匹配

| 标识符 | 分词结果 | 匹配？ |
|--------|---------|--------|
| `ECEntityClass` | `["EC","Entity","Class"]` | ✅ EC 是独立 token |
| `ECDb` | `["EC","Db"]` | ✅ |
| `myEcSchema` | `["my","Ec","Schema"]` | ✅ |
| `EC` | `["EC"]` | ✅ 独立标识符 |
| `EC_Class` | `["EC","Class"]` | ✅ snake_case |
| `$EC` | `["EC"]` | ✅ 去掉 $ 后分词 |
| `_ecSchema` | `["ec","Schema"]` | ✅ 去掉 _ 后分词 |
| `select` | `["select"]` | ❌ ec 只是 select 的子串 |
| `AEC` | `["AEC"]` | ❌ AEC 是一个整体 token |
| `check` | `["check"]` | ❌ |
| `project` | `["project"]` | ❌ |
| `SECONDS` | `["SECONDS"]` | ❌ 全大写不分词 |
| `ABCConnector` | `["ABC","Connector"]` | ❌ EC 不在 token 列表中 |
| `ECXML` | `["ECXML"]` | ❌ 默认不匹配（`--fused` 后 ✅，见下） |

### 融合词匹配（--fused）

token 匹配未命中时的兜底：整段（`_` / `.` / `-` 分隔）**纯大写或纯小写**、段长大于词长、
包含词子串时也算命中——专门捞 `ECXML`、`ECSQLREADER`、`ecsqlreader` 这类全大写/全小写
融合缩写，规则与 replace-server 的"融合词替换"完全对称：

| 标识符 | 段形态 | `--fused` 匹配？ |
|--------|--------|------------------|
| `ECXML` | 纯大写含 `EC` | ✅ |
| `ECSQLREADER` | 纯大写含 `EC` | ✅ |
| `ecsqlreader` | 纯小写含 `ec` | ✅ |
| `ecxml-parser.ts` | 文件名段 `ecxml` 纯小写 | ✅ 路径命中 |
| `EcXmlReader` | 混合大小写 | ❌ |
| `dgndWOriYSm5` | 哈希串混合大小写 | ❌（且会被随机串过滤先排除） |

⚠️ 含 `ec` 的真英文单词是纯小写/纯大写，`--fused` 后会混进来：
`DECLARE`、`RECREATE`、`SECONDS`、`select` 等都会命中。
**提取 ≠ 替换**——这些标识符进了 ec-result.json 后，replace-server 里 EC 不开启
"融合词替换"就保持原样，不受影响。

### 路径名称匹配

目录名/文件名先去扩展名 → `.` 和 `-` 替换为 `_` → 复用标识符分词逻辑：

| 路径 | 分词结果 | 匹配？ |
|------|---------|--------|
| `ec-schema/` | `["ec","schema"]` | ✅ 目录名 |
| `my-ec-utils.ts` | `["my","ec","utils"]` | ✅ 文件名 |
| `ec/` | `["ec"]` | ✅ 独立目录 |
| `ECDb.ts` | `["EC","Db"]` | ✅ 文件名 |
| `project/` | `["project"]` | ❌ |
| `select.ts` | `["select"]` | ❌ |
| `AEC-proj/` | `["AEC","proj"]` | ❌ AEC 是整体 |

## 输出模式

### 1. 终端表格（默认）

上层交叉表（文件 × 匹配数）+ 下层逐行详情 + 路径名称匹配：

```
File                                    │       EC
────────────────────────────────────────┼─────────
core/backend/src/IModelDb.ts            │       45
core/common/src/ECSchema.ts             │       32
...
TOTAL                                   │      861

📄 core/backend/src/IModelDb.ts
   EC[EC]        L  589:47 │ public readonly [ECDb]: IModelJsNative.ECDb;
   EC[Ec]        L 1613:12 │ public static openECDb(...);

📁 路径名称匹配 (语义分词)
──────────────────────────────────────────────────────────────────────
📂 目录名包含 "EC" (3 个):
   core/ecschema-metadata/           → 分词: [ecschema, metadata]
   core/ecschema-editing/            → 分词: [ecschema, editing]
   ...

📄 文件名包含 "EC" (12 个):
   core/common/src/ECSchema.ts       → 分词: [EC, Schema]
   core/backend/src/ECDb.ts          → 分词: [EC, Db]
   ...
```

### 2. 完整 JSON（`-o` 或 `--json`）

```json
{
  "generatedAt": "2026-08-04T...",
  "searchDir": "...",
  "searchWord": "EC",
  "matchMode": "semantic-token",
  "summary": {
    "word": "EC",
    "matchMode": "semantic-token",
    "caseSensitive": false,
    "extensions": ["ts", "tsx", "js", "jsx", "json", "md", "css", "html", "scss", "yaml", "yml"],
    "filesScanned": 1234,
    "filesWithMatches": 89,
    "totalMatches": 861,
    "totalUniqueIdentifiers": 156,
    "pathMatches": {
      "total": 15,
      "directories": 3,
      "fileNames": 12
    }
  },
  "results": [
    {
      "file": "core/backend/src/IModelDb.ts",
      "count": 45,
      "matches": [
        {
          "line": 589,
          "col": 47,
          "identifier": "ECDb",
          "matchedToken": "EC",
          "context": "public readonly [ECDb]: IModelJsNative.ECDb;"
        }
      ]
    }
  ],
  "identifiers": ["AbstractECConstraint", "EC", "ECClass", "ECDb", ...],
  "pathMatches": [
    { "path": "core/ecschema-metadata/", "type": "directory", "name": "ecschema-metadata", "matchedToken": "ecschema" },
    { "path": "core/common/src/ECSchema.ts", "type": "file-name", "name": "ECSchema.ts", "matchedToken": "EC" }
  ]
}
```

### 3. 简洁 JSON（`--concise`）

```json
{
  "generatedAt": "2026-08-04T...",
  "searchDir": "...",
  "searchWord": "EC",
  "matchMode": "semantic-token",
  "summary": {
    "totalFilesScanned": 1234,
    "totalUniqueIdentifiers": 156,
    "filesWithMatches": 89
  },
  "identifiers": ["AbstractECConstraint", "EC", "ECClass", "ECDb", ...],
  "pathMatches": {
    "total": 15,
    "directories": ["core/ecschema-metadata/", "core/ecschema-editing/", ...],
    "fileNames": ["core/common/src/ECSchema.ts", "core/backend/src/ECDb.ts", ...]
  }
}
```

## 噪声过滤（四层）

搜索过程中自动过滤非代码标识符的噪声：

| 层级 | 过滤内容 | 机制 |
|------|---------|------|
| 1. 目录级 | `node_modules`, `.git`, `dist`, `lib`, `build` 等 | `scan-exclude.json` 的 `dirs` 段 |
| 2. 文件级 | `pnpm-lock.yaml`, `.snap`, `.map`, 图片/字体 | `scan-exclude.json` 的 `files` + `exts` 段 |
| 3. 标识符级 | git SHA（≥32 字符纯十六进制） | `isLikelyRandomString` 规则 1 |
| 4. 标识符级 | base64 随机串（>40 字符无下划线 + 大写 >25%） | `isLikelyRandomString` 规则 2 |
| 5. 标识符级 | 数字/十六进制字面量片段：`0x56EC000`、`123EC`、`#EC0000`、`\xEC` 等 | `identifier-utils.mjs` 的 `isLiteralFragment` |

> 默认扫描所有文件夹和所有扩展名；配置文件缺失时不排除任何内容（兜底仍会跳过
> >5MB 或前 4KB 含 `\0` 的二进制文件）。

## 基础替换词保护（自动生效）

已经定稿的新词内部不再报告命中。保护词来源：`base-mapping.json` 的值、
`replace-server-config.json` 各词的 `baseName`、`exclude-list.json` 的条目。

| 标识符 | 结果 | 原因 |
|--------|------|------|
| `ECDb` | ✅ 提取 | EC 是独立语义 token |
| `szewEC` | ❌ 不提取 | 属于替换结果 `szewec`，ec 不是品牌词 |
| `SzewECSchema` | ❌ 不提取 | 同上 |
| `szewEC_ECClass` | ✅ 提取 | 仍有一个不受保护的 EC token |
| `szewec`（`--fused`） | ❌ 不提取 | 整段落在 `szewec` 内部 |

补充手工保护词写在 `name-replacer/protected-words.json`（可选）：

```json
["szewec", "szewTwin"]
```

`replace-server.mjs` 生成映射时使用同一份保护词：已替换的部分不会被后续
词规则二次改写（`szewEC_ECClass → szewEC_DMClass`，而不是 `szewDM_DMClass`）。

## 保护区域（自动生效）

`name-replacer/protected-files.json` 支持两种保护区域，命中的标识符不参与提取：

- `files`：整份文件（密码保护模块等）
- `snippets`：文件里的一段代码（直接贴原文）

`files` 整份不提取；`snippets` 只排除片段里**会被 EC 提取命中**的标识符
（`ECLicense` 这类，`minio`/`from` 这类不会被提取的词不受影响）。
被排除的标识符在其他文件里也不再提取——否则同名代码在别处被替换后，
保护区域里的代码会跟着改掉。

```bash
# 查看当前生效的保护区域
node name-replacer/protected-files.mjs

# 临时关闭 / 指定其他配置
node name-replacer/search-ec.mjs -d . --no-protected-files
node name-replacer/search-ec.mjs -d . --protected-files my.json
```

写法与匹配规则见 [protected-files.md](protected-files.md)。

## 常用场景

### EC 相关标识符全貌

```bash
node name-replacer/search-ec.mjs -d itwinjs-core
```

### 替换前摸底（仅文件内容）

```bash
node name-replacer/search-ec.mjs -d itwinjs-core --no-paths -o ec-before.json
```

### 替换后验证（对比差异）

```bash
# 替换前
node name-replacer/search-ec.mjs -d itwinjs-core --concise -o ec-before.json

# ... 执行替换 ...

# 替换后
node name-replacer/search-ec.mjs -d itwinjs-core --concise -o ec-after.json

# 对比两个 JSON 的 identifiers 差异
```

### 仅检查路径名称（看目录/文件命名是否合理）

```bash
# 用 --no-paths 的相反：可以直接看终端路径匹配部分
node name-replacer/search-ec.mjs -d itwinjs-core --limit-files 0
```

## 与 search-sensitive.mjs 的关系

| | search-sensitive | search-ec |
|---|---|---|
| 搜索词 | 任意词列表（`-w`） | 固定 "EC" |
| 匹配方式 | 大小写全排列 + 子串 | 语义分词 + token 匹配 |
| 噪声过滤 | 无 | 四层过滤（目录/文件/hex hash/base64） |
| 路径名称搜索 | 无 | 目录名 + 文件名 token 匹配 |
| 输出 | 终端表格 + JSON | 终端表格 + JSON（含路径匹配） |
| 典型用途 | 品牌词残留检查 | EC 语义单元精确提取 |
