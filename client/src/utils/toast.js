import React from 'react';

let toastCallback = null;
let presenceCallback = null;
const presenceCallbacks = new Set();

export const setToastHandler = (callback) => {
  toastCallback = callback;
};

export const setToastPresenceHandler = (callback) => {
  presenceCallback = callback;
};

export const useToastPresence = () => {
  const [toastUp, setToastUp] = React.useState(false);
  React.useEffect(() => {
    presenceCallbacks.add(setToastUp);
    return () => presenceCallbacks.delete(setToastUp);
  }, []);
  return toastUp;
};

const notifyPresence = (up) => {
  if (presenceCallback) presenceCallback(up);
  presenceCallbacks.forEach((cb) => cb(up));
};

export const clearToastPresence = () => {
  notifyPresence(false);
};

const emit = (type, message, action, opts) => {
  if (toastCallback) toastCallback({ type, message, action, opts });
  notifyPresence(true);
};

export const toast = {
  success: (message, action, opts) => emit('success', message, action, opts),
  error: (message, action, opts) => emit('error', message, action, opts),
  info: (message, action, opts) => emit('info', message, action, opts),
};