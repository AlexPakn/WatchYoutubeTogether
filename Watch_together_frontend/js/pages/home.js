import { apiGet } from "../api.js";

export async function renderHome(container) {
  container.innerHTML = "<h2>Public Rooms</h2><div id='rooms'>Loading...</div>";
  try {
    const data = await apiGet("/api/WatchRoom/public-codes", true);
    const list = document.getElementById("rooms");
    if (!data.codes || !data.codes.length) {
      list.innerHTML = "<p>No active public rooms.</p>";
      return;
    }
    list.innerHTML = data.codes.map(code => `
      <div class="room-card">
        <span>Room: <b>${code}</b></span>
        <button onclick="location.hash='#/room/${code}'">Join</button>
      </div>
    `).join("");
  } catch {
    document.getElementById("rooms").innerHTML = "<p style='color:red'>Error loading rooms.</p>";
  }
}
