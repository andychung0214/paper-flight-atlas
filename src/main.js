(function registerApp(global) {
  'use strict';

  const namespace = global.PaperFlightAtlas ?? (global.PaperFlightAtlas = {});
  const planes = namespace.data?.planes ?? [];
  const { renderApp } = namespace.render ?? {};
  const { buildCatalogHash, resolveHash } = namespace.router ?? {};
  const { createPreferenceStore } = namespace.storage ?? {};
  namespace.app = namespace.app ?? {};

const THEME_COLORS = Object.freeze({
  forest: '#3d5a4d',
  wine: '#6a3944',
  london: '#36566f',
});

const DIFFICULTY_LABELS = Object.freeze({
  basic: '基礎',
  intermediate: '進階',
  advanced: '困難',
  master: '大師',
});

const mountStates = new WeakMap();

function getLocalStorage(windowRef) {
  try {
    return windowRef?.localStorage;
  } catch {
    return undefined;
  }
}

function replaceLocationHash(windowRef, hash) {
  if (!hash) {
    return;
  }

  try {
    if (windowRef?.location?.hash === hash) {
      return;
    }

    if (typeof windowRef?.history?.replaceState === 'function') {
      windowRef.history.replaceState(null, '', hash);

      if (windowRef.location?.hash !== hash) {
        windowRef.location.hash = hash;
      }

      return;
    }

    if (windowRef?.location) {
      windowRef.location.hash = hash;
    }
  } catch {
    try {
      if (windowRef?.location) {
        windowRef.location.hash = hash;
      }
    } catch {
      // 即使無法替換網址，已產生的備援內容仍可操作。
    }
  }
}

function setMetaContent(documentRef, selector, value) {
  const node = documentRef?.querySelector?.(selector);

  if (node) {
    node.content = value;
  }
}

function updateMetadata(documentRef, title, description, theme) {
  if (typeof documentRef?.title === 'string' || typeof documentRef?.title === 'undefined') {
    documentRef.title = title;
  }

  setMetaContent(documentRef, 'meta[name="description"]', description);
  setMetaContent(documentRef, 'meta[property="og:title"]', title);
  setMetaContent(documentRef, 'meta[property="og:description"]', description);
  setMetaContent(documentRef, 'meta[name="twitter:title"]', title);
  setMetaContent(documentRef, 'meta[name="twitter:description"]', description);
  setMetaContent(documentRef, 'meta[name="theme-color"]', THEME_COLORS[theme] ?? THEME_COLORS.forest);
}

function updateLiveRegion(documentRef, message) {
  const liveRegion = documentRef?.getElementById?.('live-region');

  if (liveRegion) {
    liveRegion.textContent = message;
  }
}

function restoreFocus(documentRef, focusKey) {
  if (!focusKey) {
    return;
  }

  documentRef?.querySelector?.(`[data-focus-key="${focusKey}"]`)?.focus?.();
}

function getState(documentRef, windowRef) {
  const existing = mountStates.get(documentRef);

  if (existing) {
    return existing;
  }

  const nextState = {
    activeDifficulty: null,
    pendingFocusKey: null,
    preferences: createPreferenceStore(getLocalStorage(windowRef)),
  };

  mountStates.set(documentRef, nextState);
  return nextState;
}

function renderCurrentRoute(documentRef, windowRef, state, announcement, focusKey) {
  const appRoot = documentRef?.getElementById?.('app');

  if (!appRoot) {
    return;
  }

  const { route, recoveryHash } = resolveHash(windowRef?.location?.hash);
  const theme = state.preferences.getTheme();
  const favorites = state.preferences.getFavorites();
  const activeDifficulty = route.page === 'catalog' ? state.activeDifficulty : null;
  const rendered = renderApp({
    route,
    planes,
    theme,
    favorites,
    activeDifficulty,
  });

  replaceLocationHash(
    windowRef,
    recoveryHash ?? (route.page === 'plane' && rendered.page === 'catalog' ? buildCatalogHash() : null),
  );

  appRoot.innerHTML = rendered.html;
  restoreFocus(documentRef, focusKey);

  if (documentRef?.documentElement?.dataset) {
    documentRef.documentElement.dataset.theme = theme;
    documentRef.documentElement.dataset.page = rendered.page ?? route.page ?? 'home';
  }

  updateMetadata(documentRef, rendered.title, rendered.description, theme);
  updateLiveRegion(documentRef, announcement ?? `${rendered.title} 已更新`);
}

function navigateToHash(windowRef, hash, rerender, focusKey) {
  if (!hash || !windowRef?.location) {
    rerender(undefined, focusKey);
    return false;
  }

  if (windowRef.location.hash === hash) {
    rerender(undefined, focusKey);
    return false;
  }

  windowRef.location.hash = hash;
  return true;
}

function openDiagramDialog(documentRef, state, opener) {
  const dialog = documentRef.querySelector?.('[data-diagram-dialog]');

  if (!dialog) {
    return;
  }

  state.dialogOpener = opener;

  try {
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.setAttribute?.('open', '');
    }
  } catch {
    dialog.setAttribute?.('open', '');
  }
}

function closeDiagramDialog(dialog, state) {
  if (!dialog) {
    return;
  }

  try {
    if (typeof dialog.close === 'function' && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute?.('open');
    }
  } catch {
    dialog.removeAttribute?.('open');
  }

  const opener = state.dialogOpener;
  state.dialogOpener = null;
  opener?.focus?.();
}

function bindInteractions(documentRef, windowRef, state) {
  const rerender = (message, focusKey) => renderCurrentRoute(documentRef, windowRef, state, message, focusKey);

  documentRef.addEventListener('click', event => {
    const actionTarget = event.target?.closest?.('[data-action]');

    if (!actionTarget || actionTarget.disabled) {
      return;
    }

    event.preventDefault?.();

    switch (actionTarget.dataset.action) {
      case 'skip': {
        documentRef.getElementById?.('app')?.focus?.();
        return;
      }

      case 'open-diagram': {
        openDiagramDialog(documentRef, state, actionTarget);
        return;
      }

      case 'close-diagram': {
        closeDiagramDialog(documentRef.querySelector?.('[data-diagram-dialog]'), state);
        return;
      }

      case 'navigate':
      case 'step': {
        if (actionTarget.dataset.hash !== '#catalog') {
          state.activeDifficulty = null;
        }

        state.pendingFocusKey = actionTarget.dataset.focusKey ?? null;
        const hashChanged = navigateToHash(windowRef, actionTarget.dataset.hash, rerender, state.pendingFocusKey);
        if (!hashChanged) {
          state.pendingFocusKey = null;
        }
        return;
      }

      case 'favorite': {
        if (actionTarget.dataset.planeId) {
          state.preferences.toggleFavorite(actionTarget.dataset.planeId);
        }

        rerender(undefined, actionTarget.dataset.focusKey);
        return;
      }

      case 'theme': {
        const nextTheme = state.preferences.setTheme(actionTarget.dataset.theme);
        rerender(
          `主題已切換為 ${nextTheme === 'forest' ? '森林綠' : nextTheme === 'wine' ? '酒紅色' : '倫敦藍'}`,
          actionTarget.dataset.focusKey,
        );
        return;
      }

      case 'filter': {
        const difficulty = actionTarget.dataset.difficulty ?? '';

        state.activeDifficulty = state.activeDifficulty === difficulty ? null : difficulty;
        rerender(
          state.activeDifficulty
            ? `已套用 ${DIFFICULTY_LABELS[state.activeDifficulty] ?? '目前'} 篩選`
            : '已清除難度篩選',
          actionTarget.dataset.focusKey,
        );
        return;
      }

      default:
        break;
    }
  });

  documentRef.addEventListener('cancel', event => {
    const dialog = event.target?.closest?.('[data-diagram-dialog]');

    if (!dialog) {
      return;
    }

    event.preventDefault?.();
    closeDiagramDialog(dialog, state);
  }, true);

  windowRef.addEventListener('hashchange', () => {
    const focusKey = state.pendingFocusKey;
    state.pendingFocusKey = null;
    rerender(undefined, focusKey);
  });
}

  function mountApp(documentRef = document, windowRef = window) {
    const appRoot = documentRef?.getElementById?.('app');

  if (!appRoot) {
    return;
  }

  const state = getState(documentRef, windowRef);

  if (!state.isBound) {
    bindInteractions(documentRef, windowRef, state);
    state.isBound = true;
  }

    renderCurrentRoute(documentRef, windowRef, state);
  }

  function reportBrowserTestContract(documentRef, windowRef) {
    var search = windowRef?.location?.search ?? '';

    if (!search.includes('paper-flight-atlas-test=1') || windowRef?.parent === windowRef) {
      return;
    }

    try {
      var entryScripts = Array.prototype.slice.call(documentRef.querySelectorAll('script[src]'));
      var productSchema = documentRef.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
      var productData = null;

      try {
        productData = JSON.parse(productSchema);
      } catch {
        productData = null;
      }

      windowRef.parent.postMessage({
        type: 'paper-flight-atlas-entry-contract',
        contract: {
          lang: documentRef.documentElement?.lang ?? '',
          hasViewport: Boolean(documentRef.querySelector('meta[name="viewport"]')),
          hasDescription: Boolean(documentRef.querySelector('meta[name="description"]')),
          hasCanonical: Boolean(documentRef.querySelector('link[rel="canonical"]')),
          hasOgTitle: Boolean(documentRef.querySelector('meta[property="og:title"]')),
          hasOgDescription: Boolean(documentRef.querySelector('meta[property="og:description"]')),
          hasTwitterCard: Boolean(documentRef.querySelector('meta[name="twitter:card"]')),
          hasProductSchema: productData?.['@type'] === 'Product',
          hasSkipLink: Boolean(documentRef.querySelector('a[href="#app"][data-action="skip"]')),
          hasAppRoot: Boolean(documentRef.querySelector('main#app[data-app-root][tabindex="-1"]')),
          scriptSources: entryScripts.map(script => script.getAttribute('src')),
          scriptTypes: entryScripts.map(script => script.getAttribute('type') || ''),
          hasNamespace: Boolean(windowRef.PaperFlightAtlas),
          hasRenderedApp: Boolean(documentRef.querySelector('#app .app-shell')),
        },
      }, '*');
    } catch {
      // 測試橋接失敗不應影響正式入口的互動功能。
    }
  }

  namespace.app.mountApp = mountApp;

  if (typeof document !== 'undefined' && typeof window !== 'undefined' && document.querySelector('[data-app-root]')) {
    mountApp(document, window);
    reportBrowserTestContract(document, window);
  }
}(window));
