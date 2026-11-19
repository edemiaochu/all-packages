# replace-server — 通用替换词配置服务器

读取 `search-ec.mjs` / `search-sensitive.mjs` / `merge-ids.mjs` 的输出，通过 Web 界面
配置每个搜索词的替换目标，生成与 `apply-replace.mjs` 兼容的扁平映射表。

**核心能力**

- **单词 / 多词模式**：单次聚焦一个词，或一次配置全部词并按词长链式替换
- **长词直替、短词分词**：长词按区间替换；短词只匹配完整 camel token，避免误伤英文单词
- **待人工确认**：只有程序无法判断的融合缩写（`ECXML`、`ecclassid`）才列出，可批量确认或忽略；真英文单词自动排除，无需确认
- **配置自动恢复**：词配置、人工映射、忽略清单全部持久化，下次启动直接继续
- **保存即覆盖**：每次保存按当前输入重新生成完整映射表（不追加）

---

## 工作流概览

```
search-ec.mjs / search-sensitive.mjs ──┐
                                       ├─→ replace-server.mjs ─→ {stem}-mapping.json
merge-ids.mjs ─────────────────────────┘         │
                                                 │ Web UI 配置
                                                 ▼
                              apply-replace.mjs / replace-staged.mjs
                              （读取 name-mapping.json）
```

---

## 快速开始

### 单词模式

适合输入文件只含一个搜索词（如 `search-ec --concise` 的输出）：

```bash
# 1. 搜索标识符
node name-replacer/search-ec.mjs -d . --concise -o ec-result.json

# 2. 启动配置服务器
node name-replacer/replace-server.mjs --input ec-result.json
#    浏览器打开 http://localhost:3457：
#    填写基准替换词 → 检查大小写变体 → 预览变更 → 保存并更新映射表

# 3. 应用到代码
cp name-replacer/ec-mapping.json name-replacer/name-mapping.json
node name-replacer/apply-replace.mjs --target <目录> --dry-run   # 预览
node name-replacer/apply-replace.mjs --target <目录>             # 执行
```

### 多词模式（推荐）

适合 `merge-ids` 合并后的完整词表，一次配置全部搜索词：

```bash
# 1. 合并搜索结果为统一词表
node name-replacer/merge-ids.mjs ec-result.json result.json -o all-ids.json

# 2. 启动配置服务器（多词模式）
node name-replacer/replace-server.mjs --input all-ids.json

# 3. 浏览器中：
#    - 已保存的词自动渲染成卡片，缺失的词在顶部输入框添加
#    - 每张卡片设置基准替换词，必要时手动 override
#    - 待人工确认区域处理融合缩写（确认 / 忽略 / 批量忽略）
#    - 保存 → 生成 name-replacer/all-ids-mapping.json
```

---

## 运行参数

### CLI 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-i, --input <path>` | 搜索/合并结果 JSON | **必填** |
| `-w, --word <name>` | 聚焦单个词，强制单词模式 | 自动检测 |
| `-p, --port <n>` | HTTP 端口 | `3457` |
| `-o, --output <path>` | 映射表输出路径 | 从输入文件名推导 |
| `--config <path>` | UI 配置保存路径 | `name-replacer/replace-server-config.json` |

### 模式判定

| 输入 / 参数 | 模式 |
|---|---|
| 带 `--word` | 单词模式 |
| `search-ec --concise`（单搜索词） | 单词模式 |
| `search-sensitive --concise` 且只有 1 个词 | 单词模式 |
| `search-sensitive --concise` 且多个词，不带 `--word` | 多词模式 |
| `search-sensitive` 完整 JSON | 多词模式 |
| `merge-ids` 输出 | 多词模式（词列表来自已保存配置） |

两种模式的差异：

| | 单词模式 | 多词模式 |
|---|---|---|
| **界面** | 该词一张卡片 | 每个词一张卡片 |
| **添加 / 移除词** | ❌ | ✅ 顶部输入框 + 卡片右上 × |
| **保存配置** | 只更新该词的条目 | 整体重写（移除的词即删除） |
| **替换顺序** | 单次替换 | 按**词长降序**链式替换（不是卡片顺序） |

### 输出路径

映射表固定输出到 `name-replacer/` 目录（`-o` 覆盖）：

