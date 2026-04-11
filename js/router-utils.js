const KircleRouter = (function () {
  function getRedirectForRole(role) {
    if (role === "admin") return "pages/admin-users.html";
    return "pages/news.html";
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getQueryParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  }

  function initLogoNav() {
    var logoLink = document.querySelector(".kircle-header-logo");
    if (!logoLink || typeof KircleAuth === "undefined") return;

    function getDestForCurrentUser() {
      var u = KircleAuth.getCurrentUser();
      if (!u) return null;
      return u.role === "admin" ? "admin-users.html" : "news.html";
    }

    var dest = getDestForCurrentUser();
    if (dest) logoLink.setAttribute("href", dest);

    logoLink.addEventListener("click", function (e) {
      e.preventDefault();
      var target = getDestForCurrentUser();
      if (target) window.location.href = target;
    });
  }

  function guardUserOnlyPage() {
    if (typeof KircleAuth === "undefined") return;
    var u = KircleAuth.getCurrentUser();
    if (u && u.role === "admin") {
      window.location.href = "admin-users.html";
    }
  }

  function getInitials(name) {
    if (!name) return "?";
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function setAvatar(imgEl, name, avatarUrl) {
    if (!imgEl) return;
    var initials = getInitials(name);
    var size = parseInt(imgEl.getAttribute("width")) || 40;

    var ph = imgEl.nextElementSibling;
    if (!ph || !ph.hasAttribute("data-avatar-ph")) {
      ph = document.createElement("span");
      ph.setAttribute("data-avatar-ph", "1");
      ph.className = "kircle-post-avatar-placeholder";
      ph.setAttribute("aria-hidden", "true");
      if (size !== 40) {
        ph.style.width = size + "px";
        ph.style.height = size + "px";
        ph.style.fontSize = Math.round(size * 0.38) + "px";
      }
      ph.style.display = "none";
      imgEl.parentNode.insertBefore(ph, imgEl.nextSibling);
    }
    ph.textContent = initials;

    function showPh() {
      imgEl.style.display = "none";
      ph.style.display = "inline-flex";
    }
    function showImg() {
      imgEl.style.display = "";
      ph.style.display = "none";
    }

    if (avatarUrl) {
      showImg();
      imgEl.src = avatarUrl;
      imgEl.onerror = function () { showPh(); this.onerror = null; };
    } else {
      imgEl.src = "";
      imgEl.onerror = null;
      showPh();
    }
  }

  function showToast(msg, isError) {
    var old = document.getElementById("kircle-global-toast");
    if (old) old.remove();
    var el = document.createElement("div");
    el.id = "kircle-global-toast";
    el.className = "kircle-admin-toast" + (isError ? " kircle-admin-toast-error" : "");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add("kircle-admin-toast-visible"); }, 16);
    setTimeout(function () {
      el.classList.remove("kircle-admin-toast-visible");
      setTimeout(function () { if (el.parentNode) el.remove(); }, 300);
    }, 3000);
  }

  return {
    getRedirectForRole,
    getQueryParam,
    getQueryParams,
    initLogoNav,
    guardUserOnlyPage,
    showToast,
    getInitials,
    setAvatar,
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  KircleRouter.initLogoNav();
});
