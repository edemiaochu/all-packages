### 提取关键词并形成映射表 执行顺序

> 扫描范围：`search-sensitive` / `search-ec` / `replace-staged` 默认都覆盖 `-d` 指定目录下的
> **所有文件夹 + 所有扩展名**。需要排除的文件夹 / 扩展名 / 文件名统一写在
> `name-replacer/scan-exclude.json`（`dirs` / `exts` / `files` 三段）。
#### 1. 
```bash 
node name-replacer/search-sensitive.mjs -d /Users/luokun/Desktop/npm修改 --concise -o result.json --words-file base-words.json

### 参数说明
##### -d
指定要搜索和替换的目录

##### --concise
指定是否使用简洁模式，简洁模式会跳过一些不必要的步骤，如生成替换后的文件等
```
#### 2. 
```bash 
node name-replacer/search-ec.mjs -d /Users/luokun/Desktop/npm修改 --concise -o ec-result.json --fused
```

#### 3. 
```bash node 
name-replacer/merge-ids.mjs ec-result.json result.json -o all-ids.json
```

#### 4. 
```bash 
node name-replacer/replace-server.mjs --input all-ids.json 
```

#### 5.补充：上下文感知的 bim 词族替换
```bash
# 只替换文件后缀/扩展名/格式字面量相关的 bim/ibim/bims
# 路径段、目录名、建筑语义的 bim 一律不动
node name-replacer/replace-bim.mjs --dry-run --targets name-replacer/targets.json
node name-replacer/replace-bim.mjs --targets name-replacer/targets.json
# 或直接指定目录（--dir 与 --targets 可混用）
node name-replacer/replace-bim.mjs --dry-run --dir test/src
```


#### 6.分阶段替换
```bash
# 用 targets.json 指定分批替换顺序
node name-replacer/replace-staged.mjs --targets name-replacer/targets.json

# 预览模式
node name-replacer/replace-staged.mjs --targets name-replacer/targets.json --dry-run

# 跳过 Rush 清空（重新运行时保留 rush.json）
node name-replacer/replace-staged.mjs --targets name-replacer/targets.json --no-clear-rush

# 快速替换单个目录
node name-replacer/replace-staged.mjs --dir itwinjs-core/core/bentley --dir appui/ui/core-react
```



