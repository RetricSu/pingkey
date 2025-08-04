"use client";

import React, { useEffect, useState } from "react";
import { useNotification, Notification } from "../../contexts/notification";

// Icon components for different notification types
const CheckIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const XCircleIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ExclamationIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const InfoIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckIcon />;
      case "error":
        return <XCircleIcon />;
      case "warning":
        return <ExclamationIcon />;
      case "info":
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case "success":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30";
      case "error":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30";
      case "warning":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30";
      case "info":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30";
      default:
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30";
    }
  };

  return (
    <div
      className={`
        relative transform transition-all duration-300 ease-out
        ${
          isVisible && !isLeaving
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
        ${isLeaving ? "scale-95" : "scale-100"}
      `}
    >
      <div
        className={`
          flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
          shadow-lg shadow-black/5 dark:shadow-black/20
          ${getColorClasses()}
        `}
      >
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {notification.title}
          </div>
          {notification.message && (
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {notification.message}
            </div>
          )}
          {notification.action && (
            <div className="mt-3">
              <button
                onClick={notification.action.onClick}
                className="text-xs font-medium underline hover:no-underline transition-all"
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}
