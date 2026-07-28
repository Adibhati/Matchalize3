let toastCallback = null;

export const setToastHandler = (callback) => {
  toastCallback = callback;
};

export const toast = {
  success: (message, action) => {
    if (toastCallback) toastCallback({ type: 'success', message, action });
  },
  error: (message, action) => {
    if (toastCallback) toastCallback({ type: 'error', message, action });
  },
  info: (message, action) => {
    if (toastCallback) toastCallback({ type: 'info', message, action });
  }
};
