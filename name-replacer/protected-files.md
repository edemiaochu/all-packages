# protected-files — 保护区域（文件 / 代码片段）

密码保护、授权校验、加密解密这类代码一旦被改名就会失效。
`search-ec` / `search-sensitive` 提取标识符时按下面的规则保护它们：

1. **保护区域里会命中的标识符不提取**：文件整份跳过；片段只跳过命中的标识符，
   它们不会进入 `result.json` / `ec-result.json`；
2. **重复代码一起排除**：被排除的标识符，在其他文件里也不再提取。

第 2 条是必须的：只要同一个标识符在别处被提取、进了映射并替换，
保护区域里的同名代码就会跟着改掉，等于没保护。

保护区域有两种：

| 类型 | 配置键 | 用途 |
|------|--------|------|
| 保护文件 | `files` | 整份文件不能改名（密码保护模块等） |
| 保护片段 | `snippets` | 文件里某一段代码不能改名（直接贴原文） |

## 配置

```bash
cp name-replacer/protected-files.example.json name-replacer/protected-files.json
```

最简写法 —— `files` 里直接写路径字符串（**字符串本身就是路径**）：

```json
{
  "files": ["itwinjs-core/core/backend/src/PasswordProtection.ts"]
}
```

也可以直接写纯数组：

```json
["itwinjs-core/core/backend/src/PasswordProtection.ts"]
```

要加备注就写成 `{ "path", "note" }` 对象——`path` 里放同样的路径，
对象形式和字符串形式匹配规则完全一样，只是多一个备注：

```json
{
  "files": [
    "itwinjs-core/core/backend/src/PasswordProtection.ts",
    "**/PasswordProtection.ts",
    { "path": "base/units-schema/src/license/", "note": "密码 / 授权校验代码" }
  ]
}
```

- 条目可以是字符串，也可以是 `{ "path": "...", "note": "..." }`
- `_comment` / `_format` 等下划线开头的键会被忽略
- 文件不存在时自动跳过（配置可以先提交，换分支也不会报错）

### 保护代码片段（snippets）

文件里只有某一段代码不能改名时，直接把代码原文贴进 `snippets`：

```json
{
  "snippets": [
    "return {...from, baseUri: `${process.env.OBJECT_STORAGE_URL ?? \"http://10.0.19.202:9000\"}/${from.accountName}`, accessToken:from.sasToken }",
    { "text": "const KEY = decrypt(ECLicense);", "note": "授权校验" }
  ]
}
```

- **不需要和源码逐字符一致**：片段先收集候选标识符，再按当前搜索规则筛选
- **只有会被提取程序命中的词才排除**：
  - `search-ec`：片段里带 EC 分词单元的标识符（如 `ECLicense`、`sdfsEc54sdgsdf`）
  - `search-sensitive`：片段里命中搜索词的标识符（如搜 `Bentley` 时只排除相关词）
  - `minio`、`azure`、`from`、`process` 这类本来就不会被提取的词**不会**进入保护名单
- 片段里字符串字面量中的词也参与筛选（片段是主动划定的保护区域）
- 被排除的标识符在**所有文件**里都不再提取（同名代码一起排除）
- `files` 和 `snippets` 可以同时写，也可以只写 `snippets`

## 路径匹配规则

| 写法 | 含义 |
|------|------|
| `itwinjs-core/core/backend/src/X.ts` | 相对仓库根目录（`name-replacer` 的上一级）；也支持绝对路径 |
| `core/backend/src/X.ts` | 按路径后缀匹配，扫描根是仓库子目录时也能命中 |
| `X.ts` | 不含 `/` 时按文件名（basename）匹配，**所有同名文件**都保护 |
| `**/PasswordProtection.ts` | 通配符：`*` 不跨 `/`，`**` 跨层级，`?` 单字符 |
| `base/units-schema/src/license/` | 目录条目 = 保护该目录下全部文件 |

精确路径的保护文件**不受 `-d` 影响**：哪怕这次只扫描 `appui`，
`itwinjs-core` 里的保护文件也会被读进来，它里面的标识符照样全局排除。

> 没有目录前缀的通配符（如 `**/PasswordProtection.ts`）只在本次扫描目录里查找保护文件。
> 需要跨目录全局生效时，用精确路径或带目录前缀的写法（`itwinjs-core/**/X.ts`）。

## 标识符规则

- 按**完整标识符**精确匹配，大小写不敏感
- 保护区域里的 `ECSecretKey` → 所有文件里的 `ecsecretkey` / `ECSecretKey` 都不提取
- 但 `ECSecretKeyExtra` 不受影响（不是同一个标识符）
- 保护**文件**只统计代码里的标识符：注释、字符串字面量里的内容不算。
  否则文件里一条 `"Bentley"` 字符串就会把全局的品牌词提取全挡掉
- 保护**片段**先收集候选（字符串里的词也算），再按当前搜索词筛选：
  只有本来会被 `search-ec` / `search-sensitive` 提取出来的词才排除

## 生效范围

| 工具 | 是否生效 |
|------|---------|
| `search-ec.mjs` | ✅ 自动读取 |
| `search-sensitive.mjs` | ✅ 自动读取 |
| `start-ui.mjs` | ✅ 内部调用的就是上面两个 |
| `replace-server.mjs` / `apply-replace.mjs` | ❌ 不读取（见下方注意事项） |

临时关闭 / 指定其他配置：

```bash
# 临时关闭（调试用）
node name-replacer/search-ec.mjs -d . --no-protected-files

