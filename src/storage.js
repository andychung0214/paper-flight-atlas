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

export function createPreferenceStore(storage) {
  return {
    getTheme() {
      return normalizeTheme(getStorageValue(storage, THEME_KEY));
    },

    setTheme(theme) {
      const nextTheme = normalizeTheme(theme);
      return setStorageValue(storage, THEME_KEY, nextTheme) ? nextTheme : 'forest';
    },

    getFavorites() {
      return readFavorites(storage);
    },

    isFavorite(id) {
      return readFavorites(storage).includes(id);
    },

    toggleFavorite(id) {
      const favorites = readFavorites(storage);
      const nextFavorites = favorites.includes(id)
        ? favorites.filter(item => item !== id)
        : [...favorites, id];

      return writeFavorites(storage, nextFavorites) ? nextFavorites : [];
    },
  };
}
