import { renderAuth } from "./pages/auth.js";
import { renderProfile } from "./pages/profile.js";
import { renderHome } from "./pages/home.js";
import { renderCreateRoom } from "./pages/createRoom.js";
import { renderRoom } from "./pages/room.js";

export function initRouter(app) {
  function router() {
    const hash = location.hash.slice(1) || "/";
    const token = localStorage.getItem("accessToken");
    const protectedRoutes = ["/create-room", "/profile", "/room"];

    if (!token && protectedRoutes.some(r => hash.startsWith(r))) {
      location.hash = "/auth";
      return;
    }

    app.innerHTML = "";
    if (hash === "/" || hash === "") renderHome(app);
    else if (hash.startsWith("/auth")) renderAuth(app);
    else if (hash.startsWith("/profile")) renderProfile(app);
    else if (hash.startsWith("/create-room")) renderCreateRoom(app);
    else if (hash.startsWith("/room/")) {
      const code = hash.split("/")[2];
      renderRoom(app, code);
    } else renderHome(app);
  }

  window.addEventListener("hashchange", router);
  window.addEventListener("load", router);
}
