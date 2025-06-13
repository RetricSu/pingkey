"use client";

import { useRouter } from "next/navigation";
import { SignInForm } from "../components/sign-in/sign-in-form";
import { useAuth } from "../contexts/auth";
import { useEffect } from "react";

export default function SignInPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, router]);

  const handleCancel = () => {
    router.push("/");
  };

  const handleSuccess = () => {
    router.push("/");
  };

  // Don't render the form if user is already signed in
  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignInForm onCancel={handleCancel} onSuccess={handleSuccess} />
    </div>
  );
} 
