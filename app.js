const API_BASE = "http://localhost:3000/api/auth"; // change to your backend URL

// Error / Success containers
const registerError = document.getElementById("registerError");
const registerSuccess = document.getElementById("registerSuccess");
const loginError = document.getElementById("loginError");
const loginSuccess = document.getElementById("loginSuccess");
const verifyError = document.getElementById("verifyError");
const verifySuccess = document.getElementById("verifySuccess");

async function handleRegister(event) {
  event.preventDefault();
  registerError.textContent = "";
  registerSuccess.textContent = "";

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    registerError.textContent = "Passwords do not match!";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      logAction("REGISTER", `User: ${email}`);
      registerSuccess.textContent = "Registration successful! Redirecting...";
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } else {
      registerError.textContent = data.message || "Registration failed";
    }
  } catch (err) {
    console.error(err);
    registerError.textContent = "Server error";
  }
}

async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = "";
  loginSuccess.textContent = "";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      logAction("LOGIN", `User: ${email}`);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("email", email);
      loginSuccess.textContent = "OTP sent! Redirecting to verification...";
      setTimeout(() => (window.location.href = "verify.html"), 1500);
    } else {
      loginError.textContent = data.message || "Login failed";
    }
  } catch (err) {
    console.error(err);
    loginError.textContent = "Server error";
  }
}

// OTP Inputs Handling
const inputs = document.querySelectorAll(".verification-digit");
inputs.forEach((input, idx) => {
  input.addEventListener("input", () => {
    if (input.value && idx < inputs.length - 1) inputs[idx + 1].focus();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && idx > 0)
      inputs[idx - 1].focus();
  });
});

async function handleVerify(event) {
  event.preventDefault();
  verifyError.textContent = "";
  verifySuccess.textContent = "";

  const otp = Array.from(inputs)
    .map((i) => i.value)
    .join("");
  const userId = localStorage.getItem("userId");

  if (otp.length !== 6) {
    verifyError.textContent = "Please enter all 6 digits.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(userId), otp }),
    });

    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem("authToken", data.token);

      const email = localStorage.getItem("email");

      // ✅ log with email instead of just userId
      logAction("VERIFY", `User: ${email || "UserID " + userId}`);

      // 🔑 Send token back to the embedding host
      window.parent.postMessage(
        { type: "AUTH_SUCCESS", token: data.token },
        "*"
      );

      verifySuccess.textContent = "Verification successful!...";
    } else {
      verifyError.textContent = data.message || "Verification failed.";
    }
  } catch (err) {
    console.error(err);
    verifyError.textContent = "Server error";
  }
}

function resendCode() {
  verifySuccess.textContent = "Verification code resent (demo).";
}

// Autofocus first digit
document.addEventListener("DOMContentLoaded", () => inputs[0].focus());

// Logging user actions
function logAction(action, details) {
  try {
    const userId = localStorage.getItem("userId");
    fetch(`${API_BASE}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
      body: JSON.stringify({
        action,
        details,
        userId: userId ? Number(userId) : null,
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => console.error("Log failed:", err));
  } catch (err) {
    console.error("LogAction error:", err);
  }
}

// Fetch logs
async function fetchLogs() {
  try {
    const res = await fetch(`${API_BASE}/logs`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
    });
    const data = await res.json();
    const tbody = document.getElementById("logs-body");
    tbody.innerHTML = "";

    if (Array.isArray(data) && data.length > 0) {
      data.forEach((log) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${new Date(log.timestamp).toLocaleString()}</td>
          <td>${log.action}</td>
          <td>${log.user}</td>
          <td>${log.status}</td>
          <td>${log.ip || "-"}</td>
        `;
        tbody.appendChild(row);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">No logs found</td></tr>`;
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", fetchLogs);
