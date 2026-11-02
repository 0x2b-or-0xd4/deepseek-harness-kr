      // ---------- 버튜버식 움직임 (얼굴 추적처럼) ----------
      // 이 모델은 VBridger식 리깅: 머리 = AngleX/Y/Z, 몸 = PositionX/Y/Z·LeanInput(물리 엔진이 늦게 따라감),
      // 머리카락 물리 입력 = ParamAngleX/Y/Z, 귀 = 눈썹(ParamBrowLY/RY)을 따라 쫑긋. 입 = ParamA/I/U/E/O 모음.
      let mx = innerWidth / 2, my = innerHeight / 2, lastMove = 0;
      addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; lastMove = performance.now(); }, { passive: true });

      // 부드러운 잡음: 정수점마다 무작위 값을 두고 매끄럽게 잇기 (두 겹)
      const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
      const vnoise = (t) => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1; };
      const noise = (t, seed) => vnoise(t + seed * 17.31) * 0.72 + vnoise(t * 2.3 + seed * 5.17) * 0.28;
      // 스프링: 목표를 살짝 넘었다 돌아오며 따라감 (k 클수록 빠름, d 클수록 덜 출렁임)
      const S = () => ({ x: 0, v: 0 });
      // 프레임 간격이 길어도 흔들리지 않게 8ms 단위로 잘게 나눠 계산 (한 번에 계산하면 30fps 이하에서 눈동자가 매 프레임 튐)
      const spring = (s, target, dt, k, d) => { const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n; for (let i = 0; i < n; i++) { s.v += ((target - s.x) * k - s.v * d) * h; s.x += s.v * h; } return s.x; };
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const hx = S(), hy = S(), ex = S(), ey = S();
      let energy = 0.6;                                   // 움직임 크기 (상태마다 다름)
      const attn = { x: 0, y: 0.05, next: 0 };            // 지금 바라보는 곳 (-1~1, 캔버스 기준)

      // 바라볼 곳 고르기: 말할 땐 정면(시청자), 작업 중엔 대화창을 읽듯 왼쪽, 가끔 입력창·딴 곳
      const pickAttention = (now, talking) => {
        let p;
        const r = Math.random();
        if (talking) p = r < 0.85 ? [0, 0.05] : [-0.5, 0.1];
        else if (mood === "work") p = r < 0.55 ? [-0.75, 0.12] : r < 0.75 ? [-0.55, -0.3] : r < 0.9 ? [0, 0.05] : [0.35, 0.3];
        else if (mood === "wait") p = r < 0.7 ? [0, 0.05] : [-0.7, 0.05];
        else if (mood === "sad") p = r < 0.6 ? [0.1, -0.45] : [-0.3, -0.3];
        else p = r < 0.4 ? [0, 0.05] : r < 0.6 ? [-0.7, 0.1] : [(Math.random() - 0.5) * 1.2, (Math.random() - 0.4) * 0.7];
        attn.x = p[0] + (Math.random() - 0.5) * 0.12; attn.y = p[1] + (Math.random() - 0.5) * 0.1;
        attn.next = now + (talking ? 2500 : mood === "work" ? 1200 : 1500) + Math.random() * 3000;
        if (Math.random() < 0.35) blink.next = Math.min(blink.next, now + 60);   // 시선을 옮길 때 자주 깜빡임
        if (Math.random() < 0.3) browKick = Math.max(browKick, 0.25);
      };

      // ---- 말하기: 말풍선 글자의 모음으로 입 모양 ----
      // 한글 중성 21개 → 입 모양 (ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ)
      const JUNG = "AEAEOEOEOAEEOUOEIUUII";
      let talk = null;   // { syl: [{v, d, amp, stress}], t0, total, quiet }
      const startTalk = (text, ms, quiet) => {
        const syl = [];
        const words = String(text).split(/(\s+)/);
        for (const w of words) {
          if (/^\s+$/.test(w)) { syl.push({ v: null, d: 0.07 }); continue; }
          let first = true, prevVowel = false;
          for (const ch of w) {
            const c = ch.charCodeAt(0);
            if (c >= 0xac00 && c <= 0xd7a3) {
              syl.push({ v: JUNG[Math.floor(((c - 0xac00) % 588) / 28)], d: 0.12 + Math.random() * 0.04, amp: 0.65 + Math.random() * 0.35, stress: first });
              first = false;
            } else if (/[aeiouy]/i.test(ch)) {
              if (!prevVowel) { const l = ch.toLowerCase(); syl.push({ v: l === "a" ? "A" : l === "e" ? "E" : l === "o" ? "O" : l === "u" ? "U" : "I", d: 0.1 + Math.random() * 0.04, amp: 0.55 + Math.random() * 0.35, stress: first }); first = false; }
              prevVowel = true; continue;
            } else if (/[.,!?…~。，！？]/.test(ch)) syl.push({ v: null, d: ch === "," || ch === "，" ? 0.12 : 0.24 });
            else if (/[0-9]/.test(ch)) { syl.push({ v: "A", d: 0.12, amp: 0.7, stress: first }); first = false; }
            prevVowel = false;
          }
        }
        let total = syl.reduce((s, x) => s + x.d, 0);
        const limit = (ms || 3000) / 1000 * 0.92;
        if (total > limit && total > 0) { const k = limit / total; for (const x of syl) x.d *= k; total = limit; }   // 말풍선 시간 안에 끝나게
        talk = { syl, t0: performance.now(), total, quiet };
      };
      const VOW = ["A", "I", "U", "E", "O"];
      const vowel = { A: 0, I: 0, U: 0, E: 0, O: 0 };
      let mouthOpen = 0, browKick = 0, nodKick = 0, lastStressIdx = -1;

      const look = { x: 0, y: 0 };   // (터치·확인용으로 남겨 둔 값)
      const pose1 = { lean: 0, headZ: 0, headY: 0, bodyY: 0 };   // 자세 1단계 (S자 전환용)
      // 몸짓 곡선: 천천히 들어가서(0~35%) 머물렀다가(~70%) 천천히 돌아옴
      const sstep = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
      const holdCurve = (p, a = 0.35, b = 0.7) => (p < a ? sstep(p / a) : p > b ? sstep((1 - p) / (1 - b)) : 1);
      let blink = { next: performance.now() + 2000, start: -1e9, double: false }, lastT = performance.now();
      im.motionManager.expressionManager = {
        destroy() {},
        update() {
          const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
          const T = now / 1000;
          const talking = bubble.classList.contains("show") && fleeX === 0;
          const muttering = talking && bubble.classList.contains("mutter");
          if (moodUntil && now > moodUntil) { mood = "idle"; moodUntil = 0; }

          // 움직임 크기: 대기 < 작업 < 말하기, 웃을 땐 크게, 시무룩하면 작게
          const laughing = gest.name === "laugh";
          const eTarget = (mood === "sad" ? 0.35 : mood === "wait" ? 0.55 : mood === "work" ? 0.75 : 0.6) + (talking && !muttering ? 0.35 : 0) + (laughing ? 0.5 : 0);
          energy += (eTarget - energy) * Math.min(1, dt * 1.5);

          // ---- 바라보는 곳 ----
          let tx, ty;
          if (muttering) { tx = 0.4; ty = 0.38; }                    // 혼잣말: 옆 위를 보며 생각
          else if (now - lastMove < 2500 && !talking) {             // 마우스를 움직이면 눈은 커서를, 고개는 반쯤
            const r = canvas.getBoundingClientRect();
            tx = clamp((mx - (r.left + r.width / 2)) / 600, -1, 1);
            ty = clamp(((r.top + r.height * 0.25) - my) / 500, -1, 1);
          } else {
            if (now > attn.next || (talking && Math.abs(attn.x) > 0.3 && Math.random() < dt * 2)) pickAttention(now, talking);
            tx = attn.x; ty = attn.y;
          }
          // 눈은 빠르게(휙), 고개는 천천히 따라감 → 눈이 먼저 가고 고개가 뒤따르는 버튜버 느낌
          spring(ex, tx, dt, 900, 55); spring(ey, ty, dt, 900, 55);
          spring(hx, tx * 0.85, dt, 38, 9.5); spring(hy, ty * 0.8, dt, 38, 9.5);
          look.x = hx.x; look.y = hy.x;

          // ---- 말하기 (입 모양 · 고개 끄덕 · 눈썹) ----
          let open = 0;
          for (const k of VOW) vowel[k] *= Math.max(0, 1 - dt * 14);
          if (talk) {
            let t = (now - talk.t0) / 1000;
            if (t >= talk.total) talk = null;
            else {
              let i = 0; while (i < talk.syl.length && t > talk.syl[i].d) { t -= talk.syl[i].d; i++; }
              const s = talk.syl[i];
              if (s && s.v) {
                const p = t / s.d, env = Math.pow(Math.sin(Math.PI * Math.min(1, p)), 0.7);
                open = env * s.amp * (talk.quiet ? 0.3 : 1);
                vowel[s.v] = Math.max(vowel[s.v], open);
                if (s.stress && i !== lastStressIdx) {               // 낱말 첫소리: 눈썹 살짝(귀 쫑긋) + 가끔 끄덕
                  lastStressIdx = i;
                  if (!talk.quiet) { browKick = Math.max(browKick, 0.35 + Math.random() * 0.35); if (Math.random() < 0.45) nodKick = Math.max(nodKick, 0.6 + Math.random() * 0.5); }
                }
              }
            }
          }
          mouthOpen += (open - mouthOpen) * Math.min(1, dt * 22);
          browKick *= Math.max(0, 1 - dt * 3.5);
          nodKick *= Math.max(0, 1 - dt * 5);

          // ---- 상태별 자세 (작업 중 = 살짝 앞으로, 대기 = 숙이고 갸웃, 실패 = 고개 숙임) ----
          const goal = { lean: 0, headZ: 0, headY: 0, bodyY: 0 };
          if (mood === "work") { goal.lean = -7; goal.headY = -5; }          // 작업 중: 상체를 조금 내밀고 화면을 내려다봄
          if (mood === "wait") { goal.lean = -9; goal.headZ = 8; goal.headY = 3; }   // 대기: 다가와 갸웃하며 사용자를 올려다봄
          if (mood === "sad") { goal.headY = -10; goal.bodyY = -5; }
          const pk = Math.min(1, dt * 2.2);   // 두 단계로 따라가서 S자 곡선 (툭 끊기지 않게)
          for (const key in goal) { pose1[key] += (goal[key] - pose1[key]) * pk; pose[key] += (pose1[key] - pose[key]) * pk; }

          // ---- 고개 (AngleX/Y/Z): 시선 + 잔잔한 흔들림 + 말할 때 끄덕 ----
          let yaw = hx.x * 22 + noise(T * 0.33, 1) * 6 * energy;
          let pitch = hy.x * 13 + noise(T * 0.41, 2) * 4.5 * energy + pose.headY - nodKick * 4 - mouthOpen * 1.5;
          let roll = noise(T * 0.27, 3) * 7.5 * energy - hx.x * hy.x * 7 + pose.headZ;
          // ---- 몸 (PositionX/Y/Z·LeanInput → 물리가 몸통을 늦게 따라 움직임) ----
          let bodyX = hx.x * 8 + noise(T * 0.17, 4) * 5 * energy;
          let bodyZ = roll * 0.5 + noise(T * 0.21, 5) * 3 * energy;
          let bodyY = pose.bodyY + Math.sin(T * 2 * Math.PI / 3.6) * 1.2;   // 숨쉬기
          let lean = pose.lean, smile = 0, eyeSmileAdd = 0, eyeClose = 0, mouthAdd = 0;
          if (mood === "work") bodyZ += Math.sin(T * 2.1) * 1.2;        // 작업 중엔 리듬 타기

          if (gest.name) {
            const p = (now - gest.start) / gest.dur;
            if (p >= 1) gest.name = null;
            else {
              const env = Math.sin(Math.PI * p), d = gest.dir;
              switch (gest.name) {
                case "nod": pitch -= Math.abs(Math.sin(p * Math.PI * 4)) * 11 * env; break;                       // 끄덕끄덕
                case "tilt": roll += 15 * env * d; bodyZ += 6 * env * d; smile += env; break;                    // 고개 갸웃
                case "lean": { const h = holdCurve(p, 0.3, 0.72); lean -= 12 * h; pitch += 4 * h; roll += 8 * h * d; bodyX += 4 * h * d; smile += 0.7 * h; break; }   // 다가와 들여다보기: 몸은 앞으로, 턱은 살짝 들어 화면을 봄
                case "sway": bodyZ += Math.sin(p * Math.PI * 6) * 9 * env; roll += Math.sin(p * Math.PI * 6) * 6 * env; smile += env; break;   // 흔들흔들
                case "bounce": bodyY += Math.abs(Math.sin(p * Math.PI * 4)) * 8 * env; bodyZ += Math.sin(p * Math.PI * 4) * 6 * env; smile += env; break;   // 신나서 통통
                case "droop": pitch -= 14 * env; bodyY -= 6 * env; break;                                          // 시무룩
                case "laugh":                                                                                      // ^^ 눈웃음 + 어깨 들썩
                  eyeSmileAdd += env; eyeClose += env * 0.85; smile += env;
                  { const hb = holdCurve(p, 0.25, 0.65), hh = holdCurve(Math.max(0, p - 0.08) / 0.92, 0.3, 0.6);   // 몸이 먼저, 고개가 조금 늦게
                    lean -= 10 * hb; pitch -= 9 * hh - (p > 0.7 ? 3 * Math.sin(Math.PI * (p - 0.7) / 0.3) : 0); roll += 7 * hb * d; }
                  bodyY += Math.abs(Math.sin(p * Math.PI * 7)) * 5 * env; mouthAdd += 0.45 * env;
                  break;
              }
            }
          }
          if (!gest.name && mood === "idle" && now > nextIdleGesture) {   // 가만히 있을 때 가끔 몸짓
            const r = Math.random();
            const pick = r < 0.3 ? "tilt" : r < 0.5 ? "sway" : r < 0.72 ? "lean" : r < 0.88 ? "nod" : "laugh";
            play(pick, pick === "lean" ? 2600 : pick === "sway" ? 2300 : pick === "laugh" ? 1500 : 1800);
            nextIdleGesture = now + 7000 + Math.random() * 9000;
          }
          touchLean += ((now < touchLeanUntil ? -30 : 0) - touchLean) * Math.min(1, dt * 4);   // 가슴 터치 때 가끔 앞으로 숙임
          lean += touchLean;
          const se = (now - shiverStarted) / 1000;                   // 부끄러워 떨기 (5초에 걸쳐 잦아듦)
          if (se >= 0 && se < 5) {
            const tr = Math.sin(se * Math.PI * 2 * 8) * Math.min(1, se / 0.2) * Math.pow(1 - se / 5, 1.5);
            bodyZ -= tr * 3; roll += tr * 2;
          }
          if (fleeX > 0) bodyZ += Math.sin(T * 16) * 8;              // 도망가며 종종걸음

          yaw = clamp(yaw, -30, 30); pitch = clamp(pitch, -30, 30); roll = clamp(roll, -30, 30);
          for (const [id, v] of [["AngleX", yaw], ["AngleY", pitch], ["AngleZ", roll], ["ParamAngleX", yaw], ["ParamAngleY", pitch], ["ParamAngleZ", roll],
            ["PositionX", clamp(bodyX, -30, 30)], ["PositionY", clamp(bodyY, -30, 30)], ["PositionZ", clamp(bodyZ, -30, 30)], ["LeanInput", clamp(lean, -30, 30)]]) core.addParameterValueById(id, v);

          // ---- 눈: 눈동자는 고개보다 먼저 (머리 기준 상대 위치) ----
          // 눈동자는 작게만 (크게 움직이면 흰자가 드러나 곁눈질처럼 보임)
          core.addParameterValueById("ParamEyeBallX", clamp(((ex.x - hx.x) * 0.9 + hx.x * 0.2) * 0.6, -0.45, 0.45));
          core.addParameterValueById("ParamEyeBallY", clamp(((ey.x - hy.x) * 0.9 + hy.x * 0.2) * 0.6, -0.3, 0.3));
          core.setParameterValueById("ParamBreath", 0.5 + 0.5 * Math.sin(T * 2 * Math.PI / 3.6));

          // ---- 눈썹 (귀가 따라 움직임) ----
          const brow = browKick + noise(T * 0.5, 7) * 0.12 + (mood === "wait" ? 0.25 : mood === "sad" ? -0.3 : 0);
          core.addParameterValueById("ParamBrowLY", clamp(brow, -1, 1));
          core.addParameterValueById("ParamBrowRY", clamp(brow + noise(T * 0.6, 8) * 0.06, -1, 1));
          if (browKick > 0.2) core.addParameterValueById("BrowInnerUp", Math.min(1, browKick * 0.6));

          // ---- 입: 모음 모양 + 늘 살짝 웃는 입꼬리 ----
          const openNow = clamp(mouthOpen + mouthAdd, 0, 1);
          if (openNow > 0.01) {
            core.setParameterValueById("ParamMouthOpenY", openNow * 0.9);
            core.addParameterValueById("JawOpen", openNow * 0.45);
            core.setParameterValueById("ParamSilence", 1 - openNow);
            for (const k of VOW) if (vowel[k] > 0.01) core.addParameterValueById("Param" + k, Math.min(1, vowel[k]));
            if (mouthAdd > 0.01) core.addParameterValueById("ParamA", mouthAdd * 0.8);
          }
          const baseSmile = mood === "sad" ? 0 : mood === "wait" ? 0.15 : 0.35;
          core.addParameterValueById("ParamMouthForm", clamp(baseSmile + smile * 0.4, -1, 1));
          core.addParameterValueById("MouthSmile_L", clamp(baseSmile + smile * 0.5, 0, 1));
          core.addParameterValueById("MouthSmile_R", clamp(baseSmile + smile * 0.5 + noise(T * 0.3, 9) * 0.05, 0, 1));
          const eSmile = clamp((mood === "sad" ? 0 : 0.12) + smile * 0.35 + eyeSmileAdd, 0, 1);
          if (eSmile > 0.01) core.addParameterValueById("EyeSmile", eSmile);

          // ---- 눈 깜빡임: 2~6초 불규칙, 가끔 두 번 ----
          if (now >= blink.next && !laughing) {
            blink.start = now;
            blink.next = blink.double ? now + 2000 + Math.random() * 4000 : (Math.random() < 0.18 ? now + 260 : now + 2000 + Math.random() * 4000);
            blink.double = !blink.double && blink.next - now < 400;
          }
          const bt = (now - blink.start) / 1000;
          const blinkClose = bt < 0.07 ? bt / 0.07 : bt < 0.1 ? 1 : bt < 0.22 ? 1 - (bt - 0.1) / 0.12 : 0;
          const eyeOpen = clamp((mood === "work" ? 0.92 : 0.97) * (1 - blinkClose) * (1 - eyeClose), 0, 1.2);
          core.setParameterValueById("ParamEyeLOpen", eyeOpen); core.setParameterValueById("ParamEyeROpen", eyeOpen);

          for (const [name, params] of Object.entries(exp)) {
            const target = hold[name] || (until[name] || 0) > now ? 1 : 0;
            const w = weight[name] = (weight[name] || 0) + (target - (weight[name] || 0)) * Math.min(1, dt * 6);
            if (w < 0.01) continue;
            for (const p of params) {
              if (p.Blend === "Multiply") core.multiplyParameterValueById(p.Id, p.Value, w);
              else if (p.Blend === "Add") core.addParameterValueById(p.Id, p.Value, w);
              else core.setParameterValueById(p.Id, p.Value, w);
            }
          }
        },
      };

