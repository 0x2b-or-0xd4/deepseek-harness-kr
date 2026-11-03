# DeepSeek짱 for DeepSeek Harness

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 0.2.1-rc.5를 한국어로 쓰고, 화면 안에 살아 움직이는 Live2D 버튜버 **DeepSeek짱**을 더하는 DSH 플러그인과 ASAR 패치를 제공합니다.

![DeepSeek짱 소개 영상](docs/preview.gif)

<details>
<summary><b>소개 영상</b></summary>

https://github.com/user-attachments/assets/7e7a96cc-efc8-416d-89a0-f574fdcda690

</details>

## 구성

| 폴더 | 내용 |
|---|---|
| `plugin/` · `package.json` | DSH 플러그인: 한국어 UI, 파스텔 테마, Live2D 캐릭터 |
| `assets/` | 플러그인과 ASAR 패치가 함께 사용하는 캐릭터 코드·Live2D 모델·테마·배경 |
| `harness/overlay/` | 원본 Harness(app.asar)에 적용하는 한국어화·데스크톱 패치 파일 |
| `harness/tools/` | 원본에 overlay를 덮어쓰는 스크립트(Windows `apply-overlay.cjs`, macOS `apply-macos.sh`), 포터블 빌드 스크립트, 분석 도구 |
| `plugins/dsh-tts/` | 말풍선 대사를 음성으로 읽어 주는 옵트인 TTS 플러그인 |
| `infographic/` | 소개 영상 최종본과 제작 파일 |

## 인앱 캐릭터가 하는 일

