import { useEffect } from "react";
import React from "react";
import "./ToastNotification.css";

export default function ToastNotification({ notification, onDismiss }) {
  useEffect(() => {
    if (!notification) return undefined;

    const timeoutId = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div
      className={`toast-notification toast-notification-${notification.type}`}
      role={notification.type === "error" ? "alert" : "status"}
      aria-live={notification.type === "error" ? "assertive" : "polite"}
    >
      <span className="toast-notification-message">
        {notification.message}
      </span>
      <button
        className="toast-notification-dismiss"
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        x
      </button>
    </div>
  );
}