| 输入文件 | 映射表输出 | 配置输出 |
|----------|-----------|---------|
| `all-ids.json` | `name-replacer/all-ids-mapping.json` | `replace-server-config.json` |
| `ec-result.json` | `name-replacer/ec-mapping.json` | `replace-server-config.json` |
| `dgn-result.json` | `name-replacer/dgn-mapping.json` | `replace-server-config.json` |
| `data/foo-result.json` | `name-replacer/foo-mapping.json` | `replace-server-config.json` |

> 规则：去掉输入文件名的 `-result` 后缀，再加 `-mapping.json`，目录始终是 `name-replacer/`。
> 配置路径固定，可用 `--config` 修改。

### 保存行为：整体覆盖，不追加

点「保存并更新映射表」会写两个文件：

1. **配置** `replace-server-config.json`
   - 单词模式：只合并当前词的配置条目
   - 多词模式：整体重写（词配置 + `_manual` / `_manualTokens` / `_manualSkip`）
2. **映射表**（路径见上表）
   - 按**当前输入文件的 `identifiers` + 当前配置**重新生成
   - 用 `writeFileSync` **整体覆盖**目标文件

因此：

- 新条目不会追加到 `all-ids-mapping.json` 末尾
- 手工加进映射表、但不在当前输入 `identifiers` 里的条目，保存后会消失
- 确认/忽略结果持久化在配置文件的保留字中，下次启动自动恢复并参与重新生成
- 需要保留旧映射作为底层时，保存后用 [`merge-mapping.mjs`](merge-mapping.md) 合并

### 配置自动恢复

UI 配置（基准替换词、各模式 override、不修改、人工确认、忽略清单）保存在
`name-replacer/replace-server-config.json`，按搜索词分组：

```json
{
  "EC": { "baseName": "EntityClass", "overrides": { "eC": "entityClass" } },
  "DGN": { "baseName": "DesignFile", "overrides": {} },
  "_manual":       { "Bentley3ECXML4352": "Szewec3DMXML4352" },
  "_manualTokens": { "ecclassid": "dbclassid", "ECXML": "DMXML" },
  "_manualSkip":   ["eccentic"]
}
```

- 下次启动自动恢复，无需重新输入
- 多词模式下，`merge-ids` 输入的词列表完全以配置为准；带词的输入文件则以文件词为底座、配置叠加
- **刷新页面即重读配置**：外部修改配置文件后刷新浏览器即可，无需重启服务器
- 旧版 `{词}-config.json`（如 `ec-config.json`）首次启动时作为回退读取，保存后迁移到共享配置
- 排除列表持久化在 `name-replacer/exclude-list.json`

---

## 输入文件格式

支持四种格式，自动检测：

### A. `search-ec.mjs --concise`

```json
{
  "searchWord": "EC",
  "matchMode": "semantic-token",
  "summary": { "totalUniqueIdentifiers": 861 },
  "identifiers": ["EC", "ECDb", "ECSchema", "myEcSchema"]
}
```

→ 单词模式。

### B. `search-sensitive.mjs --concise`

```json
{
  "words": ["dgn", "DgnDb"],
  "summary": { "byWord": { "dgn": 21, "DgnDb": 4 } },
  "identifiers": {
    "dgn": ["DGN", "DgnCore", "DgnDb"],
    "DgnDb": ["DgnDb", "DgnDbWorker"]
  }
}
```

- 只有 1 个词 → 单词模式
- 多个词且不带 `--word` → 多词模式
- 多个词但只想配置其中一个 → 加 `--word`

```bash
node name-replacer/replace-server.mjs -i dgn-result.json --word "DgnDb"
```

> 旧版 `search-sensitive --concise` 输出可能没有顶层 `words` 字段（如 `resultDGN.json`），
> 同样支持——词列表自动从 `identifiers` 的键推导。

### C. `search-sensitive.mjs` 完整 JSON

```json
{
  "words": ["dgn", "DgnDb"],
  "identifiers": ["DgnDb", "openDgnDb", "dgn_View"]
}
```

→ 多词模式。

### D. `merge-ids.mjs` 输出

```json
{
  "generatedAt": "...",
  "sources": { "ec-result.json": {}, "result.json": {} },
  "totalUniqueIdentifiers": 8010,
  "identifiers": ["$EC", "DgnDb"]
}
```

→ 多词模式。合并文件不含搜索词信息，词列表来自已保存配置，可在界面继续添加：

```bash
node name-replacer/replace-server.mjs -i all-ids.json
```

---

## Web UI 操作

### 基准替换词与大小写推导

