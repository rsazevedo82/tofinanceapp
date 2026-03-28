self.addEventListener("message", (event) => {
  const message = event.data;

  if (message?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
