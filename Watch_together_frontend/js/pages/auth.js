import { apiPost } from "../api.js";

export function renderAuth(container) {
  container.innerHTML = `
    <h2>Авторизация</h2>

    <div id="authTabs">
      <button id="tabLogin" class="active">Войти</button>
      <button id="tabSignup">Регистрация</button>
      <button id="tabForgot">Забыли пароль?</button>
    </div>

    <div id="authContent"></div>
  `;

  const tabs = {
    login: document.getElementById("tabLogin"),
    signup: document.getElementById("tabSignup"),
    forgot: document.getElementById("tabForgot"),
  };

  const content = document.getElementById("authContent");

  const setActive = (name) => {
    Object.values(tabs).forEach(t => t.classList.remove("active"));
    tabs[name].classList.add("active");
  };

  // === LOGIN FORM ===
  const loginForm = `
    <form id="loginForm">
      <input id="loginEmail" type="email" placeholder="Email" required>
      <input id="loginPassword" type="password" placeholder="Пароль" required>
      <button type="submit">Войти</button>
    </form>
  `;

  // === SIGNUP FORM ===
  const signupForm = `
    <form id="signupForm">
      <input id="signupEmail" type="email" placeholder="Email" required>
      <input id="signupUsername" type="text" placeholder="Имя пользователя" required>
      <input id="signupPassword" type="password" placeholder="Пароль" required>
      <button type="submit">Зарегистрироваться</button>
      <p id="signupStatus" style="color:#0f0;margin-top:5px;"></p>
    </form>
  `;

  // === FORGOT PASSWORD FORM ===
  const forgotForm = `
    <form id="forgotForm">
      <input id="forgotEmail" type="email" placeholder="Email" required>
      <input id="forgotPassword" type="password" placeholder="Новый пароль" required>
      <button type="submit">Сбросить пароль</button>
      <p id="forgotStatus" style="color:#0f0;margin-top:5px;"></p>
    </form>
  `;

  // --- Tab handlers ---
  tabs.login.onclick = () => { setActive("login"); content.innerHTML = loginForm; attachLogin(); };
  tabs.signup.onclick = () => { setActive("signup"); content.innerHTML = signupForm; attachSignup(); };
  tabs.forgot.onclick = () => { setActive("forgot"); content.innerHTML = forgotForm; attachForgot(); };

  // Default tab
  tabs.login.onclick();

  // === Attach handlers ===
  function attachLogin() {
    document.getElementById("loginForm").onsubmit = async e => {
      e.preventDefault();
      try {
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const data = await apiPost("/api/Auth/signin", { email, password });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        location.hash = "/";
      } catch (err) {
        alert("Ошибка входа: " + err.message);
      }
    };
  }

  function attachSignup() {
    const emailInput = document.getElementById("signupEmail");
    const status = document.getElementById("signupStatus");

    // Auto email check
    emailInput.addEventListener("blur", async () => {
      const email = emailInput.value.trim();
      if (!email) return;
      try {
        const res = await apiPost("/api/Auth/check-email", email);
        if (res.registered) {
          status.style.color = "red";
          status.textContent = "Этот email уже зарегистрирован. Попробуйте войти.";
        } else {
          status.style.color = "#0f0";
          status.textContent = "Email свободен ✅";
        }
      } catch {
        status.style.color = "orange";
        status.textContent = "Не удалось проверить email.";
      }
    });

    document.getElementById("signupForm").onsubmit = async e => {
      e.preventDefault();
      try {
        const email = emailInput.value.trim();
        const username = document.getElementById("signupUsername").value.trim();
        const password = document.getElementById("signupPassword").value.trim();
        const res = await apiPost("/api/Auth/signup", { email, username, password });
        status.style.color = "#0f0";
        status.textContent = res.message || "Письмо с подтверждением отправлено.";
      } catch (err) {
        status.style.color = "red";
        status.textContent = "Ошибка: " + err.message;
      }
    };
  }

  function attachForgot() {
    const status = document.getElementById("forgotStatus");
    document.getElementById("forgotForm").onsubmit = async e => {
      e.preventDefault();
      try {
        const email = document.getElementById("forgotEmail").value.trim();
        const password = document.getElementById("forgotPassword").value.trim();
        const res = await apiPost("/api/Auth/forgot-password", { email, password });
        status.style.color = "#0f0";
        status.textContent = res.message || "Письмо для сброса отправлено.";
      } catch (err) {
        status.style.color = "red";
        status.textContent = "Ошибка: " + err.message;
      }
    };
  }
}
