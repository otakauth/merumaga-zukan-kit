/* views/map.html から views/map-mobile.html を作る。map.html を直したら実行する。
   node tools/mkmobile.cjs */

const fs = require('fs');
const P = require('path').join(__dirname, '..', 'views') + '/';
let s = fs.readFileSync(P + 'map.html', 'utf8');

const MOBILE_BOOT = `
/* ============================================================ BOOTSTRAP (mobile / remote) ============================================================ */
const FIELDS = ["title","category","headline","summary","visualization","body","relatedTopics","sourceArticles","firstIssue"];
let _root = null;
function mapRecord(r){
  return {
    id: r.id, title: r.title || r.id, category: r.category || "",
    headline: r.headline || "", summary: r.summary || "",
    visualization: r.visualization || null,
    body: Array.isArray(r.body) ? r.body : [],
    related_topics: Array.isArray(r.relatedTopics) ? r.relatedTopics.map(x=>x&&x.concept).filter(Boolean) : [],
    source_articles: Array.isArray(r.sourceArticles) ? r.sourceArticles.map(x=>x&&x.date).filter(Boolean) : [],
    first_issue: r.firstIssue || "",
  };
}
function minSrc(c){ return (c.source_articles||[]).slice().sort()[0] || "9999"; }
async function load(){
  let all = [], offset = 0, total = Infinity;
  while(all.length < total){
    const page = await window.__MC_VIEW.getItems({ offset, limit: 200, fields: FIELDS });
    total = page.total || 0;
    all = all.concat(page.items || []);
    offset = all.length;
    if(!page.items || page.items.length === 0) break;
  }
  const order = CATEGORIES.map(c=>c.id);
  CONCEPTS = all.map(mapRecord).sort((a,b)=>
    (order.indexOf(a.category) - order.indexOf(b.category)) ||
    (String(minSrc(a)).localeCompare(String(minSrc(b)))) ||
    a.title.localeCompare(b.title,"ja"));
  const allDates=[];
  CONCEPTS.forEach(c=>{
    (c.source_articles||[]).forEach(d=>allDates.push(d));
    (c.body||[]).forEach(b=>b&&b.source&&allDates.push(b.source));
  });
  const validDates = allDates.filter(d=>/^\\d{4}-\\d{2}-\\d{2}$/.test(d)).sort();
  OLDEST_ISSUE = validDates[0] || "";
  NEWEST_ISSUE = validDates[validDates.length-1] || "";
  if(!_root) _root = ReactDOM.createRoot(document.getElementById("root"));
  _root.render(React.createElement(App, { key: "r"+Date.now() }));
}
load().catch(e=>{ document.getElementById("root").textContent = "読み込み失敗: " + (e && e.message || e); });
`;
s = s.replace(/\/\* =+ BOOTSTRAP =+ \*\/[\s\S]*?(?=<\/script>)/, MOBILE_BOOT + '\n');

s = s.replace(
  /window\.__MC_VIEW\.openItem\((\w+)\.id,\s*"edit"\)/g,
  'window.__MC_VIEW.startChat("「"+$1.title+"」（"+$1.id+"）の内容を修正したい：\\n\\n")'
);
s = s.replace('"✎ 編集"', '"✎ 修正を相談"');

s = s.replace('コレクション版</span>', 'スマホ版</span>');

fs.writeFileSync(P + 'map-mobile.html', s);
console.log('map-mobile.html written,', s.length, 'bytes  (budget 900KB)');