输入 PascalCase 格式的替换目标词，系统按每个大小写模式自动推导：

| 模式形态 | 分类 | 推导结果 | 示例（基准 `EntityClass`） |
|----------|------|----------|---------------------------|
| `EC`（≤3 字符全大写） | PascalCase | 首字母大写，保留内部大小写 | `EntityClass` |
| `ECM`（>3 字符全大写） | ALL_CAPS | 全大写 | `ENTITYCLASSM` |
| `Ec`（首字母大写） | PascalCase | 首字母大写，保留内部大小写 | `EntityClass` |
| `ec`（全小写） | lowercase | 全小写 | `entityclass` |
| `eC`（首字母小写） | camelCase | 首字母小写，保留内部大小写 | `entityClass` |

2-3 字符的全大写模式（如 `EC`）默认按 PascalCase 处理，因为代码里它们几乎总是
驼峰缩写的一部分：`ECDb → EntityClassDb`，而不是 `ENTITYCLASSDb`。

### 手动覆盖

每个大小写模式右侧有自定义输入框，留空使用自动推导，填写后覆盖：

```
EC  (512) → EntityClass   [___________]
ec  (327) → entityclass   [___________]
eC  ( 26) → entityClass   [eCoverride__]   ← 手动覆盖
```

### 恢复初始值（只重置界面）

底部「恢复初始值」只重置当前页面，**不写任何文件**：

- 所有词卡片的基准替换词改回**原始搜索词**（如 `ec`、`itwin`），不是上次保存的 `baseName`
- 清空本次**尚未保存**的自定义 override 输入
- 已保存的 override 会在重绘后从配置恢复，不受影响
- 不影响「不修改 / 融合词替换」开关、词列表、待确认决策和排除列表

只要不点「保存并更新映射表」，就不会修改已保存的配置；刷新页面会重新读取
`replace-server-config.json`，之前的 `baseName` / `overrides` 原样恢复。

> ⚠️ 点「恢复初始值」后再保存，会把基准替换词以原始搜索词写回配置。
> 想放弃重置，直接刷新页面、不要保存即可。

### 预览与未变更清单

- **预览变更**：弹窗展示全部标识符的转换前后对比，支持搜索过滤
- **未变更清单**：保存后自动弹出，也可从预览弹窗打开，并标注原因：
  - **已排除**：在排除列表里，明确跳过
  - **含 xxx**：包含某个配置词的子串，但没构成可替换的边界
    （如 `DGNPLATFORM` 对短词 `dgn`、随机哈希串），提示补词或加 override
  - **不含配置词**：与任何配置词都无关

### 待人工确认（融合缩写）

多词模式下，规则替换跑完后仍残留的融合缩写 token 会按词归组列出。
决策单位是 **token，不是标识符**：勾选 `ecclassid` 一条，所有含该 token 的标识符一起处理。

> 这里列出的是**程序无法自动判断、确实需要人工确认**的融合缩写。
> 真英文单词、随机哈希等程序能识别的内容会自动排除，**不会出现在列表里，也不需要任何操作**。

**判定条件**

- token 为纯大写或纯小写、以短词开头、比词长（`ECXML` / `ecclassid` 对 `EC`）
- 该 token 没有被链上其他规则替换掉
- 同一 token 只归**最长前缀词**的组（`ecdbf` 归 `ecdb` 组，不重复出现在 `EC` 组）

**自动排除（不会进列表，因此不需要人工确认）**

- 真英文单词（`echo` / `ecosystem` / `eccentric`）——用 `english-words.txt` 判定，直接跳过
- 随机哈希串（十六进制 / base64 特征）
- 已被现有规则替换掉的 token
- 长词（≥5 字符，直接子串替换，没有盲区）

**建议替换词**

从同前缀长词反推复合约定（`ecschema→dmschema`、`ecdb→dmdb` 反推 ec→dm，多数票），
反推不出才用词自身的基准词。独立 token 的映射（`EC→db`）和复合前缀的映射
（`ec→dm`）可以不同。

**「忽略」是什么意思**

忽略 = **不给这个 token 生成替换规则**，并把它从待确认列表隐藏。它只作用于当前 token：

- `ECXML` 被忽略 → 不会生成 `ECXML → DMXML` 规则，`ECXML` 保持原样
- 同一标识符的其他部分仍可能被别的规则替换（例如 `FooECXMLBar` 里的 `Foo`）
- 忽略项保存在 `_manualSkip`，下次启动仍不显示；点「撤销忽略」会重新回到待确认列表，
  可以再次选择忽略或勾选替换
