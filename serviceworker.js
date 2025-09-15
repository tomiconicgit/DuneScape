self.addEventListener("install", (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Always go to the network, never cache
  event.respondWith(
    fetch(event.request, { cache: "no-store" }).catch(() => {
      return new Response("Offline – resource not available", { status: 503 });
    })
  );
});