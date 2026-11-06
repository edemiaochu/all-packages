# merge-mapping — 映射表合并工具

把多个扁平的映射表 `{ "原词": "替换词" }` 合并成一份，供 `apply-replace` / `replace-staged` 使用。

## 快速开始

```bash
# 默认：base-mapping.json + all-ids-mapping.json → 根目录 all-mapping.json
node name-replacer/merge-mapping.mjs

# 合并任意多个文件（按命令行顺序，后面的优先）
node name-replacer/merge-mapping.mjs \
  name-replacer/base-mapping.json \
  name-replacer/all-ids-mapping.json \
  name-replacer/complements-mapping.json \
  -o all-mapping.json
```

## 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `<file1> <file2> ...` | 输入映射表，按顺序合并 | 不传时使用下面的默认列表 |
| `-o, --output <path>` | 输出文件 | 仓库根目录 `all-mapping.json`；`--into` 时默认写回目标 |
| `--into <path>` | 把一个或多个文件合并进已有目标文件 | 无 |
| `--no-sort` | 保持合并顺序，不按键排序 | 默认按键排序 |
| `--show-conflicts` | 打印全部冲突明细 | 只打印前 20 条 |
| `-h, --help` | 显示帮助 | — |

默认输入（**base 在前，all-ids 在后**）：

1. `name-replacer/base-mapping.json`（基础映射；不存在时回退用 `name-mapping.json`）
2. `name-replacer/all-ids-mapping.json`（覆盖基础映射）

## 合并到已有文件（--into）

把一个或多个映射表的内容合并进**已有目标文件**，目标里独有的条目会保留，来源文件覆盖同名词条：

```bash
# 把 base + all-ids 合并进现有的 all-mapping.json（默认直接写回目标）
node name-replacer/merge-mapping.mjs --into all-mapping.json \
  name-replacer/base-mapping.json \
  name-replacer/all-ids-mapping.json

# 也支持多个来源；不想写回目标时用 -o 另存
node name-replacer/merge-mapping.mjs --into all-mapping.json a.json b.json -o merged.json
```

规则：

- 目标文件先读入作为底层，来源文件按命令行顺序叠加 → **来源覆盖目标**
- 目标独有的原词保留，不会被删除
- 目标文件不存在或没有来源文件会直接报错
- 读完全部输入后才写文件，输入输出同名是安全的

## 冲突规则

命令行中**靠后的文件优先**。同一个原词出现不同替换值时：

- 后传入的值覆盖先传入的值
- 值相同视为重复项，不计冲突
- 冲突会打印到终端（`原词: 旧值 (来源) → 新值 (来源)`），并统计到每个文件的「覆盖」数

## 输入要求

- 顶层必须是对象，所有值必须是字符串：`{ "iModel": "iVault" }`
- 支持带 BOM 的 JSON
- 搜索工具产出的 `identifiers` 词表不是映射表，会被明确拒绝（那种文件请用 `merge-ids.mjs`）

## 输出格式

```json
{
  "$EC": "$DM",
  "$iTwinId": "$szewTwinId",
  "iModel": "iVault",
  "iTwin": "szewTwin"
}
```

默认按键排序并写入 `all-mapping.json`，终端同时输出每个文件的「新增 / 重复 / 覆盖」统计和最终条数。
