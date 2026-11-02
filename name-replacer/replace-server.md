# replace-server — 通用替换词配置服务器

读取 `search-ec.mjs` / `search-sensitive.mjs` 的搜索输出，提供 Web 界面配置替换映射，生成与 `apply-replace.mjs` 兼容的映射表。

## 工作流概览

```
search-ec.mjs          replace-server.mjs        apply-replace.mjs
    │                       │                          │
    │  --concise            │  --input                  │  --target
    │  -o ec-result.json    │                           │
    ▼                       ▼                          ▼
ec-result.json  ──→  Web UI 配置替换  ──→  ec-mapping.json  ──→  执行替换
(861 个标识符)       设置基准替换词            (861 条映射)         (替换文件内容)
```

## 两种模式

| | 单词模式 | 多词模式 |
|---|---|---|
| **触发条件** | 文件只含一个词，或用 `--word` 指定 | 多键 concise / full / merge-ids 输入且**不带** `--word` |
| **界面** | 该词的单张卡片 | 每个词一张卡片（merge-ids 输入的词来自配置文件） |
| **添加/移除词** | ❌ | ✅ 界面顶部"添加搜索词"输入框 + 卡片右上 × |
| **保存** | 只更新该词的配置条目和映射 | **整体重写**配置文件（移除的词即删除），生成逐词串联的合并映射 |

多词模式的替换顺序：按卡片顺序逐词执行语义替换（前一个词的结果作为后一个词的输入），一个标识符同时含多个词时都能正确转换。

## 快速开始

```bash
# 第一步：搜索标识符
node name-replacer/search-ec.mjs -d . --concise -o ec-result.json

# 第二步：启动配置服务器
node name-replacer/replace-server.mjs --input ec-result.json

# 浏览器打开 http://localhost:3457
#   1. 在 "基准替换词" 输入框中填写替换目标（PascalCase 格式）
#   2. 查看自动推导的大小写变体
#   3. 点击 "预览变更" 检查结果
#   4. 点击 "保存并更新映射表"

# 第三步：执行替换（需先将映射复制为 name-mapping.json）
cp name-replacer/ec-mapping.json name-replacer/name-mapping.json
node name-replacer/apply-replace.mjs --target <目录> --dry-run  # 预览
node name-replacer/apply-replace.mjs --target <目录>             # 执行
```

### 多词一次配完（推荐）

```bash
# 用 merge-ids 的合并结果，一次配置全部词
node name-replacer/replace-server.mjs --input all-ids.json

# 浏览器打开 http://localhost:3457
#   - 已保存过配置的词自动渲染成卡片（基准词 + override 已恢复）
#   - 顶部 "添加搜索词" 输入新词（如 itwin）→ 出现新卡片
#   - 每张卡片分别设置基准替换词
#   - 保存 → 配置文件整体更新 + 生成合并映射表 all-ids-mapping.json
```

## 参数

### CLI 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-i, --input <path>` | 搜索输出 JSON 文件 | **必填** |
| `-w, --word <name>` | 聚焦单个词（强制单词模式；不传则多词输入自动进入多词模式） | 自动检测 |
| `-p, --port <n>` | HTTP 端口 | `3457` |
| `-o, --output <path>` | 映射表输出路径 | 从输入文件名推导 |
| `--config <path>` | UI 配置保存路径 | `name-replacer/replace-server-config.json` |

### 输出路径推导

| 输入文件 | 映射表输出 | 配置输出 |
|----------|-----------|---------|
| `ec-result.json` | `ec-mapping.json` | `replace-server-config.json`（固定） |
| `dgn-result.json` | `dgn-mapping.json` | `replace-server-config.json`（固定） |
| `data/foo-result.json` | `data/foo-mapping.json` | `replace-server-config.json`（固定） |

### 配置自动恢复

UI 配置（基准替换词 + 各模式 override + "不修改"勾选）保存到 `name-replacer/replace-server-config.json`，**按搜索词分组**：

