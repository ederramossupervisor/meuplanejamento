const CACHE_NAME = 'meu-planejamento-v1.1.0';

// Arquivos essenciais: se algum destes faltar, preferimos ver o erro.
const URLS_ESSENCIAIS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './css/impressao.css',
    './js/config.js',
    './js/api.js',
    './js/auth.js',
    './js/ui.js',
    './js/dashboard.js',
    './js/planos.js',
    './js/formularioPlano.js',
    './js/turmas.js',
    './js/componentes.js',
    './js/visualizacao.js',
    './js/calendario.js',
    './js/configuracoes.js',
    './js/pdf.js',
    './js/drive.js',
    './js/app.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Ícones: opcionais no cache inicial — se ainda não existirem no repositório,
// não podem derrubar a instalação inteira do service worker.
const URLS_OPCIONAIS = [
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/icon-maskable-192.png',
    './assets/icons/icon-maskable-512.png',
    './assets/icons/icon-apple-touch-180.png',
    './assets/icons/favicon-32.png',
    './assets/icons/favicon-16.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Essenciais: falha alto e claro se algum não existir.
            await cache.addAll(URLS_ESSENCIAIS);

            // Opcionais: tenta cada um individualmente, ignora os que falharem.
            await Promise.allSettled(
                URLS_OPCIONAIS.map((url) => cache.add(url))
            );

            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('script.google.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                event.waitUntil(
                    fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const clone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, clone);
                            });
                        }
                        return networkResponse;
                    }).catch(() => cachedResponse)
                );
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                if (event.request.method === 'GET' && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
