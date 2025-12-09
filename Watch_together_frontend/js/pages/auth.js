import { apiPost } from "../api.js";

export function renderAuth(container) {
  container.innerHTML = `
    <h2>Auth</h2>

    <div id="authTabs">
      <button id="tabLogin" class="active">Login</button>
      <button id="tabSignup">Sign Up</button>
      <button id="tabForgot">Forgot Password?</button>
    </div>

    <div id="authContent"></div>
  `;

  const tabs = {
    login: document.getElementById("tabLogin"),
    signup: document.getElementById("tabSignup"),
    forgot: document.getElementById("tabForgot"),
  };

  const content = document.getElementById("authContent");

  const setActive = (name) => {
    Object.values(tabs).forEach(t => t.classList.remove("active"));
    tabs[name].classList.add("active");
  };

  // === LOGIN FORM ===
  const loginForm = `
    <form id="loginForm">
      <input id="loginEmail" type="email" placeholder="Email" required>
      <input id="loginPassword" type="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  `;

  // === SIGNUP FORM ===
  const signupForm = `
    <form id="signupForm">
      <input id="signupEmail" type="email" placeholder="Email" required>
      <input id="signupUsername" type="text" placeholder="Username" required>
      <input id="signupPassword" type="password" placeholder="Password" required>
      <button type="submit">Sign Up</button>
      <p id="signupStatus" style="color:#0f0;margin-top:5px;"></p>
    </form>
  `;

  // === FORGOT PASSWORD FORM ===
  const forgotForm = `
    <form id="forgotForm">
      <input id="forgotEmail" type="email" placeholder="Email" required>
      <input id="forgotPassword" type="password" placeholder="New Password" required>
      <button type="submit">Reset Password</button>
      <p id="forgotStatus" style="color:#0f0;margin-top:5px;"></p>
    </form>
  `;

  // --- Tab handlers ---
  tabs.login.onclick = () => { setActive("login"); content.innerHTML = loginForm; attachLogin(); };
  tabs.signup.onclick = () => { setActive("signup"); content.innerHTML = signupForm; attachSignup(); };
  tabs.forgot.onclick = () => { setActive("forgot"); content.innerHTML = forgotForm; attachForgot(); };

  // Default tab
  tabs.login.onclick();

  // === Attach handlers ===
  function attachLogin() {
    document.getElementById("loginForm").onsubmit = async e => {
      e.preventDefault();
      try {
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const data = await apiPost("/api/Auth/signin", { email, password });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        location.hash = "/";
      } catch (err) {
        alert("Login error: " + err.message);
      }
    };
  }

  function attachSignup() {
    const emailInput = document.getElementById("signupEmail");
    const status = document.getElementById("signupStatus");

    // Auto email check
    emailInput.addEventListener("blur", async () => {
      const email = emailInput.value.trim();
      if (!email) return;
      try {
        const res = await apiPost("/api/Auth/check-email", email);
        if (res.registered) {
          status.style.color = "red";
          status.textContent = "This email is already registered. Try logging in.";
        } else {
          status.style.color = "#0f0";
          status.textContent = "Email is available ✅";
        }
      } catch {
        status.style.color = "orange";
        status.textContent = "Failed to check email.";
      }
    });

    document.getElementById("signupForm").onsubmit = async e => {
      e.preventDefault();
      try {
        const email = emailInput.value.trim();
        const username = document.getElementById("signupUsername").value.trim();
        const password = document.getElementById("signupPassword").value.trim();
        const res = await apiPost("/api/Auth/signup", { email, username, password });
        status.style.color = "#0f0";
        status.textContent = res.message || "Confirmation email sent.";
      } catch (err) {
        status.style.color = "red";
        status.textContent = "Error: " + err.message;
      }
    };
  }

  function attachForgot() {
    const status = document.getElementById("forgotStatus");
    document.getElementById("forgotForm").onsubmit = async e => {
      e.preventDefault();
      try {
        const email = document.getElementById("forgotEmail").value.trim();
        const password = document.getElementById("forgotPassword").value.trim();
        const res = await apiPost("/api/Auth/forgot-password", { email, password });
        status.style.color = "#0f0";
        status.textContent = res.message || "Password reset email sent.";
      } catch (err) {
        status.style.color = "red";
        status.textContent = "Error: " + err.message;
      }
    };
  }
}
