const KircleMockReports = (function () {
  var STORAGE_KEY = "kircle-reports";

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function _save(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  function getAll() {
    return _load();
  }

  function getPending() {
    return _load().filter(function (r) { return !r.dismissed; });
  }

  function hasReported(postId, userId) {
    return _load().some(function (r) {
      return r.postId === postId && r.reportedBy === userId;
    });
  }

  function add(data) {
    var list = _load();
    var report = {
      id: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
      postId: data.postId,
      reportedBy: data.reportedBy,
      reason: data.reason || "",
      createdAt: new Date().toISOString(),
    };
    list.push(report);
    _save(list);
    return report;
  }

  function removeById(id) {
    _save(_load().filter(function (r) { return r.id !== id; }));
  }

  function removeByPostId(postId) {
    _save(_load().filter(function (r) { return r.postId !== postId; }));
  }

  return { getAll, getPending, hasReported, add, removeById, removeByPostId };
})();
