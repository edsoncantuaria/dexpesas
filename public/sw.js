// public/sw.js
// Este é o Service Worker para notificações push.

self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const title = data.title || 'Dexpesas';
  const options = {
    body: data.body,
    icon: '/logo-192.png', // Ícone que aparece na notificação
    badge: '/logo-72.png', // Ícone menor (Android)
    data: {
        url: data.data?.url || '/', // URL para abrir ao clicar
        ...data.data
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Fecha a notificação
  
  // Abre a URL definida nos dados da notificação ou a página principal
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