```json
{
  "EC": { "baseName": "EntityClass", "overrides": { "eC": "entityClass" } },
  "DGN": { "baseName": "DesignFile", "overrides": {} }
}
```

下次启动同一搜索词时自动恢复，无需重新输入；多词模式（如 `--input all-ids.json`）启动时直接把**全部已保存的词**渲染成卡片，继续补充新词后再保存即可。排除列表持久化在 `exclude-list.json`，同样自动恢复。

**刷新页面即重读配置**：页面每次请求都会重新读取配置文件——外部（编辑器或脚本）修改了
`replace-server-config.json` 后，浏览器刷新一下就能看到新词/新配置，无需重启服务器。
merge-ids 输入的词列表完全以配置为准；带词的输入文件则以文件词为底座、配置叠加。

旧版 `{词}-config.json`（如 `ec-config.json`）会在首次启动时作为回退读取，保存后自动迁移到共享配置文件。

## 输入文件格式

支持三种格式，自动检测：

### A. search-ec.mjs --concise 输出

```json
{
  "searchWord": "EC",
  "matchMode": "semantic-token",
  "summary": { "totalUniqueIdentifiers": 861 },
  "identifiers": ["EC", "ECDb", "ECSchema", "myEcSchema", ...]
}
```

### B. search-sensitive.mjs --concise 输出

```json
{
  "words": ["dgn", "DgnDb"],
  "summary": { "byWord": { "dgn": 21, "DgnDb": 4 } },
  "identifiers": {
    "dgn": ["DGN", "DgnCore", "DgnDb", ...],
    "DgnDb": ["DgnDb", "DgnDbWorker", ...]
  }
}
```

多词文件需用 `--word` 指定目标词：

```bash
node name-replacer/replace-server.mjs -i dgn-result.json --word "DgnDb"
```

> **旧版文件兼容**：早期 `search-sensitive --concise` 输出没有顶层 `words` 字段（如 `resultDGN.json`、`result.json`），同样支持——词列表自动从 `identifiers` 的键推导，无需重新生成。

### C. search-sensitive.mjs 完整 JSON

```json
{
  "words": ["dgn", "DgnDb"],
  "identifiers": ["DgnDb", "openDgnDb", "dgn_View", ...]
}
```

### D. merge-ids.mjs 输出

```json
{
  "generatedAt": "...",
  "sources": { "ec-result.json": {...}, "result.json": {...} },
  "totalUniqueIdentifiers": 8010,
  "identifiers": ["$EC", "DgnDb", ...]
}
```

合并文件不含搜索词信息，直接进入**多词模式**——词列表来自已保存配置
（`replace-server-config.json` 的全部词自动渲染成卡片），可在界面继续添加：

```bash
node name-replacer/replace-server.mjs -i all-ids.json
```

## Web UI 功能

### 基准替换词

输入 PascalCase 格式的替换目标词，系统自动推导全部大小写变体：

```
基准替换词: EntityClass

自动推导:
  EC  → EntityClass    (PascalCase)
  Ec  → EntityClass    (PascalCase)
  ec  → entityclass    (lowercase)
  eC  → entityClass    (camelCase)

# 如果搜索词有长全大写变体（>3 字符），则对应 ALL_CAPS：
  ECM  → ENTITYCLASSM  (ALL_CAPS, >3 字符所以保持不变)
```

**短缩写的特殊处理：** 2-3 字符的全大写模式（如 `EC`）默认映射为 PascalCase，因为在代码标识符中它们几乎总是作为驼峰缩写使用（`ECDb` → `EntityClassDb`，而非 `ENTITYCLASSDb`）。

### 手动覆盖

每个大小写模式右侧有自定义输入框，可覆盖自动推导结果：

```
EC  (512) → EntityClass  [___________]  ← 留空使用自动推导
ec  (327) → entityclass  [___________]
eC  ( 26) → entityClass  [eCoverride__] ← 手动覆盖
```

