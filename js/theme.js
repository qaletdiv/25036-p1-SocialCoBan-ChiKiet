(() => {
  const STORAGE_KEY = "kircle-theme";
  const THEMES = new Set(["light", "dark"]);

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
    }
  }

  function getSystemTheme() {
    try {
      return globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
    } catch {
      return "light";
    }
  }

  function normalizeTheme(theme) {
    return THEMES.has(theme) ? theme : null;
  }

  function getTheme() {
    return normalizeTheme(document.documentElement.dataset.theme) || "light";
  }

  function setTheme(theme, options = {}) {
    const normalized = normalizeTheme(theme);
    const next = normalized ?? "light";
    applyTheme(next);

    const persist = options.persist !== false;
    if (persist) storeTheme(next);

    return next;
  }

  function toggleTheme(options = {}) {
    const next = getTheme() === "dark" ? "light" : "dark";
    return setTheme(next, options);
  }

  function initTheme() {
    const stored = normalizeTheme(getStoredTheme());
    if (stored) {
      applyTheme(stored);
      return stored;
    }

    const sys = getSystemTheme();
    applyTheme(sys);
    return sys;
  }

  initTheme();

  globalThis.KircleTheme = {
    initTheme,
    setTheme,
    getTheme,
    toggleTheme,
  };
})();
