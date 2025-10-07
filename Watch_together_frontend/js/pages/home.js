import { apiGet } from "../api.js";

export async function renderHome(container) {
  container.innerHTML = "<h2>Публичные комнаты</h2><div id='rooms'>Загрузка...</div>";
  try {
    const data = await apiGet("/api/WatchRoom/public-codes", true);
    const list = document.getElementById("rooms");
    if (!data.codes || !data.codes.length) {
      list.innerHTML = "<p>Нет активных публичных комнат.</p>";
      return;
    }
    list.innerHTML = data.codes.map(code => `
      <div class="room-card">
        <span>Комната: <b>${code}</b></span>
        <button onclick="location.hash='#/room/${code}'">Присоединиться</button>
      </div>
    `).join("");
  } catch {
    document.getElementById("rooms").innerHTML = "<p style='color:red'>Ошибка загрузки комнат.</p>";
  }
}
