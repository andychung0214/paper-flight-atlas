(function registerStorage(global) {
  'use strict';

  const namespace = global.PaperFlightAtlas ?? (global.PaperFlightAtlas = {});
  namespace.storage = namespace.storage ?? {};

  const THEME_KEY = 'paper-flight-atlas.theme';
const FAVORITES_KEY = 'paper-flight-atlas.favorites';
const ALLOWED_THEMES = new Set(['forest', 'wine', 'london']);

function getStorageValue(storage, key) {
  try {
    return storage?.getItem?.(key) ?? null;
  } catch {
    return null;
  }
}

function setStorageValue(storage, key, value) {
  try {
    storage?.setItem?.(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorageValue(storage, key) {
  try {
    storage?.removeItem?.(key);
    return true;
  } catch {
    return false;
  }
}

function normalizeTheme(theme) {
  return ALLOWED_THEMES.has(theme) ? theme : 'forest';
}

function readFavorites(storage) {
  const raw = getStorageValue(storage, FAVORITES_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(item => typeof item === 'string' && item.length > 0);
  } catch {
    return [];
  }
}

function writeFavorites(storage, favorites) {
  if (favorites.length === 0) {
    return removeStorageValue(storage, FAVORITES_KEY);
  }

  return setStorageValue(storage, FAVORITES_KEY, JSON.stringify(favorites));
}

  function createPreferenceStore(storage) {
    let theme = normalizeTheme(getStorageValue(storage, THEME_KEY));
    let favorites = readFavorites(storage);

    return {
      getTheme() {
        return theme;
      },

      setTheme(nextTheme) {
        theme = normalizeTheme(nextTheme);
        setStorageValue(storage, THEME_KEY, theme);
        return theme;
      },

      getFavorites() {
        return [...favorites];
      },

      isFavorite(id) {
        return favorites.includes(id);
      },

      toggleFavorite(id) {
        favorites = favorites.includes(id)
          ? favorites.filter(item => item !== id)
          : [...favorites, id];

        writeFavorites(storage, favorites);
        return [...favorites];
      },
    };
  }

  namespace.storage.createPreferenceStore = createPreferenceStore;
}(window));
