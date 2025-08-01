"use client";

import React from "react";
import { createRoot } from "react-dom/client";

interface BaseDialogProps {
  title: string;
  message?: string;
  onCancel: () => void;
  children: React.ReactNode;
}

function BaseDialog({ title, message, onCancel, children }: BaseDialogProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onCancel} />

      {/* Dialog */}
      <div
        className="relative bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 w-full max-w-sm shadow-lg"
        onKeyDown={handleKeyDown}
      >
        {/* X button in top right corner */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            {title}
          </h2>
          {message && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {message}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}

interface PromptDialogProps {
  title: string;
  message?: string;
  defaultValue?: string;
  type?: "text" | "password";
  placeholder?: string;
  confirmLabel?: string;
  onResolve: (result: string | null) => void;
}

function PromptDialogComponent({
  title,
  message,
  defaultValue = "",
  type = "text",
  placeholder,
  confirmLabel = "OK",
  onResolve,
}: PromptDialogProps) {
  const [inputValue, setInputValue] = React.useState(defaultValue);

  const handleConfirm = () => {
    onResolve(inputValue);
  };

  const handleCancel = () => {
    onResolve(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  React.useEffect(() => {
    // Auto-focus the input when dialog opens
    const input = document.querySelector(
      ".simple-dialog-input"
    ) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  return (
    <BaseDialog title={title} message={message} onCancel={handleCancel}>
      <div className="mb-4">
        <input
          type={type}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className="simple-dialog-input w-full px-3 py-2 text-xs bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div className="flex pt-2">
        <button
          onClick={handleConfirm}
          className="w-full px-3 py-2 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
        >
          {confirmLabel}
        </button>
      </div>
    </BaseDialog>
  );
}

// Utility functions that work like window.prompt(), window.confirm(), etc.

export function prompt(
  title: string,
  message?: string,
  defaultValue?: string,
  options?: {
    type?: "text" | "password";
    placeholder?: string;
    confirmLabel?: string;
  }
): Promise<string | null> {
  return new Promise((resolve) => {
    // Create a container div
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Create root and render dialog
    const root = createRoot(container);

    const cleanup = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    const handleResolve = (result: string | null) => {
      resolve(result);
      cleanup();
    };

    root.render(
      <PromptDialogComponent
        title={title}
        message={message}
        defaultValue={defaultValue}
        type={options?.type}
        placeholder={options?.placeholder}
        confirmLabel={options?.confirmLabel}
        onResolve={handleResolve}
      />
    );
  });
}

export function confirm(
  title: string,
  message?: string,
  options?: {
    confirmLabel?: string;
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    // Create a container div
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Create root and render a simplified confirm dialog
    const root = createRoot(container);

    const cleanup = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    const handleResolve = (result: boolean) => {
      resolve(result);
      cleanup();
    };

    const ConfirmDialog = () => {
      const handleConfirm = () => handleResolve(true);
      const handleCancel = () => handleResolve(false);

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleConfirm();
        }
      };

      return (
        <BaseDialog title={title} message={message} onCancel={handleCancel}>
          <div
            className="flex gap-2 pt-2"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <button
              onClick={handleConfirm}
              autoFocus
              className="px-3 py-2 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
            >
              {options?.confirmLabel || "OK"}
            </button>
          </div>
        </BaseDialog>
      );
    };

    root.render(<ConfirmDialog />);
  });
}

export function alert(
  title: string,
  message?: string,
  options?: {
    confirmLabel?: string;
  }
): Promise<void> {
  return new Promise((resolve) => {
    // Create a container div
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Create root and render a simplified alert dialog
    const root = createRoot(container);

    const cleanup = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    const handleResolve = () => {
      resolve();
      cleanup();
    };

    const AlertDialog = () => {
      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleResolve();
        }
      };

      return (
        <BaseDialog title={title} message={message} onCancel={handleResolve}>
          <div
            className="flex justify-end pt-2"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <button
              onClick={handleResolve}
              autoFocus
              className="px-3 py-2 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
            >
              {options?.confirmLabel || "OK"}
            </button>
          </div>
        </BaseDialog>
      );
    };

    root.render(<AlertDialog />);
  });
}

// Custom dialog component props interface
export interface CustomDialogProps<T = any> {
  onResolve: (result: T) => void;
  onReject: () => void;
}

export function custom<T = any>(
  Component: React.ComponentType<CustomDialogProps<T>>,
  options?: {
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
    closeOnBackdrop?: boolean;
  }
): Promise<T | null> {
  return new Promise((resolve) => {
    // Create a container div
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Create root and render the custom dialog
    const root = createRoot(container);

    const cleanup = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    const handleResolve = (result: T) => {
      resolve(result);
      cleanup();
    };

    const handleReject = () => {
      resolve(null);
      cleanup();
    };

    const maxWidthClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
    };

    const CustomDialog = () => {
      const handleBackdropClick = () => {
        if (options?.closeOnBackdrop !== false) {
          handleReject();
        }
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && options?.closeOnBackdrop !== false) {
          handleReject();
        }
      };

      return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0" onClick={handleBackdropClick} />
          <div
            className={`relative bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg w-full ${
              maxWidthClasses[options?.maxWidth || "sm"]
            }`}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <Component onResolve={handleResolve} onReject={handleReject} />
          </div>
        </div>
      );
    };

    root.render(<CustomDialog />);
  });
}
