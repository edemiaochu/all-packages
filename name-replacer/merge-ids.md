# merge-ids — 关键词合并工具

将 `search-ec` 和 `search-sensitive` 输出的标识符合并到一个文件，供 `merge-replace` 使用。

## 快速开始

```bash
# 合并 EC + 敏感词 标识符
node name-replacer/merge-ids.mjs ec-result.json result.json -o all-ids.json

# 合并多个文件
node name-replacer/merge-ids.mjs ec.json result.json dgn.json -o all.json

# 不指定输出 → 打印 JSON 到终端
node name-replacer/merge-ids.mjs a.json b.json
```

## 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `<file1> <file2> ...` | 输入文件（位置参数） | 必填 |
| `-o, --output <path>` | 输出文件路径 | 无（输出到终端） |

## 输入格式

自动识别两种来源：

| 来源工具 | identifiers 格式 | 示例 |
|---------|-----------------|------|
| `search-ec --concise` | 数组 | `["ECDb", "ECClass", ...]` |
| `search-sensitive --concise` | 对象 | `{"dgn": [...], "iModel": [...]}` |

## 输出格式

```json
{
  "generatedAt": "2026-08-04T...",
  "sources": {
    "ec-result.json": 871,
    "result.json": 5488
  },
  "totalUniqueIdentifiers": 6326,
  "identifiers": [
    "ECDb",
    "ECClass",
    "dgn_View",
    "iModelDb",
    ...
  ]
}
```

## 完整工作流

```bash
# 1. 搜索 EC 标识符
node name-replacer/search-ec.mjs \
  -d itwinjs-core \
  --concise -o ec-result.json

# 2. 搜索敏感词标识符
node name-replacer/search-sensitive.mjs \
  -d itwinjs-core \
  --words-file base-words.json \
  --concise -o result.json

# 3. 合并为一个文件
node name-replacer/merge-ids.mjs ec-result.json result.json -o all-ids.json

# 4. 生成替换映射表
node name-replacer/merge-replace.mjs \
  --ids all-ids.json \
  --words-config merge-words.json \
  -o name-mapping.json
```

> 合并输出也可用 `replace-server` 的 Web 界面配置（多词模式，词列表自动来自已保存配置）：
>
> ```bash
> node name-replacer/replace-server.mjs -i all-ids.json
> ```
