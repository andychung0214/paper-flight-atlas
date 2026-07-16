import {
  buildAboutHash,
  buildCatalogHash,
  buildHomeHash,
  buildPlaneHash,
} from './router.js';
import { renderFoldDiagram } from './diagrams.js';

const difficultyOrder = Object.freeze(['basic', 'intermediate', 'advanced', 'master']);

const difficultyLabels = Object.freeze({
  basic: '基礎',
  intermediate: '進階',
  advanced: '困難',
  master: '大師',
});

const themeOptions = Object.freeze([
  { id: 'forest', label: '森林綠' },
  { id: 'wine', label: '酒紅色' },
  { id: 'london', label: '倫敦藍' },
]);

function toFavoriteSet(favorites) {
  if (favorites instanceof Set) {
    return favorites;
  }

  if (Array.isArray(favorites)) {
    return new Set(favorites);
  }

  return new Set();
}

function clampStepIndex(stepIndex, stepCount) {
  const normalized = Number.isFinite(stepIndex) ? Math.floor(stepIndex) : 0;

  if (stepCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(normalized, 0), stepCount - 1);
}

function getCurrentHash(route, fallbackPlaneId) {
  if (!route || route.page === 'home') {
    return buildHomeHash();
  }

  if (route.page === 'catalog') {
    return buildCatalogHash();
  }

  if (route.page === 'about') {
    return buildAboutHash();
  }

  if (route.page === 'plane' && route.id) {
    return buildPlaneHash(route.id, route.step ?? 0);
  }

  if (fallbackPlaneId) {
    return buildPlaneHash(fallbackPlaneId, 0);
  }

  return buildHomeHash();
}

function renderThemeSwitcher(theme, route, fallbackPlaneId) {
  const currentHash = escapeHtml(getCurrentHash(route, fallbackPlaneId));

  return `
    <div class="theme-switcher" aria-label="主題切換">
      ${themeOptions.map(option => `
        <button
          type="button"
          class="button button--ghost theme-switcher__button"
          data-action="theme"
          data-theme="${escapeHtml(option.id)}"
          data-hash="${currentHash}"
          aria-pressed="${theme === option.id}"
        >${escapeHtml(option.label)}</button>
      `).join('')}
    </div>
  `;
}

function renderSiteHeader(route, theme, fallbackPlaneId) {
  return `
    <header class="site-header paper-panel">
      <div class="site-header__brand">
        <p class="annotation-label">Paper Flight Atlas</p>
        <h1>紙翼圖鑑</h1>
        <p>像翻閱紙工坊樣本卡一樣，安靜地挑一架適合今天風向的紙飛機。</p>
      </div>
      <nav class="site-nav" aria-label="主要導覽">
        <button type="button" class="button button--ghost" data-action="navigate" data-hash="${escapeHtml(buildHomeHash())}">首頁</button>
        <button type="button" class="button button--ghost" data-action="navigate" data-hash="${escapeHtml(buildCatalogHash())}">機型圖鑑</button>
        <button type="button" class="button button--ghost" data-action="navigate" data-hash="${escapeHtml(buildAboutHash())}">關於</button>
      </nav>
      ${renderThemeSwitcher(theme, route, fallbackPlaneId)}
    </header>
  `;
}

function renderFavoriteButton(planeId, favorites, hash) {
  const favoriteSet = toFavoriteSet(favorites);
  const isFavorite = favoriteSet.has(planeId);

  return `
    <button
      type="button"
      class="button button--ghost"
      data-action="favorite"
      data-plane-id="${escapeHtml(planeId)}"
      data-hash="${escapeHtml(hash)}"
      aria-pressed="${isFavorite}"
    >${isFavorite ? '收藏中' : '加入收藏'}</button>
  `;
}

function renderPlaneMetaList(plane) {
  return `
    <ul class="annotation-list">
      <li><span class="annotation-label">難度</span>${escapeHtml(plane.difficultyLabel)}</li>
      <li><span class="annotation-label">完成時間</span>${escapeHtml(plane.time)}</li>
      <li><span class="annotation-label">紙張</span>${escapeHtml(plane.paperSize)}</li>
    </ul>
  `;
}

