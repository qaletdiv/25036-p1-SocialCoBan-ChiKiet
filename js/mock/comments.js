const KircleMockComments = (function () {
  function getByPostId(postId) {
    return KircleDB.comments.getByPostId(postId);
  }

  function add(data) {
    var newComment = {
      id: "c" + Date.now(),
      postId: data.postId,
      authorId: data.authorId,
      content: data.content || "",
      createdAt: new Date().toISOString(),
      removed: false,
    };
    return KircleDB.comments.add(newComment);
  }

  function remove(id) {
    return KircleDB.comments.remove(id);
  }

  return {
    getByPostId,
    add,
    remove,
  };
})();
