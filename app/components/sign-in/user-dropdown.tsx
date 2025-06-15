import React, { useState } from "react";
import { useAuth } from "../../contexts/auth";
import { useNotification } from "../../contexts/notification";
import { createExportFile } from "../../lib/util";
import { prompt } from "../dialog";

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

  const handleExportKey = async () => {
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

  const menuItems: MenuItem[] = [
    {
      label: "Compose",
      href: "/compose",
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
      <div className="relative group">
        <button className="flex items-center justify-center w-6 h-6 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
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

        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-40 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-500">
              {pubkey.slice(0, 6)}...{pubkey.slice(-4)}
            </div>
          </div>
          {menuItems.map((item, index) => (
            <div key={index} className="p-1">
              <button
                onClick={
                  item.href
                    ? () => {
                        window.location.href = item.href!;
                      }
                    : item.onClick
                }
                className="w-full text-left px-2 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
