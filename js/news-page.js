(function () {
  var user = KircleAuth.requireAuth("auth/login.html");
  if (!user) return;

  var openComments = {};
  var CONTENT_LIMIT = 200;

  function closePostMenu() {
    var existing = document.querySelector(".kircle-post-dropdown");
    if (existing) existing.remove();
  }

  document.addEventListener("click", closePostMenu);

  function showConfirm(opts) {
    var old = document.getElementById("kircle-confirm-modal");
    if (old) old.remove();

    var overlay = document.createElement("div");
    overlay.id = "kircle-confirm-modal";
    overlay.className = "kircle-confirm-overlay";
    overlay.innerHTML =
      '<div class="kircle-confirm-box" role="dialog" aria-modal="true">' +
        '<p class="kircle-confirm-title">' + (opts.title || "") + '</p>' +
        (opts.desc ? '<p class="kircle-confirm-desc">' + opts.desc + '</p>' : '') +
        '<div class="kircle-confirm-actions">' +
          '<button type="button" class="kircle-btn kircle-btn-secondary kircle-btn-sm" id="kircle-confirm-cancel">Hủy</button>' +
          '<button type="button" class="kircle-btn kircle-btn-danger kircle-btn-sm" id="kircle-confirm-ok">' + (opts.okLabel || "Xác nhận") + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    setTimeout(function () { overlay.classList.add("kircle-confirm-visible"); }, 16);

    function close() {
      overlay.classList.remove("kircle-confirm-visible");
      setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 200);
    }

    document.getElementById("kircle-confirm-ok").addEventListener("click", function () {
      close();
      opts.onOk();
    });
    document.getElementById("kircle-confirm-cancel").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.getElementById("kircle-confirm-ok").focus();
  }

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getInitials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || "?").toUpperCase();
  }

  function buildPostAvatar(author) {
    var name = author.fullName || author.username || "User";
    var avatar = author.avatar || "";
    if (avatar) {
      return (
        '<img class="kircle-post-avatar" src="' + escHtml(avatar) + '" alt="' + escHtml(name) + '" ' +
        'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\';">' +
        '<span class="kircle-post-avatar-placeholder" style="display:none;" aria-hidden="true">' +
        escHtml(getInitials(name)) + '</span>'
      );
    }
    return '<span class="kircle-post-avatar-placeholder" aria-hidden="true">' + escHtml(getInitials(name)) + '</span>';
  }

  function canSeePost(post, currentUserId) {
    var author = KircleMockUsers.findById(post.authorId);
    if (!author) return false;
    if (author.locked && post.authorId !== currentUserId) return false;
    if (post.authorId === currentUserId) return true;
    if (post.privacy === "private") return false;
    if (post.privacy === "public") return true;
    if (post.privacy === "followers") {
      return author.followerIds && author.followerIds.indexOf(currentUserId) !== -1;
    }
    return true;
  }

  function getFeedPosts() {
    var all = KircleMockPosts.getAll();
    return all
      .filter(function (p) {
        return canSeePost(p, user.id);
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function formatDate(iso) {
    var d = new Date(iso);
    var now = new Date();
    var diff = (now - d) / 60000;
    if (diff < 1) return "Vừa xong";
    if (diff < 60) return Math.floor(diff) + " phút trước";
    if (diff < 1440) return Math.floor(diff / 60) + " giờ trước";
    if (diff < 43200) return Math.floor(diff / 1440) + " ngày trước";
    return d.toLocaleDateString("vi-VN");
  }

  function buildCommentAvatarHtml(name, avatar) {
    var initials = getInitials(name);
    if (avatar) {
      return (
        '<img class="kircle-comment-avatar" src="' + escHtml(avatar) + '" alt="" ' +
        'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\';">' +
        '<span class="kircle-post-avatar-placeholder" style="display:none;width:32px;height:32px;font-size:0.75rem;" aria-hidden="true">' +
        escHtml(initials) + '</span>'
      );
    }
    return '<span class="kircle-post-avatar-placeholder" style="width:32px;height:32px;font-size:0.75rem;" aria-hidden="true">' + escHtml(initials) + '</span>';
  }

  function buildCommentHtml(c) {
    var cAuthor = KircleMockUsers.findById(c.authorId);
    var name = cAuthor ? (cAuthor.fullName || cAuthor.username || "User") : "User";
    var avatar = cAuthor ? (cAuthor.avatar || "") : "";
    var isOwn = c.authorId === user.id;
    return (
      '<div class="kircle-comment" data-comment-id="' + c.id + '">' +
      buildCommentAvatarHtml(name, avatar) +
      '<div class="kircle-comment-body">' +
      '<span class="kircle-comment-author">' + escHtml(name) + "</span>" +
      '<p class="kircle-comment-content">' + escHtml(c.content) + "</p>" +
      '<span class="kircle-comment-meta">' + formatDate(c.createdAt) + "</span>" +
      "</div>" +
      (isOwn
        ? '<button type="button" class="kircle-comment-del" data-action="del-comment" data-comment-id="' +
          c.id +
          '" aria-label="Xóa bình luận">×</button>'
        : "") +
      "</div>"
    );
  }

  function buildCommentSectionHtml(post) {
    var comments = KircleMockComments.getByPostId(post.id);
    var listHtml = comments.length
      ? comments.map(buildCommentHtml).join("")
      : '<p class="kircle-comment-empty">Chưa có bình luận nào.</p>';
    var display = openComments[post.id] ? "block" : "none";
    return (
      '<div class="kircle-comments" data-post-id="' + post.id + '" style="display:' + display + ';">' +
      '<div class="kircle-comment-list">' + listHtml + "</div>" +
      '<div class="kircle-comment-compose">' +
      '<img class="kircle-comment-compose-avatar" src="' + escHtml(user.avatar || "") + '" alt="" onerror="this.style.display=\'none\'">' +
      '<div class="kircle-comment-input-row">' +
      '<input type="text" class="kircle-comment-input" placeholder="Viết bình luận..." data-post-id="' + post.id + '" maxlength="500" autocomplete="off">' +
      '<button type="button" class="kircle-btn kircle-btn-primary kircle-btn-sm" data-action="add-comment" data-post-id="' + post.id + '">Gửi</button>' +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function submitComment(postId) {
    var list = document.getElementById("feed-list");
    var section = list.querySelector('.kircle-comments[data-post-id="' + postId + '"]');
    if (!section) return;
    var input = section.querySelector(".kircle-comment-input");
    var content = input.value.trim();
    if (!content) return;

    var comment = KircleMockComments.add({ postId: postId, authorId: user.id, content: content });

    var post = KircleMockPosts.getById(postId);
    if (post) {
      var ids = post.commentIds.slice();
      ids.push(comment.id);
      KircleMockPosts.update(postId, { commentIds: ids });
    }

    var toggleBtn = list.querySelector('[data-action="comment"][data-post-id="' + postId + '"]');
    if (toggleBtn) {
      var currentCount = section.querySelectorAll(".kircle-comment[data-comment-id]").length;
      toggleBtn.textContent = "Bình luận (" + (currentCount + 1) + ")";
    }

    var commentList = section.querySelector(".kircle-comment-list");
    var empty = commentList.querySelector(".kircle-comment-empty");
    if (empty) empty.remove();

    commentList.insertAdjacentHTML("beforeend", buildCommentHtml(comment));
    var newEl = commentList.lastElementChild;

    var delBtn = newEl && newEl.querySelector("[data-action=del-comment]");
    if (delBtn) {
      delBtn.addEventListener("click", function () {
        deleteComment(comment.id, postId, newEl);
      });
    }

    input.value = "";
    input.focus();
    if (newEl) newEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function deleteComment(commentId, postId, commentEl) {
    KircleMockComments.remove(commentId);

    var post = KircleMockPosts.getById(postId);
    if (post) {
      var ids = post.commentIds.filter(function (id) { return id !== commentId; });
      KircleMockPosts.update(postId, { commentIds: ids });
    }

    var list = document.getElementById("feed-list");
    var toggleBtn = list.querySelector('[data-action="comment"][data-post-id="' + postId + '"]');
    if (toggleBtn) {
      var match = toggleBtn.textContent.match(/\d+/);
      var prev = match ? parseInt(match[0], 10) : 1;
      toggleBtn.textContent = "Bình luận (" + Math.max(0, prev - 1) + ")";
    }

    if (commentEl) commentEl.remove();

    var section = list.querySelector('.kircle-comments[data-post-id="' + postId + '"]');
    if (section) {
      var commentListEl = section.querySelector(".kircle-comment-list");
      if (commentListEl && !commentListEl.querySelector(".kircle-comment[data-comment-id]")) {
        commentListEl.innerHTML = '<p class="kircle-comment-empty">Chưa có bình luận nào.</p>';
      }
    }
  }

  function showReportModal(postId, onSubmit) {
    var old = document.getElementById("kircle-report-modal");
    if (old) old.remove();

    var overlay = document.createElement("div");
    overlay.id = "kircle-report-modal";
    overlay.className = "kircle-confirm-overlay";
    overlay.innerHTML =
      '<div class="kircle-confirm-box" role="dialog" aria-modal="true">' +
        '<p class="kircle-confirm-title">Báo cáo bài viết</p>' +
        '<p class="kircle-confirm-desc">Chọn lý do báo cáo bài viết này.</p>' +
        '<select id="kircle-report-reason" class="kircle-select" style="width:100%;margin-bottom:1.25rem;">' +
          '<option value="inappropriate">Nội dung không phù hợp</option>' +
          '<option value="spam">Spam</option>' +
          '<option value="hate">Ngôn từ kích động</option>' +
          '<option value="misinformation">Thông tin sai lệch</option>' +
          '<option value="other">Khác</option>' +
        '</select>' +
        '<div class="kircle-confirm-actions">' +
          '<button type="button" class="kircle-btn kircle-btn-secondary kircle-btn-sm" id="kircle-report-cancel">Hủy</button>' +
          '<button type="button" class="kircle-btn kircle-btn-primary kircle-btn-sm" id="kircle-report-ok">Gửi báo cáo</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    setTimeout(function () { overlay.classList.add("kircle-confirm-visible"); }, 16);

    function close() {
      overlay.classList.remove("kircle-confirm-visible");
      setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 200);
    }

    document.getElementById("kircle-report-ok").addEventListener("click", function () {
      var reason = document.getElementById("kircle-report-reason").value;
      close();
      onSubmit(reason);
    });
    document.getElementById("kircle-report-cancel").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.getElementById("kircle-report-ok").focus();
  }

  function renderPost(post) {
    var author = KircleMockUsers.findById(post.authorId);
    if (!author) return "";
    var isOwner = post.authorId === user.id;
    var isLiked = post.likeIds && post.likeIds.indexOf(user.id) !== -1;
    var likeCount = (post.likeIds && post.likeIds.length) || 0;
    var commentCount = KircleMockComments.getByPostId(post.id).length;

    var mediaHtml = "";
    var rawMedia = Array.isArray(post.media) ? post.media : [];
    rawMedia.forEach(function (url) {
      if (!url || typeof url !== "string") return;
      url = url.trim();
      if (!url) return;
      var safeUrl = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      var ext = (url.split("?")[0].split(".").pop() || "").toLowerCase();
      if (ext === "mp4" || ext === "webm" || url.indexOf("video") !== -1) {
        mediaHtml += '<div class="kircle-post-media"><video src="' + safeUrl + '" controls></video></div>';
      } else {
        mediaHtml += '<div class="kircle-post-media"><img src="' + safeUrl + '" alt=""></div>';
      }
    });

    var privacyLabel =
      { public: "Công khai", followers: "Người theo dõi", private: "Riêng tư" }[post.privacy] ||
      post.privacy;

    var profileUrl = "profile.html?user=" + encodeURIComponent(author.username);
    return (
      '<article class="kircle-post" data-post-id="' + post.id + '">' +
      '<div class="kircle-post-header">' +
      '<a href="' + profileUrl + '" class="kircle-post-author-link">' +
      buildPostAvatar(author) +
      '</a>' +
      '<div class="kircle-post-author-wrap">' +
      '<a href="' + profileUrl + '" class="kircle-post-author-name-link">' +
      '<span class="kircle-post-author-name">' + escHtml(author.fullName || author.username || "User") + "</span>" +
      '</a>' +
      '<div class="kircle-post-meta">' + formatDate(post.createdAt) + " · " + privacyLabel + "</div>" +
      "</div>" +
      '<div class="kircle-post-actions-wrap"><button type="button" class="kircle-post-menu-btn" data-action="menu" data-post-id="' +
      post.id + '" data-is-owner="' + (isOwner ? "1" : "0") + '" aria-label="Menu">⋯</button></div>' +
      "</div>" +
      '<div class="kircle-post-body">' +
      (post.content
        ? (post.content.length > CONTENT_LIMIT
          ? '<p class="kircle-post-content">' +
              '<span class="kircle-excerpt-short">' + escHtml(post.content.slice(0, CONTENT_LIMIT)) + '… ' +
                '<button type="button" class="kircle-excerpt-toggle" data-action="expand-post">Xem thêm</button>' +
              '</span>' +
              '<span class="kircle-excerpt-full" style="display:none;">' + escHtml(post.content) + ' ' +
                '<button type="button" class="kircle-excerpt-toggle" data-action="collapse-post">Ẩn bớt</button>' +
              '</span>' +
            '</p>'
          : '<p class="kircle-post-content">' + escHtml(post.content) + '</p>')
        : "") +
      mediaHtml +
      "</div>" +
      '<div class="kircle-post-footer">' +
      '<button type="button" class="kircle-post-action ' + (isLiked ? "is-active" : "") + '" data-action="like" data-post-id="' + post.id + '">Thích (' + likeCount + ")</button>" +
      '<button type="button" class="kircle-post-action" data-action="comment" data-post-id="' + post.id + '">Bình luận (' + commentCount + ")</button>" +
      "</div>" +
      buildCommentSectionHtml(post) +
      "</article>"
    );
  }

  function renderFeed() {
    var list = document.getElementById("feed-list");
    var posts = getFeedPosts();
    list.innerHTML = posts.length
      ? posts.map(renderPost).join("")
      : '<p style="color: var(--text-muted); padding: 2rem;">Chưa có bài viết nào. Hãy đăng bài đầu tiên!</p>';

    list.querySelectorAll("[data-action=expand-post]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = btn.closest(".kircle-post-content");
        p.querySelector(".kircle-excerpt-short").style.display = "none";
        p.querySelector(".kircle-excerpt-full").style.display = "";
      });
    });

    list.querySelectorAll("[data-action=collapse-post]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = btn.closest(".kircle-post-content");
        p.querySelector(".kircle-excerpt-full").style.display = "none";
        p.querySelector(".kircle-excerpt-short").style.display = "";
      });
    });

    list.querySelectorAll("[data-action=like]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-post-id");
        KircleMockPosts.toggleLike(id, user.id);
        renderFeed();
      });
    });

    list.querySelectorAll("[data-action=menu]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-post-id");
        var isOwnerPost = btn.getAttribute("data-is-owner") === "1";

        var existing = document.querySelector(".kircle-post-dropdown");
        var isOpen = existing && existing.getAttribute("data-for-post") === id;
        closePostMenu();
        if (isOpen) return;

        var dropdown = document.createElement("div");
        dropdown.className = "kircle-post-dropdown";
        dropdown.setAttribute("data-for-post", id);

        if (isOwnerPost) {
          var delItem = document.createElement("button");
          delItem.type = "button";
          delItem.className = "kircle-post-dropdown-item kircle-post-dropdown-item-danger";
          delItem.textContent = "Xóa bài viết";
          delItem.addEventListener("click", function (ev) {
            ev.stopPropagation();
            closePostMenu();
            showConfirm({
              title: "Xóa bài viết này?",
              desc: "Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.",
              okLabel: "Xóa",
              onOk: function () {
                KircleMockPosts.remove(id);
                delete openComments[id];
                renderFeed();
              },
            });
          });
          dropdown.appendChild(delItem);
        } else {
          var reportItem = document.createElement("button");
          reportItem.type = "button";
          var alreadyReported = typeof KircleMockReports !== "undefined" && KircleMockReports.hasReported(id, user.id);
          if (alreadyReported) {
            reportItem.className = "kircle-post-dropdown-item kircle-post-dropdown-item-disabled";
            reportItem.textContent = "Đã báo cáo";
            reportItem.disabled = true;
          } else {
            reportItem.className = "kircle-post-dropdown-item";
            reportItem.textContent = "Báo cáo";
            reportItem.addEventListener("click", function (ev) {
              ev.stopPropagation();
              closePostMenu();
              showReportModal(id, function (reason) {
                KircleMockReports.add({ postId: id, reportedBy: user.id, reason: reason });
                renderFeed();
              });
            });
          }
          dropdown.appendChild(reportItem);
        }

        dropdown.addEventListener("click", function (ev) { ev.stopPropagation(); });
        btn.closest(".kircle-post-actions-wrap").appendChild(dropdown);
      });
    });

    list.querySelectorAll("[data-action=comment]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-post-id");
        var section = list.querySelector('.kircle-comments[data-post-id="' + id + '"]');
        if (!section) return;
        var isOpen = section.style.display !== "none";
        section.style.display = isOpen ? "none" : "block";
        openComments[id] = !isOpen;
        if (!isOpen) {
          var input = section.querySelector(".kircle-comment-input");
          if (input) input.focus();
        }
      });
    });

    list.querySelectorAll("[data-action=add-comment]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        submitComment(btn.getAttribute("data-post-id"));
      });
    });

    list.querySelectorAll(".kircle-comment-input").forEach(function (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submitComment(input.getAttribute("data-post-id"));
        }
      });
    });

    list.querySelectorAll("[data-action=del-comment]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var commentId = btn.getAttribute("data-comment-id");
        var commentEl = btn.closest(".kircle-comment");
        var section = btn.closest(".kircle-comments");
        var postId = section ? section.getAttribute("data-post-id") : null;
        if (postId) deleteComment(commentId, postId, commentEl);
      });
    });
  }

  document.getElementById("header-username").textContent = user.fullName || "User";
  document.getElementById("composer-avatar").src = user.avatar || "";
  document.getElementById("composer-avatar").alt = user.fullName || "";
  document.getElementById("header-avatar").src = user.avatar || "";
  document.getElementById("header-avatar").alt = user.fullName || "";

  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn && typeof KircleTheme !== "undefined") {
    themeBtn.addEventListener("click", function () {
      KircleTheme.toggleTheme();
    });
  }

  document.getElementById("user-menu-btn").addEventListener("click", function () {
    var menu = document.getElementById("user-menu");
    var open = menu.classList.toggle("is-open");
    this.setAttribute("aria-expanded", open);
  });

  document.getElementById("logout-btn").addEventListener("click", function () {
    KircleAuth.logout();
    window.location.href = "auth/login.html";
  });

  var imgUrlInput = document.getElementById("composer-image-url");
  var imgClearBtn = document.getElementById("composer-image-clear");
  var previewWrap = document.getElementById("composer-preview");
  var previewImg = document.getElementById("composer-preview-img");
  var previewTimer = null;

  function sanitizeImageUrl(raw) {
    var url = raw.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "").trim();
    if (!url) return "";
    try {
      var parsed = new URL(url);
      var imgurl = parsed.searchParams.get("imgurl");
      if (imgurl) return decodeURIComponent(imgurl);
    } catch (_) {}
    return url;
  }

  function updateImagePreview() {
    var raw = imgUrlInput.value;
    var url = sanitizeImageUrl(raw);
    imgClearBtn.style.display = url ? "flex" : "none";
    if (!url) {
      previewWrap.style.display = "none";
      previewImg.src = "";
      return;
    }
    clearTimeout(previewTimer);
    previewTimer = setTimeout(function () {
      previewImg.onload = function () {
        previewWrap.style.display = "block";
      };
      previewImg.onerror = function () {
        previewWrap.style.display = "none";
      };
      previewImg.src = url;
    }, 500);
  }

  imgUrlInput.addEventListener("paste", function () {
    setTimeout(function () {
      var clean = sanitizeImageUrl(imgUrlInput.value);
      if (clean !== imgUrlInput.value) imgUrlInput.value = clean;
      updateImagePreview();
    }, 0);
  });

  imgUrlInput.addEventListener("input", updateImagePreview);

  imgClearBtn.addEventListener("click", function () {
    imgUrlInput.value = "";
    updateImagePreview();
    imgUrlInput.focus();
  });

  document.getElementById("composer-submit").addEventListener("click", function () {
    var content = document.getElementById("composer-input").value.trim();
    var privacy = document.getElementById("composer-privacy").value;
    var imageUrl = sanitizeImageUrl(document.getElementById("composer-image-url").value);
    if (!content && !imageUrl) return;
    var media = imageUrl ? [imageUrl] : [];
    KircleMockPosts.add({ authorId: user.id, content: content, privacy: privacy, media: media });
    document.getElementById("composer-input").value = "";
    document.getElementById("composer-image-url").value = "";
    updateImagePreview();
    renderFeed();
  });

  var badge = document.getElementById("notif-badge");
  if (typeof KircleMockNotifications !== "undefined") {
    var n = KircleMockNotifications.getUnreadCount(user.id);
    if (n > 0) {
      badge.textContent = n > 99 ? "99+" : n;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }

  renderFeed();
})();
