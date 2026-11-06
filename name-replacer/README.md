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

## 命令速查

| 步骤 | 工具 | 说明 | 详细文档 |
|------|------|------|---------|
| 1. 搜索 | `search-sensitive.mjs` / `search-ec.mjs` | 扫描标识符，输出 `result.json` / `ec-result.json` | [search-sensitive.md](search-sensitive.md) / [search-ec.md](search-ec.md) |
| 2. 合并词表 | `merge-ids.mjs` | 多个搜索结果合并成 `all-ids.json` | [merge-ids.md](merge-ids.md) |
| 3. 配置映射 | `replace-server.mjs` | Web UI 配置替换词，生成 `*-mapping.json` | [replace-server.md](replace-server.md) |
| 4. 合并映射 | `merge-mapping.mjs` | 把多份映射合并成一份总表（可选） | [merge-mapping.md](merge-mapping.md) |
| 5. 分阶段替换 | `replace-staged.mjs` | 替换 + 构建 + 发包 + 安装测试（推荐） | [replace-staged.md](replace-staged.md) |
| 6. 直接替换 | `apply-replace.mjs` | 只做内容替换和目录改名 | 本文 |
| 7. bim 词族 | `replace-bim.mjs` | 只处理 `.bim` / `ibim` / `bims` 等文件格式词 | 本文 |

完整执行顺序见 [replace-programm-use.md](replace-programm-use.md)。

---

## 1. 搜索标识符

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

## 2. 合并词表

```bash
node name-replacer/merge-ids.mjs ec-result.json result.json -o all-ids.json
```

- 支持合并任意多个搜索结果
- `identifiers` 无论是数组还是按词分组的对象都能识别
- 合并结果供 `replace-server` 使用

## 3. 配置替换映射

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

## 4. 合并映射（可选）

```bash
# 默认：base-mapping.json + all-ids-mapping.json → 根目录 all-mapping.json
node name-replacer/merge-mapping.mjs

# 合并任意多个文件，后面的文件优先
node name-replacer/merge-mapping.mjs base.json extra.json -o all-mapping.json

# 合并进已有总表，保留目标独有条目
node name-replacer/merge-mapping.mjs --into all-mapping.json base.json extra.json
```

## 5. 分阶段替换、发包与测试

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
- 目标目录不存在会明确提示并跳过；所有目标都不存在时不会执行后续全局改名
- 批次划分可参考 [dep-layers.md](dep-layers.md)

## 6. 直接内容替换（apply-replace）

只做替换、不构建/发布时使用：

```bash
# apply-replace 固定读取 name-mapping.json
cp name-replacer/all-ids-mapping.json name-replacer/name-mapping.json

# 预览
node name-replacer/apply-replace.mjs --target appui --dry-run

# 执行
node name-replacer/apply-replace.mjs --target appui
```

- 不传 `--target` 时扫描整个仓库
- `replace-staged.mjs` 内部调用的就是它
- 扫描范围与排除项同样来自 `scan-exclude.json`

## 7. 上下文感知的 bim 词族（replace-bim）

只替换文件后缀 / 扩展名 / 格式字面量相关的 `bim`、`ibim`、`bims`，
不会替换普通标识符、路径段或中文语境里的 `bim`：

```bash
node name-replacer/replace-bim.mjs --dry-run --targets name-replacer/targets.json
node name-replacer/replace-bim.mjs --targets name-replacer/targets.json
```

建议在主替换流程之后运行。

## 8. 扫描排除配置（scan-exclude.json）

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
- [dep-layers.md](dep-layers.md) — 依赖分层参考
