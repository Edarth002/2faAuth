// Simple logger stored in localStorage
function logAction(action, details = "") {
  const logs = JSON.parse(localStorage.getItem("appLogs") || "[]");
  logs.push({ action, details, timestamp: new Date().toISOString() });
  localStorage.setItem("appLogs", JSON.stringify(logs));
}

// Example usage
function simulateRegister(email) {
  logAction("REGISTER", `User registered with email: ${email}`);
}

function simulateLogin(email) {
  logAction("LOGIN", `User logged in with email: ${email}`);
}

function simulateVerify(email) {
  logAction("VERIFY", `User verified OTP for email: ${email}`);
}

// Display logs in logs.html
function displayLogs() {
  const logsContainer = document.getElementById("logs");
  if (!logsContainer) return;

  const logs = JSON.parse(localStorage.getItem("appLogs") || "[]");
  if (logs.length === 0) {
    logsContainer.innerHTML = "<p>No logs available.</p>";
    return;
  }

  logsContainer.innerHTML = logs
    .map(
      (log) =>
        `<div><strong>${log.action}</strong> - ${log.details} <em>(${log.timestamp})</em></div>`
    )
    .join("");
}