- **忽略不是排除**：如果想让整个标识符完全不参与任何替换，请使用下方的「排除列表」

| | 忽略（待确认列表） | 排除列表 |
|---|---|---|
| 作用对象 | 单个 token | 完整标识符 |
| 效果 | 不生成该 token 的替换规则 | 整个标识符不参与任何替换 |
| 其他规则 | 同一标识符的其他部分仍可能被替换 | 全部跳过 |
| 保存位置 | 配置文件的 `_manualSkip` | `exclude-list.json` |

**操作**

- 勾选（预填建议）后可直接编辑替换词；勾选即视为确认，会纳入预览和保存
- 单条操作：**确认 / 忽略**
  - **确认**：采用当前编辑值（没编辑过则用建议值），该 token 移出待确认列表，
    进入上方「已确认的 token 替换」
  - **忽略**：不生成替换规则并移出列表（见上文）
- 「已确认的 token 替换」区域：点 × 取消确认，token 回到待确认选择列表重新选择；
  **全部取消** 会让所有已确认 token 一起回到列表
- 每组标题旁：**全选 / 清空 / 全部确认 / 全部忽略**
  - 全选 = 勾选并预填建议，可再逐条编辑/确认
  - 全部确认 = 本组所有未确认 token 采用建议值（已编辑的保留），移出列表
- 待确认区域顶部：**全部确认（N 个 token）** / **全部忽略（N 个 token）**，
  只统计当前未确认的 token，不影响已确认项
- 鼠标悬停在按钮上会显示该操作的详细说明
- 「已忽略」区域：逐个 × 撤销，或 **全部撤销**
- 忽略后立即从列表消失；保存后写入 `_manualSkip`
- 撤销忽略后 token 会回到待确认列表，不是永久删除
- 已确认项保存后，下次启动仍在「已确认」区域，不会回到待确认列表

**token 规则的两档处理**

| 规则长度 | 处理方式 | 示例 |
|---|---|---|
| 长规则（≥5 字符） | 子串替换（大小写不敏感、形态跟随、长规则先应用） | `ecinstanceid→dminstanceid` 覆盖 `sourceecinstanceid` |
| 短规则（<5 字符） | 只匹配完整 camel token | `ecc`/`ecs`/`ECN` 不误伤 `ECCENTRIC`/`specs`/`rebeccapurple`/`VECN` |

> 历史实测（`all-ids.json` 9011 个标识符）：待确认 119 个标识符 → 67 个 token
> （EC 组 60 + ecdb 组 7），其中 `ecclassid`×17、`ecdbf`×7、`ECXML`×2。

### 排除列表

添加不需要替换的**完整标识符**（精确匹配、区分大小写）。被排除的标识符在替换和
待确认列表中都会跳过，不会出现在映射表里（应用时保持原样）。列表保存在 `exclude-list.json`。

### 融合词替换

短词（<5 字符）卡片上的开关，保存为 `fused: true`。

- **关闭（默认）**：严格按 token 边界替换
- **开启**：分隔符之间的整段为纯大写/纯小写时做子串替换
  （`DGNPLATFORM→BLDPLATFORM`、`dgndb→blddb`、`exportdgn→exportbld`）
- 混合大小写的段不碰，随机哈希串天然排除
- 长词（≥5 字符）始终直接区间替换，无需此开关

> ⚠️ `framework` / `diagram` 这类含 `ram` 的英文单词是纯小写，所以 `ram` / `ec`
> 等容易撞英文词的短词不要开启；`dgn` / `imjs` 这类不会出现在英文单词里的短词可以放心开。

### 不修改模式

勾选后该词所有输入框禁用，保存时该词不产生映射（用于暂时跳过某个词）。
单模式下保存会生成空映射表，多模式下只是该词不参与。

---

## 替换规则

### 长词（≥5 字符）：直接区间替换

正则匹配标识符中出现的搜索词（任意大小写形态），只替换命中区间。长词几乎不可能
藏在无关单词里，无需边界保护：

```
搜索词: itwin    基准替换: szewtwin

iTwinDb              → szewTwinDb                 ✅ 命中 "iTwin"
APIS_ITWINS_BASE_URL → APIS_SZEWTWINS_BASE_URL    ✅ 复数自然覆盖
ITWINJS_CORE         → SZEWTWINJS_CORE            ✅ 融合词
BENTLEYCONFIG        → SZEWECCONFIG               ✅ 产品名融合
@itwin-electron...   → @szewtwin-electron...      ✅ 包名 / 文件名
```

