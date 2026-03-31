(function () {
  function getInitials(name) {
    return (name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (w) { return w[0].toUpperCase(); })
      .join("");
  }

  function buildProfileUrl(username) {
    var parts = window.location.pathname.split("/");
    parts[parts.length - 1] = "profile.html";
    return parts.join("/") + "?user=" + encodeURIComponent(username);
  }

  function initUserSearch(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;

    var wrapper = input.closest(".kircle-header-search");
    if (!wrapper) return;

    var dropdown = null;
    var debounceTimer = null;

    function hideDropdown() {
      if (dropdown && dropdown.parentNode) {
        dropdown.parentNode.removeChild(dropdown);
      }
      dropdown = null;
    }

    function showDropdown(users) {
      hideDropdown();

      dropdown = document.createElement("div");
      dropdown.className = "kircle-user-search-dropdown";
      dropdown.setAttribute("role", "listbox");
      dropdown.setAttribute("aria-label", "Kết quả tìm kiếm người dùng");

      if (users.length === 0) {
        var empty = document.createElement("div");
        empty.className = "kircle-user-search-empty";
        empty.textContent = "Không tìm thấy người dùng nào.";
        dropdown.appendChild(empty);
      } else {
        users.forEach(function (u) {
          var item = document.createElement("a");
          item.className = "kircle-user-search-item";
          item.href = buildProfileUrl(u.username);
          item.setAttribute("role", "option");
          item.setAttribute("tabindex", "0");

          var avatarEl;
          if (u.avatar) {
            avatarEl = document.createElement("img");
            avatarEl.className = "kircle-user-search-avatar";
            avatarEl.src = u.avatar;
            avatarEl.alt = u.fullName || u.username;
          } else {
            avatarEl = document.createElement("div");
            avatarEl.className = "kircle-user-search-initials";
            avatarEl.textContent = getInitials(u.fullName || u.username);
            avatarEl.setAttribute("aria-hidden", "true");
          }

          var info = document.createElement("div");
          info.className = "kircle-user-search-info";

          var nameEl = document.createElement("span");
          nameEl.className = "kircle-user-search-name";
          nameEl.textContent = u.fullName || u.username;

          var usernameEl = document.createElement("span");
          usernameEl.className = "kircle-user-search-username";
          usernameEl.textContent = "@" + u.username;

          info.appendChild(nameEl);
          info.appendChild(usernameEl);
          item.appendChild(avatarEl);
          item.appendChild(info);
          dropdown.appendChild(item);
        });
      }

      wrapper.appendChild(dropdown);
    }

    function searchUsers(query) {
      var q = query.trim().toLowerCase();
      if (!q) {
        hideDropdown();
        return;
      }

      var all = KircleDB.users.getAll();
      var results = all
        .filter(function (u) {
          return u.role !== "admin" &&
            (u.fullName || "").toLowerCase().indexOf(q) !== -1;
        })
        .slice(0, 8);

      showDropdown(results);
    }

    input.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        searchUsers(input.value);
      }, 150);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        hideDropdown();
        input.blur();
        return;
      }

      if (!dropdown) return;

      var items = dropdown.querySelectorAll(".kircle-user-search-item");
      if (!items.length) return;

      var focused = dropdown.querySelector(".kircle-user-search-item:focus");
      var idx = Array.prototype.indexOf.call(items, focused);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        var next = idx < items.length - 1 ? items[idx + 1] : items[0];
        next.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        var prev = idx > 0 ? items[idx - 1] : items[items.length - 1];
        prev.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target)) {
        hideDropdown();
      }
    });

    input.addEventListener("focus", function () {
      if (input.value.trim()) {
        searchUsers(input.value);
      }
    });
  }

  window.KircleUserSearch = { init: initUserSearch };
})();
