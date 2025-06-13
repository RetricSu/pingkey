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
        <h1 className="text-2xl md:text-2xl font-light tracking-tight mb-6 text-neutral-900 dark:text-neutral-100 capitalize">
          Easiest way to reach you on internet
        </h1>

        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-12 leading-relaxed">
          Let other people reach you <br /> without email, phone, or any social
          media accounts.
        </p>

        <Link
          href={isSignedIn ? "/mailbox" : "/signin"}
          className="inline-block px-6 py-3 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-900 dark:hover:border-neutral-300 transition-colors duration-200"
        >
          {isSignedIn ? `Hello Back, ${profile?.name}` : "Set up your profile"}
        </Link>
      </div>
    </section>
  );
}
