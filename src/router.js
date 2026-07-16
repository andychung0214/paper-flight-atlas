const HOME_HASH = '#home';
const CATALOG_HASH = '#catalog';
const ABOUT_HASH = '#about';

const ROUTE_PATTERN = /^[a-z0-9-]+$/;
const STEP_PATTERN = /^\d+$/;

function normalizeHash(hash) {
  if (typeof hash !== 'string') {
    return '';
  }

  return hash.trim().replace(/^#/, '').replace(/^\/+/, '');
}

function parseStep(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 0 ? Math.floor(value) : 0;
  }

  if (typeof value === 'string' && STEP_PATTERN.test(value)) {
    return Number.parseInt(value, 10);
  }

  return 0;
}

export function resolveHash(hash) {
  const normalized = normalizeHash(hash);

  if (!normalized) {
    return {
      route: { page: 'home' },
      recoveryHash: null,
    };
  }

  const parts = normalized.split('/');

  if (parts.length === 1) {
    if (parts[0] === 'home') {
      return {
        route: { page: 'home' },
        recoveryHash: null,
      };
    }

    if (parts[0] === 'catalog') {
      return {
        route: { page: 'catalog' },
        recoveryHash: null,
      };
    }

    if (parts[0] === 'about') {
      return {
        route: { page: 'about' },
        recoveryHash: null,
      };
    }

    return {
      route: { page: 'home' },
      recoveryHash: HOME_HASH,
    };
  }

  if (parts[0] === 'plane' && parts[2] === 'step' && parts.length === 4) {
    const id = parts[1];

    if (!ROUTE_PATTERN.test(id)) {
      return {
        route: { page: 'home' },
        recoveryHash: HOME_HASH,
      };
    }

    return {
      route: {
        page: 'plane',
        id,
        step: parseStep(parts[3]),
      },
      recoveryHash: null,
    };
  }

  return {
    route: { page: 'home' },
    recoveryHash: HOME_HASH,
  };
}

export function parseHash(hash) {
  return resolveHash(hash).route;
}

export function buildHomeHash() {
  return HOME_HASH;
}

export function buildCatalogHash() {
  return CATALOG_HASH;
}

export function buildPlaneHash(id, step = 0) {
  const normalizedStep = parseStep(step);
  return `#plane/${id}/step/${normalizedStep}`;
}

export function buildAboutHash() {
  return ABOUT_HASH;
}
