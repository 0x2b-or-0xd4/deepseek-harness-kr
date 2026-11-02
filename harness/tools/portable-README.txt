DeepSeek짱 Harness (포터블)
===========================

DeepSeek Harness 0.2.1-rc.5에 한국어 화면, 파스텔 테마, Live2D 인앱 캐릭터 "DeepSeek짱"을
더한 버전입니다. 설치 없이 압축만 풀어서 씁니다.


실행
----
1. 압축을 원하는 곳에 풉니다. (경로에 한글·공백이 있어도 됩니다)
2. Start-DeepSeek-Harness.cmd 를 더블클릭합니다.
   - Harness\DeepSeek Harness.exe 를 직접 실행하면 설정이 PC의 기본 위치에 저장되니
     꼭 Start-DeepSeek-Harness.cmd 로 켜 주세요.
3. 처음 켜면 모델 연결 화면이 나옵니다. DeepSeek API 키를 넣거나 계정으로 로그인하세요.
   (로컬 모델 서버를 쓰려면 아래 "로컬 모델 연결" 참고)

필요한 것: Windows 10/11 64비트. 따로 설치할 프로그램은 없습니다.


저장 위치 (전부 이 폴더 안)
--------------------------
- data\dsh       : Harness 설정, 프로필, 대화 기록
- data\electron  : 화면(브라우저) 캐시
폴더째 옮기거나 USB에 넣어 다녀도 됩니다. 지우면 깨끗이 처음 상태가 됩니다.
단, AI가 파일을 읽고 쓰는 "기본 작업 공간"은 문서\deepseek-harness\default-workspace 에
만들어집니다. 다른 폴더를 쓰려면 왼쪽 "작업 공간" 옆 폴더 단추로 추가하세요.

PC에 바뀌는 것은 하나뿐입니다: Harness가 켜질 때 dsh:// 링크(계정 로그인 돌아오기용)를
이 실행 파일로 연결합니다. 원래 Harness를 설치해 쓰는 PC라면, 설치본을 한 번 켜면 다시
설치본으로 연결됩니다.


DeepSeek짱 (오른쪽 아래 캐릭터)
------------------------------
- 작업을 시키면: "알겠어요! 시작할게요" → 머리 위 로딩 표시
- 생각하는 동안: 점선 말풍선으로 추론 내용을 가끔 중얼거림 (한국어·영어 추론)
- 명령 실행·파일 읽기 같은 도구를 쓰면: "명령 실행 중…" 같은 말풍선
- 승인·질문을 기다리면: 식은땀 + "확인이 필요해요!"
- 끝나면: 하트 눈 + "다 했어요!" / 실패하면: 눈물 + "앗, 문제가 생겼어요…"
- 클릭하면 부위별로 반응 (머리 쓰다듬기 등). 투명한 곳 클릭은 뒤 화면으로 넘어감
- 마우스를 따라 고개와 눈이 움직임
- 화면이 좁아 입력창을 가리게 되면 숨음

화면 언어: 한국어 Windows는 처음부터 한국어, 그 밖에는 영어로 뜹니다.
설정 → 일반 → 언어에서 "한국어"를 고르면 바뀝니다. 캐릭터는 두 언어 모두에서 반응합니다.


로컬 모델 연결 (선택)
--------------------
llama.cpp 같은 OpenAI 호환 서버를 쓰려면, 한 번 켰다 끈 뒤 아래 파일을 고칩니다.
  data\dsh\profiles\desktop\cordis.patch.yml
예시:
  - id: llm-pi-ai
    config:
      providers:
        mylocal:
          displayName: My local server
          api: openai-completions
          baseURL: http://127.0.0.1:8080/v1
          apiKeyEnv: MYLOCAL_API_KEY
          compat:
            supportsDeveloperRole: false
            maxTokensField: max_tokens
          models:
            - id: my-model
              name: My model
              contextWindow: 32768
              maxTokens: 4096
              input: [ text ]
그리고 data\dsh\.env 파일에 MYLOCAL_API_KEY=local 한 줄을 넣습니다(아무 값이나 됨).


자동 업데이트
------------
꺼져 있습니다. 업데이트하면 한국어·캐릭터 수정이 지워지기 때문입니다.


문제 해결
--------
- 아무것도 안 뜸: 이미 이 포터블이 켜져 있는지 작업 표시줄 트레이를 확인
- 캐릭터가 안 보임: 창을 넓히면 나타납니다 (입력창을 가리지 않을 자리가 있어야 함)
- 처음 상태로 되돌리기: Harness를 끄고 data 폴더를 지움
