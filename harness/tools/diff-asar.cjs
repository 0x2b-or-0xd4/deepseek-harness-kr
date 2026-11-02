// 원본 asar 대비 바뀐/추가된/빠진 파일 목록 (헤더의 integrity 해시 비교)
const asar = require('@electron/asar');
const RES = process.env.LOCALAPPDATA + '/Programs/DeepSeek Harness/resources';
function flat(node, pre, out) {
  for (const [k, v] of Object.entries(node.files || {})) {
    const p = pre ? pre + '/' + k : k;
    if (v.files) flat(v, p, out); else out.set(p, (v.integrity && v.integrity.hash) || (v.unpacked ? 'unpacked:' + v.size : String(v.size)));
  }
  return out;
}
const a = flat(asar.getRawHeader(RES + '/app.asar.orig-0.2.1-rc.5').header, '', new Map());
const b = flat(asar.getRawHeader(RES + '/app.asar').header, '', new Map());
const changed = [], added = [], removed = [];
for (const [p, h] of b) { if (!a.has(p)) added.push(p); else if (a.get(p) !== h) changed.push(p); }
for (const p of a.keys()) if (!b.has(p)) removed.push(p);
console.log('바뀜', changed.length); changed.forEach((p) => console.log('  ~ ' + p));
console.log('추가', added.length); added.forEach((p) => console.log('  + ' + p));
console.log('빠짐', removed.length); removed.slice(0, 20).forEach((p) => console.log('  - ' + p));
