"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { custom } from "../gadget/dialog";
import { getPow } from "nostr-tools/nip13";
import { hashArtProviderRegistry } from "./providers";
import type { HashArtProvider } from "./providers";

interface HashArtRendererProps {
  hash?: string;
  width?: number;
  height?: number;
  className?: string;
  clickable?: boolean;
  providerId?: string; // 新增：指定使用的 provider
  showPostmark?: boolean; // 新增：显示邮戳覆盖层
  postmarkText?: string; // 新增：邮戳文字
  showDate?: boolean; // 新增：显示日期
  date?: Date | string; // 新增：日期数据
  postmarkPosition?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "center"; // 新增：邮戳位置
}

// 扩展对话框组件，支持 provider 选择
function HashArtDialog({
  hash,
  providerId,
  showPostmark,
  postmarkText,
  showDate,
  date,
  postmarkPosition,
  onResolve,
  onReject,
}: {
  hash?: string;
  providerId?: string;
  showPostmark?: boolean;
  postmarkText?: string;
  showDate?: boolean;
  date?: Date | string;
  postmarkPosition?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "center";
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
            width={320}
            height={400}
            className="border border-neutral-200 dark:border-neutral-700 rounded-lg"
            clickable={false}
            providerId={providerId}
            showPostmark={showPostmark}
            postmarkText={postmarkText}
            showDate={showDate}
            date={date}
            postmarkPosition={postmarkPosition}
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
          {hashArtProviderRegistry.getProviderConfig(providerId!)?.name ||
            "Unknown"}
        </p>
      </div>

      {/* Description */}
      <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        <p className="mb-2">
          Every Pow Stamp is a unique piece of art
          <br />
          determined by the hash of the message.
        </p>
        <p>The higher the difficulty, the more complex the stamp art.</p>
      </div>
    </div>
  );
}

// 邮戳覆盖层组件
function PostmarkOverlay({
  text = "HELLO PROFILE",
  date,
  position = "top-right",
  size = 60,
}: {
  text?: string;
  date?: Date | string;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "center";
  size?: number;
}) {
  // 生成唯一ID避免多个邮戳冲突
  const uniqueId = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .toUpperCase();
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-0 left-0";
      case "top-right":
        return "top-0 right-0";
      case "bottom-left":
        return "bottom-0 left-0";
      case "bottom-right":
        return "bottom-0 right-0";
      case "center":
        return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
      default:
        return "top-0 right-0";
    }
  };

  return (
    <div
      className={`absolute ${getPositionClasses()} pointer-events-none`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="text-black/60 dark:text-white/60"
      >
        {/* 圆形外圈 */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3,2"
        />

        {/* 内圈 */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />

        {/* 波浪线装饰 */}
        <path
          d="M 20 50 Q 25 45, 30 50 T 40 50 T 50 50 T 60 50 T 70 50 T 80 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M 20 55 Q 25 50, 30 55 T 40 55 T 50 55 T 60 55 T 70 55 T 80 55"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />

        {/* 文字 - 上半圆弧 */}
        <defs>
          <path id={`top-circle-${uniqueId}`} d="M 20 50 A 30 30 0 0 1 80 50" />
        </defs>
        <text fontSize="6" fill="currentColor" textAnchor="middle">
          <textPath href={`#top-circle-${uniqueId}`} startOffset="50%">
            {text}
          </textPath>
        </text>

        {/* 日期 - 中心 */}
        {date && (
          <text
            x="50"
            y="40"
            fontSize="5"
            fill="currentColor"
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-mono"
          >
            {formatDate(date)}
          </text>
        )}
      </svg>
    </div>
  );
}

// 日期标签组件
function DateLabel({
  date,
  position = "bottom-left",
}: {
  date: Date | string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-1 left-1";
      case "top-right":
        return "top-1 right-1";
      case "bottom-left":
        return "bottom-1 left-1";
      case "bottom-right":
        return "bottom-1 right-1";
      default:
        return "bottom-1 left-1";
    }
  };

  return (
    <div
      className={`absolute ${getPositionClasses()} bg-white/90 dark:bg-black/90 text-black dark:text-white text-xs px-1 py-0.5 rounded font-mono pointer-events-none`}
    >
      {formatDate(date)}
    </div>
  );
}

export function HashArtRenderer({
  hash,
  width = 100,
  height = 120,
  className = "",
  clickable = true,
  providerId,
  showPostmark = false,
  postmarkText = "HELLO PROFILE",
  showDate = false,
  date,
  postmarkPosition = "top-right",
}: HashArtRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentProvider, setCurrentProvider] =
    useState<HashArtProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false); // 跟踪组件是否已卸载

  const leadingZeros = useMemo(() => {
    if (!hash) return 0;
    return getPow(hash);
  }, [hash]);

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
            providerId={providerId}
            showPostmark={showPostmark}
            postmarkText={postmarkText}
            showDate={showDate}
            date={date}
            postmarkPosition={postmarkPosition}
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
      className={`hash-art-renderer ${className} relative flex items-center justify-center ${
        clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      } ${isLoading ? "bg-neutral-100 dark:bg-neutral-800" : ""}`}
      style={{ width, height }}
      onClick={handleClick}
      title={clickable ? "Click to view larger" : undefined}
    >
      {/* 艺术内容容器 */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
      >
        {isLoading && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-neutral-400 dark:text-neutral-600 text-xs">
              Rendering...
            </div>
          </div>
        )}
      </div>

      {/* 邮戳覆盖层 */}
      {showPostmark && isMounted && (
        <PostmarkOverlay
          text={postmarkText}
          date={showPostmark && date ? date : undefined}
          position={postmarkPosition}
          size={Math.min(width, height) * 0.6}
        />
      )}

      {/* 独立的日期标签 */}
      {showDate && date && !showPostmark && isMounted && (
        <DateLabel
          date={date}
          position={
            postmarkPosition === "center" ? "bottom-left" : postmarkPosition
          }
        />
      )}
    </div>
  );
}

// 向后兼容的别名
export const PowHashArt = HashArtRenderer;

// 默认导出
export default HashArtRenderer;