### 短词（<5 字符）：语义分词替换

短词容易作为子串出现在无关单词里（Che**ck** 含 `ec`、FRAME**WORK** 含 `ram`），
必须守 token 边界：

```
搜索词: EC    基准替换: EntityClass

ECDb                    → EntityClassDb                  ✅ EC 是独立 token
CheckECProfileResultRow → CheckEntityClass...ResultRow   ✅ 只替换 EC token
Check                   → Check                          ✅ heck 不含 EC token
select                  → select                         ✅ ec 不是独立 token
```

命中方式（按优先级）：

1. token 直接命中（`EC`）
2. 复数命中（token = 词 + `s`，如 `DGNs` 对 `dgn`）
3. 多 token 拼接命中（`Auto`+`PIPE`→`AutoPIPE`、`AEC`+`Osim`→`AECOsim`、`i`+`T`+`Win`→`iTWin`）
4. 剥字命中（`myi`+`Twin`→`iTwin`，仅混合大小写品牌形态）
5. 融合词替换（需在卡片上开启「融合词替换」）

### 多词执行顺序

按**词长降序**执行（不是卡片顺序）：长词先替换，避免 `EC` 先吃掉 `ECSchema`，
导致 `ecschema→dmschema` 的配置对大写形态失效。前一个词的结果作为后一个词的输入，
已产出的替换串会被保护，避免被后续词二次改写。

### EC 相关英文词会自动过滤吗？

**结论：真英文单词会被自动排除，不需要人工确认；只有融合缩写才需要确认或忽略。**

| 类型 | 例子 | 待确认列表 | 实际替换 | 需要人工操作？ |
|---|---|---|---|---|
| 真英文单词 | `echo` / `ecosystem` / `eccentric` / `specs` / `ECCENTRIC` / `rebeccapurple` | **不出现**（词典自动排除） | 短词按 token 边界，不命中 | ❌ 不需要 |
| 随机哈希 / 已消化 token / 长词 | `dgndWOriYSm5...` | **不出现** | 不受影响 | ❌ 不需要 |
| 融合缩写 | `ECXML` / `ecclassid` / `DGNPLATFORM` | **出现** | 程序不敢自动替换 | ✅ 确认或忽略 |

两层机制：

1. **待确认列表过滤**：`computePendingReview` 用 `english-words.txt` 判定真英文单词，
   连同随机哈希串、已被规则消化的 token 一起排除——这些**不会显示，也不需要你操作**。
2. **实际替换保护**：替换不依赖词典，靠 token 边界。短词 `ec` 只匹配完整 camel token，
   所以 `specs`、`ECCENTRIC`、`rebeccapurple`、`VECN`、`select`、`DECLARE`、`echo`
   都不会被替换。

需要留意：长词（≥5 字符）是直接子串替换；如果把常见英文长词配成搜索词，确实可能命中，
需要用「不修改」或排除列表规避。

`english-words.txt` 缺失时只退化为形态规则：待确认列表会多几条英文候选，
但实际替换结果不受影响。

---

## 生成的映射表格式

扁平 `{ "原标识符": "新标识符" }`，与 `name-mapping.json` 完全兼容：

```json
{
  "AnotherECClass": "AnotherEntityClassClass",
  "AnyECType": "AnyEntityClassType",
  "EC": "EntityClass",
  "ECDb": "EntityClassDb",
  "ECSchema": "EntityClassSchema",
  "ec": "entityclass",
  "ecSchema": "entityclassSchema"
}
```

未替换的标识符不会出现在映射表中。

---

## 与替换流程配合

### apply-replace.mjs / replace-staged.mjs

两者默认读取 `name-replacer/name-mapping.json`。使用生成的映射表前先复制/改名：

```bash
cp name-replacer/ec-mapping.json name-replacer/name-mapping.json

# 预览（不写文件）
node name-replacer/apply-replace.mjs --target appui --dry-run

# 执行
node name-replacer/apply-replace.mjs --target appui
```

不传 `--target` 时默认对整个仓库根目录执行。

### merge-mapping.mjs（可选：合并基础映射）

需要把新生成的映射与已有基础映射合并成一份总表时：

