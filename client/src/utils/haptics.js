/**
 * src/utils/haptics.js
 * A safe wrapper for the native Navigator.vibrate API.
 */

export const triggerHaptic = (style = 'light') => {
  // Defensive check: Ensure we are in a browser environment and the API is supported
  if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
    return;
  }

  try {
    switch (style) {
      case 'light':
        // A subtle, quick tap (e.g., opening a menu, switching tabs)
        window.navigator.vibrate(10);
        break;
      case 'medium':
        // A standard confirmation tap (e.g., sending a message, advancing a step)
        window.navigator.vibrate(30);
        break;
      case 'heavy':
        // A stronger, definitive thud (e.g., destructive actions, errors, successful match)
        window.navigator.vibrate(50);
        break;
      default:
        window.navigator.vibrate(10);
    }
  } catch (error) {
    // Silently catch any permission or hardware constraint errors
    console.warn('Haptics blocked or unsupported by device context.');
  }
};
