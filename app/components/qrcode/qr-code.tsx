"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

interface QRCodeComponentProps {
  value: string;
  size?: number;
  title?: string;
  description?: string;
  className?: string;
}

export function QRCodeComponent({
  value,
  size = 200,
  title = "QR Code",
  description = "",
  className = "",
}: QRCodeComponentProps) {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className={`inline-block space-y-3 ${className}`}>
      <div
        onClick={() => setShowQR(!showQR)}
        className="inline-block px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
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
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
      </div>

      {showQR && (
        <div className="flex flex-col items-center space-y-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="bg-white p-4 rounded-lg">
            <QRCode
              value={value}
              size={size}
              style={{
                height: "auto",
                maxWidth: "100%",
                width: "100%",
              }}
              viewBox={`0 0 ${size} ${size}`}
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
