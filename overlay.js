(function () {
  // Create the iframe overlay
  const iframe = document.createElement("iframe");
  iframe.src = "https:///login.html"; // entrypoint to your flow
  iframe.style.position = "fixed";
  iframe.style.top = 0;
  iframe.style.left = 0;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.style.zIndex = "99999";
  iframe.style.display = "none"; // hidden until opened
  document.body.appendChild(iframe);

  // API for host websites
  window.AuthOverlay = {
    open: () => (iframe.style.display = "block"),
    close: () => (iframe.style.display = "none"),
    onSuccess: (callback) => {
      window.addEventListener("message", (e) => {
        if (e.data.type === "AUTH_SUCCESS") {
          callback(e.data.token);
          iframe.style.display = "none"; // auto-close overlay
        }
      });
    },
  };
})();
