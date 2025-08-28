# Textale

テキストを画像に自動分割するシンプルなウェブツールです。長文の小説や記事を指定サイズの画像に変換し、SNS投稿などに便利です。

## 特徴

- **自動ページ分割**: ダブル改行（空行1つ）で次の画像に送られます
- **自動折り返し**: 日本語・英語に対応したスマートなテキスト折り返し
- **高さあふれ対応**: テキストが画像の高さを超えると自動で次のページに分割
- **PNG保存**: 生成した画像を直接保存可能
- **カスタマイズ可能**: 画像サイズ、フォント、色などを自由に設定
- **モバイル対応**: スマホからそのまま保存できます

## 使い方

1. [Textale](https://shayashida.github.io/Textale/) にアクセス
2. テキストを入力エリアに貼り付け
3. 画像サイズやフォントなどの設定を調整
4. 「画像を作成」ボタンをクリック
5. 生成された画像をプレビューで確認し、保存ボタンでダウンロード

### ページ分割のルール

- **ダブル改行**: 空行1つ（\n\n）で次の画像に送られます
- **自動分割**: テキストが画像の高さを超えると自動で次のページに分割
- **文字サイズ**: 全画像で一定のサイズになります

## 技術仕様

- **言語**: HTML5, CSS3, JavaScript (ES6+)
- **依存関係**: なし（vanilla JavaScript）
- **ブラウザ対応**: モダンブラウザ（Chrome, Firefox, Safari, Edge）

## 開発

```bash
# リポジトリをクローン
git clone https://github.com/SHayashida/Textale.git
cd Textale

# ローカルサーバーで開く
python -m http.server 8000
# または
npx serve .
```

## ライセンス

MIT License

## 作者

[SHayashida](https://github.com/SHayashida)

## 貢献

バグ報告や機能リクエストは [Issues](https://github.com/SHayashida/Textale/issues) からお願いします。
