/* =========================================================
   ガイド動画プレーヤー（図鑑の画面の上に重ねて開く）
   使い方：
     GuideVideo.register(キー, function(E){ ... return { title, subtitle, chapters, lines, scenes, gloss, yomi, cue, end } })
     GuideVideo.open(キー, { chapter: 0, onNext: fn, nextLabel: '…', onClose: fn })
   各場面は「行番号＋行内の経過秒」だけで絵が決まる。
   ========================================================= */
(function () {
'use strict';
if (window.GuideVideo) return;

const CSS = `
#gvRoot{position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;background:#05070f;color:#fff;font-family:"Hiragino Maru Gothic ProN","Rounded Mplus 1c","BIZ UDPGothic","Noto Sans JP","Droid Sans Fallback",sans-serif;user-select:none;-webkit-user-select:none}
#gvRoot *{box-sizing:content-box}
#gvRoot .gv-wrap{flex:1;position:relative;overflow:hidden}
#gvRoot .gv-stage{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;overflow:hidden;background:#0f1b3d}
#gvRoot .gv-cv{position:absolute;left:0;top:0;width:1920px;height:1080px}
#gvRoot .gv-guide{position:absolute;left:0;top:400px;width:540px;height:680px;pointer-events:none}
#gvRoot .gv-sub{position:absolute;left:560px;right:40px;bottom:34px;display:flex;justify-content:center;pointer-events:none}
#gvRoot .gv-sub span{display:inline-block;max-width:1240px;padding:14px 30px;border-radius:22px;background:rgba(8,12,30,.74);font-size:40px;line-height:1.45;font-weight:700;text-align:center;letter-spacing:.02em;box-shadow:0 6px 24px rgba(0,0,0,.35)}
#gvRoot .gv-sub span:empty{opacity:0}
#gvRoot .gv-ov{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;background:radial-gradient(circle at 50% 45%,rgba(40,60,130,.6),rgba(5,7,15,.9))}
#gvRoot .gv-ov h1{margin:0;font-size:76px;letter-spacing:.06em;text-shadow:0 6px 30px rgba(120,160,255,.6);text-align:center;line-height:1.25}
#gvRoot .gv-ov p{margin:0;font-size:30px;opacity:.88;text-align:center}
#gvRoot .gv-ov .row{display:flex;gap:24px;flex-wrap:wrap;justify-content:center}
#gvRoot .gv-ov button{font:inherit;font-size:40px;font-weight:700;border:0;border-radius:999px;padding:22px 54px;cursor:pointer;color:#1b2150;background:linear-gradient(#fff,#dfe6ff);box-shadow:0 8px 0 #8d9be0}
#gvRoot .gv-ov button.sub{font-size:30px;padding:18px 36px;background:linear-gradient(#e8ecff,#c7d0f5);box-shadow:0 6px 0 #7f8cc9}
#gvRoot .gv-ov .chaps{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:1500px}
#gvRoot .gv-ov .chaps button{font-size:26px;padding:12px 26px;background:rgba(255,255,255,.1);color:#fff;box-shadow:none;border:2px solid rgba(255,255,255,.35)}
#gvRoot .gv-ov .chaps button:hover{background:rgba(255,255,255,.2)}
#gvRoot .gv-ov .note{font-size:24px;opacity:.72;text-align:center;line-height:1.6}
#gvRoot .gv-bar{flex:none;display:flex;align-items:center;gap:8px;padding:6px 12px;background:#0b0f1f;border-top:1px solid #1d2545;flex-wrap:wrap}
#gvRoot .gv-bar button{font:inherit;font-size:20px;min-width:44px;height:40px;border:0;border-radius:10px;background:#1d2547;color:#fff;cursor:pointer;padding:0 8px}
#gvRoot .gv-bar button:hover{background:#2b376a}
#gvRoot .gv-bar .gv-close{background:#3a2240;font-size:16px;padding:0 14px}
#gvRoot .gv-seek{position:relative;flex:1;min-width:200px;height:44px;cursor:pointer}
#gvRoot .gv-chl{position:absolute;left:0;right:0;top:0;height:18px;display:flex;gap:6px}
#gvRoot .gv-chl div{font-size:12px;color:#9aa6d6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:2px}
#gvRoot .gv-chl div.on{color:#fff;font-weight:700}
#gvRoot .gv-segs{position:absolute;left:0;right:0;top:22px;height:12px;display:flex;gap:6px}
#gvRoot .gv-segs>div{display:flex;gap:2px;height:100%}
#gvRoot .gv-segs>div>div{height:100%;background:#2a3462;border-radius:4px;position:relative}
#gvRoot .gv-segs i{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#7aa2ff,#c77dff);border-radius:4px}
#gvRoot .gv-segs>div>div:hover{background:#3a4780}
#gvRoot .gv-time{font-size:15px;min-width:96px;text-align:right;color:#b9c2ea;font-variant-numeric:tabular-nums}
#gvRoot .gv-card{position:absolute;display:none;width:660px;padding:26px 32px 24px;border-radius:28px;background:rgba(14,20,50,.97);border:3px solid #fff6a0;box-shadow:0 18px 60px rgba(0,0,0,.6);z-index:5}
#gvRoot .gv-card .hd{display:flex;align-items:center;gap:14px;font-size:42px;font-weight:900;line-height:1.25}
#gvRoot .gv-card .ic{font-size:46px}
#gvRoot .gv-card p{margin:16px 0 0;font-size:31px;line-height:1.62}
#gvRoot .gv-card .more{margin-top:16px;padding:14px 20px;border-radius:18px;background:rgba(255,255,255,.08);font-size:27px;line-height:1.55;color:#ffe29a}
#gvRoot .gv-card .more::before{content:'💡 ひとこと　'}
#gvRoot .gv-card .btns{display:flex;justify-content:flex-end;margin-top:20px}
#gvRoot .gv-card button{font:inherit;font-size:30px;font-weight:800;border:0;border-radius:999px;padding:14px 36px;cursor:pointer;color:#1b2150;background:linear-gradient(#fff,#dfe6ff);box-shadow:0 6px 0 #8d9be0}
#gvRoot .gv-tip{position:absolute;top:-30px;transform:translateX(-50%);background:#1d2547;padding:4px 10px;border-radius:8px;font-size:14px;white-space:nowrap;display:none;pointer-events:none}
#gvRoot .gv-err{position:absolute;left:0;right:0;top:0;background:#b3261e;color:#fff;font-size:22px;padding:8px 16px;display:none;z-index:9}
#gvRoot .gv-msub,#gvRoot .gv-rot,#gvRoot .gv-fs{display:none}
/* ---- スマホ（画面の短い辺が600px未満）---- */
#gvRoot{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#gvRoot.gv-m .gv-bar{gap:6px;padding:6px 8px calc(6px + env(safe-area-inset-bottom)) 8px}
#gvRoot.gv-m .gv-bar button{font-size:17px;min-width:38px;height:38px;padding:0}
#gvRoot.gv-m .gv-bar .gv-close{font-size:15px;padding:0 10px}
#gvRoot.gv-m .gv-fs{display:inline-block;font-size:13px!important;padding:0 8px!important}
#gvRoot.gv-m .gv-seek{min-width:120px;height:40px}
#gvRoot.gv-m .gv-chl div{font-size:11px}
#gvRoot.gv-m .gv-segs{top:20px;height:14px}
#gvRoot.gv-m .gv-time{font-size:12px;min-width:0}
#gvRoot.gv-mp .gv-seek{order:9;flex:1 1 100%}
@media (max-width:380px){#gvRoot.gv-m .gv-bar{gap:4px;padding-left:6px;padding-right:6px}#gvRoot.gv-m .gv-bar button{min-width:34px;font-size:15px}#gvRoot.gv-m .gv-time{font-size:11px}}
#gvRoot.gv-mp .gv-time{margin-left:auto}
#gvRoot.gv-mp .gv-sub{display:none}
#gvRoot.gv-mp .gv-msub{display:flex;position:absolute;left:12px;right:12px;flex-direction:column;align-items:center;justify-content:flex-start;gap:14px;text-align:center}
#gvRoot .gv-msub span{display:inline-block;padding:10px 16px;border-radius:14px;background:rgba(255,255,255,.07);font-size:19px;line-height:1.6;font-weight:700}
#gvRoot .gv-msub span:empty{display:none}
#gvRoot.gv-mp .gv-rot{display:block;font-size:13px;color:#9aa6d6;line-height:1.6}
#gvRoot.gv-m .gv-ov{position:absolute;inset:0;z-index:20;background:radial-gradient(circle at 50% 45%,#1d2a5c,#05070f 85%);gap:14px;padding:16px;box-sizing:border-box;overflow:auto;justify-content:center}
#gvRoot.gv-m .gv-ov h1{font-size:26px}
#gvRoot.gv-m .gv-ov p{font-size:14px}
#gvRoot.gv-m .gv-ov .row{gap:10px}
#gvRoot.gv-m .gv-ov button{font-size:19px;padding:12px 26px;box-shadow:0 5px 0 #8d9be0}
#gvRoot.gv-m .gv-ov button.sub{font-size:15px;padding:10px 18px;box-shadow:0 4px 0 #7f8cc9}
#gvRoot.gv-m .gv-ov .chaps{gap:8px}
#gvRoot.gv-m .gv-ov .chaps button{font-size:13px;padding:7px 12px}
#gvRoot.gv-m .gv-ov .note{font-size:12px}
#gvRoot.gv-m .gv-card{position:absolute;left:10px!important;right:10px;top:auto!important;width:auto;max-width:640px;margin:0 auto;max-height:62%;overflow:auto;padding:16px 18px;border-radius:18px;border-width:2px;z-index:15}
#gvRoot.gv-m .gv-card .hd{font-size:21px;gap:8px}
#gvRoot.gv-m .gv-card .ic{font-size:24px}
#gvRoot.gv-m .gv-card p{margin-top:8px;font-size:15.5px;line-height:1.65}
#gvRoot.gv-m .gv-card .more{margin-top:10px;padding:10px 12px;border-radius:12px;font-size:14px}
#gvRoot.gv-m .gv-card .btns{margin-top:12px}
#gvRoot.gv-m .gv-card button{font-size:16px;padding:9px 22px;box-shadow:0 4px 0 #8d9be0}
`;
const HTML = `
<div class="gv-wrap"><div class="gv-stage">
 <canvas class="gv-cv" width="1920" height="1080"></canvas>
 <canvas class="gv-guide"></canvas>
 <div class="gv-sub"><span></span></div>
 <div class="gv-card"><div class="hd"><span class="ic"></span><b></b></div><p></p><div class="more"></div><div class="btns"><button>▶ 続きを見る</button></div></div>
 <div class="gv-ov gv-start">
  <h1></h1><p class="gv-subt"></p>
  <div class="row"><button class="gv-go">▶ 再生する</button><button class="gv-gomute sub">🔇 字幕だけで再生</button></div>
  <div class="chaps"></div>
  <div class="note">画面の中の名前や絵をクリック（タップ）すると、説明が出ます（？マークが目印）。<br>声はブラウザの読み上げを使います。声が出ない環境では字幕だけで進みます。</div>
 </div>
 <div class="gv-ov gv-end" style="display:none">
  <h1>おしまい</h1><p class="gv-endt"></p>
  <div class="row"><button class="gv-next"></button><button class="gv-again sub">↻ もう一度見る</button><button class="gv-close2 sub">✕ とじる</button></div>
 </div>
 <div class="gv-err"></div>
</div><div class="gv-msub"><span></span><div class="gv-rot">📱 横向きにすると、大きく見られます</div></div></div>
<div class="gv-bar">
 <button class="gv-pp" title="再生／一時停止（スペース）">▶</button>
 <button class="gv-prev" title="前の場面（←）">⏮</button>
 <button class="gv-nextb" title="次の場面（→）">⏭</button>
 <div class="gv-seek"><div class="gv-chl"></div><div class="gv-segs"></div><div class="gv-tip"></div></div>
 <span class="gv-time">0:00 / 0:00</span>
 <button class="gv-mute" title="声のオン／オフ">🔊</button>
 <button class="gv-fs" title="全画面">全画面</button>
 <button class="gv-close" title="動画をとじる（Esc）">✕ とじる</button>
</div>`;

/* ========================================================= 道具（中身の側でも使う） */
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const seg = (t, a, b) => cl((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = x => { if (x <= 0) return 0; if (x >= 1) return 1; const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, k) => a + (b - a) * k;
const FONT = '"Hiragino Maru Gothic ProN","Rounded Mplus 1c","BIZ UDPGothic","Noto Sans JP","Droid Sans Fallback",sans-serif';
const BC = { A: '#ff6b6b', T: '#ffd166', G: '#3ddc97', C: '#4cc9f0', U: '#c77dff' };
const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };

let R = null, cv = null, ctx = null, cur = null;   // cur＝いま開いている中身
let HOTS = [];
const INST = {}, FACT = {};

function hotRect(key, x, y, w, h) {
  if (!cur || !cur.gloss[key]) return;
  const m = ctx.getTransform();
  const pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([a, b]) => [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const b = { key, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  if (b.x1 - b.x0 < 8 || b.y1 - b.y0 < 8) return;
  HOTS.push(b);
}
const hotCircle = (key, x, y, r) => hotRect(key, x - r, y - r, r * 2, r * 2);

function txt(s, x, y, size, color = '#fff', o = {}) {
  ctx.save();
  ctx.font = `${o.weight || 800} ${size}px ${FONT}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.scale != null || o.rot) { ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.scale ?? 1, o.scale ?? 1); x = 0; y = 0; }
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 24; }
  if (o.stroke) { ctx.lineWidth = o.sw || 8; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function circle(x, y, r, fill, stroke, lw = 3) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }
function pill(s, x, y, size, bg, fg = '#fff', o = {}) {
  if ((o.scale != null && o.scale <= 0.01) || (o.alpha != null && o.alpha <= 0.01)) return;
  ctx.save(); ctx.font = `800 ${size}px ${FONT}`; const w = ctx.measureText(s).width + size * 1.2, h = size * 1.7;
  ctx.translate(x, y); if (o.scale != null) ctx.scale(o.scale, o.scale); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  if (o.border) { ctx.lineWidth = 3; ctx.strokeStyle = o.border; ctx.stroke(); }
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, 0, 2);
  if (o.key && cur.gloss[o.key] && ctx.globalAlpha > 0.5 && (o.scale ?? 1) > 0.5) {      // クリックできる印「？」
    hotRect(o.key, -w / 2, -h / 2, w, h);
    circle(w / 2 - 4, -h / 2 + 2, size * 0.42, '#fff6a0', '#1b2150', 2); txt('?', w / 2 - 4, -h / 2 + 3, size * 0.5, '#1b2150');
  }
  ctx.restore();
}
function glow(x, y, r, col, a = 1) { if (a <= 0 || r <= 0) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
function arrow(x0, y0, x1, y1, col, w = 10, head = 26) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * head * 0.6, y1 - Math.sin(a) * head * 0.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(a - 0.45) * head, y1 - Math.sin(a - 0.45) * head); ctx.lineTo(x1 - Math.cos(a + 0.45) * head, y1 - Math.sin(a + 0.45) * head); ctx.closePath(); ctx.fill(); ctx.restore();
}
function star(x, y, r, col, a = 1, rot = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rr_ = i % 2 ? r * 0.36 : r; const an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr_, Math.sin(an) * rr_); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function stamp(s, sub, x, y, k, col = '#ff5d8f', key = null, w = 300) {
  if (k <= 0) return;
  const sc = lerp(2.4, 1, back(k)), a = seg(k, 0, 0.25);
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.07); ctx.scale(sc, sc); ctx.globalAlpha *= a;
  if (key && k >= 1) hotRect(key, -w / 2, -70, w, 140);
  ctx.shadowColor = col; ctx.shadowBlur = 30;
  rr(-w / 2, -70, w, 140, 34); ctx.fillStyle = 'rgba(20,16,40,.85)'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = col; ctx.stroke();
  ctx.shadowBlur = 0;
  txt(s, 0, sub ? -12 : 0, s.length > 5 ? 56 : 70, '#fff'); if (sub) txt(sub, 0, 44, 26, col);
  ctx.restore();
}
function ring(x, y, k, col, r0 = 30, r1 = 220) { if (k <= 0 || k >= 1) return; ctx.save(); ctx.globalAlpha = (1 - k) * 0.8; circle(x, y, lerp(r0, r1, eo(k)), null, col, 8 * (1 - k) + 1); ctx.restore(); }
function blobby(x, y, rx, ry, c1, c2, T, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= (o.alpha ?? 1); if (o.rot) ctx.rotate(o.rot);
  const g = ctx.createRadialGradient(-rx * .3, -ry * .4, 5, 0, 0, Math.max(rx, ry)); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, w = 1 + 0.05 * Math.sin(a * 3 + T * 4) + 0.03 * Math.sin(a * 5 - T * 3); ctx.lineTo(Math.cos(a) * rx * w, Math.sin(a) * ry * w); }
  ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke();
  if (o.face !== false) {
    const bl = (T % 3.3) < 0.13 ? 0.15 : 1, ex = rx * 0.28, ey = -ry * 0.18;
    if (o.mood === 'x') { ctx.lineWidth = 5; ctx.strokeStyle = '#2b1b2e'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * ex - 9, ey - 9); ctx.lineTo(s * ex + 9, ey + 9); ctx.moveTo(s * ex + 9, ey - 9); ctx.lineTo(s * ex - 9, ey + 9); ctx.stroke(); } }
    else for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * ex, ey); ctx.scale(1, bl); circle(0, 0, rx * 0.1, '#2b1b2e'); circle(-rx * .03, -rx * .04, rx * .035, '#fff'); ctx.restore(); }
    ctx.lineWidth = 4; ctx.strokeStyle = '#2b1b2e'; ctx.beginPath();
    if (o.mood === 'sad' || o.mood === 'x') ctx.arc(0, ey + ry * 0.32, rx * 0.11, Math.PI + 0.3, -0.3); else if (o.mood === 'o') { circle(0, ey + ry * 0.2, rx * 0.07, '#2b1b2e'); } else ctx.arc(0, ey + ry * 0.12, rx * 0.12, 0.2, Math.PI - 0.2);
    ctx.stroke();
    glow(-rx * .45, ey + ry * .2, rx * .18, 'rgba(255,90,120,.55)'); glow(rx * .45, ey + ry * .2, rx * .18, 'rgba(255,90,120,.55)');
  }
  ctx.restore();
}
function makePath(pts, steps = 16) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) { const t = s / steps, t2 = t * t, t3 = t2 * t; const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); } }
  out.push(pts[pts.length - 1]);
  const L = [0]; for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { len: L[L.length - 1], at(s) { s = cl(s, 0, this.len); let i = 1; while (i < L.length - 1 && L[i] < s) i++; const k = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1); const a = out[i - 1], b = out[i];
    return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; } };
}
/* 二重らせん（sepFn で場所ごとに開く、twist でねじれの強さ） */
function helix(o) {
  const { x0, x1, cy, amp, phase, sp = 30, seq = null, sepFn = null, sepDist = 150, alpha = 1, twist = 0.52, letters = false, lw = 10, colA = '#8ecbff', colB = '#ffb3d9', rungs = true } = o;
  const n = Math.floor((x1 - x0) / sp) + 1, P = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * sp, s = sepFn ? sepFn(x) : 0, a = phase + i * twist;
    const sa = Math.sin(a);
    const b = seq ? seq[i % seq.length] : 'ATGC'[(i * 7 + (i >> 2)) % 4];
    P.push({ x, s, z: Math.cos(a) * (1 - s), y1: lerp(cy + amp * sa, cy - sepDist, eio(s)), y2: lerp(cy - amp * sa, cy + sepDist, eio(s)), b, e: cl(Math.min(x - x0, x1 - x) / 90) });
  }
  ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round'; const A0 = ctx.globalAlpha;
  const strand = (key, col, back_) => {
    for (let i = 0; i < n - 1; i++) {
      const p = P[i], q = P[i + 1]; const z = (key === 'y1' ? 1 : -1) * (p.z + q.z) / 2;
      if ((z < 0) !== back_) continue;
      ctx.globalAlpha = A0 * Math.min(p.e, q.e) * (back_ ? 0.45 : 1);
      ctx.strokeStyle = col; ctx.lineWidth = lw * (back_ ? 0.8 : 1);
      ctx.beginPath(); ctx.moveTo(p.x, p[key]); ctx.lineTo(q.x, q[key]); ctx.stroke();
    }
  };
  strand('y1', colA, true); strand('y2', colB, true);
  if (rungs) for (const p of P) {
    ctx.globalAlpha = A0 * p.e * (0.55 + 0.45 * Math.abs(p.z) + 0.45 * p.s);
    const mid = (p.y1 + p.y2) / 2, h = Math.abs(p.y2 - p.y1);
    ctx.lineWidth = 8;
    if (p.s < 0.05) {
      ctx.strokeStyle = BC[p.b]; ctx.beginPath(); ctx.moveTo(p.x, p.y1); ctx.lineTo(p.x, mid); ctx.stroke();
      ctx.strokeStyle = BC[COMP[p.b]]; ctx.beginPath(); ctx.moveTo(p.x, mid); ctx.lineTo(p.x, p.y2); ctx.stroke();
    } else {
      const L = lerp(h / 2, 44, p.s);
      ctx.strokeStyle = BC[p.b]; ctx.beginPath(); ctx.moveTo(p.x, p.y1); ctx.lineTo(p.x, p.y1 + L); ctx.stroke();
      ctx.strokeStyle = BC[COMP[p.b]]; ctx.beginPath(); ctx.moveTo(p.x, p.y2); ctx.lineTo(p.x, p.y2 - L); ctx.stroke();
      if (letters && p.s > 0.6) { txt(p.b, p.x, p.y1 + 64, 22, BC[p.b], { alpha: seg(p.s, .6, 1) }); txt(COMP[p.b], p.x, p.y2 - 64, 22, BC[COMP[p.b]], { alpha: seg(p.s, .6, 1) }); }
    }
  }
  strand('y1', colA, false); strand('y2', colB, false);
  for (const p of P) { ctx.globalAlpha = A0 * p.e; if (p.z >= 0 || p.s > .5) circle(p.x, p.y1, 6, '#e8f5ff'); if (p.z <= 0 || p.s > .5) circle(p.x, p.y2, 6, '#ffe6f2'); }
  ctx.restore();
}
function nucleus(x, y, r, T, o = {}) {
  glow(x, y, r * 1.15, 'rgba(160,90,255,.35)', o.alpha ?? 1);
  ctx.save(); ctx.globalAlpha *= (o.alpha ?? 1);
  const g = ctx.createRadialGradient(x - r * .3, y - r * .3, 10, x, y, r); g.addColorStop(0, 'rgba(170,120,255,.45)'); g.addColorStop(1, 'rgba(90,50,170,.35)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.03); ctx.strokeStyle = 'rgba(210,180,255,.85)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 1.06, 0, Math.PI * 2); ctx.stroke();
  if (o.inner !== false) { ctx.lineWidth = Math.max(1.5, r * 0.02); ctx.strokeStyle = 'rgba(255,200,240,.35)';
    for (let k = 0; k < 5; k++) { ctx.beginPath(); for (let i = 0; i <= 30; i++) { const u = i / 30; const px = x - r * .6 + u * r * 1.2, py = y - r * .5 + k * r * .25 + Math.sin(u * 9 + k + T * 1.2) * r * .08; if (Math.hypot(px - x, py - y) < r * .85) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); } }
  ctx.restore();
}
const BOKEH = Array.from({ length: 22 }, (_, i) => { const r = (n) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };
  return { x: r(1) * 1920, y: r(2) * 1080, r: 40 + r(3) * 140, vx: (r(4) - .5) * 14, vy: (r(5) - .5) * 10, c: ['rgba(90,140,255,.16)', 'rgba(200,110,255,.14)', 'rgba(60,220,190,.12)'][i % 3] }; });
function background(T, tint) {
  const g = ctx.createLinearGradient(0, 0, 1920, 1080);
  const TT = [['#0e1a3e', '#23164a'], ['#1d1245', '#0d1a3a'], ['#0b2433', '#16204a'], ['#241435', '#0e1d3c']][tint || 0];
  g.addColorStop(0, TT[0]); g.addColorStop(1, TT[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  for (const b of BOKEH) { const x = ((b.x + b.vx * T) % 2200 + 2200) % 2200 - 140, y = ((b.y + b.vy * T) % 1300 + 1300) % 1300 - 110; glow(x, y, b.r, b.c); }
}
const kw = (i, s) => { const n = cur.lines[i].text.indexOf(s); return n < 0 ? 0 : n * 0.135; };

const E = { cl, seg, eo, eio, back, lerp, FONT, BC, COMP, hotRect, hotCircle, txt, rr, circle, pill, glow, arrow, star, stamp, ring, blobby, makePath, helix, nucleus, background, kw,
  get ctx() { return ctx; } };

/* ========================================================= 組み立て（最初に開いたとき1回だけ） */
let SPEED = 1;
function build() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  R = document.createElement('div'); R.id = 'gvRoot'; R.innerHTML = HTML; document.body.appendChild(R);
  cv = R.querySelector('.gv-cv'); ctx = cv.getContext('2d');
  const $ = s => R.querySelector(s);
  $('.gv-go').onclick = () => { P.voice = true; play(P.startLine || 0); };
  $('.gv-gomute').onclick = () => { P.voice = false; play(P.startLine || 0); };
  $('.gv-pp').onclick = () => { if (P.card) { P.card.was = true; closeCard(); return; } if (P.state === 'play') pause(); else if (P.state === 'pause') play(P.line); else play(P.state === 'end' ? 0 : P.line); };
  $('.gv-prev').onclick = () => { const t = (now() - P.t0) / 1000; jump(t > 1.5 && P.state === 'play' ? P.line : P.line - 1); };
  $('.gv-nextb').onclick = () => jump(P.line + 1);
  $('.gv-mute').onclick = () => { P.voice = !P.voice; syncBtn(); if (!P.voice && window.speechSynthesis) { speechSynthesis.cancel(); if (P.sp) { P.sp.done = true; P.sp.silent = true; } } };
  $('.gv-close').onclick = () => GuideVideo.close();
  $('.gv-close2').onclick = () => GuideVideo.close();
  $('.gv-again').onclick = () => { $('.gv-end').style.display = 'none'; play(0); };
  $('.gv-next').onclick = () => { const f = P.opts.onNext; GuideVideo.close(); if (f) f(); };
  $('.gv-card button').onclick = closeCard;
  let ptr = 'mouse';
  cv.addEventListener('pointerdown', e => { ptr = e.pointerType; if (ptr !== 'mouse') mouse = null; });
  cv.addEventListener('mousemove', e => { if (ptr === 'mouse' && !isTouch()) mouse = toStage(e); });
  cv.addEventListener('mouseleave', () => { mouse = null; });
  // 指で触るときは当たりを広げる（実寸で約22px）
  cv.addEventListener('click', e => { if (P.card) return; const touch = ptr !== 'mouse' || isTouch(); const h = hitAt(toStage(e), touch ? 22 / (P.scale || 1) : 0); if (h) openCard(h); if (touch) mouse = null; });
  $('.gv-fs').onclick = () => {
    const d = document; const inFs = d.fullscreenElement || d.webkitFullscreenElement;
    try { if (inFs) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else { const r = (R.requestFullscreen || R.webkitRequestFullscreen).call(R); if (r && r.then) r.then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { }); } } catch (e) { }
  };
  const refit = () => { if (P.open) { fit(); setTimeout(() => { if (P.open) fit(); }, 350); } };
  addEventListener('resize', refit); addEventListener('orientationchange', refit);
  if (window.visualViewport) visualViewport.addEventListener('resize', refit);
  initGuide(R.querySelector('.gv-guide'));
}
function showErr(msg) { const el = R && R.querySelector('.gv-err'); if (el) { el.textContent = '⚠ 動画でエラーが起きました：' + msg; el.style.display = 'block'; } }

/* ========================================================= 再生の仕組み */
let base = 0, runAt = null;
const now = () => base + (runAt != null ? (performance.now() - runAt) * SPEED : 0);
const clockRun = () => { if (runAt == null) runAt = performance.now(); };
const clockStop = () => { if (runAt != null) { base = now(); runAt = null; } };
const P = { state: 'ready', line: 0, t0: 0, voice: true, sp: null, tok: 0, open: false, opts: {} };
let jaVoice = null;
function pickVoice() {
  const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  const ja = vs.filter(v => /^ja/i.test(v.lang));
  // 自然な声（Edge の Natural / Online）を最優先。声の高さ・速さは変えない（変えると声が震えて聞こえる環境がある）
  jaVoice = ja.find(v => /Natural|Online/.test(v.name)) || ja.find(v => /Google/.test(v.name)) || ja.find(v => /Kyoko|Nanami|Haruka|Ayumi|Otoya/.test(v.name)) || ja[0] || null;
}
try { if (window.speechSynthesis) { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); } } catch (e) { }
const readOf = s => cur.yomi.reduce((a, [k, v]) => a.split(k).join(v), s);
/* 読み上げは「文ごと」に分けて順に読ませる。いま読んでいる文（sp.part）に字幕と絵の時計を合わせる。
   ＝ 字幕は必ず声と同じ文になり、絵の合図（kw）もその文の中でしかずれない */
function speak(i) {
  const tok = ++P.tok, sp = { started: false, done: false, part: -1 };
  P.sp = sp;
  if (!P.voice || !window.speechSynthesis || SPEED !== 1) { sp.done = true; sp.silent = true; return; }
  try {
    speechSynthesis.cancel();
    const L = cur.lines[i], n = L.parts.length;
    L.parts.forEach((p, k) => {
      const u = new SpeechSynthesisUtterance(L.reads[k]); u.lang = 'ja-JP'; if (jaVoice) u.voice = jaVoice; u.rate = 1; u.pitch = 1;
      u.onstart = () => { if (tok === P.tok) { sp.started = true; sp.part = k; } };
      u.onend = () => { if (tok === P.tok && k === n - 1) sp.done = true; };
      u.onerror = () => { if (tok === P.tok) { if (!sp.started) sp.silent = true; sp.done = true; } };
      speechSynthesis.speak(u);
    });
  } catch (e) { sp.done = true; sp.silent = true; }
}
function stopVoice() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { } }
function startLine(i) { P.line = i; P.t0 = now(); P.vt = 0; P.vLast = P.t0; speak(i); }
/* 絵の時計（行の中の経過秒）。声がないときは実時間どおり。声があるときは、いま読んでいる文の見込み区間の中だけ進める
   （声が遅ければ文の終わりで待ち、速ければ次の文の頭まで早回しで追いつく） */
function advanceClock(L) {
  const nw = now(), dt = Math.max(0, (nw - (P.vLast ?? nw)) / 1000); P.vLast = nw;
  const sp = P.sp || { done: true, silent: true };
  if (sp.silent || !P.voice) { P.vt += dt; return; }
  const k = sp.part;
  if (sp.done) { P.vt += dt * (P.vt < L.est ? 4 : 1); return; }
  if (k < 0) return;                                    // 声が出るのを待つ
  const floor = L.pStart[k], cap = L.pEnd[k];
  if (P.vt >= cap) return;                              // 声のほうが遅い：文の終わりで待つ
  P.vt = Math.min(cap, P.vt + dt * (P.vt < floor ? 4 : 1));
}
function play(from) {
  R.querySelector('.gv-start').style.display = 'none'; R.querySelector('.gv-end').style.display = 'none';
  if (P.state === 'end' && from == null) from = 0;
  P.state = 'play'; clockRun(); startLine(from != null ? from : P.line); syncBtn();
}
function pause() { if (P.state !== 'play') return; P.state = 'pause'; clockStop(); P.tok++; stopVoice(); syncBtn(); }
function jump(i) { if (P.card) { P.card.was = false; closeCard(); } i = cl(i, 0, cur.lines.length - 1); if (P.state !== 'play') { play(i); } else { clockRun(); startLine(i); syncBtn(); } }
function syncBtn() { R.querySelector('.gv-pp').textContent = P.state === 'play' ? '⏸' : P.state === 'end' ? '↻' : '▶'; R.querySelector('.gv-mute').textContent = P.voice ? '🔊' : '🔇'; }
function onKey(e) {
  if (!P.open) return;
  const k = e.code; let used = true;
  if (P.card && (k === 'Escape' || k === 'Enter')) closeCard();
  else if (k === 'Escape') GuideVideo.close();
  else if (k === 'Space') R.querySelector('.gv-pp').click();
  else if (k === 'ArrowRight') jump(P.line + 1);
  else if (k === 'ArrowLeft') R.querySelector('.gv-prev').click();
  else used = false;
  if (used) { e.preventDefault(); e.stopPropagation(); }
}

/* 進行バー（ページごとにまとめる） */
function buildBar() {
  const segsEl = R.querySelector('.gv-segs'), chl = R.querySelector('.gv-chl'), tip = R.querySelector('.gv-tip');
  segsEl.innerHTML = ''; chl.innerHTML = '';
  cur.chapters.forEach((ch, c) => {
    const idx = cur.lines.map((L, i) => L.ch === c ? i : -1).filter(i => i >= 0);
    const dur = idx.reduce((a, i) => a + cur.lines[i].dur, 0);
    const g = document.createElement('div'); g.style.flex = dur;
    const lb = document.createElement('div'); lb.style.flex = dur; lb.textContent = ch.short || ch.title; lb.title = ch.title; lb.onclick = () => jump(idx[0]); chl.appendChild(lb);
    idx.forEach(i => { const dv = document.createElement('div'); dv.style.flex = cur.lines[i].dur; dv.appendChild(document.createElement('i')); dv.dataset.i = i;
      dv.onclick = () => jump(i);
      dv.onmouseenter = () => { tip.style.display = 'block'; tip.textContent = ch.title + (cur.lines[i].chip ? '｜' + cur.lines[i].chip : ''); const r = dv.getBoundingClientRect(), p = segsEl.getBoundingClientRect(); tip.style.left = (r.left - p.left + r.width / 2) + 'px'; };
      dv.onmouseleave = () => tip.style.display = 'none'; g.appendChild(dv); });
    segsEl.appendChild(g);
  });
  P.segEls = [...segsEl.querySelectorAll('[data-i]')];
  P.chlEls = [...chl.children];
}
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function subtitle(i, t) {
  if (P.state === 'ready') return '';
  const L = cur.lines[i], sp = P.sp;
  // 声が出ているときは、いま読んでいる文をそのまま出す（声と字幕が必ずそろう）
  if (!still && sp && !sp.silent && P.voice && P.state === 'play') return L.parts[Math.max(0, sp.done ? L.parts.length - 1 : sp.part)];
  for (let k = 0; k < L.parts.length; k++) if (t < L.pEnd[k]) return L.parts[k];
  return L.parts[L.parts.length - 1];
}
/* スマホ：短い辺が600px未満。縦向きは絵を上に置き、字幕を下に大きく出す。
   スタート画面・終わりの画面・説明カードは、絵と一緒に縮まないよう絵の外（gv-wrap）へ移す */
const isTouch = () => { try { return matchMedia('(hover:none)').matches; } catch (e) { return false; } };
function fit() {
  const wrap = R.querySelector('.gv-wrap'), stage = R.querySelector('.gv-stage');
  const VW = innerWidth, VH = innerHeight, mob = Math.min(VW, VH) < 600, por = mob && VH > VW;
  R.classList.toggle('gv-m', mob); R.classList.toggle('gv-mp', por);
  const home = mob ? wrap : stage;
  for (const el of R.querySelectorAll('.gv-ov, .gv-card')) if (el.parentNode !== home) home.appendChild(el);
  const w = wrap.clientWidth, h = wrap.clientHeight;
  let s = Math.min(w / 1920, h / 1080), ty = (h - 1080 * s) / 2;
  if (por) { s = w / 1920; ty = Math.max(0, Math.min((h - 1080 * s) * 0.18, 40)); }
  stage.style.transform = `translate(${(w - 1920 * s) / 2}px,${ty}px) scale(${s})`; R.style.setProperty('--s', s); P.scale = s;
  const ms = R.querySelector('.gv-msub'); ms.style.top = (ty + 1080 * s + 14) + 'px'; ms.style.bottom = '8px';
  // 横向きのスマホでは、絵の中の字幕を実寸で16px以上に
  const sub = R.querySelector('.gv-sub span');
  const fsz = mob && !por ? Math.max(40, 16 / s) : 40;
  sub.style.fontSize = fsz + 'px'; sub.style.maxWidth = mob && !por ? '1320px' : ''; R.querySelector('.gv-sub').style.bottom = mob && !por ? '14px' : '';
  R.querySelector('.gv-close').textContent = mob ? '✕' : '✕ とじる';
  const fsb = R.querySelector('.gv-fs'); fsb.style.display = mob && (R.requestFullscreen || R.webkitRequestFullscreen) ? '' : 'none';
  if (G3.resize) G3.resize();
}

/* 毎フレーム */
let still = null, mouse = null, rafId = 0;
function frame() {
  rafId = 0;
  if (!P.open) return;
  try { drawFrame(); } catch (e) { showErr(e.message); console.error(e); }
  rafId = requestAnimationFrame(frame);
}
function drawFrame() {
  const LINES = cur.lines;
  let i = P.line, t = P.vt || 0;
  if (still) { i = still[0]; t = still[1]; }
  const L = LINES[i];
  if (!still && P.state === 'play') {
    const sp = P.sp || { done: true };
    if (!sp.started && !sp.done && (now() - P.t0) / 1000 > 2.6) { sp.done = true; sp.silent = true; }
    advanceClock(L); t = P.vt;
    if (t >= L.dur + 0.25 && sp.done) {
      if (i >= LINES.length - 1) { P.state = 'end'; clockStop(); syncBtn(); R.querySelector('.gv-end').style.display = 'flex'; }
      else { startLine(i + 1); i = P.line; t = 0; }
    }
  } else if (!still) P.vLast = now();
  const L2 = LINES[i], tc = Math.min(t, L2.dur);
  const T = still ? tc + i * 7 : now() / 1000;
  HOTS = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  (cur.background || background)(T, cur.chapters[L2.ch].tint || 0, i, tc);
  cur.scenes[i].draw(tc, L2.dur, T, i);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // 見出し：ページ名＋場面名
  const ch = cur.chapters[L2.ch];
  const ca = seg(tc, 0, .5);
  { const lb = `${ch.num} ${ch.title}`; ctx.save(); ctx.font = `800 28px ${FONT}`; const w = ctx.measureText(lb).width + 34; ctx.restore();
    pill(lb, 570 + w / 2, 64, 28, 'rgba(255,255,255,.12)', '#fff', { alpha: ca, border: 'rgba(255,255,255,.35)' }); }
  if (P.state !== 'ready' && P.hint && i === P.startLine && tc < 6.5 && !P.card) pill(isTouch() ? '💡 名前や絵をタップすると説明が出ます' : '💡 名前や絵をクリックすると説明が出ます', 1590, 64, 24, 'rgba(255,246,160,.94)', '#1b2150', { alpha: seg(tc, .6, 1.1) * (1 - seg(tc, 5.8, 6.5)) });
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 180);
  if (P.card) {
    const h = P.card.h; ctx.save(); ctx.fillStyle = 'rgba(3,5,15,.55)'; ctx.beginPath(); ctx.rect(0, 0, 1920, 1080); ctx.roundRect(h.x0 - 16, h.y0 - 16, h.x1 - h.x0 + 32, h.y1 - h.y0 + 32, 22); ctx.fill('evenodd');
    ctx.setLineDash([14, 9]); ctx.lineDashOffset = -performance.now() / 30; ctx.lineWidth = 5; ctx.strokeStyle = '#fff6a0'; ctx.shadowColor = '#fff6a0'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.roundRect(h.x0 - 16, h.y0 - 16, h.x1 - h.x0 + 32, h.y1 - h.y0 + 32, 22); ctx.stroke(); ctx.restore();
    cv.style.cursor = 'default';
  } else {
    const hv = mouse ? hitAt(mouse) : null;
    cv.style.cursor = hv ? 'pointer' : 'default';
    if (hv) { ctx.save(); ctx.setLineDash([12, 8]); ctx.lineWidth = 4; ctx.strokeStyle = `rgba(255,246,160,${0.6 + 0.4 * pulse})`; ctx.shadowColor = '#fff6a0'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.roundRect(hv.x0 - 10, hv.y0 - 10, hv.x1 - hv.x0 + 20, hv.y1 - hv.y0 + 20, 18); ctx.stroke(); ctx.restore();
      const ty = hv.y0 - 38 < 110 ? hv.y1 + 40 : hv.y0 - 38;
      pill('👆 ' + cur.gloss[hv.key].t.replace(/（.*/, '') + ' の説明', cl((hv.x0 + hv.x1) / 2, 720, 1720), ty, 24, 'rgba(255,246,160,.96)', '#1b2150'); }
  }
  const sp = P.sp;
  const talking = P.state === 'play' && (sp && !sp.silent ? (sp.started && !sp.done) : t < L2.est);
  window.__cue = P.card ? { x: 0, walk: 0, point: P.card.pt, talk: P.card.talking } : cueFor(i, tc, L2.dur, talking);
  const s = subtitle(i, t), subEl = R.querySelector('.gv-sub span'); if (subEl.textContent !== s) { subEl.textContent = s; R.querySelector('.gv-msub span').textContent = s; }
  let el = 0; P.segEls.forEach((dv, k) => { const f = k < i ? 1 : k > i ? 0 : tc / LINES[k].dur; dv.firstChild.style.width = (f * 100) + '%'; if (k < i) el += LINES[k].dur; });
  P.chlEls.forEach((d, c) => d.classList.toggle('on', c === L2.ch));
  el += tc; R.querySelector('.gv-time').textContent = `${fmt(el)} / ${fmt(cur.total)}`;
}
function cueFor(i, t, d, talking) {
  const c = { x: 0, yaw: null, walk: 0, wave: false, point: null, nod: false, happy: false, talk: talking };
  if (i === 0) { const w = seg(t, 0, 1.5); c.x = -1.5 * (1 - w); c.walk = t < 1.5 ? 1 : 0; c.turn = seg(t, 1.5, 2.0); c.wave = t > 2.0 && t < 3.9; }
  if (i === cur.lines.length - 1) c.wave = t > d - 3.0;
  if (cur.cue) cur.cue(i, t, d, c);
  if (cur.calm) c.happy = false;          // 戦争・災害を扱う中身（歴史など）では、案内役の「喜ぶ」動きを出さない
  const p =cur.scenes[i].point && cur.scenes[i].point(t, d, i);
  if (p && !c.wave && !c.happy) c.point = p;
  return c;
}

/* クリックで説明カード */
function toStage(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1920, (e.clientY - r.top) / r.height * 1080]; }
function hitAt(p, pad = 0) { let best = null, ba = Infinity, bd = Infinity;
  for (const h of HOTS) {
    const dx = Math.max(h.x0 - p[0], 0, p[0] - h.x1), dy = Math.max(h.y0 - p[1], 0, p[1] - h.y1), d = Math.hypot(dx, dy);
    if (d > pad) continue;
    const a = (h.x1 - h.x0) * (h.y1 - h.y0);
    if (d < bd - 1e-6 || (Math.abs(d - bd) < 1e-6 && a < ba)) { bd = d; ba = a; best = h; }
  }
  return best; }
function openCard(h) {
  const g = cur.gloss[h.key]; if (!g) return;
  const was = P.state === 'play'; if (was) pause();
  P.card = { h: { ...h }, key: h.key, was, talking: false, pt: [(h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2] };
  const cardEl = R.querySelector('.gv-card');
  cardEl.querySelector('.ic').textContent = g.ic; cardEl.querySelector('b').textContent = g.t;
  cardEl.querySelector('p').textContent = g.b; const mo = cardEl.querySelector('.more'); mo.textContent = g.m || ''; mo.style.display = g.m ? '' : 'none';
  cardEl.querySelector('button').textContent = was ? '▶ 続きを見る' : 'とじる';
  cardEl.style.display = 'block';
  if (R.classList.contains('gv-m')) { cardEl.style.bottom = '10px'; cardEl.scrollTop = 0; syncBtn(); speakCard(g); return; }
  cardEl.style.bottom = '';
  const W = cardEl.offsetWidth, H = cardEl.offsetHeight, cx = P.card.pt[0], cy = P.card.pt[1];
  let left = cx < 1240 ? h.x1 + 36 : h.x0 - 36 - W;
  if (left + W > 1900 || left < 560) left = cx < 1240 ? 1900 - W : 560;
  cardEl.style.left = cl(left, 560, 1900 - W) + 'px'; cardEl.style.top = cl(cy - H / 2, 100, 950 - H) + 'px';
  syncBtn(); speakCard(g);
}
function speakCard(g) {
  if (!P.voice || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel(); const c = P.card;
    const u = new SpeechSynthesisUtterance(readOf(g.t.replace(/（.*?）/g, '') + '。' + g.b + (g.m || ''))); u.lang = 'ja-JP'; if (jaVoice) u.voice = jaVoice; u.rate = 1; u.pitch = 1;
    u.onstart = () => { if (P.card === c) c.talking = true; }; u.onend = u.onerror = () => { c.talking = false; };
    setTimeout(() => { if (P.card === c) speechSynthesis.speak(u); }, 60);
  } catch (e) { }
}
function closeCard() {
  if (!P.card) return; const was = P.card.was; P.card = null; R.querySelector('.gv-card').style.display = 'none';
  stopVoice();
  if (was) play(P.line); else syncBtn();
}

/* ========================================================= 案内役（ゆるキャラ風の2人のデフォルメの子） */
const G3 = { ready: false, running: false };
async function initGuide(gcv) {
  let THREE, RoomEnvironment;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/+esm');
    try { ({ RoomEnvironment } = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js/+esm')); } catch (e) { RoomEnvironment = null; }
  } catch (e) { gcv.style.display = 'none'; G3.failed = true; window.GUIDE = { ready: true, failed: true }; return; }
  try { buildGuide(THREE, RoomEnvironment, gcv); } catch (e) { gcv.style.display = 'none'; G3.failed = true; window.GUIDE = { ready: true, failed: true }; }
}
function buildGuide(THREE, RoomEnvironment, gcv) {
  const CV_X = 0, CV_Y = 400, CW = 540, CH = 680, PPM = 355, CX0 = 250, FEET_Y = 640, HEIGHT = 1.3, BASE_YAW = 0.22;
  const renderer = new THREE.WebGLRenderer({ canvas: gcv, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  G3.resize = () => { const s = P.scale || 1; renderer.setPixelRatio(Math.min(2, Math.max(0.5, (devicePixelRatio || 1) * s))); renderer.setSize(CW, CH, false); };
  G3.resize();
  const scene = new THREE.Scene();
  if (RoomEnvironment) scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const FOV = 18, D = (CH / PPM) / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const camX = (CW / 2 - CX0) / PPM, camY = (FEET_Y - CH / 2) / PPM;
  const camera = new THREE.PerspectiveCamera(FOV, CW / CH, 0.1, 50); camera.position.set(camX, camY, D); camera.lookAt(camX, camY, 0);
  scene.add(new THREE.HemisphereLight(0xf4fbff, 0x3a3346, RoomEnvironment ? 1.15 : 1.6));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.0); key.position.set(-1.5, 3.5, 5); scene.add(key);
  const rimB = new THREE.DirectionalLight(0x8fbcff, 1.6); rimB.position.set(3, 3, -3); scene.add(rimB);
  const rimO = new THREE.DirectionalLight(0xffb08a, 0.8); rimO.position.set(-3, 2, -3); scene.add(rimO);
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  function blobTex(stops) { return canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }); }
  const floor = new THREE.Group(); scene.add(floor);
  { const glowM = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: blobTex([[0, 'rgba(110,168,255,.55)'], [.45, 'rgba(110,168,255,.16)'], [1, 'rgba(110,168,255,0)']]), transparent: true, depthWrite: false, toneMapped: false }));
    glowM.rotation.x = -Math.PI / 2; glowM.scale.y = 0.55; glowM.position.y = 0.001; floor.add(glowM);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: blobTex([[0, 'rgba(0,0,0,.7)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.scale.y = 0.5; sh.position.y = 0.002; floor.add(sh); }
  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.78, metalness: 0, envMapIntensity: 0.35 }, o));
  function mesh(geo, mat, parent, pos, rot, scl) { const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl); if (parent) parent.add(m); return m; }
  const SPH = new THREE.SphereGeometry(1, 48, 32);
  function taper(r1, r2, len, seg_ = 40) { const p = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI / 2; p.push(new THREE.Vector2(r2 * Math.cos(a) + 1e-4, -len + r2 * Math.sin(a))); }
    for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; p.push(new THREE.Vector2(r1 * Math.cos(a) + 1e-4, r1 * Math.sin(a))); } return new THREE.LatheGeometry(p, seg_); }
  function lathe(prof, seg_ = 56, steps = 6) { const pts = []; for (let i = 0; i < prof.length - 1; i++) { const p0 = prof[Math.max(0, i - 1)], p1 = prof[i], p2 = prof[i + 1], p3 = prof[Math.min(prof.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) { const t = s / steps, t2 = t * t, t3 = t2 * t; const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); pts.push(new THREE.Vector2(Math.max(1e-4, cr(p0[1], p1[1], p2[1], p3[1])), cr(p0[0], p1[0], p2[0], p3[0]))); } }
    const L = prof[prof.length - 1]; pts.push(new THREE.Vector2(Math.max(1e-4, L[1]), L[0])); return new THREE.LatheGeometry(pts, seg_); }
  function placer(rx, ry, rz) { return (obj, yaw, pitch, out = 0) => { const d = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    const s = 1 / Math.sqrt((d.x / rx) ** 2 + (d.y / ry) ** 2 + (d.z / rz) ** 2); const p = d.multiplyScalar(s);
    const n = new THREE.Vector3(p.x / rx / rx, p.y / ry / ry, p.z / rz / rz).normalize(); obj.position.copy(p).addScaledVector(n, out); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); return obj; }; }
  const blushMat = new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,95,110,0.7)'); gr.addColorStop(0.55, 'rgba(255,110,125,0.37)'); gr.addColorStop(1, 'rgba(255,130,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  function makeEye(parent, place, yaw, pitch, w, h, t, hl) { const g = new THREE.Group(); place(g, yaw, pitch, -t * 0.35); parent.add(g);
    mesh(SPH, M(0x241a16, { roughness: 0.35 }), g, [0, 0, 0], null, [w, h, t]);
    const l = mesh(SPH, M(0xffffff, { roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.6 }), g, [w * 0.32 * Math.sign(-yaw || 1), h * 0.38, t * 0.7], null, [hl, hl * 1.15, hl * 0.5]);
    mesh(SPH, l.material, g, [-w * 0.25 * Math.sign(-yaw || 1), -h * 0.45, t * 0.75], null, [hl * 0.45, hl * 0.45, hl * 0.3]); return g; }
  function makeMouth(parent, place, pitch, r, tube, col) { const g = new THREE.Group(); place(g, 0, pitch, 0.001); parent.add(g);
    const smile = mesh(new THREE.TorusGeometry(r, tube, 10, 28, Math.PI), M(col, { roughness: 0.5 }), g, [0, r * 0.55, 0], [0, 0, Math.PI]);
    const open = new THREE.Group(); g.add(open);
    mesh(new THREE.CircleGeometry(r * 1.05, 32, Math.PI, Math.PI), M(0x7a2c30, { roughness: 0.6, side: THREE.DoubleSide }), open, [0, r * 0.4, 0.001]);
    mesh(new THREE.CircleGeometry(r * 0.55, 24, Math.PI, Math.PI), M(0xe56b75, { roughness: 0.6 }), open, [0, -r * 0.25, 0.002], null, [1, 0.55, 1]);
    open.visible = false; return { smile, open }; }
  function joint(parent, name, pos, rig) { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); rig.J[name] = g; return g; }
  function buildChibi() {
    const rig = { J: {}, eyes: [] };
    const root = new THREE.Group(); const inner = new THREE.Group(); root.add(inner); rig.root = root; rig.inner = inner;
    const skin = M(0xffdcc6, { roughness: 0.7 }), hair = M(0x8a4e2b, { roughness: 0.62 }), shorts = M(0x3f5f9e), shoe = M(0xe0574b, { roughness: 0.55 }), sole = M(0xfff7ea), sock = M(0xffffff);
    const stripe = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#fdf6e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#5aa9e0'; for (let i = 0; i < 9; i++) g.fillRect(0, i * h / 9 + h / 36, w, h / 18); });
    const shirt = M(0xffffff, { map: stripe, roughness: 0.85 });
    const pelvis = joint(inner, 'pelvis', [0, 0.175, 0], rig);
    mesh(lathe([[-0.075, 0.0], [-0.07, 0.05], [-0.055, 0.085], [-0.02, 0.1], [0.03, 0.105], [0.06, 0.1]], 56), shorts, pelvis, null, null, [1, 1, 0.86]);
    for (const s of [1, -1]) { const L = s > 0 ? 'l' : 'r';
      const hip = joint(pelvis, L + 'Hip', [0.052 * s, -0.03, 0], rig); mesh(taper(0.046, 0.042, 0.055), shorts, hip);
      const knee = joint(hip, L + 'Knee', [0, -0.06, 0], rig); mesh(taper(0.034, 0.031, 0.05), skin, knee); mesh(taper(0.034, 0.033, 0.02), sock, knee, [0, -0.035, 0]);
      const ank = joint(knee, L + 'Ank', [0, -0.058, 0], rig);
      mesh(SPH, shoe, ank, [0, -0.004, 0.018], null, [0.047, 0.036, 0.07]); mesh(SPH, sole, ank, [0, -0.026, 0.018], null, [0.048, 0.013, 0.071]); }
    const spine = joint(pelvis, 'spine', [0, 0.04, 0], rig);
    mesh(lathe([[-0.03, 0.0], [-0.02, 0.1], [0.03, 0.11], [0.09, 0.112], [0.14, 0.1], [0.175, 0.07], [0.19, 0.035], [0.195, 0.0]], 56), shirt, spine, null, null, [1, 1, 0.86]);
    const chest = joint(spine, 'chest', [0, 0.1, 0], rig);
    for (const s of [1, -1]) { const L = s > 0 ? 'l' : 'r';
      const sh = joint(chest, L + 'Sh', [0.102 * s, 0.055, 0], rig); mesh(taper(0.043, 0.04, 0.06), shirt, sh);
      const el = joint(sh, L + 'El', [0, -0.068, 0], rig); mesh(taper(0.031, 0.028, 0.045), skin, el);
      const hd = joint(el, L + 'Hand', [0, -0.055, 0], rig); mesh(SPH, skin, hd, [0, -0.012, 0], null, [0.036, 0.038, 0.034]);
      mesh(SPH, skin, hd, [-0.004 * s, -0.002, 0.026], null, [0.014, 0.018, 0.014]); joint(hd, L + 'Tip', [0, -0.05, 0], rig); }
    const neck = joint(chest, 'neck', [0, 0.085, 0], rig); mesh(taper(0.035, 0.035, 0.03), skin, neck, [0, 0.02, 0]);
    const head = joint(neck, 'head', [0, 0.02, 0], rig);
    const HS = 0.8; const hc = new THREE.Group(); hc.position.set(0, 0.24 * HS - 0.015, 0.0); hc.scale.setScalar(HS); head.add(hc);
    const RX = 0.265, RY = 0.24, RZ = 0.245; const place = placer(RX, RY, RZ);
    mesh(SPH, skin, hc, null, null, [RX, RY, RZ]);
    for (const s of [1, -1]) { const e = new THREE.Group(); place(e, s * 1.55, -0.12, -0.02); hc.add(e); mesh(SPH, skin, e, [0, 0, 0.01], null, [0.045, 0.055, 0.03]); }
    for (const s of [1, -1]) { rig.eyes.push(makeEye(hc, place, s * 0.3, -0.1, 0.036, 0.052, 0.018, 0.013));
      const br = new THREE.Group(); place(br, s * 0.31, 0.17, 0.0); hc.add(br); mesh(new THREE.CapsuleGeometry(0.0065, 0.03, 4, 10), hair, br, [0, 0, 0.002], [0, 0, Math.PI / 2 - s * 0.12]);
      const bl = new THREE.Group(); place(bl, s * 0.56, -0.24, 0.002); hc.add(bl); mesh(new THREE.PlaneGeometry(0.1, 0.07), blushMat, bl); }
    const nose = new THREE.Group(); place(nose, 0, -0.2, -0.004); hc.add(nose); mesh(SPH, skin, nose, null, null, [0.018, 0.014, 0.014]);
    rig.mouth = makeMouth(hc, place, -0.36, 0.022, 0.0045, 0x5a2e24);
    const cap = new THREE.SphereGeometry(1, 64, 40, 0, Math.PI * 2, 0, 1.8); cap.rotateX(-0.64);
    mesh(cap, M(0x8a4e2b, { roughness: 0.62, side: THREE.DoubleSide }), hc, [0, 0.004, -0.004], null, [RX * 1.07, RY * 1.08, RZ * 1.08]);
    const backG = new THREE.SphereGeometry(1, 64, 32, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1, 0.5, 1.75);
    mesh(backG, M(0x8a4e2b, { roughness: 0.62, side: THREE.DoubleSide }), hc, [0, 0, -0.004], null, [RX * 1.075, RY * 1.07, RZ * 1.07]);
    for (const [y, p, w, h] of [[-0.66, 0.36, 0.07, 0.06], [-0.35, 0.43, 0.075, 0.062], [-0.04, 0.45, 0.08, 0.064], [0.27, 0.43, 0.075, 0.062], [0.58, 0.37, 0.07, 0.06]]) { const b = new THREE.Group(); place(b, y, p, 0.004); hc.add(b); mesh(SPH, hair, b, [0, 0, 0], [0, 0, -y * 0.5], [w, h, 0.022]); }
    for (const s of [1, -1]) { const b = new THREE.Group(); place(b, s * 1.08, 0.02, 0.004); hc.add(b); mesh(SPH, hair, b, [0, -0.02, 0], [0, 0, s * 0.12], [0.05, 0.1, 0.03]); }
    mesh(taper(0.014, 0.005, 0.07, 16), hair, hc, [0.03, RY * 1.06, -0.02], [0.3, 0, -0.55]);
    return rig;
  }
  const C = buildChibi();
  { C.root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(C.root); C.scale = HEIGHT / (box.max.y - box.min.y); }
  C.inner.scale.setScalar(C.scale); scene.add(C.root);
  const JN = ['pelvis', 'spine', 'chest', 'neck', 'head', 'lSh', 'lEl', 'lHand', 'rSh', 'rEl', 'rHand', 'lHip', 'lKnee', 'lAnk', 'rHip', 'rKnee', 'rAnk'];
  const G = { t: 0, ph: 0, walkW: 0, wWave: 0, wPoint: 0, wTalk: 0, wHappy: 0, wNod: 0, look: 0, turnExtra: 0, blinkAt: 1500, lastPoint: null };
  const V = () => new THREE.Vector3(), Qn = () => new THREE.Quaternion();
  const _a = V(), _b = V(), q1 = Qn(), q2 = Qn(), q3 = Qn();
  function aim(bone, child, dir, w) { if (w <= 0.002 || !bone || !child) return; bone.getWorldPosition(_a); child.getWorldPosition(_b);
    q1.setFromUnitVectors(_b.sub(_a).normalize(), dir); bone.getWorldQuaternion(q2); q3.copy(q1).multiply(q2); q2.slerp(q3, Math.min(1, w));
    bone.parent.getWorldQuaternion(q1).invert(); bone.quaternion.copy(q1.multiply(q2)); bone.updateMatrixWorld(true); }
  const bodyDir = (x, y, z) => new THREE.Vector3(x, y, z).normalize().applyQuaternion(C.root.quaternion);
  const damp = (v, t, k, dt) => v + (t - v) * (1 - Math.exp(-k * dt));
  const toWorld = ([sx, sy]) => new THREE.Vector3(camX + (sx - CV_X - CW / 2) / PPM, camY - (sy - CV_Y - CH / 2) / PPM, 0.55);
  function step(dt) {
    const cue = window.__cue || { x: 0, walk: 0 }; const J = C.J; G.t += dt * 1000; const t = G.t / 1000;
    G.walkW = damp(G.walkW, cue.walk, 10, dt);
    const yaw = cue.walk ? Math.PI / 2 : cue.turn != null && cue.turn < 1 ? Math.PI / 2 + (BASE_YAW - Math.PI / 2) * (cue.turn * cue.turn * (3 - 2 * cue.turn)) : BASE_YAW;
    if (cue.point) G.lastPoint = cue.point;
    G.wPoint = damp(G.wPoint, cue.point ? 1 : 0, 6, dt); G.wWave = damp(G.wWave, cue.wave ? 1 : 0, 6, dt);
    G.wTalk = damp(G.wTalk, cue.talk && !cue.wave && !cue.happy ? 1 : 0, 3, dt); G.wHappy = damp(G.wHappy, cue.happy ? 1 : 0, 6, dt); G.wNod = damp(G.wNod, cue.nod ? 1 : 0, 6, dt);
    G.turnExtra = damp(G.turnExtra, cue.point ? 0.25 : 0, 4, dt);
    const Pp = {}; for (const n of JN) Pp[n] = [0, 0, 0]; const add = (n, x, y, z) => { Pp[n][0] += x; Pp[n][1] += y; Pp[n][2] += z; };
    const br = Math.sin(t * 1.6);
    Pp.spine[0] = 0.015 * br; Pp.chest[0] = -0.02 * br; Pp.pelvis[2] = 0.028 * Math.sin(t * 0.8); Pp.spine[2] = -0.02 * Math.sin(t * 0.8);
    Pp.head[2] = 0.05 * Math.sin(t * 0.55); Pp.head[0] = 0.03 * Math.sin(t * 0.9);
    Pp.lSh = [0.03 * br, 0, 0.32 + 0.02 * br]; Pp.rSh = [0.03 * br, 0, -0.32 - 0.02 * br]; Pp.lEl = [-0.15, 0, 0]; Pp.rEl = [-0.15, 0, 0];
    let sy = 1 + 0.012 * br, lift = 0; const mw = G.walkW;
    if (mw > 0.01) { G.ph += dt * 11 * mw; const A = 0.7 * mw, sL = Math.sin(G.ph), cL = Math.cos(G.ph);
      add('lHip', -A * sL, 0, 0); add('rHip', A * sL, 0, 0); add('lKnee', 0.5 * mw * Math.max(0, cL) ** 1.4 + 0.05 * mw, 0, 0); add('rKnee', 0.5 * mw * Math.max(0, -cL) ** 1.4 + 0.05 * mw, 0, 0);
      add('lAnk', 0.25 * A * sL, 0, 0); add('rAnk', -0.25 * A * sL, 0, 0); add('lSh', 0.9 * A * sL, 0, 0); add('rSh', -0.9 * A * sL, 0, 0); add('lEl', -0.25 * mw, 0, 0); add('rEl', -0.25 * mw, 0, 0);
      add('pelvis', 0, 0.12 * A * sL, 0); add('chest', 0, -0.16 * A * sL, 0); add('spine', 0.05 * mw, 0, 0); lift += 0.02 * mw * Math.abs(Math.cos(G.ph)); sy *= 1 + 0.03 * mw * Math.cos(2 * G.ph); }
    if (G.wWave > 0.005) { add('head', 0.05 * G.wWave, -0.1 * G.wWave, -0.2 * G.wWave); add('spine', 0, 0, -0.08 * G.wWave); }
    if (G.wNod > 0.01) { add('head', 0.3 * Math.max(0, Math.sin(t * 9.5)) * G.wNod, 0, 0); add('neck', 0.08 * G.wNod, 0, 0); }
    const wh = G.wHappy;
    if (wh > 0.01) { const cyc = (t % 0.62) / 0.62, air = cyc > 0.22 && cyc < 0.86 ? Math.sin(Math.PI * (cyc - 0.22) / 0.64) : 0, sq = cyc < 0.22 ? Math.sin(Math.PI * cyc / 0.22) : 0;
      lift += 0.2 * air * wh; sy *= 1 - 0.13 * sq * wh + 0.08 * air * wh;
      for (const s of ['l', 'r']) { add(s + 'Hip', -0.5 * sq * wh, 0, 0); add(s + 'Knee', 0.9 * sq * wh, 0, 0); add(s + 'Ank', -0.4 * sq * wh, 0, 0); }
      add('head', -0.15 * wh, 0, 0); }
    if (G.wTalk > 0.01) add('head', (0.06 * Math.sin(t * 4.6) * Math.max(0, Math.sin(t * 0.9 + 0.5)) + 0.025 * Math.sin(t * 2.3)) * G.wTalk, 0, 0);
    G.look = damp(G.look, cue.point ? 0.42 : 0, 4, dt);
    const yl = G.look - G.turnExtra * 0.6; add('chest', 0, yl * 0.2, 0); add('neck', 0, yl * 0.35, 0); add('head', 0, yl * 0.45, 0);
    if (cue.point) { const w = toWorld(cue.point); const up = THREE.MathUtils.clamp((w.y - 0.9) * 0.35, -0.25, 0.3); add('head', -up * G.wPoint, 0, 0); }
    for (const n of JN) J[n].rotation.set(Pp[n][0], Pp[n][1], Pp[n][2]);
    C.root.position.set(cue.x || 0, lift * C.scale, 0); C.root.rotation.y = yaw + G.turnExtra;
    C.inner.scale.set(C.scale / Math.sqrt(sy), C.scale * sy, C.scale / Math.sqrt(sy)); floor.position.set(cue.x || 0, 0, 0); C.root.updateMatrixWorld(true);
    if (G.wTalk > 0.01) { const n1 = 0.5 + 0.5 * Math.sin(t * 1.7) * Math.sin(t * 0.63 + 1), n2 = 0.5 + 0.5 * Math.sin(t * 1.3 + 2) * Math.sin(t * 0.51);
      const wr = G.wTalk * (1 - G.wWave) * (0.35 + 0.45 * n1);
      aim(J.rSh, J.rEl, bodyDir(-0.35, -0.85, 0.4), wr); aim(J.rEl, J.rHand, bodyDir(0.25 + 0.15 * Math.sin(t * 2.3), 0.2 + 0.25 * Math.sin(t * 3.1), 1), wr);
      const wl = G.wTalk * (1 - G.wPoint) * (0.2 + 0.4 * n2);
      aim(J.lSh, J.lEl, bodyDir(0.35, -0.85, 0.4), wl); aim(J.lEl, J.lHand, bodyDir(-0.25 + 0.12 * Math.sin(t * 2.7 + 1), 0.2 + 0.2 * Math.sin(t * 2.2), 1), wl); }
    if (G.wWave > 0.005) { aim(J.rSh, J.rEl, bodyDir(-0.85, 0.35, 0.3), G.wWave); aim(J.rEl, J.rHand, bodyDir(-0.1 + 0.55 * Math.sin(t * 10), 1, 0.25), G.wWave); aim(J.rHand, J.rTip, bodyDir(-0.05 + 0.4 * Math.sin(t * 10 - 0.6), 1, 0.3), G.wWave); }
    if (wh > 0.01) { const sw = Math.sin(t * 10) * 0.2; aim(J.rSh, J.rEl, bodyDir(-0.7, 0.75, 0.2), wh); aim(J.rEl, J.rHand, bodyDir(-0.3 + sw, 1, 0.2), wh); aim(J.lSh, J.lEl, bodyDir(0.7, 0.75, 0.2), wh); aim(J.lEl, J.lHand, bodyDir(0.3 - sw, 1, 0.2), wh); }
    if (G.wPoint > 0.005 && G.lastPoint) { const tw = toWorld(G.lastPoint); const sp = J.lSh.getWorldPosition(V()); const dir = tw.clone().sub(sp).normalize();
      const el = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)), c2 = THREE.MathUtils.clamp(el, -0.5, 0.8);
      if (c2 !== el) { const h = Math.hypot(dir.x, dir.z); dir.set(dir.x / h * Math.cos(c2), Math.sin(c2), dir.z / h * Math.cos(c2)); }
      aim(J.lSh, J.lEl, dir.clone().add(new THREE.Vector3(0, -0.12, 0.08)).normalize(), G.wPoint); aim(J.lEl, J.lHand, dir.clone().add(new THREE.Vector3(0, 0.06, 0)).normalize(), G.wPoint); aim(J.lHand, J.lTip, dir, G.wPoint * 0.9); }
    let lid = 1; if (G.t > G.blinkAt) { const b = (G.t - G.blinkAt) / 140; if (b < 1) lid = Math.max(0.08, Math.abs(1 - 2 * b)); else G.blinkAt = G.t + 1800 + Math.random() * 3500; }
    lid = Math.min(lid, 1 - 0.8 * wh); for (const e of C.eyes) e.scale.set(1, Math.max(0.08, lid), 1);
    const say = G.wTalk > 0.35, open = say || G.wWave > 0.4 || wh > 0.4; C.mouth.smile.visible = !open; C.mouth.open.visible = open;
    C.mouth.open.scale.set(1, say ? 0.35 + 0.65 * Math.abs(Math.sin(t * 8.5) * Math.sin(t * 3.1 + 0.7)) : 0.9, 1);
  }
  let last = performance.now();
  function loop(nw) { if (!P.open) { G3.running = false; return; } const dt = Math.min(0.1, Math.max(0, (nw - last) / 1000)); last = nw; try { step(dt); renderer.render(scene, camera); } catch (e) { } requestAnimationFrame(loop); }
  G3.start = () => { if (G3.running) return; G3.running = true; last = performance.now(); requestAnimationFrame(loop); };
  G3.step = (ms) => { const n = Math.max(1, Math.round(ms / 16)); for (let i = 0; i < n; i++) step(ms / n / 1000); renderer.render(scene, camera); };
  G3.ready = true; window.GUIDE = { ready: true };
  if (P.open) G3.start();
}

/* ========================================================= 公開する窓口 */
function instance(key) {
  if (INST[key]) return INST[key];
  const c = FACT[key](E);
  c.yomi = (c.yomi || []).slice().sort((a, b) => b[0].length - a[0].length).concat([['「', ''], ['」', '']]);
  cur = c;
  c.lines.forEach(L => { L.read = readOf(L.text); L.dur = Math.max(L.min || 0, L.text.length * 0.135 + 0.6); L.est = L.text.length * 0.135;
    L.parts = L.text.match(/[^。！？]+[。！？]*/g) || [L.text]; L.reads = L.parts.map(readOf);
    // 文ごとの見込み区間（kw() と同じ「1字0.135秒」の物差し）
    let acc = 0; L.pStart = []; L.pEnd = []; for (const p of L.parts) { L.pStart.push(acc * 0.135); acc += p.length; L.pEnd.push(acc * 0.135); } });
  c.total = c.lines.reduce((a, L) => a + L.dur, 0);
  return (INST[key] = c);
}
const GuideVideo = {
  register(key, factory) { FACT[key] = factory; },
  has(key) { return !!FACT[key]; },
  info(key) { const c = instance(key); return { title: c.title, chapters: c.chapters.map(ch => ch.title), total: c.total }; },
  open(key, opts = {}) {
    if (!FACT[key]) return false;
    if (!R) build();
    cur = instance(key);
    P.opts = opts; P.open = true; P.state = 'ready'; P.card = null; still = null; base = 0; runAt = null; P.tok++;
    const firstOf = c => Math.max(0, cur.lines.findIndex(L => L.ch === c));
    P.startLine = firstOf(opts.chapter || 0); P.line = P.startLine; P.hint = true;
    R.querySelector('.gv-start h1').textContent = cur.title;
    R.querySelector('.gv-subt').textContent = cur.subtitle || '';
    const chs = R.querySelector('.gv-ov .chaps'); chs.innerHTML = '';
    cur.chapters.forEach((ch, c) => { const b = document.createElement('button'); b.textContent = `${ch.num} ${ch.title}`; b.onclick = () => { P.voice = true; play(firstOf(c)); }; chs.appendChild(b); });
    R.querySelector('.gv-start').style.display = 'flex'; R.querySelector('.gv-end').style.display = 'none';
    R.querySelector('.gv-card').style.display = 'none'; R.querySelector('.gv-err').style.display = 'none';
    R.querySelector('.gv-endt').textContent = cur.end || '';
    const nb = R.querySelector('.gv-next'); nb.textContent = opts.nextLabel || '▶ 続きへ'; nb.style.display = opts.onNext ? '' : 'none';
    R.style.display = 'flex';
    buildBar(); fit(); syncBtn();
    addEventListener('keydown', onKey, true);
    if (!rafId) rafId = requestAnimationFrame(frame);
    if (G3.ready) G3.start();
    return true;
  },
  close() {
    if (!P.open) return;
    P.open = false; P.state = 'ready'; P.card = null; P.tok++; clockStop(); stopVoice();
    removeEventListener('keydown', onKey, true);
    if (R) R.style.display = 'none';
    const f = P.opts.onClose; if (f) try { f(); } catch (e) { }
  },
  // 点検用
  _still(i, t) { still = [i, t]; P.state = 'pause'; R.querySelector('.gv-start').style.display = 'none'; R.querySelector('.gv-end').style.display = 'none'; P.line = i; },
  _speed(s) { SPEED = s; },
  _guideStep(ms) { if (G3.step) G3.step(ms); },
  get _P() { return P; }, get _HOTS() { return HOTS; }, get _cur() { return cur; },
};
window.GuideVideo = GuideVideo;
})();
