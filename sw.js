const CACHE_NAME = "jap-static-v21";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./supabase-client.js",
  "./admin.html",
  "./admin.css",
  "./admin.js",
  "./config.example.js",
  "./manifest.webmanifest",
  "./data/jap.json",
  "./assets/icons/favicon.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/img/programa-anual.png",
  "./assets/img/promocion.png",
  "./assets/img/promocion-2.png",
  "./assets/img/sesion-hta.png",
  "./assets/img/sesion-diabetes.png",
  "./assets/img/sesion-dislipemia.png",
  "./assets/img/sesion-obesidad.png",
  "./assets/img/sesion-epoc-asma.png",
  "./assets/img/sesion-salud-mental.png",
  "./assets/img/sesion-dolor-osteomuscular.png",
  "./assets/img/sesion-dermatologia.png",
  "./assets/img/sesion-patologia-digestiva.png",
  "./assets/img/sesion-fragilidad.png",
  "./assets/img/sesion-ginecologia-ap.png",
  "./assets/img/sesion-insuficiencia-cardiaca-cronica.png",
  "./assets/docs/programa-anual.pdf",
  "./assets/docs/plantilla-jornadas-docentes-ap.pptx"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_ASSETS.map((asset) => cache.add(asset)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (requestUrl.pathname.endsWith("/config.js")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
