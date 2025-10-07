import { apiGet } from "../api.js";

export async function renderProfile(container) {
  container.innerHTML = "<h2>Профиль</h2><div id='profile'>Загрузка...</div>";
  try {
    const data = await apiGet("/api/User/me", true);
    document.getElementById("profile").innerHTML = `
      <p><b>ID:</b> ${data.id}</p>
      <p><b>Имя:</b> ${data.username}</p>
      <img src="${data.avatarUrl}" width="100">
      <br><button id='logout'>Выйти</button>
    `;
    document.getElementById("logout").onclick = () => {
      localStorage.removeItem("accessToken");
      location.hash = "/auth";
    };
  } catch {
    container.innerHTML += "<p style='color:red'>Ошибка загрузки профиля</p>";
  }
}
