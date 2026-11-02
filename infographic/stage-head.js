// DeepSeek짱 무대: Harness 인앱 펫과 같은 모델·3판 움직임을 Harness 없이 크게 렌더링
// 사용: await Stage.create(캔버스 크기 px, 말풍선 요소) → stage.say / play / setMood / flashExp / setExp / look(x,y)
window.Stage = {
  async create(SIZE, bubble) {
    const W = SIZE, H = SIZE, BASE = "assets/";
    const canvas = document.createElement("canvas"); canvas.id = "stage";
    const app = new PIXI.Application({ view: canvas, width: W, height: H, backgroundAlpha: 0, antialias: true, resolution: 1 });
    const model = await PIXI.live2d.Live2DModel.from(BASE + "model/model.model3.json", { autoInteract: false, idleMotionGroup: "Idle" });
    app.stage.addChild(model);
    const im = model.internalModel, core = im.coreModel;
    im.eyeBlink = undefined; im.breath = undefined;
    core.update();
    const cm = core.getModel();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const each = (fn) => { for (let i = 0; i < cm.drawables.count; i++) { if (cm.drawables.opacities[i] < 0.01) continue; const v = im.getDrawableVertices(i); for (let k = 0; k < v.length; k += 2) fn(v[k], v[k + 1]); } };
    each((x, y) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
    const cutY = minY + (maxY - minY) * 0.52;
    let ux0 = Infinity, ux1 = -Infinity;
    each((x, y) => { if (y < cutY) { ux0 = Math.min(ux0, x); ux1 = Math.max(ux1, x); } });
    const bw = ux1 - ux0, bh = cutY - minY;
    const s = Math.min((W * 0.98) / bw, (H * 0.95) / bh);
    model.scale.set(s); model.x = W / 2 - (ux0 + bw / 2) * s; model.y = H * 0.04 - minY * s;

    const exp = {};
    await Promise.all(["loading", "heart", "blush", "sweat", "dizzy", "tears", "squint", "smug", "dark"].map(async (f) => {
      try { exp[f] = (await (await fetch(`${BASE}model/exp/${f}.exp3.json`)).json()).Parameters || []; } catch { exp[f] = []; }
    }));
    const weight = {}, hold = {}, until = {};
    const setExp = (name, on) => { hold[name] = on; };
    const flashExp = (name, ms) => { until[name] = performance.now() + ms; };
    const gest = { name: null, start: 0, dur: 0, dir: 1 };
    const play = (name, dur, dir) => { gest.name = name; gest.start = performance.now(); gest.dur = dur; gest.dir = dir || (Math.random() < 0.5 ? -1 : 1); };
    let mood = "idle", moodUntil = 0, nextIdleGesture = 1e15;
    const setMood = (m, ms = 0) => { mood = m; moodUntil = ms ? performance.now() + ms : 0; };
    const pose = { lean: 0, headZ: 0, headY: 0, bodyY: 0, swayAmp: 0 };
    let shiverStarted = -1e9, touchLeanUntil = 0, touchLean = 0, fleeX = 0;
    let lastSayAt = 0, hideAt = 0;
    const say = (text, ms = 3500, mutter = false) => {
      bubble.textContent = text; bubble.classList.add("show"); bubble.classList.toggle("mutter", mutter);
      lastSayAt = performance.now(); hideAt = ms ? lastSayAt + ms : 0;
      startTalk(text, ms || 3000, mutter);
    };
    const hush = () => { bubble.classList.remove("show"); hideAt = 0; };
    app.ticker.add(() => { if (hideAt && performance.now() > hideAt) hush(); });
