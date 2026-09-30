/* =========================================================
   動画の絵の部品（engine.js のあとに読み込む）
   使い方（動画の .js の中で）：
     GuideVideo.register('video-xxx', function (E) {
       const K = VideoParts(E, () => lines);     // lines は後で宣言してよい（関数で渡す）
       const { bg, para, bubble, card, bars, badge, icon, counter, chipRow, vs, headline, frame } = K;
       ...
       return { ..., background: bg, scenes: K.wrapScenes(scenes) };   // wrapScenes が号のものさしを上に重ねる
     }, { category: '分類のid', label: '動画の題名', desc: 'ボタンの下に出す一行' });
   各行（lines）に issue: 'YYYY-MM-DD'（その場面が話している号）を入れると、右上の号のものさしが動く。
   ものさしの範囲は、lines の号の日付から自動で決まる。issue を書かない動画では、ものさしは出ない。
   画面：1920×1080。左下（x<540, y>400）は案内役、下（y>930）は字幕、左上 (570,64) は章の見出し、
         右上（x 1150〜1880, y 16〜110）は号のものさし。絵はだいたい x 580〜1880, y 130〜900 に置く。
   ========================================================= */
(function () {
'use strict';
/* register の3つ目の引数（分類・題名・説明）を覚えておき、図鑑の画面が「🎬 動画で見る」ボタンを出すのに使う */
if (window.GuideVideo && !window.GuideVideo.list) {
  const META = {}, reg = window.GuideVideo.register;
  window.GuideVideo.register = function (key, factory, meta) { META[key] = Object.assign({ key }, meta || {}); return reg.call(window.GuideVideo, key, factory); };
  window.GuideVideo.list = function (category) { return Object.values(META).filter(m => window.GuideVideo.has(m.key) && (category == null || m.category === category)); };
}
window.VideoParts = function (E, getLines) {
const { cl, seg, eo, eio, back, lerp, FONT, hotRect, txt, rr, circle, pill, glow, arrow } = E;
const ctx = E.ctx;

/* ---------- 背景：夜の編集部（うっすら方眼＋流れるデータの粒） ---------- */
const TINTS = [
  ['#0c1530', '#101c3c', '#16143a'],   // 0 藍
  ['#0f1a2e', '#0d2433', '#0a2a2a'],   // 1 青緑
  ['#1c1230', '#231a3f', '#12183a'],   // 2 紫
  ['#1f160f', '#2a1c14', '#161a2e'],   // 3 琥珀
];
const DOTS = Array.from({ length: 46 }, (_, i) => { const r = n => { const x = Math.sin(i * 91.7 + n * 47.3) * 43758.5453; return x - Math.floor(x); };
  return { x: r(1) * 1920, y: r(2) * 1080, v: 8 + r(3) * 22, s: 1.5 + r(4) * 2.5, ph: r(5) * 6 }; });
const ACC = ['#7aa2ff', '#4fd1c5', '#c77dff', '#ffb454'];
function bg(T, tint) {
  const c = TINTS[tint || 0] || TINTS[0], g = ctx.createLinearGradient(0, 0, 1920, 1080);
  g.addColorStop(0, c[0]); g.addColorStop(0.55, c[1]); g.addColorStop(1, c[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1;
  for (let x = 0; x <= 1920; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke(); }
  for (let y = 0; y <= 1080; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1920, y); ctx.stroke(); }
  const a = ACC[tint || 0] || ACC[0];
  for (const d of DOTS) { const x = (d.x + T * d.v) % 1980 - 30, y = d.y + Math.sin(T * 0.5 + d.ph) * 12;
    ctx.globalAlpha = 0.18 + 0.14 * Math.sin(T * 1.3 + d.ph); circle(x, y, d.s, a); }
  ctx.restore();
  glow(1500, 300, 520, 'rgba(120,150,255,.07)');
}

/* ---------- 号のものさし（lines の号の日付から範囲を決める） ---------- */
const BX0 = 1180, BX1 = 1850, BY = 70;
const dnum = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; };
let RANGE = null;
function range() {
  if (RANGE) return RANGE;
  const ns = getLines().map(L => dnum(L.issue)).filter(n => n != null);
  if (!ns.length) return (RANGE = { none: true });
  let a = Math.min(...ns), b = Math.max(...ns); const pad = Math.max(30 * 864e5, (b - a) * 0.06);
  return (RANGE = { d0: a - pad, d1: b + pad });
}
const dx = n => { const r = range(); return lerp(BX0, BX1, cl((n - r.d0) / (r.d1 - r.d0))); };
const fmtIssue = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? `${m[1].slice(2)}/${m[2]}/${m[3]}号` : ''; };
function issueBar(i, tc) {
  const lines = getLines(), L = lines[i]; const n = dnum(L.issue); if (n == null || range().none) return;
  let pv = n; for (let k = i - 1; k >= 0; k--) { const p = dnum(lines[k].issue); if (p != null) { pv = p; break; } }
  const k = eio(seg(tc, 0.1, 1.0)), cur = lerp(pv, n, k), xm = dx(cur);
  ctx.save();
  rr(BX0 - 40, 14, BX1 - BX0 + 80, 92, 22); ctx.fillStyle = 'rgba(6,10,24,.72)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(160,180,255,.22)'; ctx.beginPath(); ctx.moveTo(BX0, BY); ctx.lineTo(BX1, BY); ctx.stroke();
  const pr = ctx.createLinearGradient(BX0, 0, BX1, 0); pr.addColorStop(0, '#4fd1c5'); pr.addColorStop(0.6, '#7aa2ff'); pr.addColorStop(1, '#c77dff');
  ctx.strokeStyle = pr; ctx.beginPath(); ctx.moveTo(BX0, BY); ctx.lineTo(xm, BY); ctx.stroke();
  { const r = range(), y0 = new Date(r.d0).getUTCFullYear(), y1 = new Date(r.d1).getUTCFullYear();
    for (let y = y0 + 1; y <= y1; y++) { const x = dx(Date.UTC(y, 0, 1)); ctx.fillStyle = 'rgba(220,230,255,.55)'; ctx.fillRect(x - 1.5, BY - 12, 3, 24); txt(String(y), x, BY + 24, 15, 'rgba(220,230,255,.6)', { weight: 700 }); } }
  glow(xm, BY, 26, 'rgba(140,190,255,.7)'); circle(xm, BY, 9, '#bcd4ff', '#fff', 3);
  pill('📰 ' + fmtIssue(L.issue), cl(xm, BX0 + 70, BX1 - 70), BY - 32, 19, 'rgba(188,212,255,.96)', '#0d1640', { alpha: seg(tc, 0.3, 0.8) });
  ctx.restore();
}
function wrapScenes(scenes) {
  return scenes.map(sc => ({ draw(t, d, T, i) { sc.draw(t, d, T, i); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; issueBar(i, t); }, point: sc.point }));
}

/* ---------- 文字を折り返して書く（日本語は1文字ずつ測る）。戻り値＝書いた高さ ---------- */
function lines_(s, w, size, weight = 700) {
  ctx.save(); ctx.font = `${weight} ${size}px ${FONT}`; const out = []; let cur = '';
  for (const ch of String(s)) { if (ch === '\n') { out.push(cur); cur = ''; continue; }
    if (ctx.measureText(cur + ch).width > w && cur) { if (/^[、。）」』！？ー]$/.test(ch)) { cur += ch; continue; } out.push(cur); cur = ch; } else cur += ch; }
  if (cur) out.push(cur); ctx.restore(); return out;
}
function para(s, x, y, w, size, color = '#fff', o = {}) {
  const L = lines_(s, w, size, o.weight || 700), lh = size * (o.lh || 1.45); const a = o.alpha ?? 1; if (a <= 0) return L.length * lh;
  const al = o.align || 'left', x0 = al === 'center' ? x : x;
  L.forEach((ln, k) => { const kk = o.k == null ? 1 : seg(o.k, k * 0.12, k * 0.12 + 0.4); if (kk > 0) txt(ln, x0, y + k * lh + size / 2, size, color, { align: al, weight: o.weight || 700, alpha: a * kk }); });
  return L.length * lh;
}

/* ---------- 吹き出し（筆者の見立て・一言）。k＝出てくる度合い 0→1 ---------- */
function bubble(s, x, y, w, k, o = {}) {
  if (k <= 0) return;
  const size = o.size || 34, pad = 30, L = lines_(s, w - pad * 2, size, 800), lh = size * 1.45, h = L.length * lh + pad * 2 + (o.label ? 44 : 0);
  const col = o.color || '#ffd66b', sc = lerp(0.85, 1, back(seg(k, 0, 1)));
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2)); ctx.globalAlpha *= seg(k, 0, 0.5);
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30;
  rr(x, y, w, h, 30); ctx.fillStyle = o.bg || 'rgba(255,250,235,.97)'; ctx.fill(); ctx.shadowBlur = 0;
  ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
  const tx = o.tail === 'right' ? x + w - 90 : o.tail === 'none' ? null : x + 90;
  if (tx != null) { ctx.beginPath(); ctx.moveTo(tx - 22, y + h - 2); ctx.lineTo(tx + (o.tail === 'right' ? 34 : -34), y + h + 42); ctx.lineTo(tx + 22, y + h - 2); ctx.closePath(); ctx.fillStyle = o.bg || 'rgba(255,250,235,.97)'; ctx.fill(); }
  let yy = y + pad;
  if (o.label) { pill(o.label, x + pad + (o.label.length * 13 + 30) / 2 + 6, yy + 14, 22, col, '#1b1300'); yy += 44; }
  L.forEach((ln, j) => txt(ln, x + pad, yy + j * lh + size / 2, size, o.fg || '#1b1f3a', { align: 'left', weight: 800, alpha: seg(k, 0.2 + j * 0.1, 0.5 + j * 0.1) }));
  if (o.key) hotRect(o.key, x, y, w, h);
  ctx.restore(); return h;
}

