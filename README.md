# HTMLエディタ

Web記事用のHTML（h2/h3/pなど）をタグボタンですばやく編集できるPWA。iPad最適化・完全ローカル動作（データは端末外に送信しない）。

- 公開URL: https://shinolog21.github.io/html-editor/
- 機能: タグ挿入ボタン / タブで複数ファイル編集 / 検索・置換 / 全文コピー / プレビュー / 自動保存(localStorage) / ファイル保存・共有
- 更新: `index.html` 等を編集して main へ push（GitHub Pagesに自動反映）。`sw.js` の `VERSION` を上げると旧キャッシュが確実に消える
- アイコン再生成: `node tools/make-icons.mjs`
- タグボタンの追加: `index.html` 内の `TAG_BUTTONS` 配列に1行追加
