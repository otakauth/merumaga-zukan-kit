// 絵を描かない検査機：ブラウザなしで、動画の中身（GuideVideo.register したもの）を全場面・細かい時刻で「描いて」みて、
// 例外・NaN 座標・説明カードの抜け・長さを調べる。ブラウザより桁違いに速く、並行して走らせてもよい。
//   node video/check.cjs video/<動画>.js [キー]   … キーを省くと中身の register から自動で拾う
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const FILE = process.argv[2]; if (!FILE) { console.log('使い方: node video/check.cjs video/<動画>.js [キー]'); process.exit(2); }
const src = fs.readFileSync(FILE, 'utf8');
const KEY = process.argv[3] || (src.match(/GuideVideo\.register\(\s*['"]([^'"]+)['"]/) || [])[1];
const problems = []; const bad = m => { if (problems.length < 60) problems.push(m); };

// ---- なんでも受け付ける偽物の DOM
const noop = () => undefined;
function anyObj(name) {
  const f = function () { return anyObj(name + '()'); };
  return new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => '';
      if (k === 'style') return t._style || (t._style = new Proxy({}, { get: (o, kk) => (kk === 'setProperty' ? noop : o[kk] ?? ''), set: (o, kk, v) => { o[kk] = v; return true; } }));
      if (k === 'classList') return { toggle: noop, add: noop, remove: noop, contains: () => false };
      if (k === 'querySelectorAll' || k === 'children') return k === 'children' ? [] : () => [];
      if (k === 'getContext') return () => CTX;
      if (k === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 1280, height: 720 });
      if (k === 'clientWidth') return 1280; if (k === 'clientHeight') return 720;
      if (k === 'textContent' || k === 'innerHTML') return t['_' + k] || '';
      if (k === 'parentNode') return null;
      if (k in t) return t[k];
      return anyObj(name + '.' + String(k));
    },
    set(t, k, v) { t[k === 'textContent' || k === 'innerHTML' ? '_' + k : k] = v; return true; },
    apply() { return anyObj(name + '()'); },
  });
}
// ---- 偽物の canvas（呼ばれた描画命令の数字に NaN / Infinity がないか見る）
let where = '';
const grad = () => ({ addColorStop(o, c) { if (!(o >= 0 && o <= 1)) bad(`${where}: addColorStop の位置が範囲外 ${o}`); } });
const state = { globalAlpha: 1, font: '10px sans', lineWidth: 1 }; const stack = [];
const CHECK = new Set(['moveTo', 'lineTo', 'arc', 'arcTo', 'ellipse', 'rect', 'roundRect', 'fillRect', 'strokeRect', 'clearRect', 'quadraticCurveTo', 'bezierCurveTo', 'translate', 'scale', 'rotate', 'setTransform', 'transform', 'fillText', 'strokeText', 'drawImage']);
let calls = 0;
const CTX = new Proxy({}, {
  get(o, k) {
    if (k === 'measureText') return s => ({ width: String(s).length * (parseFloat((String(state.font).match(/(\d+(?:\.\d+)?)px/) || [0, 10])[1]) * 0.9) });
    if (k === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createConicGradient') return (...a) => { if (a.some(x => !Number.isFinite(x))) bad(`${where}: ${k} に数でない値 ${a.join(',')}`); if (k === 'createRadialGradient' && (a[2] < 0 || a[5] < 0)) bad(`${where}: createRadialGradient の半径が負 ${a.join(',')}`); return grad(); };
    if (k === 'createPattern') return () => ({});
    if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
    if (k === 'setLineDash' || k === 'getLineDash') return () => [];
    if (k in state) return state[k];
    if (k === 'save') return () => { stack.push(Object.assign({}, state)); };
    if (k === 'restore') return () => { const o = stack.pop(); if (o) Object.assign(state, o); };
    return (...a) => {
      calls++;
      if (CHECK.has(k)) {
        const nums = k === 'fillText' || k === 'strokeText' ? a.slice(1, 3) : k === 'drawImage' ? a.slice(1) : a;
        if (nums.some(x => typeof x === 'number' && !Number.isFinite(x))) bad(`${where}: ${k}(${a.map(x => typeof x === 'number' ? +x.toFixed?.(1) || x : typeof x).join(',')}) に数でない値`);
        if (k === 'arc' && a[2] < 0) bad(`${where}: arc の半径が負 ${a[2]}`);
        if ((k === 'fillText' || k === 'strokeText') && /undefined|NaN|\[object/.test(String(a[0]))) bad(`${where}: 文字に「${a[0]}」`);
      }
    };
  },
  set(o, k, v) { if (k === 'globalAlpha' && !Number.isFinite(v)) bad(`${where}: globalAlpha=${v}`); if (k === 'lineWidth' && !(v >= 0)) bad(`${where}: lineWidth=${v}`); state[k] = v; return true; },
});
const errs = [];
let rafCb = null;
const win = {
  document: anyObj('document'), navigator: { userAgent: 'node' }, innerWidth: 1280, innerHeight: 720,
  addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false }),
  requestAnimationFrame: cb => { rafCb = cb; return 1; }, cancelAnimationFrame: noop,
  performance: { now: () => 0 }, setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0,
  console: { log: console.log, warn: noop, error: (...a) => errs.push(a.map(x => x && x.stack ? x.stack.split('\n').slice(0, 3).join(' / ') : String(x)).join(' ')) },
  Math, JSON, Date, Array, Object, Number, String, Set, Map, Symbol, Promise, Proxy, Uint8ClampedArray, Float32Array, isFinite, parseFloat, parseInt, Error,
};
win.window = win; win.self = win; win.globalThis = win;
win.document.body = anyObj('body'); win.document.head = anyObj('head');
vm.createContext(win);
const engine = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8').replace(/await import\(/g, '(()=>{throw new Error("no three")})(');
try { vm.runInContext(engine, win, { filename: 'engine.js' }); } catch (e) { console.log('engine の読み込みで例外:', e.message); process.exit(1); }
const kwMiss = new Set();
{ const reg = win.GuideVideo.register; win.GuideVideo.register = (key, fac) => reg(key, E => { const E2 = Object.create(E, { ctx: { get: () => E.ctx } });
    E2.kw = (i, s) => { const c = win.GuideVideo._cur; const L = c && c.lines && c.lines[i]; if (L && L.text.indexOf(s) < 0) kwMiss.add(`行${i}「${s}」`); return E.kw(i, s); }; return fac(E2); }); }
vm.runInContext(fs.readFileSync(path.join(__dirname, 'parts.js'), 'utf8'), win, { filename: 'parts.js' });
try { vm.runInContext(src, win, { filename: path.basename(FILE) }); } catch (e) { console.log('❌ 中身の読み込みで例外:', e.message); process.exit(1); }
const GV = win.GuideVideo;
if (/<\/script/i.test(src)) bad('中身に </script と書かれている（図鑑の画面に埋め込めない）');
{ const m = (GV.list ? GV.list() : []).find(v => v.key === KEY); if (!m || !m.category) bad('register の3つ目の引数に category がない（図鑑にボタンが出ない）'); else if (!m.label) bad('register の3つ目の引数に label がない'); }
if (!GV.has(KEY)) { console.log('❌ キーが登録されていない:', KEY); process.exit(1); }
try { GV.open(KEY); } catch (e) { console.log('❌ open で例外:', e.stack.split('\n').slice(0, 4).join('\n')); process.exit(1); }
const cur = GV._cur;
// 形の点検
const need = ['title', 'chapters', 'lines', 'scenes', 'gloss'];
for (const k of need) if (!cur[k]) bad(`返す値に ${k} がない`);
if (cur.lines.length !== cur.scenes.length) bad(`lines（${cur.lines.length}）と scenes（${cur.scenes.length}）の数が違う`);
cur.lines.forEach((L, i) => { if (!(L.ch >= 0 && L.ch < cur.chapters.length)) bad(`行${i}: ch=${L.ch} が章の範囲外`); if (!L.text) bad(`行${i}: text が空`); });
for (const [k, g] of Object.entries(cur.gloss)) { if (!g.t || !g.b) bad(`用語「${k}」に t か b がない`); }
// 説明カードのキー：中身の中で使われているのに gloss にないもの（静かに無視されてしまう）
const used = new Set();
for (const m of src.matchAll(/(?:hotRect|hotCircle)\(\s*'([^']+)'/g)) used.add(m[1]);
for (const m of src.matchAll(/\bkey:\s*'([^']+)'/g)) used.add(m[1]);
const missing = [...used].filter(k => !cur.gloss[k]);
// 全場面を細かく描いてみる
const hotSeen = new Set(); let frames = 0;
cur.lines.forEach((L, i) => {
  const steps = Math.max(12, Math.ceil(L.dur / 0.25));
  for (let s = 0; s <= steps; s++) {
    const t = L.dur * s / steps; where = `行${i}（${L.chip || ''}）${t.toFixed(2)}秒`;
    const n0 = errs.length; stack.length = 0; state.globalAlpha = 1; GV._still(i, t); if (rafCb) { const cb = rafCb; rafCb = null; cb(0); } frames++;
    if (errs.length > n0) { bad(`${where}: 例外 ${errs[errs.length - 1]}`); break; }
    for (const h of GV._HOTS) hotSeen.add(h.key);
  }
});
const neverShown = Object.keys(cur.gloss).filter(k => !hotSeen.has(k));
const fmt = s => `${Math.floor(s / 60)}分${String(Math.round(s % 60)).padStart(2, '0')}秒`;
console.log(`■ ${KEY}「${cur.title}」 章${cur.chapters.length}・場面${cur.lines.length}・用語${Object.keys(cur.gloss).length}・長さ約${fmt(cur.total)}（${frames}コマ・描画命令${calls}回）`);
if (missing.length) console.log('⚠ gloss にないのにカードとして指している用語（押しても何も出ない）:', missing.join('、'));
if (neverShown.length) console.log('⚠ 一度も押せる場所に出てこない用語:', neverShown.join('、'));
if (kwMiss.size) console.log('⚠ kw() の言葉がその行の文に無い（合図が0秒になる）:', [...kwMiss].join(' '));
const long = cur.lines.map((L, i) => [i, L.text.length]).filter(([, n]) => n > 75);
const longS = []; cur.lines.forEach((L, i) => L.parts.forEach(p => { if (p.length > 48) longS.push(`行${i}「${p.slice(0, 12)}…」=${p.length}字`); }));
if (longS.length) console.log('⚠ 1文が長い（48字超・字幕1枚に収まりにくい）:', longS.join(' '));
if (cur.happyUsed) console.log('⚠ calm なのに happy を使っている');
if (long.length) console.log('⚠ 1行が長い（75字超・字幕が詰まる）:', long.map(([i, n]) => `行${i}=${n}字`).join(' '));
console.log(problems.length ? '❌\n' + problems.join('\n') : '✅ 例外・NaN なし');
process.exit(problems.length ? 1 : 0);
