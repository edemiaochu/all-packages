# protected-words — 基础替换词保护使用说明

## 解决什么问题

品牌词替换是分阶段做的，已经替换好的新词可能再次被后续词命中：

```text
bentley → szewec        （第一批已替换）
szewec 里含 "ec" →      search-ec 把 szewEC / SzewECSchema 当成 EC 提取
                        replace-server 再按 EC→dm 生成映射 → szewDM（脏数据）
```

`protected-words` 把这些**已定稿的新词**保护起来：提取时不报告，生成映射时不二次改写。

## 工作原理

按**区间**保护，不是整个标识符排除：

| 标识符 | 结果 | 原因 |
|--------|------|------|
| `ECDb` / `myEcSchema` | ✅ 提取 / 替换 | EC 是独立 token |
| `szewEC` | ❌ 跳过 | EC 落在 `szewec` 内部 |
| `SzewECSchema` | ❌ 跳过 | 同上 |
| `szewec`（`--fused`） | ❌ 跳过 | 整段属于 `szewec` |
| `szewec/`、`szewec-utils.ts`（路径名） | ❌ 跳过 | 路径名同样按区间判断 |
| `szewEC_ECClass` | ✅ 保留 | 还有一个不受保护的 EC token |
| `szewECBentley` | ✅ 保留 | Bentley 部分仍需要替换 |

两个环节共用同一份保护词：

1. **提取**（`search-ec` / `search-sensitive`）：命中落在受保护串内部 → 不报告。
2. **生成映射**（`replace-server`）：先用占位符把受保护串藏起来，所有词规则跑完再还原。
   所以 `szewEC_ECClass → szewEC_DMClass`，而不是 `szewDM_DMClass`。

## 无需配置：自动生效

普通用法不用改任何命令，保护词自动读取下面这些文件（文件不存在则跳过）：

| 来源 | 取什么 | 例子 |
|------|--------|------|
| `name-replacer/base-mapping.json` | 所有**值**（去掉 `$` 前缀） | `szewec`、`dmschema`、`iVaultId`、`szewTwinId` |
| `name-replacer/replace-server-config.json` | 各搜索词的 `baseName` | `szewtwin`、`bld`、`ivault`、`dmschema` |
| `name-replacer/exclude-list.json` | 全局条目（不带 `paths` 的） | `CorEcA` |
| `name-replacer/protected-words.json` | 手工补充（可选） | 见下 |

规则：大小写不敏感、按完整子串匹配、长度 < 3 的词忽略（如 `dm`）。

```bash
# 和以前完全一样，不用加参数
node name-replacer/search-sensitive.mjs -d . --words-file base-words.json --concise -o result.json
node name-replacer/search-ec.mjs -d . --concise -o ec-result.json
```

运行时 stderr 会打印当前生效的保护词（最多显示 10 个）：

```text
🛡️  基础替换词保护: 27 个（MY_SZEWTWINJS_VERSION, szewTwinId, Product10, …, bld）
```

## 查看当前保护词

```bash
# 表格：保护词 + 来源（哪个文件、对应哪个词）
node name-replacer/protected-words.mjs

# 机器可读（脚本/CI 用）
node name-replacer/protected-words.mjs --json

# 导出快照（review / diff / CI 留痕）
node name-replacer/protected-words.mjs --out protected-words.generated.json
```

> 快照文件只是输出，**不会被保护机制读取**。真正的来源始终是
> `base-mapping.json` / `replace-server-config.json` / `exclude-list.json` /
> `protected-words.json`。不要把它命名为 `protected-words.json`，否则会被当成手工配置。

输出会同时列出**未纳入**的条目及原因，例如：

```text
未纳入的保护项: 1 个
  dm  — 长度 < 3（replace-server-config.json）
```

> 短于 3 字符的词（如 EC 的 baseName `dm`）不参与保护，避免把普通文本大面积遮住。

## 可选：手工补充保护词

遇到自动来源没覆盖的新词（比如某个阶段临时改成的新名字），复制示例文件后填写：

```bash
cp name-replacer/protected-words.example.json name-replacer/protected-words.json
```

