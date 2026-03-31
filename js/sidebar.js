(function () {
  function injectAdminLink(nav) {
    if (typeof KircleAuth === "undefined") return;
    var user = KircleAuth.getCurrentUser();
    if (!user || user.role !== "admin") return;

    var href = window.location.href;

    var adminLinks = [
      { href: "admin-users.html", label: "Quản lý người dùng" },
      { href: "admin-reports.html", label: "Quản lý báo cáo" },
    ];

    nav.innerHTML = "";
    nav.dataset.adminNav = "true";

    adminLinks.forEach(function (item) {
      var a = document.createElement("a");
      a.href = item.href;
      if (href.indexOf(item.href) !== -1) a.className = "is-active";
      a.textContent = item.label;
      nav.appendChild(a);
    });

  }

  function init() {
    var toggle = document.getElementById("sidebar-toggle");
    var overlay = document.getElementById("sidebar-overlay");
    var sidebar = document.getElementById("sidebar");
    var mobileSearchToggle = document.getElementById("mobile-search-toggle");
    var searchInput = document.getElementById("feed-search") ||
      document.getElementById("profile-search") ||
      document.getElementById("admin-users-search") ||
      document.getElementById("admin-reports-search");
    var app = document.body;

    if (!toggle || !overlay || !sidebar || !app) return;

    function isOpen() {
      return app.classList.contains("kircle-sidebar-open");
    }

    function open() {
      app.classList.add("kircle-sidebar-open");
      overlay.classList.add("is-visible");
      overlay.setAttribute("aria-hidden", "false");
      if (toggle) toggle.setAttribute("aria-expanded", "true");
    }

    function close() {
      app.classList.remove("kircle-sidebar-open");
      overlay.classList.remove("is-visible");
      overlay.setAttribute("aria-hidden", "true");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    function toggleSidebar() {
      if (isOpen()) close();
      else open();
    }

    toggle.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", close);

    sidebar.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    function isSearchOpen() {
      return app.classList.contains("kircle-search-open");
    }

    function openSearch() {
      app.classList.add("kircle-search-open");
      if (searchInput) {
        searchInput.focus();
      }
    }

    function closeSearch() {
      app.classList.remove("kircle-search-open");
    }

    function toggleSearch() {
      if (isSearchOpen()) closeSearch();
      else openSearch();
    }

    if (mobileSearchToggle) {
      mobileSearchToggle.addEventListener("click", toggleSearch);
    }

    var nav = sidebar.querySelector(".kircle-sidebar-nav");
    if (nav && !nav.dataset.adminNav) injectAdminLink(nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
