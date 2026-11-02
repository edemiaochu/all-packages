# merge-replace — 多词合并替换工具

当一个标识符中同时包含多个需要替换的词时，协调多个搜索词以语义分词方式统一替换，生成合并映射表。

两种使用模式：
- **CLI 模式**：命令行直接生成映射表
- **Web UI 模式**：浏览器中交互式配置（`--serve`）

## 快速开始

```bash
# CLI 模式：命令行直接生成
node name-replacer/merge-replace.mjs \
  -w "EC=EntityClass" -w "iModel=iVault" \
  --ids ec-result.json,imodel-result.json

# 保存替换词配置（方便下次复用）
node name-replacer/merge-replace.mjs \
  -w "EC=EntityClass" -w "iModel=iVault" \
  --ids ec-result.json,imodel-result.json \
  --words-config merge-words.json

# 下次直接用配置，无需重复输入 -w 和 --ids
node name-replacer/merge-replace.mjs --words-config merge-words.json

# Web UI 模式：浏览器中交互式配置
node name-replacer/merge-replace.mjs \
  --serve --ids ec-result.json,imodel-result.json

# Web UI + 自动保存替换词
node name-replacer/merge-replace.mjs \
  --serve --words-config merge-words.json
```

## 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-w, --word <KEY=VALUE>` | 搜索词=基准替换词（可多次指定） | 无 |
| `--ids <file1,file2,...>` | 标识符来源文件，逗号分隔 | 无 |
| `-o, --output <path>` | 输出映射表路径 | `merged-mapping.json` |
| `--overrides <path>` | 按模式的覆盖 JSON 文件 | 无 |
| `--words-config <path>` | 替换词配置文件（自动保存/加载） | 无 |
| `--serve` | 启动 Web 配置界面 | 关闭 |
| `-p, --port <n>` | Web 端口 | `3457` |
| `--json` | 仅输出 JSON（不输出报告表格） | 关闭 |

## 替换词配置（`--words-config`）

解决每次手动输入 `-w` 的痛点。配置文件自动保存/加载替换词和标识符来源。

### 配置文件格式

```json
{
  "savedAt": "2026-08-04T...",
  "words": [
    { "searchWord": "EC", "baseReplacement": "EntityClass" },
    { "searchWord": "iModel", "baseReplacement": "iVault" }
  ],
  "idFiles": ["ec-result.json", "imodel-result.json"]
}
```

### 工作流程

```bash
# 第一步：首次使用，指定所有参数
node name-replacer/merge-replace.mjs \
  -w "EC=EntityClass" -w "iModel=iVault" \
  --ids ec-result.json,imodel-result.json \
  --words-config merge-words.json

# 第二步以后：直接加载配置
node name-replacer/merge-replace.mjs --words-config merge-words.json

# 也可以加载配置 + 临时追加新词
node name-replacer/merge-replace.mjs \
  --words-config merge-words.json \
  -w "Dgn=NewName"
```

### Web UI 模式下的保存

在界面中添加/修改搜索词后，点击"保存映射表"按钮时，会**同步保存**替换词到配置文件：

```bash
# 启动 Web UI
node name-replacer/merge-replace.mjs \
  --serve --words-config merge-words.json

# 浏览器中操作：
# 1. 添加搜索词 EC → EntityClass
# 2. 添加搜索词 iModel → iVault
# 3. 点击"保存映射表"
# → 映射表 + 替换词配置同时落盘

# 下次启动，界面自动恢复上次配置的所有词
node name-replacer/merge-replace.mjs \
  --serve --words-config merge-words.json
```

### 合并规则

| 场景 | 行为 |
|------|------|
| 配置文件 + 命令行 `-w` | 合并，同名搜索词以命令行为准 |
| 配置文件 + 命令行 `--ids` | 合并去重，命令行优先 |
| 命令行只有配置文件 | 完全从配置文件加载 words + idFiles |

## 工作原理

### 核心流程

