const KircleMockPosts = (function () {
  function getAll() {
    return KircleDB.posts.getAll().filter(function (p) {
      return !p.removed;
    });
  }

  function getById(id) {
    var p = KircleDB.posts.findById(id);
    return p && !p.removed ? p : null;
  }

  function getByAuthorId(authorId) {
    return KircleDB.posts.getAll().filter(function (p) {
      return p.authorId === authorId && !p.removed;
    });
  }

  function add(post) {
    var newPost = {
      id: "p" + Date.now(),
      authorId: post.authorId,
      content: post.content || "",
      media: post.media || [],
      privacy: post.privacy || "public",
      createdAt: new Date().toISOString(),
      likeIds: [],
      commentIds: [],
      shareCount: 0,
      removed: false,
    };
    return KircleDB.posts.add(newPost);
  }

  function update(id, data) {
    return KircleDB.posts.update(id, data);
  }

  function remove(id) {
    return KircleDB.posts.remove(id);
  }

  function toggleLike(postId, userId) {
    return KircleDB.posts.toggleLike(postId, userId);
  }

  return {
    getAll,
    getById,
    getByAuthorId,
    add,
    update,
    remove,
    toggleLike,
  };
})();
