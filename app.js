const API_BASE = "http://localhost:3000/api/auth"; // change to your backend URL

async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
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
      alert(data.message);
      window.location.href = "login.html";
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

async function handleLogin(event) {
  event.preventDefault();
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
      localStorage.setItem("userId", data.userId); // save for OTP verify
      localStorage.setItem("email", email);
      alert("OTP sent to your email");
      window.location.href = "verify.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

const inputs = document.querySelectorAll(".verification-digit");

inputs.forEach((input, idx) => {
  input.addEventListener("input", () => {
    if (input.value && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && idx > 0) {
      inputs[idx - 1].focus();
    }
  });
});

async function handleVerify(event) {
  event.preventDefault();
  const otp = Array.from(inputs)
    .map((i) => i.value)
    .join("");
  const userId = localStorage.getItem("userId");

  if (otp.length !== 6) {
    return alert("Please enter all 6 digits.");
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

      // ✅ fetch user email (stored from login step)
      const email = localStorage.getItem("email");

      // ✅ log with email instead of just userId
      logAction("VERIFY", `User: ${email || "UserID " + userId}`);

      alert("Verification successful!");
      window.location.href = "logs.html";
    } else {
      alert(data.message || "Verification failed.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

function resendCode() {
  alert("Verification code resent (demo).");
  // Optionally call API: fetch(`${API_BASE}/resend-otp`, { ... })
}

// Autofocus first digit
document.addEventListener("DOMContentLoaded", () => inputs[0].focus());

function logAction(action, details) {
  try {
    const userId = localStorage.getItem("userId"); // get from storage

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
    alert("Failed to load logs");
  }
}

document.addEventListener("DOMContentLoaded", fetchLogs);