### 预览弹窗

点击 **"预览变更"** ，弹窗显示全部标识符的转换前后对比。支持搜索过滤；
工具栏的 **"未变更 N 条"** 按钮可查看未命中任何替换规则的标识符。

### 未变更清单

保存后自动弹出（也可从预览弹窗打开）。列出所有未变更的标识符，并标注原因：

- **已排除** — 在排除列表里，明确跳过
- **含 dgn / itwin / …** — 包含某个配置词的子串，但没构成可替换的边界
  （如 `DGNPLATFORM` 对短词 `dgn`、随机哈希串），提示需要补充单词或加 override
- **不含配置词** — 与任何配置词都无关

### 待人工确认（融合缩写，按 token 批量）

多词模式卡片：**规则替换先跑完，仍残留融合缩写的 token** 按词归组整理出来——
程序无法自行判断 ECXML 是不是 EC+XML，这类才需要人确认；程序能识别的一律自动排除。

- **决策单位是 token，不是标识符**：一行 = 一条替换规则，作用于全部含该 token 的
  标识符。勾选 `ecclassid` 一条，17 个标识符一起处理；建议替换词已预填，可直接编辑。
  建议词按**复合约定**推导：从同前缀长词反推（`ecschema→dmschema`、`ecdb→dmdb`
  反推复合词里 ec→dm，多数票），反推不出才用词自身的基准词——独立 token 的映射
  （EC→db）和复合前缀的映射（ec→dm）可以不同。
- **判定** — 标识符里存在纯大写/纯小写、**以短词开头**、比词长的 camel token
  （ECXML/ecclassid 对 EC、DGNPLATFORM 对 dgn），且该 token 没被链上规则替换掉。
  同一 token 只归**最长前缀词**的组（`ecdbf` 归 ecdb 组建议 `dmdbf`，
  不再重复出现在 EC 组给出错误的 `dbdbf`）。
- **自动排除**（程序能识别的，不列出）：
  - 英文单词：select/DECLARE（词不在开头）、echo/ecosystem（以词开头的真单词，
    用 `english-words.txt` 判定）
  - 随机哈希串（十六进制 / base64 特征）
  - token 已被链上其他词或已确认的 token 规则消化
  - 长词（≥5 字符）含即被替，没有盲区，不参与
- **操作** — 勾选（预填建议）/ 编辑替换词 / "忽略"（不需要替换的 token，
  不再出现在列表，可撤销）；每组有"全选/清空"。保存后生效，确认过的 token
  自动离开待确认列表。
- token 规则按长度分两档（与"长词直替、短词守边界"的总体哲学一致）：
  - **长规则（≥5 字符）子串替换**（大小写不敏感、形态跟随、长规则先应用）：
    足够长不会藏进无关英文词，能覆盖 `sourceecinstanceid` 这种 ec 不是独立
    分词单元的全小写融合名（`ecinstanceid→dminstanceid` 规则命中其中）
  - **短规则（<5 字符）camel token 精确命中**：`ecc`/`ecs`/`ECN` 按子串会误伤
    `ECCENTRIC`/`specs`/`rebeccapurple`/`VECN` 这类含同子串的英文词

实测（all-ids.json 9011 个标识符）：待确认 119 个标识符 → **67 个 token**
（EC 组 60 + ecdb 组 7），其中 `ecclassid`×17、`ecdbf`×7、`ECXML`×2 …；
全选建议后映射 6948 → 8308。

持久化在配置文件的保留字（与搜索词同文件）：

```json
{
  "EC": { "baseName": "db", ... },
  "_manual":       { "Bentley3ECXML4352": "Szewec3DMXML4352" },
  "_manualTokens": { "ecclassid": "dbclassid", "ECXML": "DMXML" },
  "_manualSkip":   ["eccentic"]
}
```

`_manual`（按标识符逐条，优先级最高）、`_manualTokens`（按 token 批量）、
`_manualSkip`（忽略清单）——token 规则作用于新数据时自动生效，
新增含已确认 token 的标识符无需再确认。

