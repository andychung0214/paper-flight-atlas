import { planes } from './data/planes.js';
import { renderApp } from './render.js';
import { buildCatalogHash, resolveHash } from './router.js';
import { createPreferenceStore } from './storage.js';

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

function getState(documentRef, windowRef) {
  const existing = mountStates.get(documentRef);

  if (existing) {
    return existing;
  }

  const nextState = {
    activeDifficulty: null,
    preferences: createPreferenceStore(getLocalStorage(windowRef)),
  };

  mountStates.set(documentRef, nextState);
  return nextState;
}

function renderCurrentRoute(documentRef, windowRef, state, announcement) {
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

  if (documentRef?.documentElement?.dataset) {
    documentRef.documentElement.dataset.theme = theme;
    documentRef.documentElement.dataset.page = rendered.page ?? route.page ?? 'home';
  }

  updateMetadata(documentRef, rendered.title, rendered.description, theme);
  updateLiveRegion(documentRef, announcement ?? `${rendered.title} 已更新`);
}

function navigateToHash(windowRef, hash, rerender) {
  if (!hash || !windowRef?.location) {
    rerender();
    return;
  }

  if (windowRef.location.hash === hash) {
    rerender();
    return;
  }

  windowRef.location.hash = hash;
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
  const rerender = message => renderCurrentRoute(documentRef, windowRef, state, message);

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

        navigateToHash(windowRef, actionTarget.dataset.hash, rerender);
        return;
      }

      case 'favorite': {
        if (actionTarget.dataset.planeId) {
          state.preferences.toggleFavorite(actionTarget.dataset.planeId);
        }

        rerender();
        return;
      }

      case 'theme': {
        const nextTheme = state.preferences.setTheme(actionTarget.dataset.theme);
        rerender(`主題已切換為 ${nextTheme === 'forest' ? '森林綠' : nextTheme === 'wine' ? '酒紅色' : '倫敦藍'}`);
        return;
      }

      case 'filter': {
        const difficulty = actionTarget.dataset.difficulty ?? '';

        state.activeDifficulty = state.activeDifficulty === difficulty ? null : difficulty;
        rerender(
          state.activeDifficulty
            ? `已套用 ${DIFFICULTY_LABELS[state.activeDifficulty] ?? '目前'} 篩選`
            : '已清除難度篩選',
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
    rerender();
  });
}

export function mountApp(documentRef = document, windowRef = window) {
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

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  mountApp(document, window);
}
