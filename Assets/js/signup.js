// ===== OAE Signup Form Script =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");
  const msg = document.getElementById("signup-msg");

  function showMsg(text, success = false) {
    msg.textContent = text;
    msg.style.color = success ? "#007b3e" : "#b00020";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";

    const data = new FormData(form);
    const name = (data.get("name") || "").trim();
    const email = (data.get("email") || "").trim();
    const password = data.get("password") || "";
    const confirm = data.get("confirm") || "";

    // --- Validation Checks ---
    if (!name || !email || !password || !confirm) {
      showMsg("⚠️ Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      showMsg("⚠️ Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirm) {
      showMsg("⚠️ Passwords do not match.");
      return;
    }

    // --- Demo Success ---
    showMsg("✅ Account created successfully (demo). Redirecting...", true);

    setTimeout(() => {
      window.location.href = "login.htm";
    }, 1500);
  });
});
