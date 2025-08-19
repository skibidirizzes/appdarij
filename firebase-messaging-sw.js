// Using compat libraries for broader browser support in service workers.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1ekekT64tdb4Ly05qxDNd9NbcKJgkOyo",
  authDomain: "darija-f8b96.firebaseapp.com",
  projectId: "darija-f8b96",
  storageBucket: "darija-f8b96.firebasestorage.app",
  messagingSenderId: "157037222389",
  appId: "1:157037222389:web:b7e1e0f4ca00f726dc28bc",
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload,
  );

  const notificationTitle = payload.notification.title || "New Message";
  const notificationOptions = {
    body: payload.notification.body || "You have a new message.",
    icon: payload.notification.icon || "/vite.svg",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
