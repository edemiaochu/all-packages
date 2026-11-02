#!/bin/bash
# rush-all.sh — 在所有 Rush 子项目中统一执行 rush 命令
#
# 用法: ./rush-all.sh <command> [args...]
# 示例: ./rush-all.sh install
#       ./rush-all.sh update
#       ./rush-all.sh build --to @iproject/core-szew
#       ./rush-all.sh test
#       ./rush-all.sh lint

set -e

RUSH_PROJECTS=(
  "iprojectjs-core"
  "viewer"
  "iworks-clients"
  "object-storage"
  "admin-components-react"
)

if [ $# -eq 0 ]; then
  echo "用法: rush-all.sh <rush 命令> [参数...]"
  echo ""
  echo "子项目:"
  for proj in "${RUSH_PROJECTS[@]}"; do
    echo "  - $proj"
  done
  echo ""
  echo "示例:"
  echo "  rush-all.sh install"
  echo "  rush-all.sh update"
  echo "  rush-all.sh build"
  echo "  rush-all.sh test"
  exit 0
fi

COMMAND="$*"
START_DIR=$(pwd)
PASS=0
FAIL=0

echo "============================================"
echo "  rush-all: rush $COMMAND"
echo "  子项目: ${#RUSH_PROJECTS[@]} 个"
echo "============================================"
echo ""

for proj in "${RUSH_PROJECTS[@]}"; do
  echo -e "\033[1;36m>>> $proj: rush $COMMAND\033[0m"
  cd "$START_DIR/$proj"

  if rush "$@" 2>&1; then
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

if [ $FAIL -gt 0 ]; then
  exit 1
fi