# 用另一份配置
node name-replacer/search-ec.mjs -d . --protected-files path/to/my-protected-files.json
```

## 验证

```bash
# 列出当前生效的保护区域
node name-replacer/protected-files.mjs

# 查看某个搜索词下，片段里哪些标识符会被排除（子串粗筛）
node name-replacer/protected-files.mjs --word EC

# 机器可读
node name-replacer/protected-files.mjs --json

# 用另一份配置
node name-replacer/protected-files.mjs --config path/to/my-protected-files.json
```

搜索时 stderr 也会输出：

```text
🔒 保护区域: 1 个文件（27 个标识符） / 1 段代码片段（按搜索词筛选后排除） — itwinjs-core/.../PasswordProtection.ts
   片段中命中 EC 的标识符: ECLicense
📊 扫描文件数: 1200（另有 1 个保护文件跳过）
🔎 内容匹配: 89 文件, 861 处（另有 15 处属于保护区域中的标识符，已跳过）
```

核对提取结果里不含保护区域的标识符：

```bash
node -e "const d=require('./ec-result.json'); console.log(d.identifiers.filter(x=>/ECSecretKey|SecretECHelper/i.test(x)))"
# 输出 [] 即正常
```

## ⚠️ 保护区域 ≠ 替换保护

`protected-files` 只保证**提取阶段**不产出这些标识符。如果满足下面任一条件，
替换阶段仍可能改到保护区域：

1. `base-mapping.json` 等手工映射里已经有这些标识符的旧条目；
2. 替换词以子串形式命中（例如映射 `EC → dm` 会把文件里的 `ECSecretKey` 改成 `dmSecretKey`）。

这类情况需要同时用 `exclude-list.json` 处理：

```json
[
  { "text": "ECSecretKey", "paths": ["itwinjs-core/core/backend/src/PasswordProtection.ts"] }
]
```

`apply-replace` 会按 `paths` 在指定文件里把这段文本藏起来，不参与替换。

## 与其它保护机制的区别

| 机制 | 粒度 | 解决的问题 |
|------|------|-----------|
| `protected-words` | 标识符内部的一段区间 | 已定稿的新词不被二次提取/改写（`szewec` 里的 `ec`） |
| `protected-files` | 整个文件 / 片段中会被提取的标识符 | 密码保护这类代码不能改名 |
| `scan-exclude.json` | 目录 / 扩展名 / 文件名 | 根本不扫描（生成物、依赖、二进制） |
| `exclude-list.json` | 整个标识符（可按路径限定） | 替换阶段跳过指定文本 |

`scan-exclude.json` 只是不扫描；保护文件即使所在目录被它排除，也会被 `protected-files`
单独读入（否则「保护」会因为目录被跳过而失效）。
