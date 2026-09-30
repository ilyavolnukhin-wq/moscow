const CACHE = "moscow-guide-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  // Погода — только из сети (не кэшируем API), с fallback
  if(req.url.includes("api.open-meteo.com") || req.url.includes("archive-api.open-meteo.com")){
    e.respondWith(fetch(req).catch(() => new Response("{}", {headers:{"Content-Type":"application/json"}})));
    return;
  }
  if(req.mode === "navigate"){
    e.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return resp;
    }).catch(() => caches.match("./index.html")))
  );
});