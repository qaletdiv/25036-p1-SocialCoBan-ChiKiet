const KircleRouter = (function () {
  function getRedirectForRole(role) {
    if (role === "admin") return "pages/news.html";
    if (role === "moderator") return "pages/news.html";
    return "pages/news.html";
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getQueryParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  }

  return {
    getRedirectForRole,
    getQueryParam,
    getQueryParams,
  };
})();
