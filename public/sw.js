// Service Worker — Uma Geração
// Handles push notifications for match reminders

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); }
  catch { data = { title: 'Uma Geração', body: event.data.text() }; }

  const options = {
    body: data.body || 'Tens jogos por votar!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'umageracao',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || '/jogos' },
    actions: [
      { action: 'vote', title: '⚽ Votar agora' },
      { action: 'dismiss', title: 'Fechar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Uma Geração 🏆', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = (event.notification.data && event.notification.data.url) || '/jogos';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
