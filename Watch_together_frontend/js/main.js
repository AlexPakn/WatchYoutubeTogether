import { initRouter } from "./router.js";
import { refreshTokenIfNeeded } from "./api.js";

const app = document.getElementById("app");
initRouter(app);

// Check token every 5 minutes
setInterval(() => {
  refreshTokenIfNeeded();
}, 5 * 60 * 1000);