```bash
# 生成 all-mapping.json（base 在前，all-ids 覆盖）
node name-replacer/merge-mapping.mjs

# 或把新映射合并进已有总表
node name-replacer/merge-mapping.mjs --into all-mapping.json \
  name-replacer/base-mapping.json \
  name-replacer/all-ids-mapping.json
```

详见 [`merge-mapping.md`](merge-mapping.md)。

---

## 完整示例

### 替换仓库中所有 "EC" 相关标识符

```bash
# 1. 语义搜索
node name-replacer/search-ec.mjs -d . --concise -o ec-result.json

# 2. 启动配置界面
node name-replacer/replace-server.mjs --input ec-result.json

# 3. 浏览器中：
#    - 基准替换词填 "EntityClass"
#    - 检查各大小写变体，必要时 override
#    - 在排除列表加入不需要替换的标识符
#    - 预览变更
#    - 保存并更新映射表

# 4. 应用替换
cp name-replacer/ec-mapping.json name-replacer/name-mapping.json
node name-replacer/apply-replace.mjs --dry-run
node name-replacer/apply-replace.mjs
```

### 替换 DGN 相关标识符

```bash
# 1. 搜索
node name-replacer/search-sensitive.mjs -d . -w "dgn,DgnDb" --concise -o dgn-result.json

# 2. 配置 DgnDb 的替换（多词文件聚焦单个词）
node name-replacer/replace-server.mjs --input dgn-result.json --word "DgnDb"

# 3. 浏览器中保存，生成 name-replacer/dgn-mapping.json
```

---

## 常见问题

### 保存会追加到 all-ids-mapping.json 吗？

**不会，整体覆盖重写。** 映射表按当前输入的 `identifiers` + 当前配置重新生成，
然后覆盖目标文件。手工加进映射表、但不在当前输入里的条目会丢失。确认/忽略结果
保存在 `replace-server-config.json` 中，下次启动自动恢复。

详见「[保存行为](#保存行为整体覆盖不追加)」；需要保留旧映射时用 `merge-mapping.mjs --into`。

### 会自动过滤 EC 相关英文词吗？

**会，而且不需要人工确认。** 真英文单词（`echo` / `ecosystem` / `eccentric`）会被英文词典
自动排除，不进入待确认列表；实际替换时短词 `ec` 也只匹配完整 token，不会误伤
`specs` / `ECCENTRIC` / `rebeccapurple`。

只有 `ECXML`、`ecclassid` 这类无法自动判断的融合缩写才会进入待人工确认，需要你确认或忽略。

详见「[EC 相关英文词会自动过滤吗？](#ec-相关英文词会自动过滤吗)」。

### 怎么批量忽略 / 恢复？

每组有「全部忽略」，顶部有「全部忽略（N 个 token）」，「已忽略」区域有「全部撤销」。
忽略结果保存后写入 `_manualSkip`。

忽略只跳过该 token 的替换规则，**不等于把整个标识符加入排除列表**；撤销忽略后
token 会重新回到待确认列表。详见「[待人工确认](#待人工确认融合缩写)」。

---

## 与 server.mjs 的关系

| | server.mjs | replace-server.mjs |
|---|---|---|
| **定位** | iTwin 三品牌专用 | 任意搜索词通用 |
| **搜索词来源** | 硬编码（iTwin/iModel/Bentley） | 读取 `--input` 文件 |
| **替换方式** | 全局正则 | 语义分词 |
| **UI** | 3 品牌卡片 + 品牌筛选 | 单词/多词卡片 |
| **映射输出** | `name-mapping.json` | `{stem}-mapping.json`（多词合并） |
| **多词联合替换** | ✅ 三合一 | ✅ 按词长链式替换 |
| **复杂变体处理** | 内置 BRAND_FORMS | 需手动 override |

---

## 附录：重新生成 english-words.txt

`english-words.txt` 约 21 万英文单词（macOS `/usr/share/dict/words` 过滤出纯小写
2-24 字符），用于排除以短词开头的真英文单词。文件缺失时退化为仅形态规则，
不影响实际替换。重新生成：

```bash
node -e 'const fs=require("fs");
const w=fs.readFileSync("/usr/share/dict/words","utf8").split("\n");
fs.writeFileSync("name-replacer/english-words.txt",
  [...new Set(w.filter(x=>/^[a-z]{2,24}$/.test(x)))].sort().join("\n")+"\n")'
```