- 얼굴 추적처럼 자연스러운 고개·몸 움직임 (눈이 먼저, 고개가 뒤따라 · 물리 엔진 몸 흔들림)
- 작업 상태 반응: 시작 → 생각 중(추론을 혼잣말로) → 도구 사용 → 승인 대기(식은땀) → 완료(하트 눈) / 실패(눈물)
- 말풍선 글자의 모음(한글 ㅏㅔㅣㅗㅜ, 영어 a·e·i·o·u)에 맞춘 입 모양
- 클릭 부위별 반응(머리 쓰다듬기 등), 마우스 시선 따라가기
- 한국어·영어 화면 모두 지원
- (선택) 말풍선 대사를 음성으로 읽고, 소리 크기에 맞춰 입을 움직임 — [말풍선 음성](#말풍선-음성-tts-옵트인) 참고

## 플러그인으로 설치 (권장)

DSH **0.2.1-rc.5** 이상의 Desktop 앱과 브라우저 Web UI에서 사용할 수 있습니다. 텍스트 CLI/TUI와 headless 환경은 지원하지 않습니다.

### Harness에서 설치

1. Harness의 **Plugins**에서 **+ Add plugin** 버튼을 클릭합니다.
2. **Add Plugin** 창에 아래 GitHub 주소를 입력해 설치·활성화합니다.

   ```text
   git+https://github.com/noire113-dev/deepseek-harness-kr.git
   ```

3. 한국어가 자동 선택되지 않으면 **Settings → General → Language**에서 **한국어**를 선택합니다.

앱에서 설치하면 현재 앱이 사용하는 프로필에 적용됩니다. 별도의 Node/npm 설치나 전용 패치 스크립트 실행, `app.asar` 교체는 필요하지 않습니다.
플러그인은 DSH 사용자 프로필에 설치되므로 앱 업데이트가 설치 파일을 교체해도 유지됩니다. 비활성화하면 캐릭터·테마·번역 등록이 해제됩니다.

### 업데이트

GitHub 주소로 설치한 플러그인은 설치한 시점의 커밋에 고정되며, 자동으로 업데이트되지 않습니다. Harness의 Plugins 화면에는 공식 플러그인만 업데이트 버튼이 나오므로, 아래 명령으로 최신 버전을 받습니다.

1. Harness를 종료합니다.
2. 명령 프롬프트에서 실행합니다.

   ```bat
   "%LOCALAPPDATA%\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop update deepseek-harness-kr
   ```

   PowerShell에서는 `& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop update deepseek-harness-kr`로 실행합니다. 브라우저 Web UI에 설치했다면 `--profile desktop`을 `--profile web`으로 바꿉니다.

3. Harness를 다시 실행합니다.

캐릭터·테마·한국어 설정은 프로필에 따로 저장되므로 업데이트해도 유지됩니다. 명령줄을 쓰기 어렵다면 **Plugins**에서 이 플러그인을 제거한 뒤 같은 GitHub 주소로 다시 추가해도 최신 버전이 설치되고, 이때도 설정은 유지됩니다.

### 지원 기능

- Live2D 캐릭터의 표정·시선·터치 반응과 모음에 맞춘 입 모양
- 작업 상태·추론 문구에 반응하는 말풍선
- 파스텔 테마 (Harness의 밝은 모드·다크 모드 설정을 그대로 따름)
- UI 번역 54개 네임스페이스를 제공하는 한국어 언어팩
- 별도 옵트인 플러그인 `dsh-tts`와의 음성·입 모양 연동

### 플러그인 설정

**Plugins**에서 이 플러그인의 상세 페이지를 연 뒤, **Components** 아래의 **deepseek-harness-kr**를 클릭하면 설정 창이 열립니다. 여기서 다음 기능을 각각 켜고 끌 수 있습니다.

| 설정 | 기능 |
|---|---|
| 캐릭터와 말풍선 | Live2D 캐릭터, 표정·터치 반응과 말풍선 |
| 파스텔 테마 | 배경·색상·입력창 스타일. 밝은 모드와 다크 모드 모두 지원 (모드는 Harness 설정 → 모양에서 선택) |
| 한국어 언어팩 | 한국어 UI 번역 등록 |

기본값은 모두 활성화이며, 변경 사항은 즉시 적용되고 현재 프로필에 저장됩니다. 한국어 표시 언어는 **Settings → General → Language**에서 선택합니다.

### 호환성

- DSH 0.2.1-rc.5에서 패키지 설치, Host 활성화 및 클라이언트 주입을 검증했습니다.
- 작업 상태와 추론 문구는 화면의 DOM 구조로 감지합니다. DSH 업데이트가 DOM 구조나 플러그인 API를 바꾸면 호환성 수정이 필요할 수 있습니다.
- Electron 네이티브 메뉴·업데이트/복구 창, 패키지 메타데이터 설명과 일부 하드코딩 문구는 언어팩의 번역 대상이 아닙니다.
- 기존 ASAR 패치를 사용 중이라면 원본 `app.asar`를 복원한 뒤 설치하세요. 두 설치 방식을 동시에 사용하면 캐릭터가 중복 표시될 수 있습니다.

### 개발자 빌드

```powershell
npm ci
npm run locales:extract  # overlay의 번역을 수정한 경우
npm run build
npm test
```

빌드는 `assets/`의 캐릭터 코드와 `plugin/locales.ko.json`으로 플러그인 클라이언트를 생성합니다. 설정 스키마는 DSH의 `@deepseek-ai/schemastery`를 사용합니다.
빌드된 `lib/client.js`와 `assets/`를 저장소에 포함하므로 Git 주소로 설치할 때 빌드 스크립트를 실행하지 않습니다.
캐릭터 코드·번역·자산을 수정한 뒤에는 `npm run build`를 실행하고 생성물도 함께 커밋하세요.
사용자에게 나가는 변경이면 `package.json`의 `version`도 올려 주세요. Plugins 화면의 버전 표시로 새 버전인지 구분할 수 있습니다.

## 말풍선 음성 (TTS, 옵트인)

`plugins/dsh-tts`는 캐릭터가 말풍선에 띄우는 대사를 TTS로 읽어 주는 별도 플러그인입니다.

- OpenAI 호환 `/audio/speech` API로 음성을 스트리밍 재생하고, 소리 크기(RMS)에 맞춰 캐릭터 입을 움직입니다. 음소 단위 정밀 립싱크는 아직 지원하지 않습니다.
- 기본값은 **꺼짐**입니다. 꺼져 있으면 외부로 아무 요청도 보내지 않습니다.
- 켜려면 `plugins/dsh-tts/cordis.patch.yml` 설정에서 `enabled: true`로 바꾸고, API 키를 환경변수(기본 `OPENAI_API_KEY`)로 넣습니다. 키는 호스트 환경변수에만 두고 화면 쪽으로 넘기지 않습니다.
- 대사 종류별(반응·상태·혼잣말 등) 켜고 끄기, 보이스·모델·캐시 설정을 지원합니다.
- TTS가 꺼져 있거나 실패해도 말풍선은 평소대로 표시됩니다.

자세한 설정과 라우트 설명은 [`plugins/dsh-tts/README.md`](plugins/dsh-tts/README.md)를 참고하세요.

## 기존 적용 방법 (ASAR 패치, 이전 방식)

`apply-overlay.cjs`는 `harness/overlay/`의 패치 파일과 공통 `assets/`를 함께 적용합니다.

1. DeepSeek Harness 0.2.1-rc.5를 설치하고 한 번 실행 후 종료
2. 원본 백업: `%LOCALAPPDATA%\Programs\DeepSeek Harness\resources\app.asar` → `app.asar.orig`
3. 패치 만들기
   ```
   cd harness\tools
   npm install
   node apply-overlay.cjs "%LOCALAPPDATA%\Programs\DeepSeek Harness\resources\app.asar.orig" app.asar
   ```
4. 만든 `app.asar`를 `resources\` 에 덮어쓰기
5. 자동 업데이트를 끄려면 `harness\tools\app-update.yml`을 `resources\app-update.yml`에 덮어쓰기 (업데이트되면 패치가 지워짐)

되돌리기: 백업한 `app.asar.orig`를 `app.asar`로 되돌리면 됩니다.

### ASAR 패치 업데이트

ASAR 패치는 자동으로 업데이트되지 않습니다. 새 버전이 나오면 패치를 다시 만들어 덮어씁니다.

1. Harness를 종료합니다.
2. 이 저장소의 최신 버전을 받습니다(`git pull`, 또는 GitHub에서 zip을 다시 받기).
3. 위의 3~4단계(패치 만들기 → `resources\`에 덮어쓰기)만 다시 합니다.

**2단계(원본 백업)는 다시 하지 마세요.** 이미 패치된 `app.asar`로 `app.asar.orig`를 덮어쓰면 원본이 사라집니다. 패치는 항상 처음 백업한 원본으로 만듭니다.

### 플러그인 방식으로 바꾸기

앞으로 [업데이트](#업데이트)를 명령 한 줄로 하려면 플러그인 방식으로 바꿀 수 있습니다.

1. Harness를 종료하고, 백업한 `app.asar.orig`를 `app.asar`로 되돌립니다.
2. Harness를 켜고 [플러그인으로 설치](#플러그인으로-설치-권장)를 따라 설치합니다.

패치를 그대로 둔 채 플러그인을 설치하면 캐릭터가 두 개 표시됩니다. 대화 기록과 설정은 사용자 폴더에 저장되므로 `app.asar`를 바꿔도 유지됩니다.

## 적용 방법 (macOS, Apple silicon)

overlay는 Windows판과 macOS판에 공통으로 쓰입니다. 두 원본 asar에서 overlay가 덮어쓰는 파일들은 CSS 클래스 해시와 빌드 경로 주석만 다릅니다.

1. [공식 다운로드](https://www.deepseek.com/en/download/)에서 macOS용 DeepSeek Harness 0.2.1-rc.5를 받아 `/Applications`에 설치하고, 한 번 실행한 뒤 종료
2. 준비
   - Node.js가 필요합니다. 없으면 `brew install node` 등으로 설치합니다.
   - 스크립트를 실행할 터미널 앱(터미널, iTerm 등)에 **시스템 설정 → 개인정보 보호 및 보안 → 앱 관리** 권한을 켭니다. 꺼져 있으면 macOS가 `/Applications` 안의 앱 수정을 막아 `cp: ... app.asar.orig: Operation not permitted`로 멈춥니다. 권한을 켠 뒤 터미널을 다시 열고 실행하세요.
3. 패치 적용
   ```
   cd harness/tools
   npm install
   sh apply-macos.sh                       # 기본 경로: /Applications/DeepSeek Harness.app
   sh apply-macos.sh "/경로/DeepSeek Harness.app"
   ```
   원본 백업(`app.asar.orig`, `app-update.yml.orig`, `Info.plist.orig`, 처음 한 번만) → overlay 적용 → `Info.plist`의 `ElectronAsarIntegrity` 해시 갱신 → 자동 업데이트 끔 → ad-hoc 재서명 → quarantine 속성 제거 순서로 진행합니다. 다시 실행해도 항상 원본에서 새로 만듭니다.

업데이트: 이 저장소의 최신 버전을 받은 뒤 Harness를 종료하고 `sh apply-macos.sh`를 다시 실행합니다. 스크립트는 처음 백업한 원본에서 새로 만들기 때문에 백업을 다시 할 필요가 없습니다.

패치한 앱은 DeepSeek 공식 서명 대신 로컬 ad-hoc 서명을 쓰므로 Gatekeeper의 공증 확인을 거치지 않습니다.

되돌리기: `Contents/Resources/app.asar.orig` → `app.asar`, `Contents/Resources/app-update.yml.orig` → `app-update.yml`, `Contents/Info.plist.orig` → `Info.plist`로 되돌린 뒤 `codesign --force --deep -s - "/Applications/DeepSeek Harness.app"`를 실행합니다.

## 포터블(설치 없이 실행)

`harness/tools/build-portable.ps1`이 패치된 설치본을 복사해 `Start-DeepSeek-Harness.cmd`로 실행되는 포터블 폴더를 만듭니다. 설정·대화 기록은 폴더 안 `data\`에 저장됩니다(`DSH_HOME`, `--user-data-dir`). 완성본은 [Releases](https://github.com/noire113-dev/deepseek-harness-kr/releases)에 올립니다.

### 포터블 업데이트

포터블은 자동으로 업데이트되지 않습니다. 설정과 대화 기록은 `data\` 폴더에만 있으므로, 새 버전으로 바꿀 때 이 폴더만 옮기면 됩니다.

1. 포터블 Harness를 종료합니다.
2. [Releases](https://github.com/noire113-dev/deepseek-harness-kr/releases/latest)에서 최신 `DeepSeekChan-Harness-Portable.zip`을 받아 새 폴더에 풉니다.
3. 예전 포터블 폴더의 `data\` 폴더를 새 폴더로 옮깁니다(`DeepSeek-Harness.exe`와 같은 위치).
4. 새 폴더의 `DeepSeek-Harness.exe`로 실행합니다. 문제가 없으면 예전 폴더는 지워도 됩니다.

포터블도 안쪽은 ASAR 패치 방식이라, 플러그인을 함께 설치하면 캐릭터가 두 개 표시됩니다.

## 라이선스

- 이 저장소의 코드: MIT (`LICENSE`)
- 포함된 제3자 구성 요소와 그림: `NOTICE.md`

## 만든 사람

- [@noire113-dev](https://github.com/noire113-dev) — 기획, 테스트, 배경 그림
- [Claude](https://claude.ai) (Anthropic, Claude Code) — 한국어화·인앱 캐릭터 코드, 패치·빌드 도구, 소개 영상 제작
- Live2D 모델 원작: Kamiya_Ryoko (VGen @KAMIYA) — `NOTICE.md` 참고

### 기여해 주신 분

- [@conankun](https://github.com/conankun) — 말풍선 TTS와 오디오 기반 입 모양 플러그인 `plugins/dsh-tts` ([#2](https://github.com/noire113-dev/deepseek-harness-kr/pull/2))
- [@shortstories](https://github.com/shortstories) — Harness 플러그인 메뉴에서 바로 설치하는 방식, 캐릭터·테마·한국어 개별 설정 ([#3](https://github.com/noire113-dev/deepseek-harness-kr/pull/3))
- [@TraceofLight](https://github.com/TraceofLight) — macOS(Apple silicon) 적용 스크립트 ([#4](https://github.com/noire113-dev/deepseek-harness-kr/pull/4))
- [@iwannagit](https://github.com/iwannagit) — 파스텔 테마 다크 모드 지원 ([#5](https://github.com/noire113-dev/deepseek-harness-kr/pull/5))

좋은 기능을 보내 주신 분들께 감사드립니다!
