(function () {
  KircleAuth.redirectIfLoggedIn("../../");
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
      errEl.textContent = "Email hoặc mật khẩu không đúng.";
      errEl.style.display = "block";
    }
  });
})();

