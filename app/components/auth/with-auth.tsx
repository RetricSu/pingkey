"use client";

import { ComponentType } from "react";
import { ProtectedRoute } from "./protected-route";

interface WithAuthOptions {
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
  showInlineAuth?: boolean;
}

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options?: WithAuthOptions
) {
  const WrappedComponent = (props: P) => {
    return (
      <ProtectedRoute
        redirectTo={options?.redirectTo}
        loadingComponent={options?.loadingComponent}
        showInlineAuth={options?.showInlineAuth}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  // Preserve the original component name for debugging
  WrappedComponent.displayName = `withAuth(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
