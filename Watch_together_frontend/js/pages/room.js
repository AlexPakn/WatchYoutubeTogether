import { API_BASE } from "../api.js";

export function renderRoom(container, roomCode) {
  
  container.innerHTML = `
        <h2>Комната: ${roomCode}</h2>
        <label>Пароль (если есть): <input type="text" id="roomPassword"></label>
        <button id="connectBtn">Подключиться</button>
        <div id="status"></div>

        <label>YouTube URL: <input type="text" id="videoUrl" size="70"></label>
        <button id="setVideoBtn" disabled>Set Video</button>

        <div id="player"></div>
        <p id="roleStatus"></p>

        <div id="chat">
          <div><strong>Chat:</strong></div>
          <div id="chatMessages"></div>
          <input type="text" id="chatInput" placeholder="Type a message...">
          <button id="sendChatBtn">Send</button>
        </div>
      `;

      const passwordInput = document.getElementById("roomPassword");
      const statusDiv = document.getElementById("status");
      const roleStatus = document.getElementById("roleStatus");
      const chatMessages = document.getElementById("chatMessages");
      const chatInput = document.getElementById("chatInput");
      const sendChatBtn = document.getElementById("sendChatBtn");

      let connection, player, isHost = false;

      function setStatus(msg, color = "#0f0") {
        statusDiv.textContent = msg;
        statusDiv.style.color = color;
      }

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

      async function connectToRoom() {
        const token = localStorage.getItem("accessToken");
        if (!token) return alert("Авторизуйтесь!");
        const password = passwordInput.value.trim();
        setStatus("Connecting...", "#aaa");

        connection = new signalR.HubConnectionBuilder()
          .withUrl(`${API_BASE}/watch?access_token=${encodeURIComponent(token)}`, { withCredentials: true })
          .configureLogging(signalR.LogLevel.Information)
          .build();

        connection.on("ReceiveCommand", async (command, data) => {
          console.log("Received:", command, data);
          if (command === "unauthorized") {
            setStatus("Unauthorized: " + data.message, "red");
            return;
          }
          if (command === "set_role") {
            isHost = data.role === "host";
            roleStatus.textContent = "Вы: " + data.role;
            document.getElementById("setVideoBtn").disabled = !isHost;
          }
          if (command === "chat_message") appendChatMessage(data);
          if (command === "chat_history") {
            chatMessages.innerHTML = "";
            (data || []).forEach(appendChatMessage);
          }

          if (!isHost) {
            switch (command) {
              case "play": player.seekTo(data.time, true); player.playVideo(); break;
              case "pause": player.seekTo(data.time, true); player.pauseVideo(); break;
              case "set_video": loadVideo(data.url); break;
            }
          }
        });

        connection.onclose(() => setStatus("Disconnected", "red"));

        try {
          await connection.start();
          setStatus("Connected!", "#0f0");
          await connection.invoke("JoinRoom", roomCode, password);
          await connection.invoke("SendCommand", roomCode, "get_role", {});
          await connection.invoke("GetChatHistory", roomCode);
        } catch (err) {
          setStatus("Connection failed", "red");
          console.error(err);
        }
      }

      function sendCommand(command, data) {
        if (connection?.state === "Connected")
          connection.invoke("SendCommand", roomCode, command, data);
      }

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
            height: '390', width: '720', videoId: id,
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
}
