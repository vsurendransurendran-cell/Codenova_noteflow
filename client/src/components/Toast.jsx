import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, WifiOff, X, Info } from 'lucide-react';

/**
 * Accessible Individual Toast Alert
 */
export function Toast({ toast, onDismiss }) {
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 180);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} className="toast-icon" aria-hidden="true" />;
      case 'network':
        return <WifiOff size={18} className="toast-icon" aria-hidden="true" />;
      case 'error':
        return <AlertCircle size={18} className="toast-icon" aria-hidden="true" />;
      default:
        return <Info size={18} className="toast-icon" aria-hidden="true" />;
    }
  };

  return (
    <div
      role="alert"
      className={`toast-item ${toast.type} ${isDismissing ? 'removing' : ''}`}
      aria-atomic="true"
    >
      {getIcon()}
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="toast-close-btn"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default Toast;
