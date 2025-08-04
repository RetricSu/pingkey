"use client";

import { useState, useEffect, useCallback } from "react";
import { Event } from "nostr-tools";
import { ccc, useCcc } from "@ckb-ccc/connector-react";
import { findOnChainLetter, isOnChainLetter } from "app/lib/collectible";
import { custom, CustomDialogProps } from "app/components/gadget/dialog";
import { useNotification } from "app/contexts/notification";
import { unpackToRawSporeData } from "@ckb-ccc/spore/advanced";
import { ParsedOnChainLetter } from "../../lib/collectible/type";

interface CollectibleIndicatorProps {
  powWrappedEvent: Event;
  className?: string;
}

export function CollectibleIndicator({
  powWrappedEvent,
  className = "",
}: CollectibleIndicatorProps) {
  const { client } = useCcc();
  const { error } = useNotification();

  const [isDOB, setIsDOB] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assetDetails, setAssetDetails] = useState<ParsedOnChainLetter | null>(
    null
  );

  // Check if this is a DOB letter
  useEffect(() => {
    const checkIsDOB = isOnChainLetter(powWrappedEvent);
    setIsDOB(checkIsDOB);
  }, [powWrappedEvent]);

  // Find DOB assets when user has wallet connected
  const findDOBAssets = useCallback(async () => {
    if (!isDOB || !client) {
      return;
    }

    setIsLoading(true);
    try {
      const dobAssets = await findOnChainLetter(powWrappedEvent, client);
      if (dobAssets) {
        setAssetDetails(dobAssets);
      }
    } catch (err) {
      console.error("Failed to find DOB assets:", err);
      error("Failed to load DOB assets", "Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [isDOB, client, powWrappedEvent, error]);

  useEffect(() => {
    findDOBAssets();
  }, [findDOBAssets]);

  const handleClick = async () => {
    if (!assetDetails) {
      error("No assets found", "DOB assets could not be loaded.");
      return;
    }

    try {
      await custom(
        (props) => (
          <CollectibleDetailsModal parsedOnChainLetter={assetDetails} {...props} />
        ),
        {
          maxWidth: "2xl",
          closeOnBackdrop: true,
        }
      );
    } catch (error) {
      // User closed the dialog, no action needed
    }
  };

  // Only show indicator if it's a DOB letter
  if (!isDOB) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || !assetDetails}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
        isLoading
          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
          : assetDetails
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer"
          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
      } ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
          <span>Loading DOB...</span>
        </>
      ) : assetDetails ? (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Assets ({assetDetails.dobCells.length + 1})</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>Assets</span>
        </>
      )}
    </button>
  );
}

