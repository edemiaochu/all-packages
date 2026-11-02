# 各目录对应的 GitHub 项目地址

> 查证日期：2026-09-24。除标注外均通过 GitHub API 逐一验证存在。

## ✅ 已确认（iTwin 官方公开仓库，github.com/iTwin）

| 目录名 | GitHub 地址 | 说明 |
|---|---|---|
| admin-components-react | https://github.com/iTwin/admin-components-react | iTwin Platform 管理功能组件 |
| appui | https://github.com/iTwin/appui | iTwin.js AppUI monorepo |
| auth-clients | https://github.com/iTwin/auth-clients | Bentley iTwin 平台认证客户端 |
| bis-schemas | https://github.com/iTwin/bis-schemas | BIS Schema 单一事实源 |
| eslint-plugin | https://github.com/iTwin/eslint-plugin | iTwin ESLint 插件 |
| imodels-clients | https://github.com/iTwin/imodels-clients | iModels API 客户端 monorepo |
| imodel-transformer | https://github.com/iTwin/imodel-transformer | iModel 导出/导入转换 API |
| itwinjs-core | https://github.com/iTwin/itwinjs-core | iTwin.js 核心 monorepo（前身 iTwin/imodeljs） |
| iTwinUI | https://github.com/iTwin/iTwinUI | iTwinUI 设计系统（css / react / variables） |
| iTwinUI-layouts | https://github.com/iTwin/iTwinUI-layouts | iTwinUI 布局组件 |
| object-storage | https://github.com/iTwin/object-storage | 对象存储抽象层 monorepo |
| presentation | https://github.com/iTwin/presentation | iTwin.js Presentation 库 monorepo |
| reality-capture | https://github.com/iTwin/reality-capture | Reality Capture SDK（Analysis/Modeling/Conversion） |
| viewer-components-react | https://github.com/iTwin/viewer-components-react | iTwin Viewer React 组件/hooks |

## 🏠 自有 / 本地改名产物

| 目录名 | 地址 | 说明 |
|---|---|---|
| Replace-Base | https://github.com/edemiaochu/Replace-Base | 本仓库（已由本地 viewer 目录的 git remote 证实） |
| szewtwins-client | 上游源：https://github.com/iTwin/itwins-client | 本地由 itwins-client 改名而来的 szewtwin 私有包，GitHub 上无公开仓库（搜 "szewtwin" 无结果） |

## ⚠️ 未能找到公开 GitHub 仓库（3 个）

| 目录名 | 结论 | 依据 |
|---|---|---|
| base | 未找到公开仓库，疑似 Bentley/iTwin 私有仓库或内部目录 | iTwin 与 BentleySystems 组织的完整公开仓库列表中均无 `base`；npm 无 `@itwin/base*` 包 |
| icons | 疑似私有仓库 **github.com/iTwin/icons**（未登录不可见，API 返回 404） | npm 包 `@itwin/itwinui-icons` / `@itwin/itwinui-icons-react`（appui 的依赖）自 2021 年发布至今从不带 repository 字段；iTwin 公开组织与 iTwinUI 公开仓库中都没有 icons 包；其 5.0.0-alpha 曾指向私有迁移仓库 `iTwin/kiwi`（现已改名 [iTwin/stratakit](https://github.com/iTwin/stratakit)） |
| name-replacer | GitHub 上无对应公开项目，应为本地/内部改名工具 | 全局搜索 "name-replacer" 无 iTwin 相关结果；即 iTwin→szewtwin 批量改名所用工具（Windows 机器 NameReplaceTest 根目录下也有同名目录） |

## 备注

- `itwinjs-core` 旧地址 `https://github.com/iTwin/imodeljs` 仍会 301 重定向到新地址。
- 若 `base` / `icons` / `name-replacer` 确实来自公司内部 Git（如 Bentley 内网或私有 GitHub），需要用有权限的账号执行
  `git ls-remote git@github.com:iTwin/base.git` 之类命令确认实际地址。
