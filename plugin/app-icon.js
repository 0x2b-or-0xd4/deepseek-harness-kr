// 앱 바로가기(.lnk) 아이콘 바꾸기 — Windows 전용.
//
// 설치 경로를 하드코딩하지 않는다. 호스트는 앱 안에서 돌기 때문에 process.execPath 로
// 지금 실행 중인 실행 파일을 알 수 있고, 그 실행 파일(또는 같은 설치 폴더의 런처)을
// 가리키는 바로가기만 골라 아이콘을 바꾼다. 그래서 커스텀 경로·포터블 설치에서도 동작한다.
//
// 바뀌는 것은 바로가기 아이콘뿐이다. 실행 중인 창·작업 표시줄 아이콘은 exe 리소스에서
// 오므로 플러그인이 바꿀 수 없다(바꾸면 코드 서명이 깨진다).
import { execFile } from 'node:child_process'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

export const APP_ICON_FILE = 'app-icon.ico'
export const PROFILE_DIR = 'deepseek-harness-kr'
const SEP = /[\\/]+/

export const isWindows = (platform = process.platform) => platform === 'win32'

// 경로를 소문자 세그먼트 배열로 (드라이브 문자·구분자 차이 무시)
const segments = (path) => resolve(String(path)).replace(/\\/g, '/').toLowerCase().split('/').filter(Boolean)

// 실행 파일과 바로가기 대상이 같은 설치 폴더인지.
//  · 같거나, 한쪽이 다른 쪽의 상위 폴더면 같은 설치로 본다
//    (포터블 런처 `...\Portable\App.exe` ↔ 내부 exe `...\Portable\Harness\App.exe`)
//  · 공유 구간이 2칸 미만이면(드라이브 루트 등) 인정하지 않는다
//  · 이름이 접두어만 같은 남의 폴더(`C:\Apps\DSH` ↔ `C:\Apps\DSH2`)는 제외
export function sameInstall(target, exe) {
  if (typeof target !== 'string' || typeof exe !== 'string' || !target || !exe) return false
  const dirT = segments(target).slice(0, -1)
  const dirE = segments(exe).slice(0, -1)
  const isPrefix = (a, b) => a.length <= b.length && a.every((s, i) => s === b[i])
  const shorter = Math.min(dirT.length, dirE.length)
  if (shorter < 2) return false
  return isPrefix(dirT, dirE) || isPrefix(dirE, dirT)
}

// 바로가기에 넣을 IconLocation 값. bind: 아이콘 파일, restore: 원래 실행 파일 아이콘
export const shortcutIconValue = (path) => `${path},0`

// 아이콘을 안정된 경로(%LOCALAPPDATA%\deepseek-harness-kr\app-icon.ico)로 복사한다.
// 설치 폴더가 바뀌거나 플러그인이 업데이트돼도 바로가기가 깨지지 않게 하기 위함.
export async function installIconFile(assetsDir, env = process.env) {
  const source = join(assetsDir, APP_ICON_FILE)
  const base = env.LOCALAPPDATA || join(env.USERPROFILE || env.HOME || '.', 'AppData', 'Local')
  const target = join(base, PROFILE_DIR, APP_ICON_FILE)
  await mkdir(dirname(target), { recursive: true })
  await copyFile(source, target)
  return target
}

// 바로가기를 찾아 아이콘을 바꾸는 PowerShell. 대상은 지금 실행 중인 exe 또는 그 설치 폴더.
// 경로는 인자로만 넘겨 스크립트에 문자열을 끼워 넣지 않는다.
const SCRIPT = String.raw`param([string]$Exe, [string]$Root, [string]$Parent, [string]$Icon, [switch]$Restore)
$ErrorActionPreference = 'SilentlyContinue'
$shell = New-Object -ComObject WScript.Shell
$dirs = @(
  [Environment]::GetFolderPath('Desktop'),
  [Environment]::GetFolderPath('CommonDesktopDirectory'),
  [Environment]::GetFolderPath('StartMenu'),
  [Environment]::GetFolderPath('CommonStartMenu'),
  (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar')
)
$changed = 0
foreach ($dir in $dirs) {
  if (-not $dir -or -not (Test-Path -LiteralPath $dir)) { continue }
  Get-ChildItem -LiteralPath $dir -Recurse -Filter '*.lnk' -File -ErrorAction SilentlyContinue | ForEach-Object {
    $shortcut = $shell.CreateShortcut($_.FullName)
    $target = $shortcut.TargetPath
    if (-not $target) { return }
    $targetDir = [System.IO.Path]::GetDirectoryName($target)
    $match = ($target -ieq $Exe) -or ($targetDir -ieq $Root) -or ($targetDir -ieq $Parent)
    if (-not $match) { return }
    $want = if ($Restore) { "$target,0" } else { "$Icon,0" }
    if ($shortcut.IconLocation -ne $want) {
      $shortcut.IconLocation = $want
      $shortcut.Save()
      $script:changed++
    }
  }
}
$changed
`

// 스크립트를 -File 로 실행한다(-Command 로 param 블록을 넘기면 실패한다).
async function installScriptFile(env) {
  const base = env.LOCALAPPDATA || join(env.USERPROFILE || env.HOME || '.', 'AppData', 'Local')
  const dir = join(base, PROFILE_DIR)
  await mkdir(dir, { recursive: true })
  const target = join(dir, 'shortcut-icon.ps1')
  await writeFile(target, SCRIPT, 'utf8')
  return target
}

/**
 * 설정이 켜져 있으면 바로가기 아이콘을 플러그인 아이콘으로, 꺼져 있으면 원래대로 되돌린다.
 * @returns {Promise<{skipped?: string, changed?: number}>}
 */
export async function applyShortcutIcon({ assetsDir, enabled, exePath = process.execPath, platform = process.platform, env = process.env, runner = run }) {
  if (!isWindows(platform)) return { skipped: 'platform' }
  if (!exePath) return { skipped: 'no-exec-path' }
  const icon = await installIconFile(assetsDir, env)
  const script = await installScriptFile(env)
  const root = dirname(exePath)
  const parent = dirname(root)
  const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script,
    '-Exe', exePath, '-Root', root, '-Parent', parent, '-Icon', icon]
  if (!enabled) args.push('-Restore')
  try {
    const { stdout } = await runner('powershell.exe', args, { timeout: 20000, windowsHide: true })
    const changed = Number(String(stdout).trim().split(/\s+/).pop())
    return { changed: Number.isFinite(changed) ? changed : 0 }
  } catch (error) {
    return { skipped: 'spawn-failed', message: error?.message }
  }
}
