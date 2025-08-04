"use client";

import React, { useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import ConnectWallet from "../components/wallet/connect-wallet";
import { useWeb5DID } from "../contexts/web5-did";
import { custom, CustomDialogProps } from "../components/gadget/dialog";
import { CopyButton } from "app/components/gadget/copy-button";

// Custom dialog component for updating DID
interface UpdateDIDData {
  nostrPublicKey: string;
  relayUrl: string;
}

interface UpdateDIDDialogProps extends CustomDialogProps<UpdateDIDData> {
  existingNostrKey?: string;
  existingRelayUrl?: string;
}

function UpdateDIDDialog({
  onResolve,
  onReject,
  existingNostrKey = "",
  existingRelayUrl = "",
}: UpdateDIDDialogProps) {
  const [nostrPublicKey, setNostrPublicKey] = useState(existingNostrKey);
  const [relayUrl, setRelayUrl] = useState(existingRelayUrl);

  const handleUpdate = () => {
    if (!nostrPublicKey.trim() || !relayUrl.trim()) {
      return;
    }
    onResolve({
      nostrPublicKey: nostrPublicKey.trim(),
      relayUrl: relayUrl.trim(),
    });
  };

  const handleCancel = () => {
    onReject();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Update DID
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Update your Nostr public key and relay URL
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={nostrPublicKey}
          onChange={(e) => setNostrPublicKey(e.target.value)}
          placeholder="Nostr public key"
          className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors"
        />

        <input
          type="text"
          value={relayUrl}
          onChange={(e) => setRelayUrl(e.target.value)}
          placeholder="Relay URL"
          className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200 font-medium text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdate}
          disabled={!nostrPublicKey.trim() || !relayUrl.trim()}
          className="flex-1 px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm"
        >
          Update
        </button>
      </div>
    </div>
  );
}

export default function Web5ConnectPage() {
  const { signerInfo } = ccc.useCcc();
  const {
    didIdentifier,
    didDocument,
    isLoading,
    error,
    createDID,
    updateDID,
    refreshDID,
  } = useWeb5DID();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [nostrPublicKey, setNostrPublicKey] = useState("");
  const [relayUrl, setRelayUrl] = useState("");

  const handleCreateDID = async () => {
    if (!signerInfo || !nostrPublicKey || !relayUrl) return;

    setIsCreating(true);

    try {
      await createDID(nostrPublicKey, relayUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateDID = async () => {
    if (!signerInfo || !didDocument) return;

    try {
      // Show the update dialog and wait for user input
      const result = await custom(
        (props: CustomDialogProps<UpdateDIDData>) => (
          <UpdateDIDDialog
            {...props}
            existingNostrKey={didDocument.verificationMethods?.nostr || ""}
            existingRelayUrl={
              didDocument.services?.nostr_relays?.endpoints || ""
            }
          />
        ),
        {
          maxWidth: "sm",
          closeOnBackdrop: true,
        }
      );

      if (result) {
        setIsUpdating(true);
        await updateDID(result.nostrPublicKey, result.relayUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefresh = async () => {
    await refreshDID();
  };

  return (
    <section className="max-w-2xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-100 mb-4">
          Web5 DID
        </h1>
        <div className="flex justify-center mb-12">
          <ConnectWallet className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 font-medium text-center justify-center" />
        </div>
      </div>

      {!signerInfo ? (
        <div className="text-center">
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            Connect wallet to continue
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-600 dark:border-t-neutral-300 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Loading...
              </p>
            </div>
          ) : didDocument ? (
            <div className="space-y-6">
              <div className="bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-neutral-600 dark:text-neutral-400 font-mono break-all flex-1">
                    {didIdentifier}
                  </code>
                  <CopyButton value={didIdentifier || ""} children={<></>} />
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Share Web5 Profile
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                  Web5 DID-based profile works better for connectivity and
                  discovery. It doesn't rely on Nostr big relays and it has key
                  rotation for multiple public keys.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-neutral-600 dark:text-neutral-400 font-mono break-all flex-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/p/${didIdentifier}`
                        : `/p/${didIdentifier}`}
                    </code>
                    <CopyButton
                      value={`${window.location.origin}/p/${didIdentifier}`}
                      children={<></>}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  DID Document
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Verification Methods
                    </div>
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded p-2">
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                        Nostr Public Key:
                      </div>
                      <code className="text-xs text-neutral-900 dark:text-neutral-100 font-mono break-all">
                        {didDocument.verificationMethods?.nostr || "Not set"}
                      </code>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Services
                    </div>
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded p-2">
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                        Nostr Relays:
                      </div>
                      <code className="text-xs text-neutral-900 dark:text-neutral-100 font-mono break-all">
                        {didDocument.services?.nostr_relays?.endpoints ||
                          "Not set"}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleUpdateDID}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm"
                >
                  {isUpdating ? "Updating..." : "Update DID"}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200 font-medium text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Create DID
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Set up your decentralized identity
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={nostrPublicKey}
                  onChange={(e) => setNostrPublicKey(e.target.value)}
                  placeholder="Nostr public key"
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors"
                />

                <input
                  type="text"
                  value={relayUrl}
                  onChange={(e) => setRelayUrl(e.target.value)}
                  placeholder="Relay URL"
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors"
                />
              </div>

              <button
                onClick={handleCreateDID}
                disabled={isCreating || !nostrPublicKey || !relayUrl}
                className="w-full px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {isCreating ? "Creating..." : "Create DID"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
