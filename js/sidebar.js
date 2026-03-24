(function () {
  function injectAdminLink(nav) {
    if (typeof KircleAuth === "undefined") return;
    var user = KircleAuth.getCurrentUser();
    if (!user || user.role !== "admin") return;

    var href = window.location.href;
    var isActive = href.indexOf("admin-users.html") !== -1;

    var link = document.createElement("a");
    link.href = "admin-users.html";
    if (isActive) link.className = "is-active";
    var usesIconStyle = !!nav.querySelector(".kircle-nav-label");
    if (usesIconStyle) {
      link.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>' +
        '<circle cx="9" cy="7" r="4"/>' +
        '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>' +
        '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>' +
        "</svg>" +
        '<span class="kircle-nav-label">Quản lý người dùng</span>';
    } else {
      link.textContent = "Quản lý người dùng";
    }

    nav.appendChild(link);
  }

  function init() {
    var toggle = document.getElementById("sidebar-toggle");
    var overlay = document.getElementById("sidebar-overlay");
    var sidebar = document.getElementById("sidebar");
    var mobileSearchToggle = document.getElementById("mobile-search-toggle");
    var searchInput = document.getElementById("feed-search");
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
    if (nav) injectAdminLink(nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
