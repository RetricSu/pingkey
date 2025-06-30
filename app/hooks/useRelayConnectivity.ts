"use client";

import { useState, useEffect, useCallback } from "react";
import { useNostr } from "../contexts/nostr";
import { RelayListItem } from "../lib/type";

interface UseRelayConnectivityReturn {
  relaysWithStatus: RelayListItem[];
  isChecking: boolean;
}

export function useRelayConnectivity(
  relayList: RelayListItem[],
  checkOnMount: boolean = true
): UseRelayConnectivityReturn {
  const { nostr } = useNostr();
  const [relaysWithStatus, setRelaysWithStatus] =
    useState<RelayListItem[]>(relayList);
  const [isChecking, setIsChecking] = useState(false);

  // Update relaysWithStatus when relayList changes
  useEffect(() => {
    setRelaysWithStatus(
      relayList.map((relay) => ({
        ...relay,
        isConnected: relay.isConnected ?? undefined,
        isChecking: false,
      }))
    );
  }, [relayList]);

  const checkConnectivity = useCallback(async () => {
    if (!nostr || relayList.length === 0) {
      return;
    }

    setIsChecking(true);

    // Mark all relays as checking
    setRelaysWithStatus((prev) =>
      prev.map((relay) => ({ ...relay, isChecking: true }))
    );

    try {
      const relayUrls = relayList.map((relay) => relay.url);
      const connectivityResults = await nostr.checkMultipleRelayConnectivity(
        relayUrls,
        5000
      );

      setRelaysWithStatus((prev) =>
        prev.map((relay) => ({
          ...relay,
          isConnected: connectivityResults.get(relay.url) ?? false,
          isChecking: false,
        }))
      );
    } catch (error) {
      console.error("Error checking relay connectivity:", error);
      // Mark all as not checking and unknown status
      setRelaysWithStatus((prev) =>
        prev.map((relay) => ({
          ...relay,
          isConnected: undefined,
          isChecking: false,
        }))
      );
    } finally {
      setIsChecking(false);
    }
  }, [nostr, relayList]);

  // Check once on mount if enabled
  useEffect(() => {
    if (checkOnMount && nostr && relayList.length > 0) {
      // Small delay to ensure everything is ready
      const timeout = setTimeout(() => {
        checkConnectivity();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [checkOnMount, nostr, relayList.length, checkConnectivity]);

  return {
    relaysWithStatus,
    isChecking,
  };
}
