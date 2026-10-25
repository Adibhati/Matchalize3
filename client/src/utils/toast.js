import React from 'react';

let toastCallback = null;
let presenceCallback = null;
const presenceCallbacks = new Set();
let renderedToastHeight = 0;
const toastHeightCallbacks = new Set();

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

export const setRenderedToastHeight = (height) => {
  renderedToastHeight = height;
  toastHeightCallbacks.forEach((callback) => callback(height));
};

export const useToastHeight = () => {
  const [height, setHeight] = React.useState(renderedToastHeight);
  React.useEffect(() => {
    toastHeightCallbacks.add(setHeight);
    setHeight(renderedToastHeight);
    return () => toastHeightCallbacks.delete(setHeight);
  }, []);
  return height;
};

const notifyPresence = (up) => {
  if (presenceCallback) presenceCallback(up);
  presenceCallbacks.forEach((cb) => cb(up));
};

export const clearToastPresence = () => {
  setRenderedToastHeight(0);
  notifyPresence(false);
};

const emit = (type, message, action, opts) => {
  setRenderedToastHeight(0);
  if (toastCallback) toastCallback({ type, message, action, opts });
  notifyPresence(true);
};

export const toast = {
  success: (message, action, opts) => emit('success', message, action, opts),
  error: (message, action, opts) => emit('error', message, action, opts),
  info: (message, action, opts) => emit('info', message, action, opts),
};

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__matchalizeToastPreview = (type, message, action, opts) => {
    if (!Object.hasOwn(toast, type)) {
      throw new TypeError(`Unsupported toast type: ${type}`);
    }
    toast[type](message, action, opts);
  };
}