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
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-6 text-neutral-900 dark:text-neutral-100">
            PingKey — Not a chat. Just a worry-free way to let people reach you
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
            Without Email, Phone or any Social Media Accounts.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-light tracking-tight mb-8 text-neutral-900 dark:text-neutral-100 text-center">
            How it works
          </h2>

          <div className="space-y-8">
            <div className="text-left">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                1. Drop one link.
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Paste your PingKey URL anywhere you'd normally expose an email
                address—README, blog, profile bio. You identity is just a pure crypto key lives in your browser with password encrypted.
              </p>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                2. Visitor sends a note… and mints a Stamp.
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Any visitor(requires no signup) can just
                type a message and send it with a spam-proof Stamp forged from
                Proof-of-Work by their browser. Think of the Stamp as a digital
                post-mark nobody else can replicate.
              </p>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                3. Message + Stamp travel the open network.
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                The sealed note is broadcast over a open, verifiable and switchable network. Only you have the key to decrypt and read it.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href={isSignedIn ? "/mailbox" : "/signin"}
            className="inline-block px-6 py-3 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-900 dark:hover:border-neutral-300 transition-colors duration-200 capitalize"
          >
            {isSignedIn
              ? `Hello Back, ${profile?.name}`
              : "Build your Contact Link"}
          </Link>
          {!isSignedIn && (
            <Link
              href="/p/87b915fff950d6683f449edb8d283c04ac789c506daf49dbdbd97b344e5db383"
              className="inline-block px-6 py-3 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-900 dark:hover:border-neutral-300 transition-colors duration-200"
            >
              Check a Demo Link
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