/* ---------- 札（見出し＋本文の四角） ---------- */
function card(x, y, w, h, k, o = {}) {
  if (k <= 0) return;
  const col = o.color || '#7aa2ff', a = seg(k, 0, 0.6), dy = (1 - eo(seg(k, 0, 1))) * 40;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, dy);
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 24; rr(x, y, w, h, o.r || 24); ctx.fillStyle = o.bg || 'rgba(16,24,56,.9)'; ctx.fill(); ctx.shadowBlur = 0;
  ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
  rr(x, y, w, 10, 5); ctx.fillStyle = col; ctx.fill();
  let yy = y + 30;
  if (o.icon) { icon(o.icon, x + 50, y + 62, 34, col); }
  if (o.title) { const tx = o.icon ? x + 96 : x + 28; txt(o.title, tx, y + 62, o.tsize || 36, '#fff', { align: 'left', weight: 900 }); yy = y + 108; }
  if (o.body) para(o.body, x + 28, yy, w - 56, o.bsize || 27, o.bcolor || '#d7defa', { weight: 700 });
  if (o.key) hotRect(o.key, x, y, w, h);
  ctx.restore();
}

/* ---------- 横棒グラフ。data=[{label, v, col, key, note}]、k＝伸びる度合い ---------- */
function bars(x, y, w, data, k, o = {}) {
  const max = o.max || Math.max(...data.map(d => d.v)), bh = o.bh || 54, gap = o.gap || 26, lw = o.lw ?? 260;
  data.forEach((d, j) => {
    const kk = eo(seg(k, j * 0.12, j * 0.12 + 0.6)); if (kk <= 0) return;
    const yy = y + j * (bh + gap), bw = (w - lw - 20) * (d.v / max) * kk;
    txt(d.label, x + lw - 16, yy + bh / 2, o.lsize || 28, '#fff', { align: 'right', weight: 800, alpha: seg(kk, 0, 0.4) });
    rr(x + lw, yy, Math.max(bw, 2), bh, 12); ctx.fillStyle = d.col || '#7aa2ff'; ctx.fill();
    const vs = (o.fmt ? o.fmt(d.v * kk, d) : Math.round(d.v * kk).toLocaleString()) + (d.note ? '  ' + d.note : '');
    txt(vs, x + lw + bw + 14, yy + bh / 2, o.vsize || 28, d.vcol || '#fff', { align: 'left', weight: 900, alpha: seg(kk, 0.5, 1) });
    if (d.key) hotRect(d.key, x, yy, w, bh);
  });
}

