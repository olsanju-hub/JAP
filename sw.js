const CACHE_NAME = "jap-static-v30";

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
  "./assets/img/infografia-jap-programa-general-01.png",
  "./assets/img/infografia-jap-calendario-2026-2027.png",
  "./assets/img/infografia-jap-convocatoria.png",
  "./assets/img/infografia-jap-productos-finales.png",
  "./assets/img/infografia-jap-funcionamiento.png",
  "./assets/img/sesion-01-sindrome-cardiorrenal-metabolico.png",
  "./assets/img/sesion-02-hipertension-arterial.png",
  "./assets/img/sesion-03-diabetes-mellitus.png",
  "./assets/img/sesion-04-dislipemia.png",
  "./assets/img/sesion-05-insuficiencia-cardiaca.png",
  "./assets/img/sesion-06-obesidad.png",
  "./assets/img/sesion-07-epoc-asma.png",
  "./assets/img/sesion-08-dispepsia-erge-sii.png",
  "./assets/img/sesion-09-salud-mental-bzd.png",
  "./assets/img/sesion-10-anticoncepcion-menopausia-trh.png",
  "./assets/img/sesion-11-manejo-dolor.png",
  "./assets/img/sesion-12-adulto-mayor.png",
  "./assets/img/sesion-13-jornada-final.png",
  "./assets/docs/programa-anual-jap-2026-2027.pdf",
  "./assets/docs/programa-anual-jap-2026-2027-editable.docx",
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
