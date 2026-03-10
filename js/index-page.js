(function () {
  if (typeof KircleAuth !== "undefined" && KircleAuth.getCurrentUser()) {
    var path = KircleRouter.getRedirectForRole(KircleAuth.getCurrentUser().role);
    window.location.href = path;
  }
})();

