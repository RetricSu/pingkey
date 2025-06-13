"use client";

import { useState } from "react";
import { useAuth } from "../contexts/auth";
import { UserDropdown } from "./user-dropdown";
import { SignInForm } from "./sign-in-form";

export function SignIn() {
  const { isSignedIn, pubkey, signOut } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  const handleSignInSuccess = () => {
    setShowSignIn(false);
  };

  const handleSignInCancel = () => {
    setShowSignIn(false);
  };

  if (isSignedIn) {
    return <UserDropdown pubkey={pubkey!} onSignOut={signOut} />;
  }

  if (!showSignIn) {
    return (
      <button
        onClick={() => setShowSignIn(true)}
        className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline"
      >
        sign in
      </button>
    );
  }

  return (
    <SignInForm 
      onCancel={handleSignInCancel} 
      onSuccess={handleSignInSuccess} 
    />
  );
}
