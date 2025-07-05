"use client";

import React, { useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import ConnectWallet from "../components/wallet/connect-wallet";
import { useWeb5DID } from "../contexts/web5-did";

export default function Web5ConnectPage() {
  const { signerInfo } = ccc.useCcc();
  const { 
    didIdentifier, 
    didDocument, 
    isLoading, 
    error, 
    createDID 
  } = useWeb5DID();

  const [isCreating, setIsCreating] = useState(false);
  const [nostrPublicKey, setNostrPublicKey] = useState("ce6232feaec4e6d01a4e00daa3648030c42017bdf589e34b53744fc49c5cba8a");
  const [relayUrl, setRelayUrl] = useState("wss://relay.pingkey.xyz");

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

  return (
    <section className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center flex justify-center items-center gap-4">
        <ConnectWallet className="px-4 py-2 text-sm text-white dark:text-black bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-300 rounded transition-colors" />
      </div>

      {!signerInfo ? (
        <div className="text-center">
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Please connect your wallet to continue
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading DID...</p>
            </div>
          ) : didDocument ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">
                ✅ DID Found
              </h2>
              <h3>{didIdentifier}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nostr Public Key:
                  </label>
                  <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono break-all">
                    {didDocument.verificationMethods.nostr}
                  </code>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Relay URL:
                  </label>
                  <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono break-all">
                    {didDocument.services.nostr_relays.endpoints}
                  </code>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">
                Create Your DID
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                No DID found. Create a new Decentralized Identity to get started.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nostr Public Key
                  </label>
                  <input
                    type="text"
                    value={nostrPublicKey}
                    onChange={(e) => setNostrPublicKey(e.target.value)}
                    placeholder="Enter your Nostr public key"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relay URL
                  </label>
                  <input
                    type="text"
                    value={relayUrl}
                    onChange={(e) => setRelayUrl(e.target.value)}
                    placeholder="wss://relay.example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                
                <button
                  onClick={handleCreateDID}
                  disabled={isCreating || !nostrPublicKey || !relayUrl}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? "Creating DID..." : "Create DID"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
} 
