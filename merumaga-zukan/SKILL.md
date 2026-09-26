---
name: merumaga-zukan
description: 定期配信のメルマガ（ニュースレター）を「概念ごとのカード」に分けて蓄積し、図解・号の出典・関連する概念のつながりを持つ知識図鑑に育てるコレクション。1レコード = 1概念（記事単位ではなく概念単位。同じ概念が複数の号に出ても1枚のカードにまとめる）。records live at `data/merumaga-zukan/items/<id>.json`（id = 概念スラッグ）。ユーザーは `/collections/merumaga-zukan` の「マップ」ビューで閲覧する。ユーザーがメルマガの本文を貼り付けて「取り込んで」と言ったとき、見本カードを消したいとき、分類や図解を変えたいときに使う。レコードI/Oは `manageCollection`。
---

# メルマガ知識図鑑

メルマガの号を読み、話題を **概念ごとのカード** に分けて積み上げていく図鑑。
カードには、図解・号ごとの話（どの号で出た話か）・関連する概念へのつながりが付く。

## はじめて入れたとき（インストール）

ユーザーがこのリポジトリの URL を貼って「入れて」と言ったら、次の順に進める。

0. URL のリポジトリを `github/merumaga-zukan-kit/` に `git clone` する（すでにあれば `git pull`）。
   以下の「このフォルダ」は、その中の `merumaga-zukan/` を指す。
   ユーザーが展開済みのフォルダをワークスペース内に置いた場合は、それを使う。
1. `config/helps/collection-skills.md` を読み、この環境でスキルを置く場所を確かめる。
   - `data/skills/` があれば `data/skills/merumaga-zukan/` に置く。
   - なければ `.claude/skills/merumaga-zukan/` に置く。
2. このフォルダの `SKILL.md`・`schema.json`・`views/`・`tools/` を、そのままそこへ写す。
3. `samples/*.json`（見本カード11枚）を1つの JSON 配列にまとめてワークスペース内に書き出し、
   `manageCollection` の `putItems`（`slug: "merumaga-zukan"`、`itemsFile` にその絶対パス、`mode: "create"`）で入れる。
4. `presentCollection`（`collectionSlug: "merumaga-zukan"`）で図鑑を見せる。

## カードの項目

- `id` — 概念スラッグ（英小文字とハイフン）。主キー。
- `title` — 概念の名前（必須）
- `category` — 分類（必須）。値は `schema.json` の enum と、`views/map.html` の `CATEGORIES` の両方にある id。
- `headline` — 15〜30字で、ひとことで言うと（必須）
- `summary` — 「結局なに？」を、前提知識なしで読める言葉で（必須）
- `firstIssue` — 最初に出た号の配信日（`YYYY-MM-DD`）
- `visualization` — 図解のキー（`views/map.html` の `FIGS` にある名前）
- `body` — 号ごとの話（表）。`label`（見出し）/ `text`（本文）/ `source`（その話が出た号の配信日 `YYYY-MM-DD`）/ `sourceType`（`article`＝本文記事、`qa`＝読者質問への回答）
- `relatedTopics` — 関連する概念（表）。`concept` にほかのカードの id。これが図鑑のつながりになる
- `sourceArticles` — この概念が出た号の配信日（表）。`date`
- `referencedBy` — 逆向きのつながり（自動で計算される。書かない）

## 号を取り込む

ユーザーがメルマガの本文を貼り付けて「取り込んで」と言ったら：

1. 号の配信日を確かめる（本文やユーザーの言葉から。分からなければ聞く）。
2. 本文から、カードにする価値のある概念を選ぶ。記事の数ではなく、**話題の数** で考える。
3. 概念ごとに、既存のカードがあるかを `getItems`（`fields: ["title","category"]`）で確かめる。
   - **ある** → `body` に、その号で出た話を1行足し、`sourceArticles` にその号を足す（`mode: "merge"`。表は丸ごと置き換わるので、既存の行も含めて書く）。
   - **ない** → 新しいカードを作る（`mode: "create"`）。
4. 関係のある概念どうしを `relatedTopics` でつなぐ。新しいカードからだけでなく、既存のカードからもつなぐ。
5. 図解があると分かりやすい概念には、下の「図解を足す」の手順で図を足す。
6. 最後に、足したカード・直したカードの数と題名を短く伝え、`presentCollection` で見せる。

### 書き方の決まり

- **原文にない評価を足さない。**「期待できる」「有望」「おすすめ」などの言葉は、原文にあるときだけ書く。
- 読者の質問に筆者が答えた部分（質問コーナーなど）は、`sourceType: "qa"` にする。画面に「読者質問への回答」と表示され、筆者自身の主張と区別できる。
- 本文をそのまま長く写さない。自分の言葉で短くまとめる。
- 号の日付は、その号の配信日にそろえる（カードの号表示・時系列の並びに使われる）。

## 見本を片づける

ユーザーが「見本を消して」と言ったら：

- 見本カード11枚（`llm` `transformer` `ai-agent` `token-pricing` `gpu` `moores-law` `humanoid` `autonomous-driving-levels` `git` `dollar-cost-averaging` `inflation`）を `deleteItems` で消す。ただし、ユーザーが取り込んだ号で同じ id を使い、中身を書き換えたカードは消さない。
- `views/map.html` の中の、見本カードを指している次の部分を、取り込んだ内容に合わせて書き直すか空にする。
  - `GLOSSARY`（用語集。本文中の言葉にふきだしで説明が出る）
  - `CATEGORY_GUIDE`（分類ごとの読み物。`{{概念id}}` と書くとカードへのリンクになる）
  - `LESSON_FLOWS` と `CATEGORY_LESSONS`（「時系列で読む」などの、カードを順にたどる読み物）
  - `FIGS` の中の `sample-*` の図解（使っているカードがなくなったものは消してよい）
- `views/map.html` を直したら、スマホ版を作り直す：`node <スキルの場所>/tools/mkmobile.cjs`

## 図解を足す

図解はデータではなく **画面のコード** に書く。

1. `views/map.html` に、図を返す関数 `FigXxx` を書く。
   - 使える部品：`Bars`（横棒グラフ）、`Steps`（段階）、`StatFlow`（数字の流れ）、`TwoBox`（2つの比較）、`ChipRow`（矢印でつないだ流れ）、`Timeline`（年表）、`Meter`、`StackBar`、`NoteBox`、`Svg`（SVG を直接書く）。
   - 見本の `FigSample*` が書き方の例になる。
2. `FIGS` に `"キー": FigXxx` を登録する。
3. カードの `visualization` にそのキーを入れる（`mode: "merge"`）。
4. スマホ版を作り直す：`node <スキルの場所>/tools/mkmobile.cjs`

## 分類を変える

分類は2か所にある。**必ず両方** を同じ id にそろえる。

- `schema.json` の `category` の enum（`manageCollection` の `getSchema` → `putSchema` で直す）
- `views/map.html` の `CATEGORIES`（id と表示名）

直したあと、スマホ版を作り直す。

## 画面

- `views/map.html` — パソコン用。分類 → カード一覧 → カード、の順にたどる。
- `views/map-mobile.html` — スマホ用。`tools/mkmobile.cjs` で `map.html` から自動で作る。**直接は直さない。**

チャットに全カードを書き出さない。追加・更新のあとは `presentCollection` で見せる。
