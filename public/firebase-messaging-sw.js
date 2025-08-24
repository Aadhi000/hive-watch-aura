// Firebase messaging service worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyD4M_ZOMqR9MtSkbgH2SQQvj2QSAFKLOhU",
  authDomain: "beehive-d31e3.firebaseapp.com",
  databaseURL: "https://beehive-d31e3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "beehive-d31e3",
  storageBucket: "beehive-d31e3.firebasestorage.app",
  messagingSenderId: "412298384436",
  appId: "1:412298384436:web:469569b024f27482456661",
  measurementId: "G-P6FF4EJC3K"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title || 'Beehive Alert 🚨';
  const notificationOptions = {
    body: payload.notification.body || 'Check your beehive status',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});