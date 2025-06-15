"use client";

import Link from "next/link";
import { useAuth } from "./contexts/auth";
import { useUserProfile } from "./hooks/useUserProfile";

export default function Page() {
  const { isSignedIn } = useAuth();
  const { profile } = useUserProfile();

  return (
    <section className="max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-16">
          <h1 className="text-2xl md:text-2xl font-light tracking-tight mb-1 text-neutral-900 dark:text-neutral-100 capitalize">
            Let other people reach you
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed capitalize mb-6">
            Without Email, Phone or any Social Media Accounts.
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Relies on just a pure crypto key and client side validation.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href={isSignedIn ? "/mailbox" : "/signin"}
            className="inline-block px-6 py-3 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-900 dark:hover:border-neutral-300 transition-colors duration-200 capitalize"
          >
            {isSignedIn
              ? `Hello Back, ${profile?.name}`
              : "Set up your profile"}
          </Link>
          {!isSignedIn && (
            <Link
              href="/p/87b915fff950d6683f449edb8d283c04ac789c506daf49dbdbd97b344e5db383"
              className="inline-block px-6 py-3 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-900 dark:hover:border-neutral-300 transition-colors duration-200"
            >
              Check Example Profile
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
