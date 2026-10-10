import React from 'react';
import { Toast } from './Toast.jsx';

/**
 * Toast Container with Accessible ARIA Live Region
 */
export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default ToastContainer;
