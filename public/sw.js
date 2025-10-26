self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    // PWA mínimo: apenas responde normalmente
});