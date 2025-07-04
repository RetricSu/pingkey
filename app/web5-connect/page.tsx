"use client";

import React, { useEffect, useState } from "react";
import { ccc, Signer } from "@ckb-ccc/connector-react";
import ConnectWallet from "../components/wallet/connect-wallet";
import { DIDDocument, DIDSDK } from "app/lib/did-sdk";

export default function Web5ConnectPage() {
  const { wallet, open, signerInfo} = ccc.useCcc();

  const [did, setDid] = useState<DIDDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nostrPublicKey, setNostrPublicKey] = useState("ce6232feaec4e6d01a4e00daa3648030c42017bdf589e34b53744fc49c5cba8a");
  const [relayUrl, setRelayUrl] = useState("wss://relay.pingkey.xyz");

  useEffect(() => {
    if (signerInfo) {
      setIsLoading(true);
      setError(null);
      const sdk = new DIDSDK(signerInfo.signer as Signer);
      sdk.findDIDCells().then((cells) => {
        if (cells.length > 0) {
          const did = sdk.deserializeDIDDocument(cells[0].outputData);
          setDid(did);
        }
        setIsLoading(false);
      }).catch((err) => {
        setError("Failed to load DID: " + err.message);
        setIsLoading(false);
      });
    }
  }, [signerInfo]);

  const handleCreateDID = async () => {
    if (!signerInfo || !nostrPublicKey || !relayUrl) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const sdk = new DIDSDK(signerInfo.signer as Signer);
      const txHash = await sdk.createDID(nostrPublicKey, relayUrl);
      
      // Wait a moment for the transaction to be processed
      setTimeout(() => {
        // Refresh the DID cells after creation
        sdk.findDIDCells().then((cells) => {
          if (cells.length > 0) {
            const did = sdk.deserializeDIDDocument(cells[0].outputData);
            setDid(did);
          }
        });
      }, 3000);
      
      console.log("DID created with transaction hash:", txHash);
    } catch (err) {
      console.error(err);
      setError("Failed to create DID: " + (err as Error).message);
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
          ) : did ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">
                ✅ DID Found
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nostr Public Key:
                  </label>
                  <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono break-all">
                    {did.verificationMethods.nostr}
                  </code>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Relay URL:
                  </label>
                  <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono break-all">
                    {did.services.nostr_relays.endpoints}
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
