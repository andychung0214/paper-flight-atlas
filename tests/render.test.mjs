import test from 'node:test';
import assert from 'node:assert/strict';

import { planes } from '../src/data/planes.js';
import {
  escapeHtml,
  renderAbout,
  renderApp,
  renderCatalog,
  renderGuide,
  renderHome,
} from '../src/render.js';

test('escapeHtml escapes unsafe characters for text rendering', () => {
  assert.equal(
    escapeHtml(`折線 <安全> & "安靜" '紙張'`),
    '折線 &lt;安全&gt; &amp; &quot;安靜&quot; &#39;紙張&#39;',
  );
});

test('renderHome creates the paper workshop landing view', () => {
  const html = renderHome({
    planes,
    favorites: ['classic-dart', 'wabi-sabi-crane'],
  });

  assert.match(html, /紙翼圖鑑/);
  assert.match(html, /日式侘寂紙工坊/);
  assert.match(html, /今日推薦/);
  assert.match(html, /Classic Dart/);
  assert.match(html, /已收藏 2 張機型/);
  assert.match(html, /data-action="navigate"/);
  assert.match(html, /data-hash="#catalog"/);
});

test('renderCatalog renders eight specimen cards and supports filtering', () => {
  const allHtml = renderCatalog({
    planes,
    favorites: ['classic-dart'],
  });

  assert.equal((allHtml.match(/class="plane-card\b/g) ?? []).length, 8);
  assert.match(allHtml, /查看教學/);
  assert.match(allHtml, /收藏/);

  const filteredHtml = renderCatalog({
    planes,
    favorites: [],
    activeDifficulty: 'master',
  });

  assert.equal((filteredHtml.match(/class="plane-card\b/g) ?? []).length, 2);
  assert.match(filteredHtml, /aria-pressed="true"[^>]*>大師/);
});

test('renderCatalog uses Traditional Chinese section labels', () => {
  const html = renderCatalog({
    planes,
    favorites: [],
  });

  assert.match(html, /紙樣標本卡/);
  assert.doesNotMatch(html, /Paper specimen cards/);
});

test('renderGuide renders the current step, progress, and trusted SVG', () => {
  const plane = planes[1];
  const html = renderGuide({
    plane,
    stepIndex: 2,
    favorites: [plane.id],
  });

  assert.match(html, new RegExp(plane.steps[2].title));
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /第 3 步 \/ 共 5 步/);
  assert.match(html, /<svg[\s\S]*role="img"/);
  assert.match(html, /摺紙提醒/);
  assert.match(html, /常見失手/);
  assert.match(html, /data-action="step"/);
});

test('renderAbout includes paper safety guidance', () => {
  const html = renderAbout();

  assert.match(html, /紙材安全提示/);
  assert.match(html, /請避開潮濕紙張與過度鋒利的紙角/);
  assert.match(html, /內容授權與使用說明/);
});

test('renderAbout and app footer use Traditional Chinese section labels', () => {
  const aboutHtml = renderAbout();
  const app = renderApp({
    route: { page: 'about' },
    planes,
    theme: 'forest',
    favorites: [],
  });

  assert.match(aboutHtml, /工坊筆記/);
  assert.match(aboutHtml, /典藏說明/);
  assert.doesNotMatch(aboutHtml, /Workshop notes/);
  assert.doesNotMatch(aboutHtml, /Archive/);
  assert.match(app.html, /靜折手記/);
  assert.doesNotMatch(app.html, /Quiet fold notes/);
});

test('renderApp normalizes missing plane routes to catalog state', () => {
  const rendered = renderApp({
    route: {
      page: 'plane',
      id: 'missing-plane',
      step: 2,
    },
    planes,
    theme: 'forest',
    favorites: [],
  });

  assert.match(rendered.title, /找不到機型｜紙翼圖鑑/);
  assert.match(rendered.description, /找不到指定機型，已回到紙翼圖鑑繼續挑選/);
  assert.equal(rendered.page, 'catalog');
  assert.match(rendered.html, /data-page="catalog"/);
  assert.match(rendered.html, /找不到指定機型，先回到圖鑑挑一張新的紙樣卡吧/);
  assert.match(rendered.html, /紙樣標本卡/);
  assert.doesNotMatch(rendered.html, /<main\b/i);
  assert.doesNotMatch(rendered.html, /data-page="plane"/);
  assert.doesNotMatch(rendered.html, /data-hash="#plane\/missing-plane\/step\/2"/);
});

test('renderApp returns metadata and escapes unsafe plane content', () => {
  const unsafePlane = {
    ...planes[0],
    name: '<紙翼 & 樣本>',
    summary: '試著避開 <script> 與未轉義標記。',
    flightTraits: ['安定 & 延展'],
    materials: ['A4 <薄紙>'],
    steps: [
      {
        ...planes[0].steps[0],
        title: '對齊 <中心線>',
        instruction: '先向內 & 再壓平。',
        tip: '保持 "安靜" 的手勢。',
        commonMistake: '不要插入 <b> 標籤。</b>',
      },
    ],
  };

  const rendered = renderApp({
    route: {
      page: 'plane',
      id: unsafePlane.id,
      step: 0,
    },
    planes: [unsafePlane, ...planes.slice(1)],
    theme: 'wine',
    favorites: [unsafePlane.id],
  });

  assert.match(rendered.title, /紙翼圖鑑/);
  assert.match(rendered.description, /試著避開/);
  assert.match(rendered.html, /data-theme="wine"/);
  assert.match(rendered.html, /&lt;紙翼 &amp; 樣本&gt;/);
  assert.match(rendered.html, /對齊 &lt;中心線&gt;/);
  assert.match(rendered.html, /A4 &lt;薄紙&gt;/);
  assert.doesNotMatch(rendered.html, /<script/i);
  assert.doesNotMatch(rendered.html, /<b> 標籤/);
});