```json
{
  "_comment": "下划线开头的键会被忽略，可用来写说明",
  "words": [
    "szewCloud",
    "szewConnect",
    { "word": "myNewBrand" }
  ]
}
```

也支持纯数组格式：

```json
["szewec", "szewTwin", "myNewBrand"]
```

格式说明：

- 条目可以是字符串，也可以是 `{ "word": "..." }` 对象
- 大小写不敏感，按完整子串匹配
- 长度 < 3 的词会被忽略（如 `dm`）
- `_comment` / `_format` 等下划线开头的键不会被当作保护词

- CLI 每次运行都会重新读取，改完直接重跑即可。
- `replace-server` 每次生成映射时读取，改完刷新浏览器页面即可，不用重启服务。
- 这个词表同时影响提取和映射生成。

## 日常工作流

```bash
# 1) 搜索（保护自动生效）
node name-replacer/search-sensitive.mjs -d . --words-file base-words.json --concise -o result.json
node name-replacer/search-ec.mjs -d . --concise -o ec-result.json

# 2) 合并
node name-replacer/merge-ids.mjs ec-result.json result.json -o all-ids.json

# 3) 检查提取结果：不应再出现 szewEC / SzewECSchema 这类词
node -e "const d=require('./ec-result.json'); console.log(d.identifiers.filter(x=>/szewec/i.test(x)))"
# 输出 [] 即正常；若仍有，说明该词不在任何一种保护来源里 → 加进 protected-words.json

# 4) 打开 Web UI 配置并保存映射
node name-replacer/start-ui.mjs --skip-search
# 或
node name-replacer/replace-server.mjs --input all-ids.json

# 5) 检查生成的映射：新词不应被二次改写
node -e "const m=require('./name-replacer/all-ids-mapping.json'); const bad=Object.entries(m).filter(([k,v])=>/szewdm|szewDM|szewDm/i.test(v)); console.log(bad.length ? bad : 'OK')"
```

步骤 3/5 是可选的核对步骤，建议每次改完品牌方案后跑一次。

## 已有产物怎么办

保护只在**生成时**生效，不会自动修正历史文件。遇到下面情况需要重新生成：

| 产物 | 处理 |
|------|------|
| `ec-result.json` / `all-ids.json` 里混入 `szewEC` 等 | 重新跑搜索 + `merge-ids.mjs` |
| `all-ids-mapping.json` / `name-mapping.json` 里出现 `szewDM` | 在 replace-server 里重新保存一次映射；或用 `merge-mapping.mjs` 合并新生成的映射 |
| 源码里已经被错误替换成 `szewdm` | 用 `git diff` / `git checkout` 回滚后重跑替换 |

## 与 `exclude-list.json` 的区别

| | `exclude-list.json` | 基础替换词保护 |
|---|---|---|
| 粒度 | 整个标识符 / 字面量 | 标识符内部的一段区间 |
| 用途 | 人工确认「这个不要改」 | 系统保证「已经改好的不要改第二次」 |
| 作用环节 | `replace-server` 跳过整个标识符；`apply-replace` 做字面量占位符保护 | 提取时跳过区间命中；生成映射时保护区间 |
| 是否需要手写 | 需要（人工判断） | 基本自动，必要时补充 `protected-words.json` |

`exclude-list.json` 里的全局条目也会自动纳入保护词，两边不用重复维护。

## FAQ

**Q：为什么 `szewEC` 还在提取结果里？**
说明该标识符里还有另一个不受保护的 EC token。用终端详情看命中的那一段，
或检查 `protected-words.json` 是否漏了某个新词。

**Q：能关掉保护吗？**
没有开关——这是防止生成脏映射的硬保护。临时调试可以清空
`protected-words.json`，但 `base-mapping.json` 和 `replace-server-config.json`
里的自动来源仍会生效。

**Q：保护词会不会太宽，误伤正常品牌词？**
只跳过**完全落在保护串内部**的命中，且保护词都是已定稿的新名字。
例如 `szewECBentley` 的 Bentley、`szewEC_ECClass` 的 ECClass 都会正常处理。

**Q：`server.mjs` / `extract-brand-words.mjs` 也生效吗？**
不生效。它们属于旧工具链；当前流程（`search-ec` / `search-sensitive` /
`replace-server`）已全部接入。
