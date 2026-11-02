# 포터블 실행기

`DeepSeek-Harness.exe`: 포터블 폴더 맨 위에 두는 실행 파일. 설정·대화 기록을 `data\`에 두고 Harness를 켭니다(`Start-DeepSeek-Harness.cmd`와 같은 일, 아이콘 있음, 검은 창 없음).

빌드 (Windows 내장 .NET 컴파일러):
```
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /optimize+ /win32icon:custom-app.ico /reference:System.Windows.Forms.dll /out:DeepSeek-Harness.exe Launcher.cs
```
