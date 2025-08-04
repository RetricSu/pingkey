"use client";

import { useEffect, useState } from "react";
import { generateIdenticon } from "../../lib/util";

interface AvatarProps {
  publicKey: string;
  pictureUrl?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export function Avatar({ 
  publicKey, 
  pictureUrl, 
  alt = "Avatar", 
  size = 64, 
  className = "" 
}: AvatarProps) {
  const [identiconUrl, setIdenticonUrl] = useState<string>("");

  useEffect(() => {
    // Only generate identicon if no picture URL is provided
    if (!pictureUrl) {
      const identicon = generateIdenticon(publicKey, size);
      setIdenticonUrl(identicon);
    }
  }, [publicKey, pictureUrl, size]);

  // If a picture URL is provided, use it; otherwise use the generated identicon
  const imageSrc = pictureUrl || identiconUrl;

  if (!imageSrc) {
    // Fallback while identicon is being generated
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-gray-400 dark:text-gray-600 text-xs">
          {publicKey?.slice(0, 2).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
} 
