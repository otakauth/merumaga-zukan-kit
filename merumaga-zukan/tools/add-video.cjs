/* video/ の動画を views/map.html に埋め込み、スマホ版も作り直す。動画を足したり直したりしたら実行する。
   node tools/add-video.cjs
   ・video/engine.js と video/parts.js のあとに、ほかの video/*.js をすべて入れる（何度実行してもよい）
   ・分類の画面に「🎬 動画で見る」ボタンを出すしかけも、まだ無ければ入れる */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'), V = path.join(ROOT, 'video'), MAP = path.join(ROOT, 'views', 'map.html');

const read = n => {
  const s = fs.readFileSync(path.join(V, n), 'utf8');
  if (/<\/script/i.test(s)) { console.error('❌ ' + n + ' に </script と書かれているので埋め込めない'); process.exit(1); }
  return s;
};
const videos = fs.readdirSync(V).filter(n => n.endsWith('.js') && n !== 'engine.js' && n !== 'parts.js').sort();
const block = '<!-- GUIDE-VIDEO BEGIN -->\n' + ['engine.js', 'parts.js'].concat(videos).map(n => '<script>\n' + read(n) + '\n</script>\n').join('') + '<!-- GUIDE-VIDEO END -->\n';

let s = fs.readFileSync(MAP, 'utf8');
s = s.replace(/<!-- GUIDE-VIDEO BEGIN -->[\s\S]*?<!-- GUIDE-VIDEO END -->\n/, '');
const main = s.indexOf('<script>\nconst {\n');
if (main < 0) { console.error('❌ map.html の本体のスクリプトが見つからない'); process.exit(1); }
s = s.slice(0, main) + block + s.slice(main);

const ROW = '  const lessonButtons = lessonIds.length > 0 ?';
if (!s.includes('const gvList = ')) {
  if (s.split(ROW).length !== 2) { console.error('❌ 分類の画面のボタン列が見つからない'); process.exit(1); }
  const BTN = `  /* 「🎬 動画で見る」：video/ の動画のうち、この分類のもの。見終わったら、あれば最初の読み物へ */
  const gvList = window.GuideVideo && window.GuideVideo.list ? window.GuideVideo.list(cat) : [];
  const gvFlow = lessonIds.find(fid => LESSON_FLOWS[fid]);
  const gvBtns = gvList.map(v => /*#__PURE__*/React.createElement("button", {
    key: "gv-" + v.key,
    onClick: () => window.GuideVideo.open(v.key, gvFlow ? { nextLabel: "📰 " + LESSON_FLOWS[gvFlow].label + " へ", onNext: () => goLesson(cat, gvFlow) } : {}),
    className: "text-left rounded-xl px-4 py-3 bg-fuchsia-400/[.08] ring-1 ring-fuchsia-400/35 hover:bg-fuchsia-400/[.15] hover:ring-fuchsia-400/55 transition"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[13px] font-bold text-fuchsia-100"
  }, "🎬 ", v.label || "動画で見る"), v.desc ? /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-fuchsia-200/70 mt-0.5"
  }, v.desc) : null));
`;
  s = s.replace(ROW, BTN + '  const lessonButtons = lessonIds.length > 0 || gvBtns.length > 0 ?');
  const OLD = '    className: "flex flex-wrap gap-2 mb-6"\n  }, lessonIds.map(fid => {';
  if (s.split(OLD).length !== 2) { console.error('❌ 分類の画面のボタン列の中身が見つからない'); process.exit(1); }
  s = s.replace(OLD, '    className: "flex flex-wrap gap-2 mb-6"\n  }, gvBtns, lessonIds.map(fid => {');
}
fs.writeFileSync(MAP, s);
console.log('map.html に動画 ' + videos.length + ' 本を埋め込んだ：' + videos.join('、'));
cp.execFileSync('node', [path.join(__dirname, 'mkmobile.cjs')], { stdio: 'inherit' });
