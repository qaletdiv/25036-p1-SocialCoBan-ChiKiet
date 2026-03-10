const KircleMockNotifications = (function () {
  function getByUserId(userId) {
    return KircleDB.notifications
      .getAll()
      .filter(function (n) {
        return n.userId === userId;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function getUnreadCount(userId) {
    return KircleDB.notifications.getAll().filter(function (n) {
      return n.userId === userId && !n.read;
    }).length;
  }

  function markRead(id) {
    return KircleDB.notifications.update(id, { read: true });
  }

  function add(notification) {
    var newN = {
      id: "n" + Date.now(),
      userId: notification.userId,
      type: notification.type,
      refId: notification.refId || "",
      fromUserId: notification.fromUserId || "",
      read: false,
      createdAt: new Date().toISOString(),
    };
    return KircleDB.notifications.add(newN);
  }

  return {
    getByUserId,
    getUnreadCount,
    markRead,
    add,
  };
})();
