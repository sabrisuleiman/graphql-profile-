/**
 * auth.js
 * Handles login (Basic auth → JWT) and logout.
 *
 * The JWT is stored on window.__JWT so every gql() call
 * in queries.js can pick it up without a module system.
 */

const AUTH_URL = "https://learn.01founders.co/api/auth/signin";

/* ─── Initialise ─────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-btn").addEventListener("click", doLogin);
  document.getElementById("logout-btn").addEventListener("click", doLogout);

  // Allow Enter key to submit the login form
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Enter" &&
      document.getElementById("login-screen").style.display !== "none"
    ) {
      doLogin();
    }
  });
});

/* ─── Login ──────────────────────────────────── */
async function doLogin() {
  const identifier = document.getElementById("identifier").value.trim();
  const password = document.getElementById("password").value;
  const errEl = document.getElementById("login-error");
  const btn = document.getElementById("login-btn");

  // Clear previous errors
  showLoginError(null);

  // Basic client-side validation
  if (!identifier || !password) {
    showLoginError("Please enter your username/email and password.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Signing in…";

  try {
    // Encode credentials as Base64 for Basic auth
    const creds = btoa(`${identifier}:${password}`);

    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { Authorization: `Basic ${creds}` },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        showLoginError(
          "Invalid credentials. Check your username/email and password.",
        );
      } else {
        showLoginError(`Login failed (HTTP ${res.status}). Please try again.`);
      }
      return;
    }

    // The endpoint may return a bare string or a JSON object
    const raw = await res.text();
    let token;

    try {
      const json = JSON.parse(raw);
      token =
        typeof json === "string"
          ? json
          : json.token || json.jwt || Object.values(json)[0];
    } catch {
      token = raw.trim();
    }

    if (!token) {
      showLoginError("Unexpected server response. Please try again.");
      return;
    }

    // Store JWT globally so queries.js can read it
    window.__JWT = token;

    // Switch to the app
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").style.display = "block";

    // Kick off data loading (defined in app.js)
    loadAllData();
  } catch {
    showLoginError("Network error. Check your connection and try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
}

/* ─── Logout ─────────────────────────────────── */
function doLogout() {
  window.__JWT = null;

  // Reset UI back to login screen
  document.getElementById("app").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("identifier").value = "";
  document.getElementById("password").value = "";
  showLoginError(null);

  // Reset all profile cards so they show loading state next login
  const loadingCards = [
    "user-card",
    "xp-card",
    "audit-card",
    "skills-card",
    "graph-xp-time",
    "graph-audit-ratio",
    "graph-skills",
    "graph-passfail",
  ];
  loadingCards.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="loading-text">Loading…</div>';
  });
}

/* ─── Helper ─────────────────────────────────── */
/**
 * Show or hide the login error message.
 * @param {string|null} msg - Message to show, or null to hide.
 */
function showLoginError(msg) {
  const el = document.getElementById("login-error");
  if (msg) {
    el.textContent = msg;
    el.classList.add("visible");
  } else {
    el.classList.remove("visible");
    el.textContent = "";
  }
}
