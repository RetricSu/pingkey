"use client";

import { useState } from "react";
import { useAuth } from "../contexts/auth";
import { createExportFile } from "app/lib/util";

export function SignIn() {
  const {
    isSignedIn,
    pubkey,
    signIn,
    signOut,
    generateNewKey,
    exportPrivateKey,
  } = useAuth();

  const [showSignIn, setShowSignIn] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(privateKey, password);
      setShowSignIn(false);
      setPrivateKey("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewKey = async () => {
    if (!password) {
      setError("Please enter a password to encrypt your new key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const keyPair = await generateNewKey(password);
      alert(
        `New key generated!\n\nPublic Key: ${keyPair.publicKey}\nPrivate Key: ${keyPair.secretKey}\n\nPlease save your private key in a secure location!`
      );
      setShowSignIn(false);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Key generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExportKey = async () => {
    const exportPassword = prompt(
      "Enter your password to decrypt and export your private key:"
    );
    if (!exportPassword) return;

    try {
      const privateKeyData = await exportPrivateKey(exportPassword);
      if (!privateKeyData) {
        alert("No private key found. Please sign in first.");
        return;
      }

      const { fileName, fileContent } = createExportFile(
        pubkey!,
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
    } catch (err) {
      alert(
        "Failed to export private key: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  if (isSignedIn) {
    return (
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
              {pubkey?.slice(0, 6)}...{pubkey?.slice(-4)}
            </div>
          </div>
          <div className="p-1">
            <a
              href="/setting"
              className="w-full text-left px-2 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded transition-colors"
            >
              Setting
            </a>
          </div>
          <div className="p-1">
            <a
              href={`/p/${pubkey}`}
              className="w-full text-left px-2 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded transition-colors"
            >
              My Profile
            </a>
          </div>
          <div className="p-1">
            <button
              onClick={handleExportKey}
              className="w-full text-left px-2 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded transition-colors cursor-pointer"
            >
              Export Key
            </button>
          </div>
          <div className="p-1">
            <button
              onClick={signOut}
              className="w-full text-left px-2 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showSignIn) {
    return (
      <button
        onClick={() => setShowSignIn(true)}
        className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline"
      >
        sign in
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          Sign in with Nostr
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-xs text-neutral-600 dark:text-neutral-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="privateKey"
              className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1"
            >
              Private Key
            </label>
            <input
              id="privateKey"
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Enter your Nostr private key"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password to encrypt your key"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setShowSignIn(false)}
              disabled={loading}
              className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
            Don't have a key?
          </p>
          <button
            type="button"
            onClick={handleGenerateNewKey}
            disabled={loading}
            className="w-full px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating..." : "Generate new key"}
          </button>
        </div>
      </div>
    </div>
  );
}