/* ---------- 会社・人の丸い札（頭文字＋名前） ---------- */
function badge(label, x, y, r, col, k = 1, o = {}) {
  if (k <= 0) return;
  const s = back(seg(k, 0, 1));
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= seg(k, 0, 0.4);
  if (o.glow) glow(0, 0, r * 1.8, o.glow);
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, col); g.addColorStop(1, shade(col, -0.35));
  circle(0, 0, r, g, 'rgba(255,255,255,.85)', 4);
  const ab = o.abbr || label.replace(/[（(].*$/, '').slice(0, label.match(/^[A-Za-z]/) ? 2 : 1);
  txt(ab, 0, 2, r * (ab.length > 2 ? 0.62 : ab.length > 1 ? 0.8 : 0.95), '#fff', { weight: 900, stroke: 'rgba(0,0,0,.25)', sw: 5 });
  if (o.name !== false) txt(o.name || label, 0, r + 30, o.nsize || 26, '#fff', { weight: 800, stroke: 'rgba(5,8,20,.8)', sw: 7 });
  ctx.restore();
  if (o.key && k >= 0.6) hotRect(o.key, x - r, y - r, r * 2, r * 2 + 50);
}
function shade(hex, f) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex; const n = parseInt(m[1], 16);
  const ch = v => Math.round(cl(f < 0 ? v * (1 + f) : v + (255 - v) * f, 0, 255));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

