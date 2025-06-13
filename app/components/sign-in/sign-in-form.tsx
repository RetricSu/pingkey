import React, { useState } from "react";
import { useAuth } from "../../contexts/auth";

interface SignInFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function SignInForm({ onCancel, onSuccess }: SignInFormProps) {
  const { signIn, generateNewKey } = useAuth();
  
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
      setPassword("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Key generation failed");
    } finally {
      setLoading(false);
    }
  };

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
              onClick={onCancel}
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
