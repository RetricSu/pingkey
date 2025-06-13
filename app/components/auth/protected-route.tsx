"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
  showInlineAuth?: boolean;
}

export function ProtectedRoute({
  children,
  redirectTo = "/",
  loadingComponent,
  showInlineAuth = false,
}: ProtectedRouteProps) {
  const { isSignedIn, pubkey } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if showInlineAuth is false and user is not authenticated
    if (!showInlineAuth && !isSignedIn && !pubkey) {
      router.push(redirectTo);
    }
  }, [showInlineAuth, isSignedIn, pubkey, router, redirectTo]);

  // Show inline auth prompt if enabled and user is not authenticated
  if (showInlineAuth && !isSignedIn && !pubkey) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            Authentication Required
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            You need to sign in with your Nostr account to access this page.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show loading component while auth state is being determined (redirect mode)
  if (!showInlineAuth && isSignedIn === false && !pubkey) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Redirecting...
          </div>
        </div>
      )
    );
  }

  // If signed in, render the protected content
  if (isSignedIn && pubkey) {
    return <>{children}</>;
  }

  // Default loading state while auth is being determined
  return (
    loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Loading...
        </div>
      </div>
    )
  );
}
