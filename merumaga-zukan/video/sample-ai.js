/* 見本の動画：見本カード6枚（GPU → ムーアの法則 → トランスフォーマー → 大規模言語モデル → トークン課金 → AIエージェント）の流れ（約30秒）
   新しい動画を書くときの手本。VIDEO.md も読むこと。
   この見本は6枚を1本の話にしたもので、号のものさし（lines の issue）の代わりに、画面の上に「カードのつながり」を出している。 */
GuideVideo.register('sample-ai', function (E) {
'use strict';
const { cl, seg, eo, eio, back, lerp, hotRect, hotCircle, txt, rr, circle, pill, glow, arrow, ring, kw } = E;
const ctx = E.ctx;
const K = VideoParts(E, () => lines);
const { bg, para, bubble, card, bars, icon, chipRow, frame } = K;

const chapters = [{ num: '🎬', title: 'AIの流れ（見本カード6枚から）', short: 'AIの流れ', tint: 0 }];
const lines = [
  { ch: 0, chip: 'GPU', min: 5.2, text: 'GPUは、単純な計算を大量に同時にこなす部品。AIの学習に欠かせません。' },
  { ch: 0, chip: 'ムーアの法則', text: '半導体に載る部品の数は、およそ2年で2倍。ムーアの法則です。' },
  { ch: 0, chip: 'トランスフォーマー', text: 'トランスフォーマーは、言葉どうしの関係を一度に見渡す仕組みです。' },
  { ch: 0, chip: 'LLM', text: 'その上に、次に来る言葉を当てる大規模言語モデルが生まれました。' },
  { ch: 0, chip: 'トークン課金', text: 'AIの料金は、読んで書いた量「トークン」で決まり、年々下がっています。' },
  { ch: 0, chip: 'AIエージェント', min: 5.6, text: 'そして今は、AIが自分で調べて試し、仕事を進めるエージェントの時代へ。' },
];
const yomi = [['GPU', 'ジーピーユー'], ['AIの', 'エーアイの'], ['AIが', 'エーアイが'], ['2年で2倍', 'にねんでにばい'], ['大量', 'たいりょう'], ['年々', 'ねんねん']];

const gloss = {
  'GPU': { ic: '🎮', t: 'GPU', b: 'たくさんの単純な計算を同時にこなす半導体です。もとは画像を描くための部品でした。' },
  'ムーアの法則': { ic: '📈', t: 'ムーアの法則', b: '半導体に載る部品の数は、およそ2年で2倍になる、という経験則です。' },
  'トランスフォーマー': { ic: '🔗', t: 'トランスフォーマー', b: '文の中の言葉どうしの関係を、まとめて一度に計算できるAIの設計です。' },
  'LLM': { ic: '💬', t: '大規模言語モデル（LLM）', b: '大量の文章から「次に来る言葉」を当てる練習をしたAIです。' },
  'トークン課金': { ic: '🪙', t: 'トークン課金', b: 'AIの利用料は、読んだ・書いた文字の量で決まります。数える単位がトークンです。' },
  'AIエージェント': { ic: '🧭', t: 'AIエージェント', b: '自分で手順を考え、道具を使いながら仕事を進めるAIです。' },
};

/* 上の「カードのつながり」：6枚のカードが順に灯る */
const CHAIN = ['GPU', 'ムーアの法則', 'トランスフォーマー', 'LLM', 'トークン課金', 'AIエージェント'];
const CHAIN_LB = ['GPU', 'ムーア', 'トランス\nフォーマー', 'LLM', 'トークン', 'エージェント'];
function chain(i, t) {
  const x0 = 700, x1 = 1800, y = 175, n = CHAIN.length;
  for (let j = 0; j < n; j++) {
    const x = lerp(x0, x1, j / (n - 1)), on = j < i ? 1 : j === i ? seg(t, 0, 0.6) : 0;
    if (j > 0) { const xp = lerp(x0, x1, (j - 1) / (n - 1)); ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = j <= i ? 'rgba(255,214,107,.85)' : 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(xp + 34, y); ctx.lineTo(x - 34, y); ctx.stroke(); ctx.restore(); }
    if (j === i) glow(x, y, 70, 'rgba(255,214,107,.55)', on);
    circle(x, y, 26, on > 0 ? `rgba(255,214,107,${0.35 + 0.65 * on})` : 'rgba(255,255,255,.1)', on > 0 ? '#fff' : 'rgba(255,255,255,.3)', 3);
    txt(String(j + 1), x, y + 1, 24, on > 0.5 ? '#2a1a00' : 'rgba(255,255,255,.6)', { weight: 900 });
    const lb = CHAIN_LB[j].split('\n'); lb.forEach((s, k) => txt(s, x, y + 50 + k * 26, 22, j === i ? '#ffd66b' : j < i ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.4)', { weight: 800 }));
  }
}

const scenes = [
 /* 0 GPU：CPU は順番に、GPU は一斉に */
 { draw(t, d, T, i) {
    const kG = kw(i, '単純な'), kA = kw(i, 'AIの学習');
    frame(620, 290, 440, 520, seg(t, 0, 0.6), { title: 'CPU：順番に', color: 'rgba(122,162,255,.95)' });
    frame(1110, 290, 740, 520, seg(t, 0.3, 0.9), { title: 'GPU：一斉に', color: 'rgba(255,180,84,.95)' });
    // CPU：大きな4つの部屋が1つずつ光る
    for (let j = 0; j < 4; j++) { const x = 700 + (j % 2) * 180, y = 370 + Math.floor(j / 2) * 190, on = Math.floor(T * 3) % 4 === j;
      rr(x, y, 150, 150, 18); ctx.fillStyle = on ? 'rgba(122,162,255,.85)' : 'rgba(122,162,255,.15)'; ctx.fill(); }
    // GPU：小さな部屋がたくさん、いっせいに光る
    const g = seg(t, kG - 0.3, kG + 0.8);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 16; c++) { const x = 1150 + c * 42, y = 345 + r * 48, w = 0.5 + 0.5 * Math.sin(T * 6 + (r + c) * 0.25);
      rr(x, y, 34, 38, 6); ctx.fillStyle = `rgba(255,180,84,${0.12 + g * 0.7 * w})`; ctx.fill(); }
    hotRect('GPU', 1110, 290, 740, 520);
    const a = seg(t, kA - 0.2, kA + 0.6); if (a > 0) pill('AIの学習＝掛け算を一斉に', 1480, 860, 30, 'rgba(255,180,84,.97)', '#2a1a00', { scale: back(a) });
  }, point(t, d, i) { const k = kw(i, '単純な'); return t > k && t < k + 2 ? [1400, 500] : null; } },

 /* 1 ムーアの法則：2年で2倍の階段 */
 { draw(t, d, T, i) {
    const k1 = kw(i, 'およそ'), k2 = kw(i, 'ムーアの法則');
    const x0 = 700, y0 = 800, w = 1100, n = 8;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, 300); ctx.lineTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.stroke(); ctx.restore();
    for (let j = 0; j < n; j++) { const kk = eo(seg(t, 0.3 + j * 0.35, 0.8 + j * 0.35)); if (kk <= 0) continue;
      const h = 460 * Math.pow(2, j) / Math.pow(2, n - 1), x = x0 + 40 + j * 132;
      rr(x, y0 - h * kk, 96, Math.max(2, h * kk), 10); ctx.fillStyle = j === n - 1 ? '#4fd1c5' : 'rgba(79,209,197,.6)'; ctx.fill();
      if (j > 0 && kk > 0.8) txt('×2', x + 48, y0 - h - 26, 26, '#bff5ee', { weight: 900 });
      txt((j * 2) + '年', x + 48, y0 + 30, 22, 'rgba(255,255,255,.7)'); }
    hotRect('ムーアの法則', x0, 280, w, 540);
    const a = seg(t, k2 - 0.2, k2 + 0.6); if (a > 0) pill('ムーアの法則', 1000, 380, 40, 'rgba(79,209,197,.97)', '#062a28', { scale: back(a), key: 'ムーアの法則' });
    const b = seg(t, k1, k1 + 0.8); if (b > 0) txt('14年で128倍', 1000, 470, 34, '#fff', { alpha: b, weight: 900 });
  }, point(t, d, i) { const k = kw(i, 'およそ'); return t > k && t < k + 2 ? [1400, 600] : null; } },

 /* 2 トランスフォーマー：言葉どうしを一度に結ぶ */
 { draw(t, d, T, i) {
    const k1 = kw(i, '言葉どうし'), k2 = kw(i, '一度に');
    const words = ['ねこが', '魚を', 'くわえて', '走った'], xs = words.map((_, j) => 820 + j * 300), y = 700;
    const a = seg(t, 0, 0.8);
    words.forEach((w, j) => pill(w, xs[j], y, 40, 'rgba(199,125,255,.95)', '#fff', { scale: back(seg(a, j * 0.15, j * 0.15 + 0.5)) }));
    const b = seg(t, k1 - 0.2, k2 + 0.6);
    if (b > 0) { let n = 0; for (let p = 0; p < 4; p++) for (let q = p + 1; q < 4; q++) { const kk = seg(b, n * 0.08, n * 0.08 + 0.4); n++; if (kk <= 0) continue;
      const xa = xs[p], xb = xs[q], h = 70 + (q - p) * 60, xe = lerp(xa, xb, eo(kk));
      ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = `rgba(255,214,107,${0.5 + 0.4 * Math.sin(T * 4 + n)})`; ctx.beginPath(); ctx.moveTo(xa, y - 44);
      ctx.quadraticCurveTo((xa + xe) / 2, y - 44 - h * 2 * eo(kk), xe, y - 44); ctx.stroke(); ctx.restore(); } }
    hotRect('トランスフォーマー', 660, 280, 1200, 420);
    const c = seg(t, k2 + 0.4, k2 + 1.2); if (c > 0) pill('全部の言葉の関係を、まとめて計算', 1270, 820, 30, 'rgba(255,214,107,.97)', '#2a1a00', { scale: back(c), key: 'トランスフォーマー' });
  }, point(t, d, i) { const k = kw(i, '言葉どうし'); return t > k && t < k + 2 ? [1270, 450] : null; } },

 /* 3 LLM：次に来る言葉を当てる */
 { draw(t, d, T, i) {
    const k1 = kw(i, '次に来る'), k2 = kw(i, '大規模言語モデル');
    const a = seg(t, 0, 0.6);
    frame(640, 290, 1200, 170, a, { title: '文のつづきは？', color: 'rgba(122,162,255,.95)' });
    if (a > 0) { txt('むかしむかし、あるところに', 1130, 385, 46, '#fff', { alpha: a, weight: 900 }); const bl = 0.5 + 0.5 * Math.sin(T * 8); rr(1530, 350, 150, 70, 12); ctx.fillStyle = `rgba(255,214,107,${0.25 + 0.3 * bl})`; ctx.fill(); txt('？', 1605, 386, 44, '#ffd66b', { alpha: a }); }
    bars(700, 520, 1000, [{ label: 'おじいさん', v: 62, col: '#ffd66b', vcol: '#ffd66b' }, { label: 'おばあさん', v: 28, col: 'rgba(122,162,255,.8)' }, { label: 'ねこ', v: 6, col: 'rgba(122,162,255,.5)' }], seg(t, k1 - 0.3, k1 + 1.4), { max: 70, fmt: v => Math.round(v) + '%', bh: 50, gap: 22, lw: 240 });
    hotRect('LLM', 640, 280, 1200, 520);
    const c = seg(t, k2 - 0.2, k2 + 0.6); if (c > 0) pill('大規模言語モデル（LLM）', 1250, 830, 34, 'rgba(122,162,255,.97)', '#fff', { scale: back(c), key: 'LLM' });
  }, point(t, d, i) { const k = kw(i, '次に来る'); return t > k && t < k + 2 ? [1100, 600] : null; } },

 /* 4 トークン課金：量で決まり、年々下がる */
 { draw(t, d, T, i) {
    const k1 = kw(i, '読んで'), k2 = kw(i, '年々');
    const a = seg(t, k1 - 0.6, k1 + 0.8);
    frame(620, 290, 560, 520, seg(t, 0, 0.5), { title: '量で決まる', color: 'rgba(255,180,84,.95)' });
    const toks = ['ねこ', 'が', '魚', 'を', 'くわえ', 'て', '走っ', 'た'];
    toks.forEach((s, j) => { const kk = seg(a, j * 0.09, j * 0.09 + 0.35); pill(s, 700 + (j % 4) * 125, 400 + Math.floor(j / 4) * 100, 28, j % 2 ? 'rgba(255,180,84,.9)' : 'rgba(255,214,107,.9)', '#2a1a00', { scale: back(kk), alpha: kk }); });
    if (a > 0.7) { txt('8トークン', 900, 640, 42, '#ffd66b', { weight: 900, alpha: seg(a, 0.7, 1) }); icon('coin', 900, 730, 34, '#ffd66b', { alpha: seg(a, 0.7, 1) }); }
    hotRect('トークン課金', 620, 290, 560, 520);
    // 右：値下がりの線
    const b = seg(t, k2 - 0.4, k2 + 1.4);
    frame(1230, 290, 620, 520, seg(t, 0.2, 0.7), { title: '同じ性能の料金', color: 'rgba(79,209,197,.95)' });
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1300, 360); ctx.lineTo(1300, 740); ctx.lineTo(1800, 740); ctx.stroke();
    if (b > 0) { ctx.lineWidth = 8; ctx.strokeStyle = '#4fd1c5'; ctx.lineCap = 'round'; ctx.beginPath(); for (let s = 0; s <= 40 * b; s++) { const u = s / 40, x = 1310 + u * 470, y = 380 + 340 * (1 - Math.exp(-3.2 * u)); s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    ctx.restore(); if (b > 0) icon('down', 1700, 480, 46, '#4fd1c5', { alpha: seg(b, 0.6, 1) });
    txt('年', 1780, 772, 22, 'rgba(255,255,255,.6)');
  }, point(t, d, i) { const k = kw(i, '年々'); return t > k && t < k + 2 ? [1540, 550] : null; } },

 /* 5 AIエージェント：調べる→考える→実行する→確かめる */
 { draw(t, d, T, i) {
    const k1 = kw(i, '自分で'), k2 = kw(i, 'エージェント');
    const cx = 1060, cy = 560, R = 210, st = [['調べる', 'eye'], ['考える', 'brain'], ['実行する', 'code'], ['確かめる', 'doc']];
    const a = seg(t, k1 - 0.4, k1 + 1.0), act = Math.floor(T * 1.4) % 4;
    if (a > 0) { ctx.save(); ctx.globalAlpha *= a; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -T * 40; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,214,107,.6)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    st.forEach(([s, ic], j) => { const an = -Math.PI / 2 + j * Math.PI / 2, x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R, kk = seg(a, j * 0.15, j * 0.15 + 0.5); if (kk <= 0) return;
      const on = j === act; circle(x, y, 74 * back(kk), on ? 'rgba(255,214,107,.95)' : 'rgba(22,30,70,.95)', '#ffd66b', 4); icon(ic, x, y - 12, 26, on ? '#2a1a00' : '#ffd66b', { alpha: kk }); txt(s, x, y + 34, 22, on ? '#2a1a00' : '#fff', { alpha: kk }); });
    if (a > 0) { icon('robot', cx, cy, 60, '#fff', { alpha: a }); hotCircle('AIエージェント', cx, cy, 290); }
    const c = seg(t, k2 - 0.2, k2 + 0.6); if (c > 0) pill('AIエージェント', 1580, 420, 40, 'rgba(255,214,107,.97)', '#2a1a00', { scale: back(c), key: 'AIエージェント' });
    const e = seg(t, d - 1.8, d - 1.0); if (e > 0) pill('6枚のカードが、ひとつの話に', 1580, 700, 30, 'rgba(255,255,255,.95)', '#12183a', { scale: back(e) });
  }, point(t, d, i) { const k = kw(i, '自分で'); return t > k && t < k + 2 ? [1060, 560] : null; } },
];

const scenesOut = scenes.map(sc => ({ draw(t, d, T, i) { sc.draw(t, d, T, i); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; chain(i, t); }, point: sc.point }));

return { title: 'AIの流れを、30秒で', subtitle: 'メルマガ知識図鑑・見本カード6枚から作った動画（見本）', chapters, lines, scenes: scenesOut, gloss, yomi, background: bg,
  end: '見本カード6枚だけで作った、動画の見本です。' };
}, { category: 'ai-tech', label: 'AIの流れを、30秒で', desc: '見本カード6枚をつないだ、約30秒の見本の動画。' });
