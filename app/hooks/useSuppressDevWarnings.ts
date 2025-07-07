import { useEffect } from 'react';

/**
 * 在开发模式下抑制特定的控制台警告
 * 主要用于忽略第三方库在热重载时产生的无害警告
 */
export function useSuppressDevWarnings() {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      const originalError = console.error;
      const originalWarn = console.warn;
      
      // 需要忽略的警告模式
      const warningPatterns = [
        "CustomElementRegistry",
        "already has",
        '"ccc-connector"',
        '"ccc-button-pill"',
        '"ccc-button"',
        "This may have been caused by live reload",
        "hot module replacement"
      ];
      
      const shouldSuppressMessage = (message: string) => {
        return warningPatterns.some(pattern => 
          message?.includes?.(pattern)
        );
      };
      
      console.error = (...args) => {
        const message = args[0]?.toString?.() || '';
        if (!shouldSuppressMessage(message)) {
          originalError.apply(console, args);
        }
      };

      console.warn = (...args) => {
        const message = args[0]?.toString?.() || '';
        if (!shouldSuppressMessage(message)) {
          originalWarn.apply(console, args);
        }
      };

      return () => {
        console.error = originalError;
        console.warn = originalWarn;
      };
    }
  }, []);
} 
