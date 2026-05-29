/* Service worker — Meu Jurídico (Nicastro Soller)
   Permite usar o app sem internet e instalar como aplicativo.
   Estratégia: rede primeiro para o app (pega atualizações), cache como reserva offline. */
const CACHE = 'juridico-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Documento/navegação: rede primeiro (mostra atualizações), cache se estiver offline
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
    return;
  }
  // Demais arquivos (ícones, manifest): cache primeiro
  e.respondWith(caches.match(req).then(m => m || fetch(req)));
});