function renderPlaneTraits(traits) {
  return `
    <ul class="tag-list">
      ${traits.map(trait => `<li class="tag">${escapeHtml(trait)}</li>`).join('')}
    </ul>
  `;
}

function renderMaterials(materials) {
  return `
    <ul class="material-list">
      ${materials.map(material => `<li>${escapeHtml(material)}</li>`).join('')}
    </ul>
  `;
}

function renderPlaneCard(plane, favorites) {
  const guideHash = buildPlaneHash(plane.id, 0);

  return `
    <article class="plane-card paper-panel">
      <div class="plane-card__heading">
        <p class="annotation-label">${escapeHtml(plane.difficultyLabel)}</p>
        <h3>${escapeHtml(plane.name)}</h3>
      </div>
      <p class="plane-card__summary">${escapeHtml(plane.summary)}</p>
      ${renderPlaneMetaList(plane)}
      <section class="plane-card__section">
        <p class="annotation-label">飛行特性</p>
        ${renderPlaneTraits(plane.flightTraits)}
      </section>
      <section class="plane-card__section">
        <p class="annotation-label">建議紙材</p>
        ${renderMaterials(plane.materials)}
      </section>
      <div class="plane-card__actions">
        ${renderFavoriteButton(plane.id, favorites, guideHash)}
        <button type="button" class="button" data-action="navigate" data-hash="${escapeHtml(guideHash)}">查看教學</button>
      </div>
    </article>
  `;
}

