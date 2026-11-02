@echo off
REM rush-all.bat — 在所有 Rush 子项目中统一执行 rush 命令
REM
REM 用法: rush-all.bat <command> [args...]
REM 示例: rush-all.bat install
REM        rush-all.bat build
REM        rush-all.bat test

setlocal enabledelayedexpansion

set RUSH_PROJECTS=iprojectjs-core viewer iworks-clients object-storage admin-components-react

if "%~1"=="" (
  echo 用法: rush-all.bat ^<rush 命令^> [参数...]
  echo.
  echo 子项目:
  for %%p in (%RUSH_PROJECTS%) do echo   - %%p
  echo.
  echo 示例:
  echo   rush-all.bat install
  echo   rush-all.bat update
  echo   rush-all.bat build
  echo   rush-all.bat test
  exit /b 0
)

set COMMAND=%*
set START_DIR=%CD%
set PASS=0
set FAIL=0

echo ============================================
echo   rush-all: rush %COMMAND%
echo   子项目: 4 个
echo ============================================
echo.

for %%p in (%RUSH_PROJECTS%) do (
  echo [0;36m>>> %%p: rush %COMMAND%
  cd /d "%START_DIR%\%%p"

  rush %* 2>&1
  if !errorlevel! equ 0 (
    echo [0;32m<<< %%p: OK
    set /a PASS+=1
  ) else (
    echo [0;31m<<< %%p: FAILED
    set /a FAIL+=1
  )
  echo.
)

echo ============================================
echo   通过: %PASS%  失败: %FAIL%
echo ============================================

if %FAIL% gtr 0 exit /b 1
exit /b 0
