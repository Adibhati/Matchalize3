import webPush from 'web-push';
import User from '../models/User.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:admin@matchalize.app',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export const sendPushNotification = async (userId, payload) => {
  try {
    // ⚠️ The status flags were never selected here, so they could never be
    // tested. Suspension blocks the *user* from acting (middleware/auth.js
    // rejects them and the deck filters them out), but it did nothing to stop
    // their device being handed inbound content: an active alignment is not
    // deactivated on suspension, so their counterpart could keep messaging them
    // and the lock screen kept showing up to 100 chars of the message text.
    // The fix is here rather than at each call site so no future caller can
    // reintroduce it by forgetting a pre-check.
    const user = await User.findById(userId).select(
      'pushSubscription name suspended isDeleted shadowbannedAt contentFrozen'
    );
    if (!user?.pushSubscription) return false;

    if (user.suspended || user.isDeleted) {
      // Moderation action, not a transient failure: drop the subscription so a
      // suspended device stops being a notification target entirely rather than
      // relying on this guard on every future send.
      await User.findByIdAndUpdate(userId, { pushSubscription: null }).catch(() => {});
      console.warn(
        `[push] Suppressed notification for ${userId} (suspended=${!!user.suspended} deleted=${!!user.isDeleted}); cleared subscription`
      );
      return false;
    }

    // Shadowbanned users still function normally in the app (that is the point of
    // a shadowban), so they keep receiving their own notifications — only the
    // sender is misled. Not treated as a suppression case.

    const notificationPayload = {
      title: payload.title || 'Matchalize',
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
    };

    await webPush.sendNotification(
      user.pushSubscription,
      JSON.stringify(notificationPayload)
    );
    return true;
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or invalid, remove it
      await User.findByIdAndUpdate(userId, { pushSubscription: null }).catch(() => {});
    }
    console.error('Push notification error:', error.message);
    return false;
  }
};

export const generateVapidKeys = () => {
  return webPush.generateVAPIDKeys();
};
