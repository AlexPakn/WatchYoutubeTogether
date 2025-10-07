import { apiPost } from "../api.js";

export function renderAuth(container) {
  container.innerHTML = `
    <h2>Авторизация</h2>
    <form id="loginForm">
      <input id="email" type="email" placeholder="Email" required>
      <input id="password" type="password" placeholder="Пароль" required>
      <button type="submit">Войти</button>
    </form>
  `;
  document.getElementById("loginForm").onsubmit = async e => {
    e.preventDefault();
    try {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const data = await apiPost("/api/Auth/signin", { email, password });
      localStorage.setItem("accessToken", data.accessToken);
      location.hash = "/";
    } catch (err) {
      alert("Ошибка входа: " + err.message);
    }
  };
}