export function CollectibleDetailsModal({
  parsedOnChainLetter,
  onResolve,
  onReject,
}: CustomDialogProps<void> & {
  parsedOnChainLetter;
}) {
  const formatHex = (hex: string) => {
    if (hex.length > 20) {
      return hex.substring(0, 10) + "..." + hex.substring(hex.length - 10);
    }
    return hex;
  };

  const getContentPreview = (
    content: string,
    contentType: string
  ): string | { type: "image"; url: string; contentType: string } => {
    if (contentType.startsWith("text/")) {
      try {
        const decoded = new TextDecoder().decode(
          new Uint8Array(Buffer.from(content, "hex"))
        );
        return decoded.length > 50 ? decoded.substring(0, 50) + "..." : decoded;
      } catch {
        return "Text content";
      }
    } else if (contentType.startsWith("image/")) {
      try {
        const decoded = ccc.bytesFrom(content);
        const blob = new Blob([decoded], { type: contentType });
        const imageUrl = URL.createObjectURL(blob);
        return { type: "image", url: imageUrl, contentType };
      } catch {
        return "Image content";
      }
    } else if (contentType.startsWith("application/json")) {
      try {
        const decoded = new TextDecoder().decode(
          new Uint8Array(Buffer.from(content, "hex"))
        );
        const parsed = JSON.parse(decoded);
        return "JSON: " + (parsed.name || parsed.title || "Data");
      } catch {
        return "JSON content";
      }
    } else {
      return `${contentType} content`;
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          DOB Assets of the Letter
        </h2>
        <button
          onClick={onReject}
          className="w-6 h-6 flex items-center justify-center text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Letter Cell Details - Envelope Style */}
        <div className="relative bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg overflow-hidden shadow-lg">
          {/* Airmail Border Pattern */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top border */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-blue-500 to-red-500">
              <div className="flex justify-between px-1">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-white rounded-full opacity-80"
                  ></div>
                ))}
              </div>
            </div>
            {/* Bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-blue-500 to-red-500">
              <div className="flex justify-between px-1">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-white rounded-full opacity-80"
                  ></div>
                ))}
              </div>
            </div>
            {/* Left border */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-red-500 via-blue-500 to-red-500">
              <div className="flex flex-col justify-between h-full py-1">
                {Array.from({ length: 15 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-white rounded-full opacity-80"
                  ></div>
                ))}
              </div>
            </div>
            {/* Right border */}
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-red-500 via-blue-500 to-red-500">
              <div className="flex flex-col justify-between h-full py-1">
                {Array.from({ length: 15 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-white rounded-full opacity-80"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Envelope Content */}
          <div className="relative p-6 pt-8 pb-8 pl-8 pr-8">
            {/* Sender Information (Top Left) */}
            <div className="absolute top-8 left-8 text-xs text-neutral-600 dark:text-neutral-400 font-serif">
              <div className="italic">(Date)</div>
              <div className="italic">(Sender's Full Name)</div>
              <div className="italic">(Sender's City, State, and Zip Code)</div>
            </div>

            {/* Recipient Information (Bottom Right) */}
            <div className="absolute bottom-8 right-8 text-xs text-neutral-600 dark:text-neutral-400 font-serif">
              <div className="italic">(Recipient's Full Name)</div>
              <div className="italic">(Recipient's Street Name and Number)</div>
              <div className="italic">
                (Recipient's City, State, and Zip Code)
              </div>
            </div>

            {/* Blockchain Information as Postmarks */}
            <div className="space-y-4">
              {/* Main Postmark - Capacity */}
              <div className="absolute top-4 right-4">
                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded border-2 border-white shadow-md">
                  <div className="font-bold text-center">CAPACITY</div>
                  <div className="text-center font-mono">
                    {ccc.fixedPointToString(
                      parsedOnChainLetter.letter.cell.cellOutput.capacity
                    )}{" "}
                    CKB
                  </div>
                </div>
              </div>

              {/* Central Message */}
              <div className="text-center pt-16 pb-16">
                <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  This Letter is on-chain
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Type Hash:{" "}
                  {formatHex(
                    parsedOnChainLetter.letter.cell.cellOutput.type?.hash() || "N/A"
                  )}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Lock Script:{" "}
                  {formatHex(parsedOnChainLetter.letter.cell.cellOutput.lock.hash()) ||
                    "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spore Assets Details */}
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            DOB Assets Attached ({parsedOnChainLetter.dobCells.length})
          </h3>
          {parsedOnChainLetter.dobCells.length > 0 ? (
            <div className="space-y-3">
              {parsedOnChainLetter.dobCells.map((sporeCell, index) => (
                <div
                  key={index}
                  className="border border-neutral-200 dark:border-neutral-700 rounded p-3"
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Capacity:
                      </span>
                      <span className="font-mono text-neutral-900 dark:text-neutral-100">
                        {ccc.fixedPointToString(sporeCell.cellOutput.capacity)}{" "}
                        CKB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Spore ID:
                      </span>
                      <span className="font-mono text-neutral-900 dark:text-neutral-100">
                        {formatHex(sporeCell.cellOutput.type?.args || "N/A")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Content Type:
                      </span>
                      <span className="font-mono text-neutral-900 dark:text-neutral-100">
                        {(() => {
                          try {
                            // Try to parse the spore data from the cell output
                            const sporeData = unpackToRawSporeData(
                              sporeCell.outputData
                            );
                            return sporeData.contentType || "N/A";
                          } catch {
                            return "N/A";
                          }
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Content Preview:
                      </span>
                      <div className="font-mono text-neutral-900 dark:text-neutral-100 text-xs">
                        {(() => {
                          try {
                            // Try to parse the spore data from the cell output
                            const sporeData = unpackToRawSporeData(
                              sporeCell.outputData
                            );
                            const contentType =
                              sporeData.contentType || "text/plain";
                            const content = sporeData.content || "";

                            if (content) {
                              const preview = getContentPreview(
                                ccc.hexFrom(content),
                                contentType
                              );

                              if (
                                typeof preview === "object" &&
                                "type" in preview &&
                                preview.type === "image"
                              ) {
                                return (
                                  <div className="mt-2">
                                    <img
                                      src={preview.url}
                                      alt="DOB Stamp"
                                      className="max-w-full h-auto max-h-32 rounded border border-neutral-200 dark:border-neutral-700"
                                      onLoad={() => {
                                        // Clean up the object URL after the image loads
                                        setTimeout(
                                          () =>
                                            URL.revokeObjectURL(preview.url),
                                          1000
                                        );
                                      }}
                                    />
                                  </div>
                                );
                              }

                              return <span>{String(preview)}</span>;
                            }
                            return "N/A";
                          } catch {
                            return "N/A";
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              No DOB stamps found for this letter.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-4 gap-2">
        <button
          onClick={() => onResolve()}
          className="cursor-pointer px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm font-medium"
        >
          Transfer On-chain Letter Cell
        </button>

        <button
          onClick={() => onResolve()}
          className="cursor-pointer px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm font-medium"
        >
          Extract DOB Assets
        </button>
        <button
          onClick={() => onResolve()}
          className="cursor-pointer px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}


