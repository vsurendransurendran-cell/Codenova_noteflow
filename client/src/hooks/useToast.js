import { useState, useCallback } from 'react';

let toastIdCounter = 0;

/**
 * Custom hook for accessible toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title = '', message = '', duration = 4000 }) => {
    const id = ++toastIdCounter;
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message, title = 'Success') => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const showError = useCallback((message, title = 'Request Failed') => {
    return addToast({ type: 'error', title, message });
  }, [addToast]);

  const showNetworkError = useCallback((message = 'Cannot connect to server. Please verify backend is running.', title = 'Network Failure') => {
    return addToast({ type: 'network', title, message, duration: 6000 });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showNetworkError,
  };
}

export default useToast;
