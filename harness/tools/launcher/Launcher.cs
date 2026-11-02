// DeepSeek짱 Harness 포터블 실행기: 설정·대화 기록을 이 폴더의 data\ 에 두고 Harness를 켠다.
// (Start-DeepSeek-Harness.cmd 와 같은 일을 하되, 아이콘이 있고 검은 창이 뜨지 않음)
// 빌드: csc /target:winexe /win32icon:custom-app.ico /out:DeepSeek-Harness.exe Launcher.cs
using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

static class Launcher
{
    [STAThread]
    static void Main()
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string exe = Path.Combine(root, "Harness", "DeepSeek Harness.exe");
        if (!File.Exists(exe))
        {
            MessageBox.Show("Harness\\DeepSeek Harness.exe 를 찾지 못했습니다.\n압축을 푼 폴더 구조 그대로 실행해 주세요.", "DeepSeek짱 Harness");
            return;
        }
        string dsh = Path.Combine(root, "data", "dsh");
        string ud = Path.Combine(root, "data", "electron");
        Directory.CreateDirectory(dsh);
        Directory.CreateDirectory(ud);
        var psi = new ProcessStartInfo(exe, "--user-data-dir=\"" + ud + "\"");
        psi.UseShellExecute = false;
        psi.WorkingDirectory = Path.Combine(root, "Harness");
        psi.EnvironmentVariables["DSH_HOME"] = dsh;
        Process.Start(psi);
    }
}
