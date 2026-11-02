# DeepSeek짱 Harness 포터블 폴더 만들기 (설치 폴더에서 백업·제거 프로그램을 빼고 복사 + 실행 파일·안내문)
param([string]$Out = (Join-Path $PSScriptRoot "..\..\dist\DeepSeekChan-Harness-Portable"))
$ErrorActionPreference = 'Stop'
$src = "$env:LOCALAPPDATA\Programs\DeepSeek Harness"
if (Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue) { throw "Harness가 켜져 있음" }
if (Test-Path $Out) { Remove-Item $Out -Recurse -Force }
New-Item -ItemType Directory -Force "$Out\Harness" | Out-Null

robocopy $src "$Out\Harness" /E /NFL /NDL /NJH /NP /R:1 /W:1 `
  /XF "app.asar.bak-*" "app.asar.orig-*" "app.asar.imgpatch" "app.asar.new" "app.asar.old-swap" "debug.log" "Uninstall DeepSeek Harness.exe" `
  /XD "icon-backup-*" | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 실패: $LASTEXITCODE" }

# 실행 파일: 설정·대화 기록을 이 폴더의 data\ 에 둠 (PC의 기존 Harness와 섞이지 않음)
$cmd = @'
@echo off
rem DeepSeek-chan Harness portable launcher.
rem Settings, sessions and browser data stay in the "data" folder next to this file.
setlocal
set "ROOT=%~dp0"
if not exist "%ROOT%data\dsh" mkdir "%ROOT%data\dsh"
if not exist "%ROOT%data\electron" mkdir "%ROOT%data\electron"
set "DSH_HOME=%ROOT%data\dsh"
start "" "%ROOT%Harness\DeepSeek Harness.exe" --user-data-dir="%ROOT%data\electron"
'@
[IO.File]::WriteAllText("$Out\Start-DeepSeek-Harness.cmd", ($cmd -replace "`r?`n", "`r`n"), [Text.Encoding]::ASCII)

Copy-Item "$PSScriptRoot\portable-README.txt" "$Out\README.txt"
Copy-Item "$PSScriptRoot\portable-NOTICE.txt" "$Out\NOTICE.txt"
$size = (Get-ChildItem $Out -Recurse -File | Measure-Object Length -Sum).Sum
"완료: $Out  ($([math]::Round($size/1GB,2)) GB, 파일 $((Get-ChildItem $Out -Recurse -File).Count)개)"
