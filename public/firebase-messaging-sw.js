importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBvJhJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
  authDomain: "comunidad-musical.firebaseapp.com",
  projectId: "comunidad-musical",
  storageBucket: "comunidad-musical.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Mensaje recibido en background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nuevo mensaje';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes un nuevo mensaje en el chat',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'chat-message',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Ver mensaje'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('https://comunidad-musical.web.app')
    );
  }
});