`english-words.txt`：约 21 万英文单词（macOS `/usr/share/dict/words` 过滤出纯小写
2-24 字符），用于排除以短词开头的真英文单词。文件缺失时退化为仅形态规则
（会多几条英文候选，无功能影响）。重新生成：

```bash
node -e 'const w=require("fs").readFileSync("/usr/share/dict/words","utf8").split("\n");
require("fs").writeFileSync("name-replacer/english-words.txt",
  [...new Set(w.filter(x=>/^[a-z]{2,24}$/.test(x)))].sort().join("\n")+"\n")'
```

### 排除列表

添加不需要替换的关键词（精确匹配），被排除的标识符在映射表中保持不变。

### 融合词替换

短词（<5 字符）词卡片上的开关。开启后整段纯大写/纯小写时做子串替换
（`DGNPLATFORM→BLDPLATFORM`、`dgndb→blddb`），关闭则严格按 token 边界。
长词（≥5 字符）始终直接区间替换，无需此开关。配置里保存为 `fused: true`。

### 不修改模式

勾选后所有输入框禁用，保存时生成空映射表（用于快速清空映射）。

## 替换词推导规则

大小写分类逻辑（与 `server.mjs` 一致但泛化）：

| 模式形态 | 分类 | 推导结果 | 示例 |
|----------|------|----------|------|
| `EC`（≤3 字符全大写） | PascalCase | 首字母大写，保留内部大小写 | `EntityClass` |
| `ECM`（>3 字符全大写） | ALL_CAPS | 全大写 | `ENTITYCLASSM` |
| `Ec`（首字母大写其余小写） | PascalCase | 首字母大写，保留内部大小写 | `EntityClass` |
| `ec`（全小写） | lowercase | 全小写 | `entityclass` |
| `eC`（首字母小写） | camelCase | 首字母小写，保留内部大小写 | `entityClass` |

## 替换策略：长词直替，短词分词

替换按搜索词长度分两级：

**长词（≥5 字符，如 itwin/imodel/bentley/ecschema/产品名）— 直接区间替换。**
正则匹配标识符里出现的搜索词（任意大小写形态），只替换命中区间。长词几乎不可能
作为子串藏在无关单词里，无需 token 边界保护；复数和融合形态自动覆盖：

```
搜索词: itwin  基准替换: szewtwin

iTwinDb              → szewTwinDb        ✅ 命中 "iTwin" 区间
APIS_ITWINS_BASE_URL → APIS_SZEWTWINS_BASE_URL  ✅ 复数自动补 s
ITWINJS_CORE         → SZEWTWINJS_CORE    ✅ 融合词
BENTLEYCONFIG        → SZEWECCONFIG       ✅ (bentley 融合)
@itwin-electron...   → @szewtwin-electron... ✅ 包名/文件名
```

**短词（<5 字符，如 EC/DGN/RAM）— 语义分词替换。**
短词容易作为子串出现在无关单词里（Che**ck** 含 ec、FRAME**WORK** 含 ram、随机哈希含 dgn），
必须守 token 边界：

```
搜索词: EC  基准替换: EntityClass

ECDb                    → EntityClassDb              ✅ EC 是独立 token
CheckECProfileResultRow → CheckEntityClass...ResultRow ✅ 仅 EC token 被替换
Check                   → Check                        ✅ heck 不含 EC token
select                  → select                       ✅ ec 不是独立 token
```

短词的命中方式（按优先级）：token 直接命中 → 复数命中（token = 词+s，如 ITWINS）→
多 token 拼接命中（"Auto"+"PIPE"→AutoPIPE、"AEC"+"Osim"→AECOsim、"i"+"T"+"Win"→iTWin）→
剥字命中（"myi"+"Twin"→iTwin，仅混合大小写品牌形态）→
融合词替换（需在词卡片上开启"融合词替换"）。

