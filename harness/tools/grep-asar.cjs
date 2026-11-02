// asar 안 파일 하나에서 정규식 찾기: node grep-asar.cjs <asar 안 경로(/ 구분)> <정규식> [앞뒤 글자 수]
const asar = require('@electron/asar');
const path = require('path');
const A = process.env.LOCALAPPDATA + '/Programs/DeepSeek Harness/resources/app.asar';
const s = asar.extractFile(A, path.join(...process.argv[2].split('/'))).toString();
const re = new RegExp(process.argv[3], 'g');
const ctx = Number(process.argv[4] || 100);
let m, n = 0;
while ((m = re.exec(s)) && n < 12) { n++; console.log('---', m.index); console.log(s.slice(Math.max(0, m.index - ctx), m.index + m[0].length + ctx)); }
console.log('찾은 수(최대 12 표시):', n);
