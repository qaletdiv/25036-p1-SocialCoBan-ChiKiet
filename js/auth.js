const KircleAuth = (function () {
  const STORAGE_KEY = "kircle-user";

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function toTitleCase(str) {
    return String(str || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\p{L}+/gu, function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
  }

  function setUser(user) {
    try {
      const toStore = {
        id: user.id,
        fullName: toTitleCase(user.fullName || user.username || ""),
        email: user.email,
        avatar: user.avatar || "",
        bio: user.bio || "",
        role: user.role || "user",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      return toStore;
    } catch {
      return null;
    }
  }

  function login(email, password) {
    if (typeof KircleMockUsers === "undefined") return null;
    const user = KircleMockUsers.findByEmail(email);
    if (!user || user.password !== password || user.locked) return null;
    return setUser(user);
  }

  function logout() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  function requireAuth(loginPath) {
    const path = loginPath || "pages/auth/login.html";
    const user = getCurrentUser();
    if (!user) {
      window.location.href = path;
      return null;
    }
    return user;
  }

  function redirectIfLoggedIn(basePath) {
    const user = getCurrentUser();
    if (!user) return;
    const base = basePath || "";
    window.location.href = base + "pages/news.html";
  }

  return {
    getCurrentUser,
    setUser,
    login,
    logout,
    requireAuth,
    redirectIfLoggedIn,
  };
})();
