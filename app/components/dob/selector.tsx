"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ccc, useCcc } from "@ckb-ccc/connector-react";
import { findSporesBySigner } from "@ckb-ccc/spore";
import { useNotification } from "../../contexts/notification";

export interface DOBItem {
  id: string;
  contentType: string;
  content: string;
  clusterId?: string;
  cell: any;
  sporeData: any;
  scriptInfo: any;
}

interface DOBSelectorProps {
  onSelect?: (dobId: string) => void;
  selectedId?: string;
  className?: string;
}

export function DOBSelector({ onSelect, selectedId, className = "" }: DOBSelectorProps) {
  const { signerInfo } = useCcc();
  const { error } = useNotification();
  
  const [dobItems, setDobItems] = useState<DOBItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDOBItems = useCallback(async () => {
    if (!signerInfo?.signer) {
      setErrorMessage("No signer available. Please connect your wallet first.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const items: DOBItem[] = [];
      
      // Use the findSporesBySigner function to get all spores owned by the signer
      for await (const result of findSporesBySigner({
        signer: signerInfo.signer,
        order: "desc", // Most recent first
        limit: 100, // Limit to 100 items
      })) {
        items.push({
          id: result.cell.cellOutput.type?.args || "",
          contentType: result.sporeData.contentType,
          content: typeof result.sporeData.content === 'string' ? result.sporeData.content : ccc.hexFrom(result.sporeData.content),
          clusterId: result.sporeData.clusterId ? (typeof result.sporeData.clusterId === 'string' ? result.sporeData.clusterId : ccc.hexFrom(result.sporeData.clusterId)) : undefined,
          cell: result.cell,
          sporeData: result.sporeData,
          scriptInfo: result.scriptInfo,
        });
      }

      setDobItems(items);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch DOB items";
      setErrorMessage(errorMsg);
      error("Failed to fetch DOB items", errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [signerInfo?.signer, error]);

  useEffect(() => {
    fetchDOBItems();
  }, [fetchDOBItems]);

  const handleItemClick = (dobId: string) => {
    onSelect?.(dobId);
  };

  const getContentPreview = (content: string, contentType: string) => {
    if (contentType.startsWith("text/")) {
      try {
        const decoded = new TextDecoder().decode(new Uint8Array(Buffer.from(content, 'hex')));
        return decoded.length > 50 ? decoded.substring(0, 50) + "..." : decoded;
      } catch {
        return "Text content";
      }
    } else if (contentType.startsWith("image/")) {
      return "Image content";
    } else if (contentType.startsWith("application/json")) {
      try {
        const decoded = new TextDecoder().decode(new Uint8Array(Buffer.from(content, 'hex')));
        const parsed = JSON.parse(decoded);
        return "JSON: " + (parsed.name || parsed.title || "Data");
      } catch {
        return "JSON content";
      }
    } else {
      return `${contentType} content`;
    }
  };

  const formatId = (id: string) => {
    if (id.length > 20) {
      return id.substring(0, 10) + "..." + id.substring(id.length - 10);
    }
    return id;
  };

  if (!signerInfo?.signer) {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          Please connect your wallet to view your DOB items.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400" />
          Loading your DOB items...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <div className="text-sm text-red-800 dark:text-red-200">
          Error: {errorMessage}
        </div>
        <button
          onClick={fetchDOBItems}
          className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (dobItems.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg ${className}`}>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          No DOB items found. You don't own any Digital Objects on the CKB network.
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
        Your DOB Items ({dobItems.length})
      </div>
      
      <div className="grid gap-2 max-h-96 overflow-y-auto">
        {dobItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`
              p-3 border rounded-lg cursor-pointer transition-all
              ${selectedId === item.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {formatId(item.id)}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {item.contentType}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 truncate">
                  {getContentPreview(item.content, item.contentType)}
                </div>
                {item.clusterId && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Cluster: {formatId(item.clusterId)}
                  </div>
                )}
              </div>
              {selectedId === item.id && (
                <div className="ml-2 text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedId && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="text-xs text-green-800 dark:text-green-200">
            Selected: {formatId(selectedId)}
          </div>
        </div>
      )}
    </div>
  );
}
