// 인포그래픽 녹화기 (Electron): 페이지 시계를 1/30초씩 넘기며 프레임을 JPEG로 저장
//   electron record.cjs <페이지> <초> <출력폴더> [시작초]
const { app, BrowserWindow } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const [page, secs, outDir, startArg] = process.argv.slice(2);
const ROOT = __dirname, FPS = 30;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.moc3': 'application/octet-stream', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.whenReady().then(() => server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const win = new BrowserWindow({ show: false, width: 1920, height: 1080, useContentSize: true, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setFrameRate(60);
  win.webContents.on('console-message', (e, level, msg) => { if (level >= 2) console.log('[page]', msg); });
  await win.loadURL(`http://127.0.0.1:${port}/${page}`);
  await win.webContents.executeJavaScript('window.__ready');
  fs.mkdirSync(outDir, { recursive: true });
  const N = Math.round(Number(secs) * FPS), start = Number(startArg || 0);
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const t = start + i / FPS;
    await win.webContents.executeJavaScript(`window.__frame(${t.toFixed(4)})`);
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(outDir, `f${String(i + 1).padStart(5, '0')}.jpg`), img.toJPEG(93));
    if (i % 150 === 0) console.log(`${i}/${N} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  console.log('완료', N, '프레임');
  app.quit();
}));
