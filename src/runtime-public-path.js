/* global __webpack_public_path__ */

if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined' && typeof document !== 'undefined') {
  const APP_SCRIPT_PATTERN = /\/js\/app\.js(?:\?.*)?$/;
  const hasTrailingSlash = (value) => value.charAt(value.length - 1) === '/';

  const normalizeBaseUrl = (value) => {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    return hasTrailingSlash(trimmed) ? trimmed : `${trimmed}/`;
  };

  const extractBaseFromScript = (scriptLike) => {
    const source = scriptLike && typeof scriptLike.src === 'string' ? scriptLike.src : '';
    if (!APP_SCRIPT_PATTERN.test(source)) {
      return null;
    }

    return normalizeBaseUrl(source.replace(APP_SCRIPT_PATTERN, '/'));
  };

  const resolveAssetBase = () => {
    const currentScriptBase = extractBaseFromScript(document.currentScript);
    if (currentScriptBase) {
      return currentScriptBase;
    }

    const scripts = document.getElementsByTagName('script');
    for (let index = scripts.length - 1; index >= 0; index -= 1) {
      const candidateBase = extractBaseFromScript(scripts[index]);
      if (candidateBase) {
        return candidateBase;
      }
    }

    const fallbackBase = normalizeBaseUrl(window.__CRYSTAL_ASSET_BASE__);
    if (fallbackBase) {
      return fallbackBase;
    }

    const locationOrigin = window.location.origin || `${window.location.protocol}//${window.location.host}`;
    return normalizeBaseUrl(locationOrigin || '/');
  };

  const assetBase = resolveAssetBase();
  if (assetBase) {
    __webpack_public_path__ = assetBase;
    window.__CRYSTAL_ASSET_BASE__ = assetBase;
  }
}
