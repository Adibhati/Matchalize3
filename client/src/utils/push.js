import { api } from './api';

let registration = null;

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service Worker registered');
    return registration;
  } catch (error) {
    console.error('SW registration failed:', error);
    return null;
  }
};

export const subscribeToPush = async () => {
  if (!registration) {
    registration = await registerServiceWorker();
  }
  if (!registration) return null;

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) return subscription;

    // Get VAPID key
    const { publicKey } = await api.get('/notifications/vapid-key');
    if (!publicKey) return null;

    // Convert VAPID key
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Save subscription to server
    await api.post('/notifications/subscribe', { subscription });

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
};

export const unsubscribeFromPush = async () => {
  if (!registration) return;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await api.delete('/notifications/subscribe');
    }
  } catch (error) {
    console.error('Push unsubscribe failed:', error);
  }
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
