<#
.SYNOPSIS
    检查 VC++ 运行库 (msvcp140.dll 等) 版本，结果写入文本文件。
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\check-vcruntime.ps1
#>

$ErrorActionPreference = 'SilentlyContinue'
$outFile = Join-Path $PSScriptRoot 'vc-runtime-report.txt'

$lines = New-Object System.Collections.Generic.List[string]
function Add-Line([string]$text) { $lines.Add($text) }

Add-Line "== VC++ runtime report =="
Add-Line ("Generated : " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
Add-Line ("Computer  : " + $env:COMPUTERNAME)
Add-Line ""

Add-Line "-- DLL files --"
$dlls = @(
    'C:\Windows\System32\msvcp140.dll',
    'C:\Windows\System32\msvcp140_1.dll',
    'C:\Windows\System32\msvcp140_2.dll',
    'C:\Windows\System32\vcruntime140.dll',
    'C:\Windows\System32\vcruntime140_1.dll',
    'C:\Windows\SysWOW64\msvcp140.dll',
    'C:\Windows\SysWOW64\vcruntime140.dll'
)
foreach ($dll in $dlls) {
    $fi = Get-Item $dll
    if ($fi) {
        Add-Line ("{0,-45} {1}" -f $fi.FullName, $fi.VersionInfo.FileVersion)
    } else {
        Add-Line ("{0,-45} (not found)" -f $dll)
    }
}
Add-Line ""

Add-Line "-- Installed redistributables --"
$keys = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
Get-ItemProperty $keys |
    Where-Object { $_.DisplayName -like '*Visual C++*' } |
    Sort-Object DisplayName |
    ForEach-Object { Add-Line ("{0}  [{1}]" -f $_.DisplayName, $_.DisplayVersion) }
Add-Line ""

Add-Line "-- Resolved by PATH (where.exe) --"
$where = & where.exe msvcp140.dll 2>$null
if ($where) { $where | ForEach-Object { Add-Line $_ } } else { Add-Line '(not on PATH)' }

$lines | Set-Content -Path $outFile -Encoding UTF8
Write-Host ("Report written to: " + $outFile)
