// メイン処理
const el = (id) => document.getElementById(id);

const inputText = el('inputText');
const inputWidth = el('width');
const inputHeight = el('height');
const inputFontSize = el('fontSize');
const inputLineHeight = el('lineHeight');
const inputPadding = el('padding');
const inputFontFamily = el('fontFamily');
const inputTextColor = el('textColor');
const inputBgColor = el('bgColor');
const btnGenerate = el('btnGenerate');
const btnClear = el('btnClear');
const preview = el('preview');

// X（旧Twitter）シェアボタン - ハンドラはトップレベルで登録する
const btnShareX = el('btnShareX');
if (btnShareX) {
  // 明示的にボタンの type を設定（フォーム submit を防ぐ）
  btnShareX.type = 'button';
  btnShareX.addEventListener('click', async () => {
    const shareText = 'テキスト→画像 分割ツール"Textale" https://shayashida.github.io/Textale/';
    const shareUrl = 'https://shayashida.github.io/Textale/';

    // 1) ネイティブ共有が使える端末（スマホ等）は優先
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Textale', text: shareText, url: shareUrl });
        return;
      } catch (err) {
        // ユーザーキャンセルやエラーはフォールバックへ
      }
    }

    // 2) X の intent へポップアップを開く（デスクトップ向け）
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    try {
      const w = 600, h = 480;
      const left = (window.screenX || 0) + (((window.outerWidth || window.innerWidth) - w) / 2);
      const top = (window.screenY || 0) + (((window.outerHeight || window.innerHeight) - h) / 2);
      const win = window.open(xUrl, 'shareX', `width=${w},height=${h},left=${Math.round(left)},top=${Math.round(top)},menubar=no,toolbar=no,status=no,scrollbars=yes`);
      if (win) { win.focus(); return; }
    } catch (e) {
      // fall through to anchor fallback
    }

    // 3) 最終フォールバック：一時的なリンクを生成してクリック（ポップアップブロッカー回避）
    const a = document.createElement('a');
    a.href = xUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}
btnGenerate.addEventListener('click', () => {
  const text = (inputText.value || '').replace(/\r\n/g, '\n');
  if (!text.trim()) {
    preview.innerHTML = '<div class="note">テキストを入力してください。</div>';
    return;
  }
  const width = clamp(parseInt(inputWidth.value || '1080', 10), 300, 4096);
  const height = clamp(parseInt(inputHeight.value || '1920', 10), 300, 8192);
  const fontSize = clamp(parseInt(inputFontSize.value || '42', 10), 10, 256);
  const lineHeightMul = clamp(parseFloat(inputLineHeight.value || '1.6'), 1.0, 3.0);
  const padding = clamp(parseInt(inputPadding.value || '64', 10), 0, Math.floor(Math.min(width, height) / 2));
  const fontFamily = inputFontFamily.value || "-apple-system, system-ui, 'Noto Sans JP', 'Hiragino Sans', Meiryo, sans-serif";
  const textColor = inputTextColor.value || '#111111';
  const bgColor = inputBgColor.value || '#ffffff';

  const pages = textToImages({ text, width, height, fontSize, lineHeightMul, padding, fontFamily, textColor, bgColor });
  renderPreview(pages);
});

btnClear.addEventListener('click', () => {
  inputText.value = '';
  preview.innerHTML = '';
});

function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

function textToImages(options) {
  const { text, width, height, fontSize, lineHeightMul, padding, fontFamily, textColor, bgColor } = options;
  const lineHeight = Math.round(fontSize * lineHeightMul);
  const maxTextWidth = Math.max(0, width - padding * 2);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px ${fontFamily}`;

  function drawBackground() {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = textColor;
  }

  // ページ管理
  const dataUrls = [];
  let cursorY = padding;
  let hasContentOnPage = false;

  function commitPageIfHasContent() {
    if (!hasContentOnPage) return;
    // 既存キャンバスをエクスポート
    dataUrls.push(canvas.toDataURL('image/png'));
    // 新しいページを準備
    drawBackground();
    cursorY = padding;
    hasContentOnPage = false;
  }

  // 初期背景
  drawBackground();

  // ダブル改行でチャンク分割 (空行1つでページ送り)
  const chunks = text.split(/\n\s*\n/g);
  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    const lines = wrapToLines(chunk, ctx, maxTextWidth);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (cursorY + lineHeight > height - padding) {
        commitPageIfHasContent();
      }
      // 描画
      if (line === '') {
        // 空行は高さだけ進める
        cursorY += lineHeight;
      } else {
        ctx.fillText(line, padding, cursorY);
        cursorY += lineHeight;
        hasContentOnPage = true;
      }
    }
    // チャンク末尾でページ送り (ダブル改行の仕様)
    commitPageIfHasContent();
  }

  // 末尾が描画されたがコミットされていない場合はコミット
  commitPageIfHasContent();

  return dataUrls;
}

// 自動折り返し: 日本語は連続文字、英数はスペース優先で折り返し
function wrapToLines(text, ctx, maxWidth) {
  const result = [];
  const paragraphs = text.split('\n');
  for (let p = 0; p < paragraphs.length; p++) {
    const para = paragraphs[p];
    if (para.length === 0) {
      result.push('');
      continue;
    }
    let line = '';
    for (let i = 0; i < para.length; i++) {
      const ch = para[i];
      const test = line + ch;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
        continue;
      }
      if (line.length === 0) {
        // 1文字でも超える場合は強制改行
        result.push(ch);
        line = '';
        continue;
      }
      const lastSpace = line.lastIndexOf(' ');
      if (lastSpace > 0) {
        result.push(line.slice(0, lastSpace));
        line = line.slice(lastSpace + 1) + ch;
      } else {
        result.push(line);
        line = ch;
      }
    }
    if (line.length > 0) result.push(line);
  }
  return result;
}

function renderPreview(urls) {
  preview.innerHTML = '';
  if (!urls || urls.length === 0) {
    preview.innerHTML = '<div class="note">画像はまだありません。</div>';
    return;
  }
  urls.forEach((url, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = `画像 ${idx + 1}`;
    img.src = url;

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const label = document.createElement('div');
    label.textContent = `画像 ${idx + 1}`;
    const actions = document.createElement('div');
    const a = document.createElement('a');
    a.textContent = '保存';
    a.href = url;
    a.download = `text-image-${idx + 1}.png`;
    a.className = 'secondary button-link';
    actions.appendChild(a);
    footer.appendChild(label);
    footer.appendChild(actions);

    card.appendChild(img);
    card.appendChild(footer);
    preview.appendChild(card);
  });
}
