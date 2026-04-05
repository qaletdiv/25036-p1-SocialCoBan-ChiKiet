(function () {
  var user = KircleAuth.requireAuth("auth/login.html");
  if (!user) return;

  if (user.role !== "admin") {
    window.location.href = "news.html";
    return;
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
          '<button type="button" class="kircle-btn kircle-btn-sm ' + (opts.danger ? 'kircle-btn-danger' : 'kircle-btn-primary') + '" id="kircle-confirm-ok">' + escHtml(opts.okLabel || 'Xác nhận') + '</button>' +
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
    var users = KircleDB.users.getAll().filter(function (u) {
      return u.id !== user.id;
    });
    var wrap = document.getElementById("admin-user-table-wrap");
    var countEl = document.getElementById("admin-user-count");
    if (countEl) countEl.textContent = users.length + " người dùng";

    if (!users.length) {
      wrap.innerHTML = '<p class="kircle-admin-empty">Chưa có người dùng nào.</p>';
      return;
    }

    var rows = users.map(function (u, i) {
      var isLocked = !!u.locked;

      var statusBadge = isLocked
        ? '<span class="kircle-badge kircle-badge-locked">Bị khóa</span>'
        : '<span class="kircle-badge kircle-badge-active">Hoạt động</span>';

      var roleBadge = "";
      if (u.role === "admin") {
        roleBadge = ' <span class="kircle-badge kircle-badge-role-admin">Admin</span>';
      }

      var avatarHtml;
      if (u.avatar) {
        avatarHtml =
          '<img class="kircle-admin-avatar" src="' + escHtml(u.avatar) + '" alt="' + escHtml(u.fullName || u.username) + '" ' +
          'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\';">' +
          '<span class="kircle-admin-avatar-ph" style="display:none;" aria-hidden="true">' +
          escHtml(getInitials(u.fullName || u.username)) + "</span>";
      } else {
        avatarHtml =
          '<span class="kircle-admin-avatar-ph" aria-hidden="true">' +
          escHtml(getInitials(u.fullName || u.username)) + "</span>";
      }

      var actionBtn;
      if (isLocked) {
        actionBtn =
          '<button type="button" class="kircle-btn kircle-btn-primary kircle-btn-sm" ' +
          'data-action="unlock" data-uid="' + escHtml(u.id) + '">Mở khóa</button>';
      } else {
        actionBtn =
          '<button type="button" class="kircle-btn kircle-btn-danger kircle-btn-sm" ' +
          'data-action="lock" data-uid="' + escHtml(u.id) + '">Khóa</button>';
      }

      return (
        "<tr" + (isLocked ? ' class="kircle-admin-row-locked"' : "") + ">" +
        '<td class="kircle-admin-col-num">' + (i + 1) + "</td>" +
        "<td>" +
          '<a href="profile.html?user=' + encodeURIComponent(u.username) + '" class="kircle-admin-user-cell kircle-admin-user-link">' +
          avatarHtml +
          '<div class="kircle-admin-user-info">' +
            '<span class="kircle-admin-fullname">' + escHtml(u.fullName || u.username) + "</span>" +
            '<span class="kircle-admin-username">@' + escHtml(u.username) + "</span>" +
          "</div>" +
          "</a>" +
          roleBadge +
        "</td>" +
        '<td class="kircle-admin-col-email">' + escHtml(u.email) + "</td>" +
        "<td>" + statusBadge + "</td>" +
        "<td>" + actionBtn + "</td>" +
        "</tr>"
      );
    }).join("");

    wrap.innerHTML =
      '<div class="kircle-table-scroll">' +
      '<table class="kircle-admin-table">' +
      "<thead><tr>" +
      '<th class="kircle-admin-col-num">No</th>' +
      "<th>Tên</th>" +
      '<th class="kircle-admin-col-email">Email</th>' +
      "<th>Trạng thái</th>" +
      "<th>Quản lý</th>" +
      "</tr></thead>" +
      "<tbody>" + rows + "</tbody>" +
      "</table></div>";
  }

  document.getElementById("admin-user-table-wrap").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    var uid = btn.getAttribute("data-uid");
    if (!uid) return;

    var target = KircleDB.users.findById(uid);
    var name = target ? (target.fullName || target.username) : uid;

    if (action === "lock") {
      showConfirm({
        title: 'Khóa tài khoản "' + name + '"?',
        desc: "Tài khoản này sẽ không thể đăng nhập cho đến khi được mở khóa.",
        okLabel: "Khóa",
        danger: true,
        onOk: function () {
          KircleDB.users.update(uid, { locked: true, status: "Bị khóa" });
          showToast("Đã khóa tài khoản thành công.");
          renderTable();
        }
      });
    } else if (action === "unlock") {
      showConfirm({
        title: 'Mở khóa tài khoản "' + name + '"?',
        desc: "Tài khoản này sẽ có thể đăng nhập trở lại.",
        okLabel: "Mở khóa",
        danger: false,
        onOk: function () {
          KircleDB.users.update(uid, { locked: false, status: "Hoạt động" });
          showToast("Đã mở khóa tài khoản thành công.");
          renderTable();
        }
      });
    }
  });

  document.getElementById("header-username").textContent = user.fullName || "Admin";
  KircleRouter.setAvatar(document.getElementById("header-avatar"), user.fullName, user.avatar);
  document.getElementById("header-avatar").alt = user.fullName || "";

  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn && typeof KircleTheme !== "undefined") {
    themeBtn.addEventListener("click", function () {
      KircleTheme.toggleTheme();
    });
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

  var notifBadge = document.getElementById("notif-badge");
  if (notifBadge && typeof KircleMockNotifications !== "undefined") {
    var n = KircleMockNotifications.getUnreadCount(user.id);
    if (n > 0) {
      notifBadge.textContent = n > 99 ? "99+" : n;
      notifBadge.style.display = "inline-block";
    }
  }

  renderTable();
})();
