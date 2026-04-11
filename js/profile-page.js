(function () {
  var currentUser = KircleAuth.requireAuth("auth/login.html");
  if (!currentUser) return;

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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

  function getInitials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || "?").toUpperCase();
  }

  function getProfileUserId() {
    var params = new URLSearchParams(window.location.search);
    var usernameParam = params.get("user");
    if (usernameParam) {
      if (usernameParam === currentUser.username) {
        window.history.replaceState(null, "", "profile.html");
        return currentUser.id;
      }
      var found = KircleMockUsers.findByUsername(usernameParam);
      return found ? found.id : "__not_found__";
    }
    return params.get("uid") || currentUser.id;
  }

  var profileUserId = getProfileUserId();
  var isOwnProfile = profileUserId === currentUser.id;

  (function guardAdminProfile() {
    if (!profileUserId || profileUserId === "__not_found__") return;
    var target = KircleMockUsers.findById(profileUserId);
    if (target && target.role === "admin" && !isOwnProfile) {
      profileUserId = "__not_found__";
    }
  })();

  function renderProfileHero() {
    var profileUser = KircleMockUsers.findById(profileUserId);
    if (!profileUser) {
      document.getElementById("profile-info").innerHTML =
        '<p style="color:var(--text-muted);padding:1rem 0;">Không tìm thấy thông tin người dùng. ' +
        '<a href="" onclick="localStorage.removeItem(\'kircle_db_seeded\');location.reload();return false;" style="color:var(--primary);">Tải lại dữ liệu</a></p>';
      return;
    }

    if (profileUser.locked && !isOwnProfile) {
      document.getElementById("profile-avatar-display").innerHTML =
        '<div class="kircle-profile-avatar-placeholder">?</div>';
      document.getElementById("profile-info").innerHTML =
        '<p style="color:var(--text-muted);padding:0.5rem 0;">Tài khoản này không khả dụng.</p>';
      document.getElementById("profile-stats").innerHTML = "";
      document.getElementById("edit-profile-btn").style.display = "none";
      document.title = "Tài khoản không khả dụng – Kircle";
      return;
    }

    var name = profileUser.fullName || profileUser.username || "User";
    var avatar = profileUser.avatar || "";
    var bio = profileUser.bio || "";
    var followerCount = (profileUser.followerIds || []).length;
    var followingCount = (profileUser.followingIds || []).length;
    var postCount = KircleMockPosts.getAll().filter(function (p) {
      return p.authorId === profileUserId;
    }).length;

    var avatarDisplay = document.getElementById("profile-avatar-display");
    if (avatar) {
      avatarDisplay.innerHTML =
        '<img class="kircle-profile-avatar" src="' + escHtml(avatar) + '" alt="' + escHtml(name) + '" ' +
        'onerror="this.style.display=\'none\'; document.getElementById(\'profile-avatar-fallback\').style.display=\'flex\';">' +
        '<div class="kircle-profile-avatar-placeholder" id="profile-avatar-fallback" style="display:none;">' + escHtml(getInitials(name)) + '</div>';
    } else {
      avatarDisplay.innerHTML =
        '<div class="kircle-profile-avatar-placeholder" id="profile-avatar-fallback">' + escHtml(getInitials(name)) + '</div>';
    }

    var infoEl = document.getElementById("profile-info");
    infoEl.innerHTML =
      '<h1 class="kircle-profile-fullname">' + escHtml(name) + '</h1>' +
      (bio
        ? '<p class="kircle-profile-bio">' + escHtml(bio) + '</p>'
        : '<p class="kircle-profile-bio kircle-profile-bio-empty">Chưa có tiểu sử.</p>');

    var statsEl = document.getElementById("profile-stats");
    statsEl.innerHTML =
      '<div class="kircle-profile-stat"><span class="kircle-profile-stat-value">' + postCount + '</span><span class="kircle-profile-stat-label">Bài viết</span></div>' +
      '<div class="kircle-profile-stat"><span class="kircle-profile-stat-value">' + followerCount + '</span><span class="kircle-profile-stat-label">Người theo dõi</span></div>' +
      '<div class="kircle-profile-stat"><span class="kircle-profile-stat-value">' + followingCount + '</span><span class="kircle-profile-stat-label">Đang theo dõi</span></div>';

    var editBtn = document.getElementById("edit-profile-btn");
    editBtn.style.display = isOwnProfile ? "" : "none";

    var existingFollowBtn = document.getElementById("follow-btn");
    if (existingFollowBtn) existingFollowBtn.remove();

    if (!isOwnProfile) {
      var isFollowing = KircleMockUsers.isFollowing(currentUser.id, profileUserId);
      var followBtn = document.createElement("button");
      followBtn.id = "follow-btn";
      followBtn.type = "button";
      followBtn.className = isFollowing
        ? "kircle-btn kircle-btn-secondary kircle-btn-sm"
        : "kircle-btn kircle-btn-primary kircle-btn-sm";
      followBtn.textContent = isFollowing ? "Bỏ theo dõi" : "Theo dõi";
      followBtn.addEventListener("click", function () {
        if (KircleMockUsers.isFollowing(currentUser.id, profileUserId)) {
          KircleMockUsers.unfollow(currentUser.id, profileUserId);
        } else {
          KircleMockUsers.follow(currentUser.id, profileUserId);
        }
        renderProfileHero();
      });
      var avatarOuter = document.querySelector(".kircle-profile-avatar-outer");
      if (avatarOuter) avatarOuter.appendChild(followBtn);
    }

    document.title = name + " – Kircle";
  }

  var openComments = {};
  var CONTENT_LIMIT = 200;

  function closePostMenu() {
    var existing = document.querySelector('.kircle-post-dropdown');
    if (existing) existing.remove();
  }

  document.addEventListener('click', closePostMenu);

  function showConfirm(opts) {
    var old = document.getElementById('kircle-confirm-modal');
    if (old) old.remove();
    var overlay = document.createElement('div');
    overlay.id = 'kircle-confirm-modal';
    overlay.className = 'kircle-confirm-overlay';
    overlay.innerHTML =
      '<div class="kircle-confirm-box" role="dialog" aria-modal="true">' +
        '<p class="kircle-confirm-title">' + (opts.title || '') + '</p>' +
        (opts.desc ? '<p class="kircle-confirm-desc">' + opts.desc + '</p>' : '') +
        '<div class="kircle-confirm-actions">' +
          '<button type="button" class="kircle-btn kircle-btn-secondary kircle-btn-sm" id="kircle-confirm-cancel">Hủy</button>' +
          '<button type="button" class="kircle-btn kircle-btn-danger kircle-btn-sm" id="kircle-confirm-ok">' + (opts.okLabel || 'Xác nhận') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    setTimeout(function () { overlay.classList.add('kircle-confirm-visible'); }, 16);
    function close() {
      overlay.classList.remove('kircle-confirm-visible');
      setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 200);
    }
    document.getElementById('kircle-confirm-ok').addEventListener('click', function () { close(); opts.onOk(); });
    document.getElementById('kircle-confirm-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.getElementById('kircle-confirm-ok').focus();
  }

  function showReportModal(postId, onSubmit) {
    var old = document.getElementById('kircle-report-modal');
    if (old) old.remove();
    var overlay = document.createElement('div');
    overlay.id = 'kircle-report-modal';
    overlay.className = 'kircle-confirm-overlay';
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
    setTimeout(function () { overlay.classList.add('kircle-confirm-visible'); }, 16);
    function close() {
      overlay.classList.remove('kircle-confirm-visible');
      setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 200);
    }
    document.getElementById('kircle-report-ok').addEventListener('click', function () {
      var reason = document.getElementById('kircle-report-reason').value;
      close();
      onSubmit(reason);
    });
    document.getElementById('kircle-report-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.getElementById('kircle-report-ok').focus();
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
    var isOwn = c.authorId === currentUser.id;
    var profileUrl = isOwn
      ? 'profile.html'
      : (cAuthor && cAuthor.username ? 'profile.html?user=' + encodeURIComponent(cAuthor.username) : 'profile.html');
    return (
      '<div class="kircle-comment" data-comment-id="' + c.id + '">' +
      '<a href="' + profileUrl + '" class="kircle-comment-avatar-link">' + buildCommentAvatarHtml(name, avatar) + '</a>' +
      '<div class="kircle-comment-body">' +
      '<a href="' + profileUrl + '" class="kircle-comment-author-link"><span class="kircle-comment-author">' + escHtml(name) + '</span></a>' +
      '<p class="kircle-comment-content">' + escHtml(c.content) + '</p>' +
      '<span class="kircle-comment-meta">' + formatDate(c.createdAt) + '</span>' +
      '</div>' +
      (isOwn
        ? '<button type="button" class="kircle-comment-del" data-action="del-comment" data-comment-id="' + c.id + '" aria-label="Xóa bình luận">×</button>'
        : '') +
      '</div>'
    );
  }

  function buildCommentSectionHtml(post) {
    var comments = KircleMockComments.getByPostId(post.id);
    var listHtml = comments.length
      ? comments.map(buildCommentHtml).join('')
      : '<p class="kircle-comment-empty">Chưa có bình luận nào.</p>';
    var display = openComments[post.id] ? 'block' : 'none';
    return (
      '<div class="kircle-comments" data-post-id="' + post.id + '" style="display:' + display + ';">' +
      '<div class="kircle-comment-list">' + listHtml + '</div>' +
      '<div class="kircle-comment-compose">' +
      '<img class="kircle-comment-compose-avatar" src="' + escHtml(currentUser.avatar || '') + '" alt="" onerror="this.style.display=\'none\'">' +
      '<div class="kircle-comment-input-row">' +
      '<input type="text" class="kircle-comment-input" placeholder="Viết bình luận..." data-post-id="' + post.id + '" maxlength="500" autocomplete="off">' +
      '<button type="button" class="kircle-btn kircle-btn-primary kircle-btn-sm" data-action="add-comment" data-post-id="' + post.id + '">Gửi</button>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function submitComment(postId, listEl) {
    var section = listEl.querySelector('.kircle-comments[data-post-id="' + postId + '"]');
    if (!section) return;
    var input = section.querySelector('.kircle-comment-input');
    var content = input.value.trim();
    if (!content) return;

    var comment = KircleMockComments.add({ postId: postId, authorId: currentUser.id, content: content });

    var post = KircleMockPosts.getById(postId);
    if (post) {
      var ids = post.commentIds.slice();
      ids.push(comment.id);
      KircleMockPosts.update(postId, { commentIds: ids });
    }

    var toggleBtn = listEl.querySelector('[data-action="comment"][data-post-id="' + postId + '"]');
    if (toggleBtn) {
      var currentCount = section.querySelectorAll('.kircle-comment[data-comment-id]').length;
      toggleBtn.textContent = 'Bình luận (' + (currentCount + 1) + ')';
    }

    var commentList = section.querySelector('.kircle-comment-list');
    var empty = commentList.querySelector('.kircle-comment-empty');
    if (empty) empty.remove();

    commentList.insertAdjacentHTML('beforeend', buildCommentHtml(comment));
    var newEl = commentList.lastElementChild;

    var delBtn = newEl && newEl.querySelector('[data-action=del-comment]');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        deleteComment(comment.id, postId, newEl, listEl);
      });
    }

    input.value = '';
    input.focus();
    if (newEl) newEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function deleteComment(commentId, postId, commentEl, listEl) {
    KircleMockComments.remove(commentId);

    var post = KircleMockPosts.getById(postId);
    if (post) {
      var ids = post.commentIds.filter(function (id) { return id !== commentId; });
      KircleMockPosts.update(postId, { commentIds: ids });
    }

    var toggleBtn = listEl.querySelector('[data-action="comment"][data-post-id="' + postId + '"]');
    if (toggleBtn) {
      var match = toggleBtn.textContent.match(/\d+/);
      var prev = match ? parseInt(match[0], 10) : 1;
      toggleBtn.textContent = 'Bình luận (' + Math.max(0, prev - 1) + ')';
    }

    if (commentEl) commentEl.remove();

    var section = listEl.querySelector('.kircle-comments[data-post-id="' + postId + '"]');
    if (section) {
      var commentListEl = section.querySelector('.kircle-comment-list');
      if (commentListEl && !commentListEl.querySelector('.kircle-comment[data-comment-id]')) {
        commentListEl.innerHTML = '<p class="kircle-comment-empty">Chưa có bình luận nào.</p>';
      }
    }
  }

  function renderPost(post) {
    var author = KircleMockUsers.findById(post.authorId);
    if (!author) return '';
    var isOwner = post.authorId === currentUser.id;
    var isLiked = post.likeIds && post.likeIds.indexOf(currentUser.id) !== -1;
    var likeCount = (post.likeIds && post.likeIds.length) || 0;
    var commentCount = KircleMockComments.getByPostId(post.id).length;

    var mediaHtml = '';
    var rawMedia = Array.isArray(post.media) ? post.media : [];
    rawMedia.forEach(function (url) {
      if (!url || typeof url !== 'string') return;
      url = url.trim();
      if (!url) return;
      var safeUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      var ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
      if (ext === 'mp4' || ext === 'webm' || url.indexOf('video') !== -1) {
        mediaHtml += '<div class="kircle-post-media"><video src="' + safeUrl + '" controls></video></div>';
      } else {
        mediaHtml += '<div class="kircle-post-media"><img src="' + safeUrl + '" alt=""></div>';
      }
    });

    var privacyLabel =
      { public: 'Công khai', followers: 'Người theo dõi', private: 'Riêng tư' }[post.privacy] || post.privacy;
    var profileUrl = 'profile.html?user=' + encodeURIComponent(author.username);

    return (
      '<article class="kircle-post" data-post-id="' + post.id + '">' +
      '<div class="kircle-post-header">' +
      '<a href="' + profileUrl + '" class="kircle-post-author-link">' +
      buildPostAvatar(author) +
      '</a>' +
      '<div class="kircle-post-author-wrap">' +
      '<a href="' + profileUrl + '" class="kircle-post-author-name-link">' +
      '<span class="kircle-post-author-name">' + escHtml(author.fullName || author.username || 'User') + '</span>' +
      '</a>' +
      '<div class="kircle-post-meta">' + formatDate(post.createdAt) + ' · ' + privacyLabel + '</div>' +
      '</div>' +
      '<div class="kircle-post-actions-wrap"><button type="button" class="kircle-post-menu-btn" data-action="menu" data-post-id="' + post.id + '" data-is-owner="' + (isOwner ? '1' : '0') + '" aria-label="Menu">⋯</button></div>' +
      '</div>' +
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
        : '') +
      mediaHtml +
      '</div>' +
      '<div class="kircle-post-footer">' +
      '<button type="button" class="kircle-post-action ' + (isLiked ? 'is-active' : '') + '" data-action="like" data-post-id="' + post.id + '">Thích (' + likeCount + ')</button>' +
      '<button type="button" class="kircle-post-action" data-action="comment" data-post-id="' + post.id + '">Bình luận (' + commentCount + ')</button>' +
      '</div>' +
      buildCommentSectionHtml(post) +
      '</article>'
    );
  }

  function getProfilePosts() {
    return KircleMockPosts.getAll()
      .filter(function (p) {
        if (p.authorId !== profileUserId) return false;
        if (!isOwnProfile && p.privacy === 'private') return false;
        return true;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function bindPostListEvents(listEl) {
    listEl.querySelectorAll('[data-action=expand-post]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.closest('.kircle-post-content');
        p.querySelector('.kircle-excerpt-short').style.display = 'none';
        p.querySelector('.kircle-excerpt-full').style.display = '';
      });
    });

    listEl.querySelectorAll('[data-action=collapse-post]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.closest('.kircle-post-content');
        p.querySelector('.kircle-excerpt-full').style.display = 'none';
        p.querySelector('.kircle-excerpt-short').style.display = '';
      });
    });

    listEl.querySelectorAll('[data-action=like]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        KircleMockPosts.toggleLike(btn.getAttribute('data-post-id'), currentUser.id);
        renderPosts();
      });
    });

    listEl.querySelectorAll('[data-action=menu]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-post-id');
        var isOwnerPost = btn.getAttribute('data-is-owner') === '1';
        var isAdmin = currentUser.role === 'admin';
        var canDelete = isOwnerPost || isAdmin;

        var existing = document.querySelector('.kircle-post-dropdown');
        var isOpen = existing && existing.getAttribute('data-for-post') === id;
        closePostMenu();
        if (isOpen) return;

        var dropdown = document.createElement('div');
        dropdown.className = 'kircle-post-dropdown';
        dropdown.setAttribute('data-for-post', id);

        if (canDelete) {
          var delItem = document.createElement('button');
          delItem.type = 'button';
          delItem.className = 'kircle-post-dropdown-item kircle-post-dropdown-item-danger';
          delItem.textContent = 'Xóa bài';
          delItem.addEventListener('click', function (ev) {
            ev.stopPropagation();
            closePostMenu();
            showConfirm({
              title: 'Xóa bài viết này?',
              desc: 'Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.',
              okLabel: 'Xóa',
              onOk: function () {
                KircleMockPosts.remove(id);
                if (typeof KircleMockReports !== 'undefined') {
                  KircleMockReports.removeByPostId(id);
                }
                delete openComments[id];
                renderPosts();
                renderProfileHero();
                if (typeof KircleRouter !== 'undefined') KircleRouter.showToast('Đã xóa bài viết thành công.');
              },
            });
          });
          dropdown.appendChild(delItem);
        } else {
          var reportItem = document.createElement('button');
          reportItem.type = 'button';
          var alreadyReported = typeof KircleMockReports !== 'undefined' && KircleMockReports.hasReported(id, currentUser.id);
          if (alreadyReported) {
            reportItem.className = 'kircle-post-dropdown-item kircle-post-dropdown-item-disabled';
            reportItem.textContent = 'Đã báo cáo';
            reportItem.disabled = true;
          } else {
            reportItem.className = 'kircle-post-dropdown-item';
            reportItem.textContent = 'Báo cáo';
            reportItem.addEventListener('click', function (ev) {
              ev.stopPropagation();
              closePostMenu();
              showReportModal(id, function (reason) {
                KircleMockReports.add({ postId: id, reportedBy: currentUser.id, reason: reason });
                if (typeof KircleRouter !== 'undefined') KircleRouter.showToast('Đã gửi báo cáo thành công.');
              });
            });
          }
          dropdown.appendChild(reportItem);
        }

        dropdown.addEventListener('click', function (ev) { ev.stopPropagation(); });
        btn.closest('.kircle-post-actions-wrap').appendChild(dropdown);
      });
    });

    listEl.querySelectorAll('[data-action=comment]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-post-id');
        var section = listEl.querySelector('.kircle-comments[data-post-id="' + id + '"]');
        if (!section) return;
        var isOpen = section.style.display !== 'none';
        section.style.display = isOpen ? 'none' : 'block';
        openComments[id] = !isOpen;
        if (!isOpen) {
          var input = section.querySelector('.kircle-comment-input');
          if (input) input.focus();
        }
      });
    });

    listEl.querySelectorAll('[data-action=add-comment]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        submitComment(btn.getAttribute('data-post-id'), listEl);
      });
    });

    listEl.querySelectorAll('.kircle-comment-input').forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitComment(input.getAttribute('data-post-id'), listEl);
        }
      });
    });

    listEl.querySelectorAll('[data-action=del-comment]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var commentId = btn.getAttribute('data-comment-id');
        var commentEl = btn.closest('.kircle-comment');
        var section = btn.closest('.kircle-comments');
        var postId = section ? section.getAttribute('data-post-id') : null;
        if (postId) deleteComment(commentId, postId, commentEl, listEl);
      });
    });
  }

  function renderPosts() {
    var section = document.getElementById('profile-posts-section');
    var profileUser = KircleMockUsers.findById(profileUserId);
    if (profileUser && profileUser.locked && !isOwnProfile) {
      section.innerHTML = '';
      return;
    }
    var posts = getProfilePosts();

    var html =
      '<div class="kircle-profile-posts-header">' +
      'Bài viết <span class="kircle-profile-posts-count">(' + posts.length + ')</span>' +
      '</div>';

    if (posts.length === 0) {
      html += '<p style="color: var(--text-muted); padding: 1rem 0;">Chưa có bài viết nào.</p>';
      section.innerHTML = html;
      return;
    }

    html += '<div id="profile-post-list">' + posts.map(renderPost).join('') + '</div>';
    section.innerHTML = html;
    bindPostListEvents(document.getElementById('profile-post-list'));
  }

  var editAvatarInput = document.getElementById('edit-avatar-url');
  var editAvatarClearBtn = document.getElementById('edit-avatar-clear');
  var editAvatarPreviewWrap = document.getElementById('edit-avatar-preview-wrap');
  var editFullnameInput = document.getElementById('edit-fullname');
  var editBioInput = document.getElementById('edit-bio');
  var editBioCounter = document.getElementById('edit-bio-counter');
  var editFeedback = document.getElementById('edit-save-feedback');
  var editCard = document.getElementById('edit-profile-card');

  function renderEditAvatarPreview(url) {
    var profileUser = KircleMockUsers.findById(profileUserId);
    var name = profileUser ? (profileUser.fullName || profileUser.username || 'User') : 'User';
    if (url) {
      editAvatarPreviewWrap.innerHTML =
        '<img class="kircle-profile-edit-avatar-preview" src="' + escHtml(url) + '" alt="" ' +
        'onerror="this.style.display=\'none\'; document.getElementById(\'edit-avatar-fallback\').style.display=\'flex\';">' +
        '<div class="kircle-profile-edit-avatar-placeholder" id="edit-avatar-fallback" style="display:none;">' + escHtml(getInitials(name)) + '</div>';
    } else {
      editAvatarPreviewWrap.innerHTML =
        '<div class="kircle-profile-edit-avatar-placeholder">' + escHtml(getInitials(name)) + '</div>';
    }
  }

  function openEditForm() {
    var profileUser = KircleMockUsers.findById(profileUserId);
    if (!profileUser) return;

    editAvatarInput.value = profileUser.avatar || '';
    editFullnameInput.value = profileUser.fullName || '';
    editBioInput.value = profileUser.bio || '';
    editBioCounter.textContent = (profileUser.bio || '').length + ' / 200';
    renderEditAvatarPreview(profileUser.avatar || '');

    document.getElementById('edit-avatar-error').style.display = 'none';
    document.getElementById('edit-fullname-error').style.display = 'none';
    editFeedback.style.display = 'none';

    editCard.style.display = '';
    editCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    editFullnameInput.focus();
  }

  function closeEditForm() {
    editCard.style.display = 'none';
  }

  editAvatarInput.addEventListener('input', function () {
    renderEditAvatarPreview(editAvatarInput.value.trim());
  });

  editAvatarInput.addEventListener('paste', function () {
    setTimeout(function () { renderEditAvatarPreview(editAvatarInput.value.trim()); }, 0);
  });

  editAvatarClearBtn.addEventListener('click', function () {
    editAvatarInput.value = '';
    renderEditAvatarPreview('');
    editAvatarInput.focus();
  });

  editBioInput.addEventListener('input', function () {
    editBioCounter.textContent = editBioInput.value.length + ' / 200';
  });

  document.getElementById('edit-profile-btn').addEventListener('click', openEditForm);
  document.getElementById('edit-cancel-btn').addEventListener('click', closeEditForm);

  document.getElementById('edit-save-btn').addEventListener('click', function () {
    var avatarUrl = editAvatarInput.value.trim();
    var fullName = editFullnameInput.value.trim();
    var bio = editBioInput.value.trim();

    var avatarErrEl = document.getElementById('edit-avatar-error');
    var nameErrEl = document.getElementById('edit-fullname-error');
    avatarErrEl.style.display = 'none';
    nameErrEl.style.display = 'none';
    editFeedback.style.display = 'none';

    var hasError = false;

    if (!fullName) {
      nameErrEl.textContent = 'Tên hiển thị không được để trống.';
      nameErrEl.style.display = '';
      hasError = true;
    }

    if (avatarUrl) {
      try { new URL(avatarUrl); } catch (_) {
        avatarErrEl.textContent = 'Đường dẫn ảnh không hợp lệ.';
        avatarErrEl.style.display = '';
        hasError = true;
      }
    }

    if (hasError) return;

    var updated = KircleDB.users.update(profileUserId, {
      fullName: fullName,
      avatar: avatarUrl,
      bio: bio,
    });

    if (!updated) {
      editFeedback.style.color = '#e53e3e';
      editFeedback.textContent = 'Có lỗi xảy ra. Vui lòng thử lại.';
      editFeedback.style.display = '';
      return;
    }

    if (isOwnProfile) {
      KircleAuth.setUser(updated);
      currentUser = KircleAuth.getCurrentUser();
      document.getElementById('header-username').textContent = currentUser.fullName || 'User';
      KircleRouter.setAvatar(document.getElementById('header-avatar'), currentUser.fullName, currentUser.avatar);
      document.getElementById('header-avatar').alt = currentUser.fullName || '';
    }

    editFeedback.style.color = '#38a169';
    editFeedback.textContent = 'Đã lưu thành công!';
    editFeedback.style.display = '';

    renderProfileHero();
    renderPosts();

    setTimeout(closeEditForm, 1000);
  });

  document.getElementById('header-username').textContent = currentUser.fullName || 'User';
  KircleRouter.setAvatar(document.getElementById('header-avatar'), currentUser.fullName, currentUser.avatar);
  document.getElementById('header-avatar').alt = currentUser.fullName || '';

  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn && typeof KircleTheme !== 'undefined') {
    themeBtn.addEventListener('click', function () { KircleTheme.toggleTheme(); });
  }

  document.getElementById('user-menu-btn').addEventListener('click', function () {
    var menu = document.getElementById('user-menu');
    var open = menu.classList.toggle('is-open');
    this.setAttribute('aria-expanded', open);
  });

  document.getElementById('logout-btn').addEventListener('click', function () {
    KircleAuth.logout();
    window.location.href = 'auth/login.html';
  });

  var badge = document.getElementById('notif-badge');
  if (typeof KircleMockNotifications !== 'undefined') {
    var n = KircleMockNotifications.getUnreadCount(currentUser.id);
    if (n > 0) {
      badge.textContent = n > 99 ? '99+' : n;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  renderProfileHero();
  renderPosts();
})();
