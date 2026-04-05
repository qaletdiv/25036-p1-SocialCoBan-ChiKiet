(function () {
  var _existing = KircleAuth.getCurrentUser();
  if (_existing) {
    window.location.href = "../../" + KircleRouter.getRedirectForRole(_existing.role);
    return;
  }
  var form = document.getElementById("login-form");
  var errEl = document.getElementById("login-error");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errEl.style.display = "none";
    var email = document.getElementById("login-email").value.trim();
    var password = document.getElementById("login-password").value;
    var user = KircleAuth.login(email, password);
    if (user) {
      var url = "../../" + KircleRouter.getRedirectForRole(user.role);
      window.location.href = url;
    } else {
      var found = typeof KircleMockUsers !== "undefined"
        ? KircleMockUsers.findByEmail(email)
        : null;
      if (found && found.password === password && found.locked) {
        errEl.textContent = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.";
      } else {
        errEl.textContent = "Email hoặc mật khẩu không đúng.";
      }
      errEl.style.display = "block";
    }
  });
})();

