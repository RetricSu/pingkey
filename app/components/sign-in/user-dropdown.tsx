import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/auth";
import { useNotification } from "../../contexts/notification";
import { createExportFile } from "../../lib/util";
import { prompt } from "../dialog";
import { QRScanner } from "../qr-scanner";

interface UserDropdownProps {
  pubkey: string;
  onSignOut: () => void;
}

interface MenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export function UserDropdown({ pubkey, onSignOut }: UserDropdownProps) {
  const { exportPrivateKey } = useAuth();
  const { success, error } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExportKey = async () => {
    setIsOpen(false); // Close dropdown first
    const password = await prompt(
      "Export Private Key",
      "Enter your password to decrypt and export your private key:",
      "",
      {
        type: "password",
        placeholder: "Enter password",
        confirmLabel: "Export",
      }
    );

    if (!password) return;

    try {
      const privateKeyData = await exportPrivateKey(password);
      if (!privateKeyData) {
        error("Export Failed", "No private key found. Please sign in first.");
        return;
      }

      const { fileName, fileContent } = createExportFile(
        pubkey,
        privateKeyData
      );

      // Create and download the file
      const blob = new Blob([fileContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success(
        "Key Exported",
        "Your private key has been successfully exported."
      );
    } catch (err) {
      error(
        "Export Failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  };

  const handleScanQRCode = () => {
    setIsOpen(false); // Close dropdown first
    setShowQRScanner(true);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    setIsOpen(false); // Close dropdown
    if (item.href) {
      window.location.href = item.href;
    } else if (item.onClick) {
      item.onClick();
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: "Compose",
      href: "/compose",
    },
    {
      label: "Scan QR Code",
      onClick: handleScanQRCode,
    },
    {
      label: "Mailbox",
      href: "/mailbox",
    },
    {
      label: "Edit Profile",
      href: "/setting",
    },
    {
      label: "View My Page",
      href: `/p/${pubkey}`,
    },
    {
      label: "Export Key",
      onClick: handleExportKey,
    },
    {
      label: "Sign out",
      onClick: onSignOut,
    },
  ];

  return (
    <>
      <div className="relative group" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-6 h-6 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        <div className={`absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-1 w-48 sm:w-40 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg transition-all duration-200 z-50 ${
          isOpen 
            ? 'opacity-100 visible' 
            : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
        }`}>
          <div className="p-3 sm:p-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-500">
              {pubkey.slice(0, 6)}...{pubkey.slice(-4)}
            </div>
          </div>
          {menuItems.map((item, index) => (
            <div key={index} className="p-1">
              <button
                onClick={() => handleMenuItemClick(item)}
                className="w-full text-left px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm sm:text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showQRScanner && (
        <QRScanner onClose={() => setShowQRScanner(false)} />
      )}
    </>
  );
}
