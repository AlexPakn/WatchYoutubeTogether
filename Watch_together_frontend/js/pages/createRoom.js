export function renderCreateRoom(container) {
  container.innerHTML = `
    <h2>Create or Join a Room</h2>
    <label>Room ID: <input type="text" id="roomId" placeholder="e.g. test-room"></label>
    <label>Password (optional): <input type="text" id="roomPassword"></label>
    <button id="createRoomBtn">Create / Join</button>
  `;
  document.getElementById("createRoomBtn").onclick = () => {
    const id = document.getElementById("roomId").value.trim();
    if (!id) return alert("Enter Room ID!");
    location.hash = `/room/${id}`;
  };
}
