/* Push only: authenticated pages and API responses are never cached. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    return;
  }
  let url = "/dashboard";
  try {
    const candidate = new URL(data.url || url, self.location.origin);
    if (candidate.origin === self.location.origin)
      url = candidate.pathname + candidate.search + candidate.hash;
  } catch {}
  event.waitUntil(
    self.registration.showNotification(String(data.title || "আরোহণ"), {
      body: String(data.body || ""),
      icon: "/push-icon-192.png",
      badge: "/push-icon-192.png",
      tag: String(data.id || "aarohon-update"),
      data: { url },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(
    event.notification.data?.url || "/dashboard",
    self.location.origin,
  );
  if (url.origin !== self.location.origin) return;
  event.waitUntil(self.clients.openWindow(url.href));
});
