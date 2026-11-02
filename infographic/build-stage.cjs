// stage.js = stage-head.js + 3판 움직임 블록(마우스 대신 지정 시선) + API
const fs = require('fs');
const path = require('path');
const D = __dirname;
let motion = fs.readFileSync(path.join(D, 'motion-block3g.js'), 'utf8');
const rep = (a, b) => { if (!motion.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 60)); motion = motion.split(a).join(b); };
// 마우스 대신 인포그래픽이 정한 시선
rep('if (muttering) { tx = 0.4; ty = 0.38; }', 'if (lookTarget) { tx = lookTarget.x; ty = lookTarget.y; } else if (muttering) { tx = 0.4; ty = 0.38; }');
const head = fs.readFileSync(path.join(D, 'stage-head.js'), 'utf8');
const tail = `
    let lookTarget = null;
    // 눈·입·귀의 실제 위치 (캔버스 좌표): 부품에 속한 메시들의 경계 중심
    const DR = cm.drawables, PA = cm.parts;
    const partOf = (ids) => { const set = new Set(ids), out = []; for (let i = 0; i < DR.count; i++) for (let p = DR.parentPartIndices[i]; p >= 0; p = PA.parentIndices[p]) if (set.has(PA.ids[p])) { out.push(i); break; } return out; };
    const FEAT = { eye: partOf(["Part49", "Part36", "Part141", "Part146"]), mouth: partOf(["Part12", "Part149"]), earL: partOf(["Part159"]), earR: partOf(["Part157"]) };
    const featBox = (list) => {
      const pts = [];
      for (const i of list) { if (DR.opacities[i] < 0.05) continue; const v = im.getDrawableVertices(i); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let k = 0; k < v.length; k += 2) { x0 = Math.min(x0, v[k]); x1 = Math.max(x1, v[k]); y0 = Math.min(y0, v[k + 1]); y1 = Math.max(y1, v[k + 1]); } pts.push([(x0 + x1) / 2, (y0 + y1) / 2, x0, x1, y0, y1]); }
      return pts;
    };
    const toCanvas = (x, y) => ({ x: model.x + x * model.scale.x, y: model.y + y * model.scale.y });
    return {
      feature(name) {
        if (name === "eyeL" || name === "eyeR") {
          const pts = featBox(FEAT.eye); if (!pts.length) return null;
          const mid = pts.reduce((s, p) => s + p[0], 0) / pts.length;
          const side = pts.filter((p) => (name === "eyeL" ? p[0] < mid : p[0] >= mid));
          const cx = side.reduce((s, p) => s + p[0], 0) / side.length, cy = side.reduce((s, p) => s + p[1], 0) / side.length;
          return toCanvas(cx, cy);
        }
        const pts = featBox(FEAT[name] || []); if (!pts.length) return null;
        return toCanvas((Math.min(...pts.map((p) => p[2])) + Math.max(...pts.map((p) => p[3]))) / 2, (Math.min(...pts.map((p) => p[4])) + Math.max(...pts.map((p) => p[5]))) / 2);
      },
      canvas, model, say, hush, play, setMood, setExp, flashExp,
      look(x, y) { lookTarget = x === null ? null : { x, y }; },
      gestures(on) { nextIdleGesture = on ? performance.now() + 4000 : 1e15; },
      core,
      // 지금 말하는 글자: k = 소리 나는 글자 순번(0부터), v = 모음
      talkState() {
        if (!talk) return null;
        let t = (performance.now() - talk.t0) / 1000, k = -1;
        for (const x of talk.syl) { if (x.v) k++; if (t < x.d) return { k: x.v ? k : -1, v: x.v }; t -= x.d; }
        return null;
      },
    };
  },
};
`;
// 움직임 블록 안의 lookTarget 은 아래 tail 에서 선언되지만, update() 가 불릴 때는 이미 선언돼 있음
fs.writeFileSync(path.join(D, 'stage.js'), head + motion + tail);
console.log('stage.js', fs.statSync(path.join(D, 'stage.js')).size);
