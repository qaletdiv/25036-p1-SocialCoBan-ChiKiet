const KircleDB = (function () {
  var KEYS = {
    seeded: "kircle_db_seeded",
    users: "kircle_db_users",
    posts: "kircle_db_posts",
    notifications: "kircle_db_notifications",
    comments: "kircle_db_comments",
  };

  var SEED_USERS = [
    {
      id: "u1",
      username: "alice",
      fullName: "Alice Nguyễn",
      email: "alice@kircle.demo",
      phone: "0901234561",
      password: "12345",
      avatar: "",
      bio: "Hello from Alice.",
      role: "user",
      status: "Hoạt động",
      createdAt: "2024-01-15T10:00:00Z",
      friendIds: ["u2", "u3"],
      followerIds: ["u4"],
      followingIds: ["u2", "u3"],
      blockedIds: [],
      locked: false,
    },
    {
      id: "u2",
      username: "bob",
      fullName: "Bob Trần",
      email: "bob@kircle.demo",
      phone: "0901234562",
      password: "12345",
      avatar: "",
      bio: "Bob here.",
      role: "user",
      status: "Hoạt động",
      createdAt: "2024-01-16T10:00:00Z",
      friendIds: ["u1", "u3"],
      followerIds: [],
      followingIds: ["u1"],
      blockedIds: [],
      locked: false,
    },
    {
      id: "u3",
      username: "carol",
      fullName: "Carol Lê",
      email: "carol@kircle.demo",
      phone: "0901234563",
      password: "12345",
      avatar: "",
      bio: "Carol.",
      role: "user",
      status: "Hoạt động",
      createdAt: "2024-01-17T10:00:00Z",
      friendIds: ["u1", "u2"],
      followerIds: ["u1"],
      followingIds: ["u1", "u2"],
      blockedIds: [],
      locked: false,
    },
    {
      id: "u4",
      username: "admin",
      fullName: "Admin",
      email: "admin@kircle.demo",
      phone: "0901234565",
      password: "12345",
      avatar: "",
      bio: "Admin.",
      role: "admin",
      status: "Hoạt động",
      createdAt: "2024-01-01T10:00:00Z",
      friendIds: [],
      followerIds: [],
      followingIds: [],
      blockedIds: [],
      locked: false,
    },
  ];

  var SEED_POSTS = [
    {
      id: "p1",
      authorId: "u1",
      content: "Hello Kircle! First post here.",
      media: [],
      privacy: "public",
      createdAt: "2024-02-01T12:00:00Z",
      likeIds: ["u2", "u3"],
      commentIds: ["c1", "c2"],
      shareCount: 0,
      removed: false,
    },
    {
      id: "p2",
      authorId: "u2",
      content: "Having a great day. What are you building?",
      media: [],
      privacy: "public",
      createdAt: "2024-02-02T09:00:00Z",
      likeIds: ["u1"],
      commentIds: [],
      shareCount: 1,
      removed: false,
    },
    {
      id: "p3",
      authorId: "u1",
      content: "Photo from the weekend.",
      media: ["https://picsum.photos/600/400"],
      privacy: "followers",
      createdAt: "2024-02-03T14:00:00Z",
      likeIds: [],
      commentIds: [],
      shareCount: 0,
      removed: false,
    },
  ];

  var SEED_COMMENTS = [
    {
      id: "c1",
      postId: "p1",
      authorId: "u2",
      content: "Chào Alice! Bài viết hay lắm.",
      createdAt: "2024-02-01T13:00:00Z",
    },
    {
      id: "c2",
      postId: "p1",
      authorId: "u3",
      content: "Mình cũng mới tham gia, rất vui được kết bạn!",
      createdAt: "2024-02-01T14:00:00Z",
    },
  ];

  var SEED_NOTIFICATIONS = [
    {
      id: "n1",
      userId: "u1",
      type: "like",
      refId: "p1",
      fromUserId: "u2",
      read: false,
      createdAt: "2024-02-02T10:00:00Z",
    },
    {
      id: "n2",
      userId: "u1",
      type: "comment",
      refId: "p1",
      fromUserId: "u3",
      read: false,
      createdAt: "2024-02-02T11:00:00Z",
    },
  ];

  function _read(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (_) {
      return [];
    }
  }

  function _write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (_) {}
  }

  function init() {
    var seeded = localStorage.getItem(KEYS.seeded) === "1";
    var hasUsers = _read(KEYS.users).length > 0;
    if (seeded && hasUsers) return;
    if (_read(KEYS.users).length === 0) _write(KEYS.users, SEED_USERS);
    if (_read(KEYS.posts).length === 0) _write(KEYS.posts, SEED_POSTS);
    if (_read(KEYS.notifications).length === 0) _write(KEYS.notifications, SEED_NOTIFICATIONS);
    if (_read(KEYS.comments).length === 0) _write(KEYS.comments, SEED_COMMENTS);
    localStorage.setItem(KEYS.seeded, "1");
  }

  var users = {
    getAll: function () {
      return _read(KEYS.users);
    },

    findById: function (id) {
      return (
        _read(KEYS.users).find(function (u) {
          return u.id === id;
        }) || null
      );
    },

    findByEmail: function (email) {
      var lower = String(email).toLowerCase();
      return (
        _read(KEYS.users).find(function (u) {
          return u.email.toLowerCase() === lower;
        }) || null
      );
    },

    findByUsername: function (username) {
      var lower = String(username).toLowerCase();
      return (
        _read(KEYS.users).find(function (u) {
          return u.username.toLowerCase() === lower;
        }) || null
      );
    },

    add: function (user) {
      var list = _read(KEYS.users);
      list.push(user);
      _write(KEYS.users, list);
      return user;
    },

    update: function (id, data) {
      var list = _read(KEYS.users);
      var idx = list.findIndex(function (u) {
        return u.id === id;
      });
      if (idx === -1) return null;
      Object.keys(data).forEach(function (k) {
        if (k !== "id" && k !== "password" && data[k] !== undefined) {
          list[idx][k] = data[k];
        }
      });
      _write(KEYS.users, list);
      return list[idx];
    },

    follow: function (followerId, targetId) {
      if (followerId === targetId) return false;
      var list = _read(KEYS.users);
      var fIdx = list.findIndex(function (u) { return u.id === followerId; });
      var tIdx = list.findIndex(function (u) { return u.id === targetId; });
      if (fIdx === -1 || tIdx === -1) return false;
      if (!Array.isArray(list[fIdx].followingIds)) list[fIdx].followingIds = [];
      if (!Array.isArray(list[tIdx].followerIds)) list[tIdx].followerIds = [];
      if (list[fIdx].followingIds.indexOf(targetId) === -1) list[fIdx].followingIds.push(targetId);
      if (list[tIdx].followerIds.indexOf(followerId) === -1) list[tIdx].followerIds.push(followerId);
      _write(KEYS.users, list);
      return true;
    },

    unfollow: function (followerId, targetId) {
      var list = _read(KEYS.users);
      var fIdx = list.findIndex(function (u) { return u.id === followerId; });
      var tIdx = list.findIndex(function (u) { return u.id === targetId; });
      if (fIdx === -1 || tIdx === -1) return false;
      list[fIdx].followingIds = (list[fIdx].followingIds || []).filter(function (id) { return id !== targetId; });
      list[tIdx].followerIds = (list[tIdx].followerIds || []).filter(function (id) { return id !== followerId; });
      _write(KEYS.users, list);
      return true;
    },

    isFollowing: function (followerId, targetId) {
      var u = this.findById(followerId);
      return !!(u && u.followingIds && u.followingIds.indexOf(targetId) !== -1);
    },
  };

  var posts = {
    getAll: function () {
      return _read(KEYS.posts);
    },

    findById: function (id) {
      return (
        _read(KEYS.posts).find(function (p) {
          return p.id === id;
        }) || null
      );
    },

    add: function (post) {
      var list = _read(KEYS.posts);
      list.push(post);
      _write(KEYS.posts, list);
      return post;
    },

    update: function (id, data) {
      var list = _read(KEYS.posts);
      var idx = list.findIndex(function (p) {
        return p.id === id;
      });
      if (idx === -1) return null;
      var ALLOWED = ["content", "media", "privacy", "likeIds", "commentIds", "shareCount", "removed"];
      ALLOWED.forEach(function (k) {
        if (data[k] !== undefined) list[idx][k] = data[k];
      });
      _write(KEYS.posts, list);
      return list[idx];
    },

    remove: function (id) {
      var list = _read(KEYS.posts);
      var idx = list.findIndex(function (p) {
        return p.id === id;
      });
      if (idx === -1) return false;
      list[idx].removed = true;
      _write(KEYS.posts, list);
      return true;
    },

    toggleLike: function (postId, userId) {
      var list = _read(KEYS.posts);
      var idx = list.findIndex(function (p) {
        return p.id === postId;
      });
      if (idx === -1) return false;
      var likeIdx = list[idx].likeIds.indexOf(userId);
      if (likeIdx === -1) {
        list[idx].likeIds.push(userId);
      } else {
        list[idx].likeIds.splice(likeIdx, 1);
      }
      _write(KEYS.posts, list);
      return true;
    },
  };

  var notifications = {
    getAll: function () {
      return _read(KEYS.notifications);
    },

    add: function (notification) {
      var list = _read(KEYS.notifications);
      list.push(notification);
      _write(KEYS.notifications, list);
      return notification;
    },

    update: function (id, data) {
      var list = _read(KEYS.notifications);
      var idx = list.findIndex(function (n) {
        return n.id === id;
      });
      if (idx === -1) return null;
      Object.keys(data).forEach(function (k) {
        if (data[k] !== undefined) list[idx][k] = data[k];
      });
      _write(KEYS.notifications, list);
      return list[idx];
    },
  };

  var comments = {
    getAll: function () {
      return _read(KEYS.comments);
    },

    getByPostId: function (postId) {
      return _read(KEYS.comments)
        .filter(function (c) {
          return c.postId === postId && !c.removed;
        })
        .sort(function (a, b) {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
    },

    findById: function (id) {
      return (
        _read(KEYS.comments).find(function (c) {
          return c.id === id;
        }) || null
      );
    },

    add: function (comment) {
      var list = _read(KEYS.comments);
      list.push(comment);
      _write(KEYS.comments, list);
      return comment;
    },

    remove: function (id) {
      var list = _read(KEYS.comments);
      var idx = list.findIndex(function (c) {
        return c.id === id;
      });
      if (idx === -1) return false;
      list[idx].removed = true;
      _write(KEYS.comments, list);
      return true;
    },
  };

  return {
    init: init,
    users: users,
    posts: posts,
    notifications: notifications,
    comments: comments,
  };
})();
