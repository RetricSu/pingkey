"use client";

import { useState } from "react";
import { useAuth } from "../contexts/auth";
import { useNotification } from "../contexts/notification";
import { hexToBytes } from "@noble/hashes/utils";
import { prompt } from "../components/dialog";
import { createOnChainLetter, sealLetterWithDOBStamp } from "../lib/dob/seal";
import { ccc, useCcc } from "@ckb-ccc/connector-react";
import { Event } from "nostr-tools";
import { usePowCreation } from "app/hooks/usePowCreation";
import { Hex } from "@ckb-ccc/connector-react";
import { createSpore } from "@ckb-ccc/spore";

export default function TestDOBPage() {
  const { isSignedIn, exportPrivateKey } = useAuth();
  const { success, error, info } = useNotification();
  const { signerInfo } = useCcc();

  const { createPowNote } = usePowCreation();

  const [isCreatingLetter, setIsCreatingLetter] = useState(false);
  const [isSealingStamp, setIsSealingStamp] = useState(false);
  const [isCreatingDOB, setIsCreatingDOB] = useState(false);
  const [letterTypeHash, setLetterTypeHash] = useState<string>("");
  const [sporeId, setSporeId] = useState<string>("");
  const [receiverLock, setReceiverLock] = useState<string>("");
  const [message, setMessage] = useState("");
  const [dobContentType, setDobContentType] = useState<string>("text/plain");
  const [dobContent, setDobContent] = useState<string>("");

  const handleCreateDOBStamp = async () => {
    if (!signerInfo?.signer) {
      return error("Please connect wallet first");
    }

    if (!dobContent.trim()) {
      return error("Please enter DOB content");
    }

    setIsCreatingDOB(true);

    try {
      const spore = await createSpore({
        signer: signerInfo.signer,
        data: {
          contentType: dobContentType,
          content: ccc.Bytes.from(dobContent) 
        },
      });

      await spore.tx.completeFeeBy(signerInfo.signer, 1000);
      await signerInfo.signer.sendTransaction(spore.tx);
      setSporeId(spore.id);
      success("DOB Stamp created successfully!", `Spore ID: ${spore.id}`);
    } catch (err: any) {
      console.error("Failed to create DOB stamp:", err);
      error("Failed to create DOB stamp", err.message);
    } finally {
      setIsCreatingDOB(false);
    }
  };
  
  const handleCreateOnChainLetter = async () => {
    if (!isSignedIn) {
      return error("Please sign in first");
    }

    if (!receiverLock.trim() || !message.trim()) {
      return error("Please fill in receiver lock and message");
    }

    if (!signerInfo?.signer) {
      return error("Please connect wallet first");
    }

    setIsCreatingLetter(true);

    try {
      const password = await prompt(
        "Enter your password",
        "Please enter your password to create the on-chain letter:",
        "",
        {
          type: "password",
          placeholder: "Enter password",
          confirmLabel: "Create",
        }
      );
      if (!password) {
        return error("Password required to create letter");
      }

      const senderPrivkey = hexToBytes(await exportPrivateKey(password));

      // Create a mock receiver lock script
      const receiverLockScript = ccc.Script.from({
        codeHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        hashType: "type",
        args: receiverLock,
      });

      // Create a mock letter event function
      const createLetterEvent = (extraTags: string[][]): Promise<Event> => {
        return createPowNote({
          senderPrivkey,
          recipient: {
            publicKey:
              "ce6232feaec4e6d01a4e00daa3648030c42017bdf589e34b53744fc49c5cba8a",
          },
          message,
          difficulty: 1,
          extraTags,
        });
      };

      const result = await createOnChainLetter(
        receiverLockScript,
        signerInfo.signer,
        createLetterEvent
      );

      setLetterTypeHash(result.letterTypeHash);
      success(
        "On-chain letter created successfully!",
        `Letter type hash: ${result.letterTypeHash}`
      );
      info("Transaction details", `Event ID: ${result.signedEvent.id}`);
    } catch (err: any) {
      console.error("Failed to create on-chain letter:", err);
      error("Failed to create on-chain letter", err.message);
    } finally {
      setIsCreatingLetter(false);
    }
  };

  const handleSealLetterWithDOBStamp = async () => {
    if (!isSignedIn) {
      return error("Please sign in first");
    }

    if (!letterTypeHash.trim() || !sporeId.trim()) {
      return error("Please fill in letter type hash and spore ID");
    }

    if (!signerInfo?.signer) {
      return error("Please connect wallet first");
    }

    setIsSealingStamp(true);

    try {
      const tx = await sealLetterWithDOBStamp(
        letterTypeHash as Hex,
        sporeId as Hex,
        signerInfo.signer
      );

      success(
        "Letter sealed with DOB stamp successfully!",
        "Transaction completed"
      );
      info("Transaction details", `Transaction hash: ${tx.hash()}`);
    } catch (err: any) {
      console.error("Failed to seal letter with DOB stamp:", err);
      error("Failed to seal letter with DOB stamp", err.message);
    } finally {
      setIsSealingStamp(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          DOB Seal Test Page
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Test the DOB (Date of Birth) seal functionality for on-chain letters
        </p>
      </div>

      {/* Authentication Status */}
      <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Authentication Status
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {isSignedIn ? "✅ Signed in" : "❌ Not signed in"}
        </p>
      </div>

      {/* Create DOB Stamp Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          1. Create DOB Stamp
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Content Type (e.g., "text/plain", "application/json")
            </label>
            <input
              type="text"
              value={dobContentType}
              onChange={(e) => setDobContentType(e.target.value)}
              placeholder="text/plain"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Content
            </label>
            <textarea
              value={dobContent}
              onChange={(e) => setDobContent(e.target.value)}
              placeholder="Enter your DOB content..."
              className="w-full h-32 px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleCreateDOBStamp}
            disabled={
              !isSignedIn ||
              isCreatingDOB ||
              !dobContentType.trim() ||
              !dobContent.trim()
            }
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingDOB ? "Creating..." : "Create DOB Stamp"}
          </button>
        </div>

        {sporeId && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              DOB Stamp Created
            </h3>
            <p className="text-xs font-mono text-green-700 dark:text-green-300 break-all">
              Spore ID: {sporeId}
            </p>
          </div>
        )}
      </div>

      {/* Create On-Chain Letter Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          2. Create On-Chain Letter
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Receiver Lock (Hex)
            </label>
            <input
              type="text"
              value={receiverLock}
              onChange={(e) => setReceiverLock(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Message Content
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message content..."
              className="w-full h-32 px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleCreateOnChainLetter}
            disabled={
              !isSignedIn ||
              isCreatingLetter ||
              !receiverLock.trim() ||
              !message.trim()
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingLetter ? "Creating..." : "Create On-Chain Letter"}
          </button>
        </div>

        {letterTypeHash && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Letter Type Hash Generated
            </h3>
            <p className="text-xs font-mono text-green-700 dark:text-green-300 break-all">
              {letterTypeHash}
            </p>
          </div>
        )}
      </div>

      {/* Seal Letter with DOB Stamp Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          3. Seal Letter with DOB Stamp
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Letter Type Hash (from step 1)
            </label>
            <input
              type="text"
              value={letterTypeHash}
              onChange={(e) => setLetterTypeHash(e.target.value)}
              placeholder="Letter type hash..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Spore ID (Hex)
            </label>
            <input
              type="text"
              value={sporeId}
              onChange={(e) => setSporeId(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all font-mono"
            />
          </div>

          <button
            onClick={handleSealLetterWithDOBStamp}
            disabled={
              !isSignedIn ||
              isSealingStamp ||
              !letterTypeHash.trim() ||
              !sporeId.trim()
            }
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSealingStamp ? "Sealing..." : "Seal Letter with DOB Stamp"}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          How to Test
        </h3>
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
          <p>1. Make sure you are signed in to the application and connect your wallet</p>
          <p>2. Create a DOB stamp by entering content type and content, then click "Create DOB Stamp"</p>
          <p>3. Enter a receiver lock (hex format) and message content</p>
          <p>
            4. Click "Create On-Chain Letter" to generate a letter type hash
          </p>
          <p>
            5. Use the generated letter type hash and spore ID to seal the letter
          </p>
          <p>6. Click "Seal Letter with DOB Stamp" to complete the process</p>
          <p className="text-yellow-600 dark:text-yellow-400">
            Note: This is a test page with mock transaction signing. In a real
            environment, you would need proper CKB wallet integration.
          </p>
        </div>
      </div>
    </section>
  );
}
