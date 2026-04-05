(function () {
  var _existing = KircleAuth.getCurrentUser();
  if (_existing) {
    window.location.href = "../../" + KircleRouter.getRedirectForRole(_existing.role);
    return;
  }

  var form = document.getElementById("register-form");
  var errEl = document.getElementById("register-error");

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = "block";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /^[0-9\s\+\-]{8,15}$/.test(phone);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errEl.style.display = "none";

    var fullName = document.getElementById("reg-fullname").value.trim();
    var email = document.getElementById("reg-email").value.trim();
    var phone = document.getElementById("reg-phone").value.trim();
    var password = document.getElementById("reg-password").value;
    var confirmPassword = document.getElementById("reg-confirm-password").value;

    if (!fullName || fullName.length < 2) {
      showError("Vui lòng nhập họ tên (ít nhất 2 ký tự).");
      return;
    }

    if (!isValidEmail(email)) {
      showError("Email không đúng định dạng.");
      return;
    }

    if (!isValidPhone(phone)) {
      showError("Số điện thoại không hợp lệ.");
      return;
    }

    if (password.length < 6) {
      showError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Mật khẩu và nhập lại mật khẩu không khớp.");
      return;
    }

    var user = KircleMockUsers.register({
      fullName: fullName,
      email: email,
      phone: phone,
      password: password,
    });

    if (user) {
      KircleAuth.setUser(user);
      var url = "../../" + KircleRouter.getRedirectForRole(user.role);
      window.location.href = url;
    } else {
      showError("Email đã được sử dụng.");
    }
  });
})();
