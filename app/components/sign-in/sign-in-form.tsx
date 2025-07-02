import React, { useState } from "react";
import { useAuth } from "../../contexts/auth";
import { useNotification } from "app/contexts/notification";

interface SignInFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

type FormMode = "signin" | "generate";

export function SignInForm({ onCancel, onSuccess }: SignInFormProps) {
  const { signIn, generateNewKey } = useAuth();
  const { success } = useNotification();

  const [mode, setMode] = useState<FormMode>("signin");
  const [privateKey, setPrivateKey] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clearForm = () => {
    setPrivateKey("");
    setPassword("");
    setError("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(privateKey, password);
      clearForm();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter a password to encrypt your new key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await generateNewKey(password);
      success(
        "New key generated!",
        `Please use the dropdown menu with Export Key to backup your privatekey now!\n\n`
      );
      setPassword("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Key generation failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: FormMode) => {
    setMode(newMode);
    clearForm();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 w-full max-w-sm shadow-lg relative">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 disabled:opacity-50 transition-colors"
        >
          ×
        </button>

        {mode === "signin" ? (
          <>
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
                  placeholder="Choose a password to protect your key"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-3 py-2 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                Don't have a key?
              </p>
              <button
                type="button"
                onClick={() => switchMode("generate")}
                disabled={loading}
                className="w-full px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded disabled:opacity-50 transition-colors"
              >
                Generate new key
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                disabled={loading}
                className="mr-3 w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 disabled:opacity-50 transition-colors"
              >
                ←
              </button>
              <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Generate New Key
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-xs text-neutral-600 dark:text-neutral-400">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerateNewKey} className="space-y-4">
              <div>
                <label
                  htmlFor="generatePassword"
                  className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1"
                >
                  Password
                </label>
                <input
                  id="generatePassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password to protect your new key"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-xs text-neutral-600 dark:text-neutral-400">
                <p className="font-medium mb-1">Important:</p>
                <p>
                  Your private key will be removed once you log out. Make sure
                  to export it in a secure location!
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-3 py-2 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Generating..." : "Generate New Key"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
