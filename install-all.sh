#!/bin/bash
# install-all.sh — 在所有子项目中安装依赖
#
# 用法: ./install-all.sh [install|build|test|clean]

set -e

# 5 个 Rush 子项目
RUSH_PROJECTS=(
  "iprojectjs-core"
  "viewer"
  "iworks-clients"
  "object-storage"
  "admin-components-react"
)

# 6 个 pnpm 子项目
PNPM_PROJECTS=(
  "appui"
  "presentation"
  "iProjectUI"
  "viewer-components-react"
  "auth-clients"
  "reality-capture"
)

# 1 个 Yarn 子项目
YARN_PROJECTS=(
  "iProjectUI-layouts"
)

CMD="${1:-install}"
START_DIR=$(pwd)
PASS=0
FAIL=0

echo "============================================"
echo "  install-all: $CMD"
echo "  子项目: Rush x${#RUSH_PROJECTS[@]} + pnpm x${#PNPM_PROJECTS[@]} + Yarn x${#YARN_PROJECTS[@]}"
echo "============================================"
echo ""

# Rush
for proj in "${RUSH_PROJECTS[@]}"; do
  echo -e "\033[1;36m>>> [Rush ] $proj\033[0m"
  cd "$START_DIR/$proj"
  if rush "$CMD" 2>&1 | tail -3; then
    echo -e "\033[1;32m<<< $proj: OK\033[0m"
    PASS=$((PASS + 1))
  else
    echo -e "\033[1;31m<<< $proj: FAILED\033[0m"
    FAIL=$((FAIL + 1))
  fi
  echo ""
done

# pnpm
for proj in "${PNPM_PROJECTS[@]}"; do
  echo -e "\033[1;36m>>> [pnpm ] $proj\033[0m"
  cd "$START_DIR/$proj"
  if pnpm "$CMD" 2>&1 | tail -3; then
    echo -e "\033[1;32m<<< $proj: OK\033[0m"
    PASS=$((PASS + 1))
  else
    echo -e "\033[1;31m<<< $proj: FAILED\033[0m"
    FAIL=$((FAIL + 1))
  fi
  echo ""
done

# Yarn
for proj in "${YARN_PROJECTS[@]}"; do
  echo -e "\033[1;36m>>> [Yarn ] $proj\033[0m"
  cd "$START_DIR/$proj"
  if yarn "$CMD" 2>&1 | tail -3; then
    echo -e "\033[1;32m<<< $proj: OK\033[0m"
    PASS=$((PASS + 1))
  else
    echo -e "\033[1;31m<<< $proj: FAILED\033[0m"
    FAIL=$((FAIL + 1))
  fi
  echo ""
done

echo "============================================"
echo "  通过: $PASS  失败: $FAIL"
echo "============================================"
[ $FAIL -gt 0 ] && exit 1