/* ---------- 数字が数えあがる ---------- */
function counter(v0, v1, k, fmt = v => Math.round(v).toLocaleString()) { return fmt(lerp(v0, v1, eo(cl(k)))); }

/* ---------- 小さな札を横に並べる。items=[{t, col, key}] ---------- */
function chipRow(items, cx, y, k, o = {}) {
  const size = o.size || 26; ctx.save(); ctx.font = `800 ${size}px ${FONT}`;
  const ws = items.map(it => ctx.measureText(it.t).width + size * 1.2), gap = o.gap || 18; ctx.restore();
  const tot = ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1); let x = cx - tot / 2;
  items.forEach((it, j) => { const kk = seg(k, j * 0.1, j * 0.1 + 0.5); pill(it.t, x + ws[j] / 2, y, size, it.col || 'rgba(122,162,255,.9)', it.fg || '#fff', { scale: back(kk), alpha: kk, key: it.key }); x += ws[j] + gap; });
}

/* ---------- 左右の対比（A vs B） ---------- */
function vs(x, y, w, h, k, A, B, o = {}) {
  const hw = (w - 80) / 2;
  card(x, y, hw, h, seg(k, 0, 0.6), A);
  card(x + hw + 80, y, hw, h, seg(k, 0.25, 0.85), B);
  const kk = seg(k, 0.4, 0.8); if (kk > 0) { circle(x + hw + 40, y + h / 2, 34 * back(kk), o.mid || '#ffd66b'); txt(o.label || 'VS', x + hw + 40, y + h / 2 + 2, 26 * back(kk), '#1b1300', { weight: 900 }); }
}

/* ---------- 画面に大きな見出し（場面の頭） ---------- */
function headline(s, cx, y, k, o = {}) {
  if (k <= 0) return; const size = o.size || 60;
  txt(s, cx, y + (1 - eo(k)) * 30, size, o.color || '#fff', { weight: 900, alpha: seg(k, 0, 0.6), stroke: 'rgba(5,8,20,.7)', sw: 10, glow: o.glow });
}

/* ---------- 線画の小さな絵（絵文字は環境で□になるので使わない） ----------
   名前：chip robot car coin up down globe code brain factory bolt server person doc mail ship plane gpu dc drone flag bank phone lock chat hand eye */
