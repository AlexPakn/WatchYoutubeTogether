export function renderCreateRoom(container) {
  container.innerHTML = `
    <h2>Создать или войти в комнату</h2>
    <label>Room ID: <input type="text" id="roomId" placeholder="например test-room"></label>
    <label>Пароль (опционально): <input type="text" id="roomPassword"></label>
    <button id="createRoomBtn">Создать / Войти</button>
  `;
  document.getElementById("createRoomBtn").onclick = () => {
    const id = document.getElementById("roomId").value.trim();
    if (!id) return alert("Введите Room ID!");
    location.hash = `/room/${id}`;
  };
}
