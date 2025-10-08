import { apiGet, API_BASE } from "../api.js";

export async function renderProfile(container) {
  container.innerHTML = `
    <h2>Профиль</h2>
    <div id="profile">Загрузка...</div>
  `;

  try {
    const data = await apiGet("/api/User/me", true);
    renderProfileForm(data);
  } catch {
    container.innerHTML += "<p style='color:red'>Ошибка загрузки профиля</p>";
  }

  function renderProfileForm(user) {
    const div = document.getElementById("profile");
    div.innerHTML = `
      <form id="profileForm" enctype="multipart/form-data">
        <p><b>ID:</b> ${user.id}</p>
        <label>
          Имя пользователя:
          <input type="text" id="username" value="${user.username || ""}" required>
        </label>
        <br>
        <label>Аватар:</label><br>
        <img id="avatarPreview" src="${user.avatarUrl || ""}" width="100" style="border-radius:8px;margin-bottom:8px;"><br>
        <input type="file" id="avatarInput" accept="image/*"><br>
        <button type="submit">Сохранить изменения</button>
      </form>
      <br>
      <button id="logout">Выйти</button>
      <p id="profileStatus" style="margin-top:10px;color:#0f0;"></p>
    `;

    const form = document.getElementById("profileForm");
    const avatarInput = document.getElementById("avatarInput");
    const avatarPreview = document.getElementById("avatarPreview");
    const status = document.getElementById("profileStatus");

    // --- preview image before upload ---
    avatarInput.onchange = () => {
      const file = avatarInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => { avatarPreview.src = e.target.result; };
        reader.readAsDataURL(file);
      }
    };

    // --- form submit ---
    form.onsubmit = async e => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const file = avatarInput.files[0];

      const token = localStorage.getItem("accessToken");
      if (!token) return alert("Необходимо войти!");

      const formData = new FormData();
      formData.append("Username", username);
      if (file) formData.append("Avatar", file);

      try {
        const res = await fetch(`${API_BASE}/api/User/update`, {
          method: "PUT",
          headers: { Authorization: token },
          body: formData,
        });
        if (!res.ok) throw new Error("Ошибка обновления: " + res.status);
        const data = await res.json();
        status.style.color = "#0f0";
        status.textContent = data.message || "Данные обновлены!";
      } catch (err) {
        status.style.color = "red";
        status.textContent = err.message;
      }
    };

    // --- logout ---
    document.getElementById("logout").onclick = () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      location.hash = "/auth";
    };
  }
}
