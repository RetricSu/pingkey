"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "../contexts/notification";
import dynamic from "next/dynamic";

// Dynamically import the Scanner component to avoid SSR issues
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => ({ default: mod.Scanner })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-600 dark:text-gray-400">Loading camera...</div>
      </div>
    )
  }
);

interface QRScannerProps {
  onClose: () => void;
}

export function QRScanner({ onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { success, error: showError } = useNotification();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleScan = useCallback((detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      
      // Validate if it looks like a public key (64 character hex string)
      if (scannedValue && typeof scannedValue === 'string') {
        const pubkeyPattern = /^[a-fA-F0-9]{64}$/;
        
        if (pubkeyPattern.test(scannedValue)) {
          setIsScanning(false);
          success("QR Code scanned successfully!");
          onClose();
          // Navigate to compose page with the scanned pubkey
          router.push(`/compose?replyToPubkey=${scannedValue}`);
        } else {
          showError("Invalid QR code", "This doesn't appear to be a valid public key");
          setError("Invalid public key format");
        }
      }
    }
  }, [router, onClose, success, showError]);

  const handleError = useCallback((error: any) => {
    console.error("QR Scanner error:", error);
    setError("Failed to access camera. Please check permissions.");
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Scan QR Code
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Scan a QR code containing a public key to send a message
          </p>
        </div>
        
        <div className="p-4">
          {error ? (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setIsScanning(true);
                }}
                className="w-full px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {isClient && isScanning && (
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    formats={['qr_code']}
                    scanDelay={1000}
                    styles={{
                      container: {
                        width: '100%',
                        height: '100%',
                      },
                    }}
                    components={{
                      finder: true,
                      torch: true,
                    }}
                  />
                )}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Position the QR code within the frame to scan
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
