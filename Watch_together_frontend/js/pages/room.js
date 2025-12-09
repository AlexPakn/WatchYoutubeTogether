import { API_BASE } from "../api.js";

export async function renderRoom(container, roomCode) {
  container.innerHTML = `
    <h2>Room: ${roomCode}</h2>
    <label>Password (if any): <input type="text" id="roomPassword"></label>
    <button id="connectBtn">Connect</button>
    <button id="leaveRoomBtn" style="display:none;">Leave Room</button>

    <div id="status"></div>

    <div id="hostControls" style="display:none;margin-top:15px;">
      <h3>Room Controls (host only)</h3>
      <div>
        <label>Change password:
          <input type="text" id="newPassword" placeholder="leave empty to remove">
        </label>
        <button id="setPasswordBtn">Apply</button>
      </div>
      <div style="margin-top:15px;">
        <h4>Participants:</h4>
        <button id="refreshUsersBtn">Refresh List</button>
        <div id="userList">Loading...</div>
      </div>
    </div>

    <p id="roleStatus"></p>

    <label>YouTube URL: <input type="text" id="videoUrl" size="70"></label>
    <button id="setVideoBtn" disabled>Set Video</button>

    <div id="videoContainer">
      <div id="chat">
        <div><strong>Chat:</strong></div>
        <div id="chatMessages"></div>
        <div id="chatInputContainer">
          <input type="text" id="chatInput" placeholder="Type a message...">
          <button id="sendChatBtn">Send</button>
        </div>
      </div>

      <div id="player"></div>
    </div>
  `;

  const statusDiv = document.getElementById("status");
  const roleStatus = document.getElementById("roleStatus");
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const hostControls = document.getElementById("hostControls");

  let connection, player, isHost = false;

  function setStatus(msg, color = "#0f0") {
    statusDiv.textContent = msg;
    statusDiv.style.color = color;
  }

//  === Chat messages (same logic as before) ===
  async function appendChatMessage(data) {
    let text = data.text || data.message || "";
    let username = "";
    let avatarUrl = "";
    if (data.userId) {
      try {
        const res = await fetch(`${API_BASE}/api/User/${data.userId}`);
        if (res.ok) {
          const user = await res.json();
          username = user.username;
          avatarUrl = user.avatarUrl;
        } else username = `User ${data.userId}`;
      } catch {
        username = `User ${data.userId}`;
      }
    }

    const div = document.createElement("div");
    div.className = "chat-message";
    if (avatarUrl) {
      const img = document.createElement("img");
      img.src = avatarUrl;
      img.width = 32;
      img.height = 32;
      img.style.marginRight = "8px";
      div.appendChild(img);
    }
    const meta = document.createElement("span");
    meta.className = "chat-meta";
    meta.textContent = `${username || "User"}: `;
    div.appendChild(meta);
    div.appendChild(document.createTextNode(text));
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // === Connection ===
  async function connectToRoom() {
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("Please sign in!");
    const password = document.getElementById("roomPassword").value.trim();
    setStatus("Connecting...", "#aaa");

    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/watch?access_token=${encodeURIComponent(token)}`, { withCredentials: true })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.on("ReceiveCommand", async (command, data) => {
      console.log("Received:", command, data);
      switch (command) {
        case "unauthorized":
          setStatus("Unauthorized: " + data.message, "red"); return;

        case "set_role":
          isHost = data.role === "host";
          roleStatus.textContent = "Вы: " + data.role;
          document.getElementById("setVideoBtn").disabled = !isHost;
          hostControls.style.display = isHost ? "block" : "none";
          if (isHost) loadUserList();
          break;

        case "chat_message": appendChatMessage(data); break;
        case "chat_history":
          chatMessages.innerHTML = "";
          (data || []).forEach(appendChatMessage);
          break;

        case "kicked":
          alert(data.message || "You were kicked by the host");
          location.hash = "/";
          break;

        case "password_updated":
          alert("Password successfully updated!");
          break;

        default:
          if (!isHost) {
            switch (command) {
              case "play": player.seekTo(data.time, true); player.playVideo(); break;
              case "pause": player.seekTo(data.time, true); player.pauseVideo(); break;
              case "set_video": loadVideo(data.url); break;
            }
          }
          break;
      }
    });

    connection.onclose(() => setStatus("Disconnected", "red"));

    try {
      await connection.start();
      setStatus("Connected!", "#0f0");
      document.getElementById("leaveRoomBtn").style.display = "inline";
      await connection.invoke("JoinRoom", roomCode, password);
      await connection.invoke("SendCommand", roomCode, "get_role", {});
      await connection.invoke("GetChatHistory", roomCode);
    } catch (err) {
      setStatus("Connection failed", "red");
      console.error(err);
    }
  }

  
  async function leaveRoom() {
    if (!connection) return alert("You are not connected to a room.");
    try {
      await connection.invoke("LeaveRoom", roomCode);
      await connection.stop();

      location.hash = "/"; // optional: return to main screen
    } catch (err) {
      console.error("Error Exit:", err);
      setStatus("Error leaving room", "red");
    }
  }

  // === SendCommand helper ===
  function sendCommand(command, data) {
    if (connection?.state === "Connected")
      connection.invoke("SendCommand", roomCode, command, data);
  }

  // === User list (host only) ===
  async function loadUserList() {
    const listDiv = document.getElementById("userList");
    listDiv.innerHTML = "Loading...";
    try {
      const res = await fetch(`${API_BASE}/api/WatchRoom/user-ids/${roomCode}`);
      if (!res.ok) throw new Error("Error: " + res.status);
      const data = await res.json();
      if (!data.userIds || !data.userIds.length) {
        listDiv.innerHTML = "<p>No users.</p>";
        return;
      }

      const users = await Promise.all(
        data.userIds.map(async id => {
          try {
            const uRes = await fetch(`${API_BASE}/api/User/${id}`);
            if (!uRes.ok) return { id };
            const u = await uRes.json();
            return { id, username: u.username, avatarUrl: u.avatarUrl };
          } catch {
            return { id };
          }
        })
      );

      listDiv.innerHTML = users.map(u => `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div style="display:flex;align-items:center;">
            <img src="${u.avatarUrl || ""}" width="32" height="32" style="border-radius:50%;margin-right:8px;">
            <span>${u.username || "User " + u.id}</span>
          </div>
          <div>
            <button class="transferBtn" data-id="${u.id}">Give host</button>
            <button class="kickBtn" data-id="${u.id}">Kick</button>
          </div>
        </div>
      `).join("");

      document.querySelectorAll(".transferBtn").forEach(btn => {
        btn.onclick = () => sendCommand("transfer_host", { userId: parseInt(btn.dataset.id) });
      });

      document.querySelectorAll(".kickBtn").forEach(btn => {
        btn.onclick = () => {
          sendCommand("kick", { userId: parseInt(btn.dataset.id) });
          // assume backend worked → refresh list
          setTimeout(loadUserList, 1000);
        };
      });

    } catch (err) {
      listDiv.innerHTML = `<p style="color:red;">ERROR loading users: ${err.message}</p>`;
    }
  }

  document.getElementById("refreshUsersBtn").onclick = loadUserList;


  // === Change room password (host only) ===
  document.getElementById("setPasswordBtn").onclick = () => {
    const newPass = document.getElementById("newPassword").value.trim();
    sendCommand("set_password", { password: newPass });
  };

  //  === Player + Chat logic (same as before) ===
  function extractYouTubeId(url) {
    const regExp = /^.*(?:youtu\.be\/|v\/|embed\/|watch\\?v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  }

  function loadVideo(url) {
    const id = extractYouTubeId(url);
    if (!id) return alert("Invalid YouTube URL");
    if (player) player.cueVideoById(id);
    else {
      player = new YT.Player('player', {
        height: '580', width: '1080', videoId: id,
        events: { 'onStateChange': onPlayerStateChange }
      });
    }
  }

  function onPlayerStateChange(event) {
    if (!isHost) return;
    const t = player.getCurrentTime();
    if (event.data === YT.PlayerState.PLAYING)
      sendCommand("play", { time: t });
    else if (event.data === YT.PlayerState.PAUSED)
      sendCommand("pause", { time: t });
  }

  sendChatBtn.onclick = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    sendCommand("chat_message", { text });
    chatInput.value = "";
  };

  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendChatBtn.onclick();
  });

  document.getElementById("connectBtn").onclick = connectToRoom;
  document.getElementById("setVideoBtn").onclick = () => {
    const url = document.getElementById("videoUrl").value.trim();
    if (!url) return;
    loadVideo(url);
    sendCommand("set_video", { url });
  };
  document.getElementById("leaveRoomBtn").onclick = leaveRoom;
}
