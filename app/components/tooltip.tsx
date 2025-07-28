"use client";

import { useState, useRef } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "top-full left-1/2 transform -translate-x-1/2 border-t-black dark:border-t-white";
      case "bottom":
        return "bottom-full left-1/2 transform -translate-x-1/2 border-b-black dark:border-b-white";
      case "left":
        return "left-full top-1/2 transform -translate-y-1/2 border-l-black dark:border-l-white";
      case "right":
        return "right-full top-1/2 transform -translate-y-1/2 border-r-black dark:border-r-white";
      default:
        return "top-full left-1/2 transform -translate-x-1/2 border-t-black dark:border-t-white";
    }
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onClick={showTooltip}
    >
      {children}
      
      {isVisible && (
        <div
          className={`absolute z-50 ${getPositionClasses()}`}
          role="tooltip"
        >
          <div className="relative">
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-4 border-transparent ${getArrowClasses()}`}
            />
            
            {/* Tooltip content */}
            <div className="bg-black dark:bg-white text-white dark:text-black text-xs rounded shadow-lg px-3 py-2 w-[200px] whitespace-normal">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