```
搜索词 "-w EC=EntityClass"
    │
    ▼
标识符来源 "--ids ec-result.json"
    │
    ▼
提取模式: EC → ["EC","Ec","ec","eC"]   (来自标识符的大小写变体)
    │
    ▼
推导替换: EC→EntityClass, Ec→EntityClass, ec→entityclass, eC→entityClass
    │
    ▼
合并 Token Map: { EC: "EntityClass", ec: "entityclass", iModel: "iVault", ... }
    │
    ▼
语义分词替换: iModelECObjects → iVaultEntityClassObjects
```

### 多词协调示例

```
标识符: iModelECObjects

语义分词: ["iModel", "EC", "Objects"]

Token Map:
  iModel → iVault
  EC     → EntityClass

替换结果: iVaultEntityClassObjects
```

两个词各替换各的 token，互不干扰。

### 覆盖配置（`--overrides`）

当默认推导的替换不满意时，可以按模式精确覆盖：

```json
{
  "EC": {
    "ec": "entityClassCustom"
  },
  "iModel": {
    "IMODEL": "IVAULT"
  }
}
```

Web UI 中也支持逐模式覆盖，每条模式右侧有"覆盖"输入框。

## 覆盖配置格式

```json
{
  "搜索词": {
    "具体模式": "自定义替换值"
  }
}
```

- 搜索词 = `-w` 中 KEY 部分
- 具体模式 = 标识符中出现的大小写变体（如 `EC`、`ec`、`eC`）
- 自定义替换值 = 你想要的精确替换文本

## 输出格式

### 终端报告（默认）

```
═══ 合并替换报告 ═══

替换规则:
  EC → EntityClass
  iModel → iVault

Token 映射表:
Token    │ Replacement
─────────┼──────────────────────────────
EC       │ EntityClass
Ec       │ EntityClass
ec       │ entityclass
eC       │ entityClass
IModel   │ IVault
iModel   │ iVault
...

标识符总数: 4709
  替换: 2926  未变: 1783

替换示例（前 10 条）:
  iModelECObjects   → iVaultEntityClassObjects   (2 个词)
```

### JSON 输出（`-o` 或 `--json`）

```json
{
  "generatedAt": "2026-08-04T...",
  "words": { "EC": "EntityClass", "iModel": "iVault" },
  "tokenMap": { "EC": "EntityClass", "ec": "entityclass", ... },
  "identifiersMerged": 4709,
  "mapping": {
    "ECDb": "EntityClassDb",
    "iModelECObjects": "iVaultEntityClassObjects",
    ...
  },
  "stats": { "changed": 2926, "unchanged": 1783, "total": 4709 }
}
```

## 与其它工具的关系

| | search-ec | search-sensitive | merge-replace |
|---|---|---|---|
| 功能 | 搜索 EC 标识符 | 搜索任意敏感词 | 生成替换映射表 |
| 输入 | 目录 | 目录 + 词列表 | 标识符文件 + 替换规则 |
| 输出 | 标识符列表 | 词×文件交叉表 | 标识符→替换映射表 |
| 路径名称搜索 | ✅ | ✅ | N/A |
| 典型用途 | EC 摸底 | 品牌词残留检查 | 生成 name-mapping.json |

## 完整工作流示例

```bash
# 1. 搜索 EC 相关标识符
node name-replacer/search-ec.mjs \
  -d itwinjs-core \
  --concise -o ec-result.json

# 2. 搜索 iModel 相关标识符
node name-replacer/search-sensitive.mjs \
  -d itwinjs-core \
  -w "iModel" \
  --concise -o imodel-result.json

# 3. 生成合并替换映射表（首次，保存配置）
node name-replacer/merge-replace.mjs \
  -w "EC=EntityClass" -w "iModel=iVault" \
  --ids ec-result.json,imodel-result.json \
  --words-config merge-words.json \
  -o name-mapping.json

# 4. 后续微调替换词后重新生成（无需重复输入 -w）
node name-replacer/merge-replace.mjs \
  --words-config merge-words.json \
  -o name-mapping2.json

# 5. 或使用 Web UI 交互式调整
node name-replacer/merge-replace.mjs \
  --serve --words-config merge-words.json
```