function renderDifficultyFilters(planes, activeDifficulty) {
  const counts = difficultyOrder.map(id => ({
    id,
    label: difficultyLabels[id],
    count: planes.filter(plane => plane.difficulty === id).length,
  }));

  return `
    <div class="catalog-filters" aria-label="難度篩選">
      ${counts.map(item => {
        const selected = activeDifficulty === item.id;

        return `
          <button
            type="button"
            class="button button--ghost"
            data-action="filter"
            data-difficulty="${escapeHtml(item.id)}"
            data-hash="${escapeHtml(buildCatalogHash())}"
            aria-pressed="${selected}"
          >${escapeHtml(item.label)}<span class="annotation-count">${item.count}</span></button>
        `;
      }).join('')}
    </div>
  `;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderHome({ planes, favorites }) {
  const featuredPlane = Array.isArray(planes) && planes.length > 0 ? planes[0] : null;
  const favoriteSet = toFavoriteSet(favorites);

  return `
    <section class="hero-panel paper-panel">
      <div class="hero-panel__copy">
        <p class="annotation-label">日式侘寂紙工坊</p>
        <h2>紙翼圖鑑</h2>
        <p>在安靜的工作台上，挑一張紙、讀一則摺法，讓每道折線都像標本卡上的細註解一樣清楚。</p>
        <p class="hero-panel__status">已收藏 ${favoriteSet.size} 張機型</p>
        <div class="hero-panel__actions">
          <button type="button" class="button" data-action="navigate" data-hash="${escapeHtml(buildCatalogHash())}">翻閱機型圖鑑</button>
          <button type="button" class="button button--ghost" data-action="navigate" data-hash="${escapeHtml(buildAboutHash())}">紙材與安全提示</button>
        </div>
      </div>
      <aside class="hero-panel__specimen paper-panel">
        <p class="annotation-label">今日推薦</p>
        <h3>${escapeHtml(featuredPlane?.name ?? '尚無機型')}</h3>
        <p>${escapeHtml(featuredPlane?.summary ?? '稍後再回來，新的紙樣卡就會鋪好。')}</p>
        ${featuredPlane ? renderPlaneTraits(featuredPlane.flightTraits) : ''}
        ${featuredPlane ? `<button type="button" class="button" data-action="navigate" data-hash="${escapeHtml(buildPlaneHash(featuredPlane.id, 0))}">從第一步開始</button>` : ''}
      </aside>
    </section>
  `;
}

export function renderCatalog({ planes, favorites, activeDifficulty }) {
  const filteredPlanes = activeDifficulty
    ? planes.filter(plane => plane.difficulty === activeDifficulty)
    : planes;
  const cards = filteredPlanes.length > 0
    ? filteredPlanes.map(plane => renderPlaneCard(plane, favorites)).join('')
    : `
      <article class="empty-state paper-panel">
        <p class="annotation-label">暫時留白</p>
        <h3>目前沒有符合的機型</h3>
        <p>換一個難度看看，或回到全部機型重新翻閱紙樣標本卡。</p>
      </article>
    `;

  return `
    <section class="catalog-shell">
      <div class="catalog-shell__intro paper-panel">
        <p class="annotation-label">紙樣標本卡</p>
        <h2>機型圖鑑</h2>
        <p>依照今天想練習的節奏，從四個難度中挑一張紙樣卡，先讀飛行特性，再決定要不要收藏。</p>
      </div>
      ${renderDifficultyFilters(planes, activeDifficulty)}
      <div class="catalog-grid">
        ${cards}
      </div>
    </section>
  `;
}

export function renderGuide({ plane, stepIndex, favorites }) {
  const safeStepIndex = clampStepIndex(stepIndex, plane.steps.length);
  const step = plane.steps[safeStepIndex];
  const previousStep = Math.max(safeStepIndex - 1, 0);
  const nextStep = Math.min(safeStepIndex + 1, plane.steps.length - 1);
  const guideHash = buildPlaneHash(plane.id, safeStepIndex);
  const svg = renderFoldDiagram(
    step.diagram,
    `${plane.name} 第 ${safeStepIndex + 1} 步 ${step.title}`,
  );

  return `
    <section class="guide-layout">
      <div class="guide-layout__primary paper-panel">
        <div class="guide-layout__header">
          <button type="button" class="button button--ghost" data-action="navigate" data-hash="${escapeHtml(buildCatalogHash())}">返回圖鑑</button>
          ${renderFavoriteButton(plane.id, favorites, guideHash)}
        </div>
        <p class="annotation-label">${escapeHtml(plane.difficultyLabel)} ／ ${escapeHtml(plane.time)}</p>
        <h2>${escapeHtml(plane.name)}</h2>
        <p class="guide-layout__summary">${escapeHtml(plane.summary)}</p>
        <p class="step-status" aria-live="polite">第 ${safeStepIndex + 1} 步 / 共 ${plane.steps.length} 步</p>
        <div class="diagram-frame" aria-label="摺紙示意圖">
          ${svg}
        </div>
      </div>
      <aside class="guide-layout__notes paper-panel">
        <p class="annotation-label">步驟標題</p>
        <h3>${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.instruction)}</p>
        <section class="guide-note">
          <p class="annotation-label">建議紙材</p>
          ${renderMaterials(plane.materials)}
        </section>
        <section class="guide-note">
          <p class="annotation-label">摺紙提醒</p>
          <p>${escapeHtml(step.tip)}</p>
        </section>
        <section class="guide-note">
          <p class="annotation-label">常見失手</p>
          <p>${escapeHtml(step.commonMistake)}</p>
        </section>
        <div class="stepper">
          <button
            type="button"
            class="button button--ghost"
            data-action="step"
            data-hash="${escapeHtml(buildPlaneHash(plane.id, previousStep))}"
            ${safeStepIndex === 0 ? 'disabled' : ''}
          >上一則</button>
          <button
            type="button"
            class="button"
            data-action="step"
            data-hash="${escapeHtml(buildPlaneHash(plane.id, nextStep))}"
            ${safeStepIndex === plane.steps.length - 1 ? 'disabled' : ''}
          >下一則</button>
        </div>
      </aside>
    </section>
  `;
}

export function renderAbout() {
  return `
    <section class="about-layout">
      <article class="paper-panel">
        <p class="annotation-label">工坊筆記</p>
        <h2>紙材安全提示</h2>
        <p>請避開潮濕紙張與過度鋒利的紙角，摺線若已疲乏，請更換紙張再重新開始。</p>
        <ul class="material-list">
          <li>投擲前先確認周圍沒有玻璃、風扇與尖角家具。</li>
          <li>讓孩童練習時，建議由大人先示範投擲方向與收納方式。</li>
          <li>紙張若有破損或濕痕，請直接回收，不要硬折到纖維裂開。</li>
        </ul>
      </article>
      <article class="paper-panel">
        <p class="annotation-label">典藏說明</p>
        <h2>內容授權與使用說明</h2>
        <p>紙翼圖鑑首版專注於靜態教學體驗，所有圖說都以受控 SVG 線稿與內建資料生成，不載入外部素材。</p>
        <p>如果你想把今天喜歡的摺法留到下次，只要收藏機型，之後就能從圖鑑快速回到它的教學頁。</p>
      </article>
    </section>
  `;
}

export function renderApp({ route, planes, theme, favorites, activeDifficulty }) {
  const safeRoute = route ?? { page: 'home' };
  const safePlanes = Array.isArray(planes) ? planes : [];
  const favoriteSet = toFavoriteSet(favorites);
  const requestedPlane = safeRoute.page === 'plane'
    ? safePlanes.find(plane => plane.id === safeRoute.id)
    : null;
  const fallbackToCatalog = safeRoute.page === 'plane' && !requestedPlane;
  const effectiveRoute = fallbackToCatalog ? { page: 'catalog' } : safeRoute;
  const currentPlane = effectiveRoute.page === 'plane' ? requestedPlane : null;

  let title = '紙翼圖鑑｜Paper Flight Atlas';
  let description = '在日式侘寂紙工坊中翻閱八種紙飛機標本卡，逐步完成自己的紙翼。';
  let content = renderHome({ planes: safePlanes, favorites: favoriteSet });

  if (effectiveRoute.page === 'catalog') {
    const activeDifficultyLabel = activeDifficulty ? difficultyLabels[activeDifficulty] : '';

    title = fallbackToCatalog
      ? '找不到機型｜紙翼圖鑑'
      : activeDifficultyLabel
        ? `${activeDifficultyLabel}機型圖鑑｜紙翼圖鑑`
        : '機型圖鑑｜紙翼圖鑑';
    description = fallbackToCatalog
      ? '找不到指定機型，已回到紙翼圖鑑繼續挑選。'
      : activeDifficultyLabel
        ? `聚焦 ${activeDifficultyLabel} 難度的紙飛機紙樣卡，挑一張適合今天節奏的紙翼。`
      : '翻閱八張紙飛機紙樣卡，依難度挑選今日要練習的摺法。';
    content = `
      ${fallbackToCatalog ? '<div class="notice-strip paper-panel" role="status">找不到指定機型，先回到圖鑑挑一張新的紙樣卡吧。</div>' : ''}
      ${renderCatalog({ planes: safePlanes, favorites: favoriteSet, activeDifficulty })}
    `;
  }

  if (effectiveRoute.page === 'about') {
    title = '關於紙翼圖鑑';
    description = '了解紙材、安全提示與紙翼圖鑑的內容使用方式。';
    content = renderAbout();
  }

  if (currentPlane) {
    const safeStepIndex = clampStepIndex(safeRoute.step ?? 0, currentPlane.steps.length);
    const step = currentPlane.steps[safeStepIndex];

    title = `${currentPlane.name}｜紙翼圖鑑教學`;
    description = `${currentPlane.summary} 第 ${safeStepIndex + 1} 步：${step.instruction}`;
    content = renderGuide({
      plane: currentPlane,
      stepIndex: safeStepIndex,
      favorites: favoriteSet,
    });
  }

  return {
    title,
    description,
    html: `
      <div class="app-shell" data-theme="${escapeHtml(theme ?? 'forest')}" data-page="${escapeHtml(effectiveRoute.page ?? 'home')}">
        ${renderSiteHeader(effectiveRoute, theme ?? 'forest', currentPlane?.id)}
        <main class="site-main">
          ${content}
        </main>
        <footer class="site-footer paper-panel">
          <p class="annotation-label">靜折手記</p>
          <p>八種機型、四個難度，讓每次練習都像回到紙工坊整理標本卡。</p>
        </footer>
      </div>
    `,
  };
}
