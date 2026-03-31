(function () {
  var user = KircleAuth.requireAuth("auth/login.html");
  if (!user) return;

  if (user.role !== "admin") {
    window.location.href = "news.html";
    return;
  }

  var REASON_LABELS = {
    spam: "Spam",
    inappropriate: "Nội dung không phù hợp",
    hate: "Ngôn từ kích động",
    misinformation: "Thông tin sai lệch",
    other: "Khác",
  };

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

  var EXCERPT_LIMIT = 100;

  function showImageLightbox(src) {
    var old = document.getElementById("kircle-lightbox");
    if (old) old.remove();
    var overlay = document.createElement("div");
    overlay.id = "kircle-lightbox";
    overlay.className = "kircle-lightbox";
    overlay.innerHTML =
      '<div class="kircle-lightbox-inner">' +
        '<img src="' + src.replace(/"/g, "&quot;") + '" alt="" class="kircle-lightbox-img">' +
        '<button type="button" class="kircle-lightbox-close" aria-label="Đóng">×</button>' +
      '</div>';
    document.body.appendChild(overlay);
    setTimeout(function () { overlay.classList.add("kircle-lightbox-visible"); }, 16);
    function closeLightbox() {
      overlay.classList.remove("kircle-lightbox-visible");
      setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 200);
    }
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest(".kircle-lightbox-close")) closeLightbox();
    });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { closeLightbox(); document.removeEventListener("keydown", onKey); }
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

  function showConfirm(opts) {
    var old = document.getElementById("kircle-confirm-modal");
    if (old) old.remove();

    var overlay = document.createElement("div");
    overlay.id = "kircle-confirm-modal";
    overlay.className = "kircle-confirm-overlay";
    overlay.innerHTML =
      '<div class="kircle-confirm-box" role="dialog" aria-modal="true">' +
        '<p class="kircle-confirm-title">' + escHtml(opts.title) + '</p>' +
        (opts.desc ? '<p class="kircle-confirm-desc">' + escHtml(opts.desc) + '</p>' : '') +
        '<div class="kircle-confirm-actions">' +
          '<button type="button" class="kircle-btn kircle-btn-secondary kircle-btn-sm" id="kircle-confirm-cancel">Hủy</button>' +
          '<button type="button" class="kircle-btn kircle-btn-danger kircle-btn-sm" id="kircle-confirm-ok">' + escHtml(opts.okLabel || "Xác nhận") + '</button>' +
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
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.getElementById("kircle-confirm-ok").focus();
  }

  function showToast(msg, isError) {
    var old = document.getElementById("kircle-admin-toast");
    if (old) old.remove();
    var el = document.createElement("div");
    el.id = "kircle-admin-toast";
    el.className = "kircle-admin-toast" + (isError ? " kircle-admin-toast-error" : "");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add("kircle-admin-toast-visible"); }, 16);
    setTimeout(function () {
      el.classList.remove("kircle-admin-toast-visible");
      setTimeout(function () { if (el.parentNode) el.remove(); }, 300);
    }, 3000);
  }

  function renderTable() {
    var reports = KircleMockReports.getPending();
    var wrap = document.getElementById("admin-report-table-wrap");
    var countEl = document.getElementById("admin-report-count");
    if (countEl) countEl.textContent = reports.length + " báo cáo";

    if (!reports.length) {
      wrap.innerHTML = '<p class="kircle-admin-empty">Không có báo cáo nào đang chờ xử lý.</p>';
      return;
    }

    var rows = reports.map(function (r, i) {
      var post = KircleMockPosts.getById(r.postId);
      var reporter = KircleMockUsers.findById(r.reportedBy);
      var reporterName = reporter ? (reporter.fullName || reporter.username) : "Người dùng ẩn danh";

      var postCell;
      if (!post) {
        postCell =
          '<span class="kircle-report-post-removed">Bài viết đã bị gỡ</span>';
      } else {
        var author = KircleMockUsers.findById(post.authorId);
        var authorName = author ? (author.fullName || author.username) : "Ẩn danh";
        var content = post.content || "";
        var isLong = content.length > EXCERPT_LIMIT;
        var excerptHtml = "";
        if (content) {
          if (isLong) {
            excerptHtml =
              '<span class="kircle-report-post-excerpt">' +
                '<span class="kircle-excerpt-short">' + escHtml(content.slice(0, EXCERPT_LIMIT)) + '… ' +
                  '<button type="button" class="kircle-excerpt-toggle" data-action="expand-excerpt">Xem thêm</button>' +
                '</span>' +
                '<span class="kircle-excerpt-full" style="display:none;">' + escHtml(content) + ' ' +
                  '<button type="button" class="kircle-excerpt-toggle" data-action="collapse-excerpt">Ẩn bớt</button>' +
                '</span>' +
              '</span>';
          } else {
            excerptHtml = '<span class="kircle-report-post-excerpt">' + escHtml(content) + '</span>';
          }
        }
        var firstImage = Array.isArray(post.media) && post.media.length
          ? post.media.find(function (u) {
              var ext = (u.split("?")[0].split(".").pop() || "").toLowerCase();
              return ext !== "mp4" && ext !== "webm" && u.indexOf("video") === -1;
            })
          : null;
        var mediaThumb = firstImage
          ? '<img class="kircle-report-post-thumb" src="' + firstImage.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '" alt="">'
          : "";
        postCell =
          '<div class="kircle-report-post-cell">' +
          '<a href="' + (author ? 'profile.html?user=' + encodeURIComponent(author.username) : '#') + '" class="kircle-report-post-author">@' + escHtml(authorName) + '</a>' +
          (excerptHtml || "") +
          (mediaThumb ? '<div class="kircle-report-post-media">' + mediaThumb + '</div>' : "") +
          (!content && !mediaThumb ? '<em class="kircle-text-muted" style="font-size:0.85rem;">Bài viết không có nội dung</em>' : "") +
          '</div>';
      }

      var reasonLabel = REASON_LABELS[r.reason] || escHtml(r.reason) || "—";

      var reporterProfileUrl = reporter ? 'profile.html?user=' + encodeURIComponent(reporter.username) : '#';
      var reporterCell =
        '<a href="' + reporterProfileUrl + '" class="kircle-admin-user-cell kircle-admin-user-link">' +
        '<span class="kircle-admin-avatar-ph" aria-hidden="true">' + escHtml(getInitials(reporterName)) + '</span>' +
        '<span class="kircle-admin-fullname">' + escHtml(reporterName) + '</span>' +
        '</a>';

      var actionBtns = post
        ? '<button type="button" class="kircle-btn kircle-btn-danger kircle-btn-sm kircle-btn-equal-w" ' +
          'data-action="delete-post" data-report-id="' + escHtml(r.id) + '" data-post-id="' + escHtml(r.postId) + '">Xóa bài</button>' +
          '<button type="button" class="kircle-btn kircle-btn-secondary kircle-btn-sm kircle-btn-equal-w" ' +
          'data-action="dismiss" data-report-id="' + escHtml(r.id) + '">Bỏ qua</button>'
        : '<button type="button" class="kircle-btn kircle-btn-secondary kircle-btn-sm kircle-btn-equal-w" ' +
          'data-action="dismiss" data-report-id="' + escHtml(r.id) + '">Bỏ qua</button>';

      return (
        '<tr>' +
        '<td class="kircle-admin-col-num">' + (i + 1) + '</td>' +
        '<td>' + postCell + '</td>' +
        '<td>' + reporterCell + '</td>' +
        '<td><span class="kircle-badge kircle-badge-report">' + escHtml(reasonLabel) + '</span></td>' +
        '<td class="kircle-admin-col-date">' + formatDate(r.createdAt) + '</td>' +
        '<td class="kircle-admin-col-actions">' + actionBtns + '</td>' +
        '</tr>'
      );
    }).join("");

    wrap.innerHTML =
      '<div class="kircle-table-scroll">' +
      '<table class="kircle-admin-table">' +
      '<thead><tr>' +
      '<th class="kircle-admin-col-num">No</th>' +
      '<th>Bài viết</th>' +
      '<th>Người báo cáo</th>' +
      '<th>Lý do</th>' +
      '<th class="kircle-admin-col-date">Thời gian</th>' +
      '<th class="kircle-admin-col-actions">Quản lý</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table></div>';
  }

  document.getElementById("admin-report-table-wrap").addEventListener("click", function (e) {
    var thumb = e.target.closest(".kircle-report-post-thumb");
    if (thumb) { showImageLightbox(thumb.src); return; }

    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    var reportId = btn.getAttribute("data-report-id");

    if (action === "expand-excerpt") {
      var excerptSpan = btn.closest(".kircle-report-post-excerpt");
      excerptSpan.querySelector(".kircle-excerpt-short").style.display = "none";
      excerptSpan.querySelector(".kircle-excerpt-full").style.display = "";
      return;
    }
    if (action === "collapse-excerpt") {
      var excerptSpan = btn.closest(".kircle-report-post-excerpt");
      excerptSpan.querySelector(".kircle-excerpt-short").style.display = "";
      excerptSpan.querySelector(".kircle-excerpt-full").style.display = "none";
      return;
    }

    if (action === "delete-post") {
      var postId = btn.getAttribute("data-post-id");
      var post = KircleMockPosts.getById(postId);
      var title = post && post.content
        ? '"' + post.content.slice(0, 40) + (post.content.length > 40 ? "…" : "") + '"'
        : "bài viết này";

      showConfirm({
        title: "Xóa " + title + "?",
        desc: "Bài viết sẽ bị gỡ khỏi hệ thống và tất cả báo cáo liên quan sẽ được đóng.",
        okLabel: "Xóa bài viết",
        onOk: function () {
          KircleMockPosts.remove(postId);
          KircleMockReports.removeByPostId(postId);
          showToast("Đã xóa bài viết thành công.");
          renderTable();
        },
      });
    } else if (action === "dismiss") {
      KircleMockReports.removeById(reportId);
      showToast("Đã bỏ qua báo cáo.");
      renderTable();
    }
  });

  document.getElementById("header-username").textContent = user.fullName || "Admin";
  document.getElementById("header-avatar").src = user.avatar || "";
  document.getElementById("header-avatar").alt = user.fullName || "";

  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn && typeof KircleTheme !== "undefined") {
    themeBtn.addEventListener("click", function () { KircleTheme.toggleTheme(); });
  }

  var userMenuBtn = document.getElementById("user-menu-btn");
  var userMenu = document.getElementById("user-menu");

  userMenuBtn.addEventListener("click", function () {
    var open = userMenu.classList.toggle("is-open");
    userMenuBtn.setAttribute("aria-expanded", open);
  });

  document.addEventListener("click", function (e) {
    if (userMenu.classList.contains("is-open") &&
        !userMenu.contains(e.target) &&
        !userMenuBtn.contains(e.target)) {
      userMenu.classList.remove("is-open");
      userMenuBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.getElementById("logout-btn").addEventListener("click", function () {
    KircleAuth.logout();
    window.location.href = "auth/login.html";
  });

  renderTable();
})();
