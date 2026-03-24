const KircleMockUsers = (function () {
  function findByEmail(email) {
    return KircleDB.users.findByEmail(email);
  }

  function findById(id) {
    return KircleDB.users.findById(id);
  }

  function findByUsername(username) {
    return KircleDB.users.findByUsername(username);
  }

  function getAll() {
    return KircleDB.users.getAll();
  }

  function update(id, data) {
    return KircleDB.users.update(id, data);
  }

  function register(data) {
    if (findByEmail(data.email)) return null;
    var ts = Date.now();
    var newUser = {
      id: "u" + ts,
      username: data.email.split("@")[0] + ts,
      fullName: data.fullName || "",
      email: data.email,
      phone: data.phone || "",
      password: data.password,
      avatar: "",
      bio: "",
      role: "user",
      status: "Hoạt động",
      createdAt: new Date().toISOString(),
      friendIds: [],
      followerIds: [],
      followingIds: [],
      blockedIds: [],
      locked: false,
    };
    return KircleDB.users.add(newUser);
  }

  function follow(followerId, targetId) {
    return KircleDB.users.follow(followerId, targetId);
  }

  function unfollow(followerId, targetId) {
    return KircleDB.users.unfollow(followerId, targetId);
  }

  function isFollowing(followerId, targetId) {
    return KircleDB.users.isFollowing(followerId, targetId);
  }

  return {
    findByEmail,
    findById,
    findByUsername,
    getAll,
    update,
    register,
    follow,
    unfollow,
    isFollowing,
  };
})();