function icon(name, x, y, r, col = '#fff', o = {}) {
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.globalAlpha *= (o.alpha ?? 1);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(2, r * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const L = (pts, close) => { ctx.beginPath(); pts.forEach(([a, b], j) => j ? ctx.lineTo(a * r, b * r) : ctx.moveTo(a * r, b * r)); if (close) ctx.closePath(); ctx.stroke(); };
  const R = (a, b, w, h, rad = 0.15) => { rr(a * r, b * r, w * r, h * r, rad * r); ctx.stroke(); };
  const C = (a, b, rad, fill) => { ctx.beginPath(); ctx.arc(a * r, b * r, rad * r, 0, Math.PI * 2); fill ? ctx.fill() : ctx.stroke(); };
  switch (name) {
    case 'chip': case 'gpu': R(-0.6, -0.6, 1.2, 1.2); R(-0.3, -0.3, 0.6, 0.6, 0.05); for (let j = -2; j <= 2; j++) { const q = j * 0.22; L([[q, -0.6], [q, -0.9]]); L([[q, 0.6], [q, 0.9]]); L([[-0.6, q], [-0.9, q]]); L([[0.6, q], [0.9, q]]); } if (name === 'gpu') { C(0, 0, 0.12, true); } break;
    case 'robot': R(-0.55, -0.55, 1.1, 0.8, 0.2); C(-0.22, -0.18, 0.1, true); C(0.22, -0.18, 0.1, true); L([[0, -0.55], [0, -0.8]]); C(0, -0.88, 0.08, true); R(-0.4, 0.32, 0.8, 0.55, 0.12); L([[-0.2, 0.05], [0.2, 0.05]]); break;
    case 'car': L([[-0.9, 0.25], [-0.9, -0.05], [-0.55, -0.1], [-0.35, -0.45], [0.35, -0.45], [0.6, -0.1], [0.9, 0], [0.9, 0.25], [-0.9, 0.25]], true); C(-0.5, 0.3, 0.2, false); C(0.5, 0.3, 0.2, false); break;
    case 'coin': C(0, 0, 0.8); ctx.font = `900 ${r * 1.0}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, r * 0.05); break;
    case 'up': L([[-0.85, 0.6], [-0.3, 0], [0.1, 0.3], [0.8, -0.55]]); L([[0.4, -0.6], [0.8, -0.55], [0.75, -0.15]]); break;
    case 'down': L([[-0.85, -0.6], [-0.3, 0], [0.1, -0.3], [0.8, 0.55]]); L([[0.4, 0.6], [0.8, 0.55], [0.75, 0.15]]); break;
    case 'globe': C(0, 0, 0.8); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.35, r * 0.8, 0, 0, Math.PI * 2); ctx.stroke(); L([[-0.8, 0], [0.8, 0]]); L([[-0.7, -0.4], [0.7, -0.4]]); L([[-0.7, 0.4], [0.7, 0.4]]); break;
    case 'code': L([[-0.35, -0.5], [-0.8, 0], [-0.35, 0.5]]); L([[0.35, -0.5], [0.8, 0], [0.35, 0.5]]); L([[0.15, -0.65], [-0.15, 0.65]]); break;
    case 'brain': ctx.beginPath(); ctx.arc(-0.25 * r, -0.15 * r, 0.45 * r, Math.PI * 0.6, Math.PI * 1.9); ctx.arc(0.25 * r, -0.15 * r, 0.45 * r, Math.PI * 1.1, Math.PI * 0.4); ctx.arc(0, 0.25 * r, 0.45 * r, 0.1, Math.PI - 0.1); ctx.closePath(); ctx.stroke(); L([[0, -0.55], [0, 0.6]]); L([[-0.35, -0.1], [-0.1, 0.05]]); L([[0.35, 0.1], [0.1, 0.2]]); break;
    case 'factory': L([[-0.85, 0.7], [-0.85, -0.1], [-0.4, 0.2], [-0.4, -0.1], [0.05, 0.2], [0.05, -0.7], [0.4, -0.7], [0.4, 0.2], [0.85, 0.2], [0.85, 0.7]], true); break;
    case 'bolt': ctx.beginPath(); [[0.15, -0.9], [-0.5, 0.1], [-0.05, 0.1], [-0.2, 0.9], [0.5, -0.15], [0.05, -0.15]].forEach(([a, b], j) => j ? ctx.lineTo(a * r, b * r) : ctx.moveTo(a * r, b * r)); ctx.closePath(); ctx.fill(); break;
    case 'server': case 'dc': for (let j = 0; j < 3; j++) { R(-0.7, -0.8 + j * 0.55, 1.4, 0.45, 0.08); C(0.45, -0.58 + j * 0.55, 0.07, true); } break;
    case 'person': C(0, -0.45, 0.3); ctx.beginPath(); ctx.arc(0, 0.75 * r, 0.62 * r, Math.PI, 0); ctx.stroke(); break;
    case 'doc': case 'mail': if (name === 'mail') { R(-0.8, -0.5, 1.6, 1.0, 0.1); L([[-0.8, -0.5], [0, 0.1], [0.8, -0.5]]); } else { L([[-0.55, -0.8], [0.25, -0.8], [0.6, -0.45], [0.6, 0.8], [-0.55, 0.8]], true); for (let j = 0; j < 3; j++) L([[-0.3, -0.2 + j * 0.3], [0.35, -0.2 + j * 0.3]]); } break;
    case 'ship': L([[-0.85, 0.1], [0.85, 0.1], [0.55, 0.6], [-0.6, 0.6]], true); R(-0.4, -0.35, 0.8, 0.45, 0.05); L([[0, -0.35], [0, -0.75]]); break;
    case 'plane': ctx.beginPath(); [[0.9, 0], [0.2, -0.12], [-0.2, -0.75], [-0.35, -0.75], [-0.15, -0.12], [-0.6, -0.1], [-0.8, -0.35], [-0.9, -0.35], [-0.8, 0], [-0.9, 0.35], [-0.8, 0.35], [-0.6, 0.1], [-0.15, 0.12], [-0.35, 0.75], [-0.2, 0.75], [0.2, 0.12]].forEach(([a, b], j) => j ? ctx.lineTo(a * r, b * r) : ctx.moveTo(a * r, b * r)); ctx.closePath(); ctx.fill(); break;
    case 'drone': C(-0.55, -0.55, 0.28); C(0.55, -0.55, 0.28); C(-0.55, 0.55, 0.28); C(0.55, 0.55, 0.28); L([[-0.35, -0.35], [0.35, 0.35]]); L([[0.35, -0.35], [-0.35, 0.35]]); R(-0.2, -0.2, 0.4, 0.4, 0.08); break;
    case 'flag': L([[-0.6, 0.85], [-0.6, -0.8]]); L([[-0.6, -0.8], [0.7, -0.55], [-0.6, -0.1]], true); break;
    case 'bank': L([[-0.85, -0.3], [0, -0.85], [0.85, -0.3]], true); for (let j = 0; j < 4; j++) L([[-0.6 + j * 0.4, -0.2], [-0.6 + j * 0.4, 0.5]]); L([[-0.85, 0.65], [0.85, 0.65]]); break;
    case 'phone': R(-0.42, -0.85, 0.84, 1.7, 0.18); C(0, 0.62, 0.08, true); break;
    case 'lock': R(-0.55, -0.1, 1.1, 0.9, 0.12); ctx.beginPath(); ctx.arc(0, -0.1 * r, 0.35 * r, Math.PI, 0); ctx.stroke(); C(0, 0.3, 0.1, true); break;
    case 'chat': R(-0.85, -0.65, 1.7, 1.1, 0.3); L([[-0.4, 0.45], [-0.55, 0.85], [-0.05, 0.45]]); C(-0.4, -0.1, 0.08, true); C(0, -0.1, 0.08, true); C(0.4, -0.1, 0.08, true); break;
    case 'hand': for (let j = 0; j < 4; j++) R(-0.55 + j * 0.3, -0.85 + (j === 0 || j === 3 ? 0.15 : 0), 0.24, 0.9, 0.12); R(-0.6, -0.05, 1.2, 0.85, 0.3); L([[-0.6, 0.15], [-0.9, -0.2]]); break;
    case 'eye': ctx.beginPath(); ctx.ellipse(0, 0, r * 0.85, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); C(0, 0, 0.25, true); break;
    default: C(0, 0, 0.6);
  }
  ctx.restore();
}

/* ---------- 画面の枠（中身を置く場所の目安。o.title で上に札） ---------- */
function frame(x, y, w, h, k, o = {}) {
  if (k <= 0) return; ctx.save(); ctx.globalAlpha *= seg(k, 0, 0.5);
  rr(x, y, w, h, 28); ctx.fillStyle = o.bg || 'rgba(8,12,30,.55)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = o.border || 'rgba(255,255,255,.14)'; ctx.stroke();
  if (o.title) pill(o.title, x + w / 2, y, 26, o.color || 'rgba(122,162,255,.95)', '#fff');
  ctx.restore();
}

return { bg, issueBar, wrapScenes, fmtIssue, para, wrapText: lines_, bubble, card, bars, badge, shade, counter, chipRow, vs, headline, icon, frame, ACC };
};
})();
