// app.asar 안 여러 파일에 문자열 치환을 적용한 app.asar.new 를 만든다.
// 사용: node patch-files.cjs <spec.cjs>   (spec: module.exports = { "asar/안/경로": [[찾을 문자열, 바꿀 문자열], ...] })
// 방식: 바뀐 파일 내용을 데이터 끝에 붙이고 헤더의 그 항목만 고침 (다른 파일·unpacked 표시는 그대로).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const asar = require('@electron/asar');
const pickle = require('@electron/asar/lib/pickle').Pickle;

const RES = process.env.LOCALAPPDATA + '/Programs/DeepSeek Harness/resources';
const SRC = path.join(RES, 'app.asar');
const OUT = path.join(RES, 'app.asar.new');
const spec = require(path.resolve(process.argv[2]));

const raw = asar.getRawHeader(SRC);
const header = raw.header;
const fd = fs.openSync(SRC, 'r');
const total = fs.fstatSync(fd).size;
const dataStart = 8 + raw.headerSize;
let tailOffset = total - dataStart;
const tails = [];
const BLOCK = 4 * 1024 * 1024;

for (const [rel, reps] of Object.entries(spec)) {
  const parts = rel.split('/');
  let s = asar.extractFile(SRC, path.join(...parts)).toString('utf8');
  for (const [from, to] of reps) {
    if (!s.includes(from)) throw new Error(`${rel}: 못 찾음: ${from.slice(0, 80)}`);
    s = s.split(from).join(to);
  }
  const data = Buffer.from(s, 'utf8');
  let node = header;
  for (const p of parts) node = node.files[p];
  const blocks = [];
  for (let i = 0; i < data.length; i += BLOCK) blocks.push(crypto.createHash('sha256').update(data.subarray(i, i + BLOCK)).digest('hex'));
  node.size = data.length;
  node.offset = String(tailOffset);
  node.integrity = { algorithm: 'SHA256', hash: crypto.createHash('sha256').update(data).digest('hex'), blockSize: BLOCK, blocks };
  tailOffset += data.length;
  tails.push([rel, data]);
}

const hp = pickle.createEmpty(); hp.writeString(JSON.stringify(header));
const headerBuf = hp.toBuffer();
const sp = pickle.createEmpty(); sp.writeUInt32(headerBuf.length);
const out = fs.openSync(OUT, 'w');
fs.writeSync(out, sp.toBuffer()); fs.writeSync(out, headerBuf);
const buf = Buffer.alloc(8 * 1024 * 1024);
for (let pos = dataStart; pos < total;) { const n = fs.readSync(fd, buf, 0, Math.min(buf.length, total - pos), pos); fs.writeSync(out, buf, 0, n); pos += n; }
for (const [, data] of tails) fs.writeSync(out, data);
fs.closeSync(out); fs.closeSync(fd);
for (const [rel, data] of tails) {
  if (!asar.extractFile(OUT, path.join(...rel.split('/'))).equals(data)) throw new Error('검증 실패: ' + rel);
  console.log('고침:', rel, data.length);
}
console.log('완료:', OUT, fs.statSync(OUT).size);