**融合词替换（fused）**：短词的兜底开关。整段（分隔符之间的部分）纯大写或纯小写时
做子串替换：`DGNPLATFORM→BLDPLATFORM`、`dgndb→blddb`、`exportdgn→exportbld`。
混合大小写的段不碰——随机哈希串（`dgndWOriYSm5...`）天然被排除。
⚠️ framework/diagram 这类含 ram 的真英文单词是纯小写，所以 ram/ec 等容易撞
英文单词的短词**不要开启**；dgn/imjs 这类不会出现在英文单词里的短词可以放心开。

**多词模式的执行顺序：按词长降序**（长词先执行），避免 EC 先把 ECSchema 吃掉、
导致 ecschema→dmschema 的配置对大写形态失效。

## 生成的映射表格式

```json
{
  "AnotherECClass": "AnotherEntityClassClass",
  "AnyECType": "AnyEntityClassType",
  "CorEcA": "CorEntityClassA",
  "EC": "EntityClass",
  "ECDb": "EntityClassDb",
  "ECSchema": "EntityClassSchema",
  "ChangesetECAdaptor": "ChangesetEntityClassAdaptor",
  "ec": "entityclass",
  "ecSchema": "entityclassSchema",
  ...
}
```

扁平 `{ "原标识符": "新标识符" }` 格式，与 `name-mapping.json` 完全兼容。

## 与 apply-replace.mjs 配合

`apply-replace.mjs` 默认读取 `name-replacer/name-mapping.json`，使用前需将生成的映射表复制/重命名：

```bash
# 替换前必须复制到标准路径
cp name-replacer/ec-mapping.json name-replacer/name-mapping.json

# 预览变更（不写文件）
node name-replacer/apply-replace.mjs --target appui --dry-run

# 执行替换
node name-replacer/apply-replace.mjs --target appui
```

如未指定 `--target`，默认对整个仓库根目录执行替换。

## 完整示例

### 替换仓库中所有 "EC" 相关的标识符

```bash
# 1. 语义搜索
node name-replacer/search-ec.mjs -d . --concise -o ec-result.json

# 2. 启动配置界面
node name-replacer/replace-server.mjs --input ec-result.json

# 3. 在浏览器中：
#    - 输入基准替换词 "EntityClass"
#    - 检查模式列表：EC→EntityClass, ec→entityclass, ...
#    - 对特殊模式手动覆盖（如 eC→entityClass）
#    - 在排除列表中添加不需要替换的标识符
#    - 点击 "预览变更" 检查
#    - 点击 "保存并更新映射表"

# 4. 应用替换
cp name-replacer/ec-mapping.json name-replacer/name-mapping.json
node name-replacer/apply-replace.mjs --dry-run  # 先预览
node name-replacer/apply-replace.mjs             # 正式执行
```

### 替换 DGN 相关标识符

```bash
# 1. 搜索
node name-replacer/search-sensitive.mjs -d . -w "dgn,DgnDb" --concise -o dgn-result.json

# 2. 配置 DgnDb 的替换（多词文件需指定 --word）
node name-replacer/replace-server.mjs --input dgn-result.json --word "DgnDb"

# 3. 在浏览器中配置并保存，生成 dgn-mapping.json
```

## 与 server.mjs 的关系

| | server.mjs | replace-server.mjs |
|---|---|---|
| **定位** | iTwin 三品牌专用 | 任意搜索词通用 |
| **搜索词来源** | 硬编码（iTwin/iModel/Bentley） | 读取 `--input` 文件 |
| **替换方式** | 全局正则 | 语义分词 |
| **UI** | 3 品牌卡片 + 品牌筛选 | 单搜索词卡片 |
| **映射输出** | `name-mapping.json` | `{Word}-mapping.json` |
| **多词联合替换** | ✅ 三合一 | ❌ 一次一词 |
| **复杂变体处理** | 内置 BRAND_FORMS | 需手动 override |
