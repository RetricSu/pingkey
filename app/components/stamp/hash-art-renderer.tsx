"use client";

import { useEffect, useRef, useState } from "react";
import { custom } from "../dialog";
import { getPow } from "nostr-tools/nip13";
import { hashArtProviderRegistry } from "./providers";
import type { HashArtProvider } from "./providers";

interface HashArtRendererProps {
  hash?: string;
  leadingZeros?: number;
  width?: number;
  height?: number;
  className?: string;
  clickable?: boolean;
  providerId?: string; // 新增：指定使用的 provider
}

// 扩展对话框组件，支持 provider 选择
function HashArtDialog({
  hash,
  leadingZeros,
  providerId,
  onResolve,
  onReject,
}: {
  hash?: string;
  leadingZeros?: number;
  providerId?: string;
  onResolve: (result: any) => void;
  onReject: () => void;
}) {

  return (
    <div className="p-4 sm:p-6 max-w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          POW Stamp
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

      {/* Art display container with responsive sizing */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-md flex justify-center">
          <HashArtRenderer
            hash={hash}
            leadingZeros={leadingZeros}
            width={320}
            height={400}
            className="border border-neutral-200 dark:border-neutral-700 rounded-lg"
            clickable={false}
            providerId={providerId}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="text-center space-y-2 mb-6">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
          Hash:{" "}
          {hash ? `${hash.slice(0, 10)}...${hash.slice(-10)}` : "Simulated"}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Pow Difficulty: {hash ? getPow(hash) : "Unknown"}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Art Provider:{" "}
          {hashArtProviderRegistry.getProviderConfig(providerId!)
            ?.name || "Unknown"}
        </p>
      </div>

      {/* Description */}
      <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        <p className="mb-2">
          Every Pow Stamp is a unique piece of art<br/>
          determined by the hash of the message.
        </p>
        <p>The higher the difficulty, the more complex the stamp art.</p>
      </div>
    </div>
  );
}

export function HashArtRenderer({
  hash,
  leadingZeros = 0,
  width = 100,
  height = 120,
  className = "",
  clickable = true,
  providerId,
}: HashArtRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentProvider, setCurrentProvider] =
    useState<HashArtProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false); // 跟踪组件是否已卸载

  // 确定使用的 provider ID
  const getResolvedProviderId = (): string => {
    if (providerId) return providerId;
    const defaultProvider = hashArtProviderRegistry.getDefaultProvider();
    return defaultProvider?.id || "p5-generative";
  };
  const resolvedProviderId = getResolvedProviderId();

  // Handle click to open expanded dialog
  const handleClick = async () => {
    if (!clickable) return;

    try {
      await custom(
        (props) => (
          <HashArtDialog
            hash={hash}
            leadingZeros={leadingZeros}
            providerId={resolvedProviderId}
            {...props}
          />
        ),
        {
          maxWidth: "xl",
          closeOnBackdrop: true,
        }
      );
    } catch (error) {
      // User closed the dialog, no action needed
    }
  };

  useEffect(() => {
    // Only run on the client side
    if (typeof window === "undefined") return;

    isMountedRef.current = true;
    setIsMounted(true);

    // 组件卸载时设置标志并清理
    return () => {
      isMountedRef.current = false;
      if (currentProvider) {
        try {
          currentProvider.cleanup?.();
        } catch (cleanupError) {
          console.debug("Provider cleanup error:", cleanupError);
        }
      }
    };
  }, [currentProvider]);

  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    let cancelled = false;

    const renderArt = async () => {
      if (cancelled) return;

      setIsLoading(true);
      setError(null);

      try {
        // 获取 provider
        const provider =
          hashArtProviderRegistry.getProvider(resolvedProviderId);
        if (!provider) {
          throw new Error(`Provider '${resolvedProviderId}' not found`);
        }

        if (cancelled) return;

        // 清理之前的 provider
        if (currentProvider && currentProvider !== provider) {
          try {
            currentProvider.cleanup?.();
          } catch (cleanupError) {
            console.debug("Provider cleanup error:", cleanupError);
          }
        }

        if (cancelled) return;

        setCurrentProvider(provider);

        // 渲染艺术
        await provider.render({
          hash: hash!,
          leadingZeros,
          width,
          height,
          container: containerRef.current!,
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to render hash art:", err);
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    renderArt();

    // 清理函数
    return () => {
      cancelled = true;
      // 不在这里调用cleanup，让组件卸载时统一处理
    };
  }, [isMounted, hash, leadingZeros, width, height, resolvedProviderId]);

  // Show placeholder during SSR and before client-side mount
  if (!isMounted) {
    return (
      <div
        className={`hash-art-renderer ${className} bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center`}
        style={{ width, height }}
      >
        <div className="text-neutral-400 dark:text-neutral-600 text-xs">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`hash-art-renderer ${className} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center`}
        style={{ width, height }}
      >
        <div className="text-red-600 dark:text-red-400 text-xs text-center px-2">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`hash-art-renderer ${className} flex items-center justify-center ${
        clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      } ${isLoading ? "bg-neutral-100 dark:bg-neutral-800" : ""}`}
      style={{ width, height }}
      onClick={handleClick}
      title={clickable ? "Click to view larger" : undefined}
    >
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-neutral-400 dark:text-neutral-600 text-xs">
            Rendering...
          </div>
        </div>
      )}
    </div>
  );
}

// 向后兼容的别名
export const PowHashArt = HashArtRenderer;

// 默认导出
export default HashArtRenderer;
