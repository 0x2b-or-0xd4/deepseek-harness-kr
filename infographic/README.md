# 인포그래픽 광고 다시 만들기

캐릭터를 Harness 화면 캡처 없이 직접 렌더링해 만든 광고 영상의 원본.

- `index.html` : 장면·자막·설명선·캐릭터 연기 시간표 (모든 애니메이션은 녹화 시계 기준)
- `DeepSeekHarness_인포그래픽.mp4` : 최종 영상 (57초, 1920×1080)
- `stage.js` : 캐릭터 무대 (Harness 인앱 펫과 같은 모델·3판 움직임). `node build-stage.cjs`로 다시 만듦
- `assets/` : 저장소에 없음. `../harness/overlay/dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/dsc/` 를 이 폴더의 `assets/` 로 복사
- 렌더링: `"<펫 폴더>\pet\node_modules\electron\dist\electron.exe" record.cjs index.html 57 frames`
- 영상: `ffmpeg -framerate 30 -i frames/f%05d.jpg -c:v libx264 -crf 16 -pix_fmt yuv420p out.mp4`
