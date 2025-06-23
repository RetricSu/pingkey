"use client";

import Link from "next/link";
import { useAuth } from "./contexts/auth";
import { useUserProfile } from "./hooks/useUserProfile";
import Image from "next/image";

export default function Page() {
  const { isSignedIn } = useAuth();
  const { profile } = useUserProfile();

  return (
    <section className="max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="mb-16">
        <div className="mb-16 text-center">
          {/* Logo and Title */}
          <div className="flex items-center justify-center my-6 sm:my-8 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700">
              <Image
                src="/logo.svg"
                alt="PingKey"
                width={40}
                height={40}
                className="sm:w-[50px] sm:h-[50px]"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extralight tracking-tight text-neutral-900 dark:text-neutral-100">
              PingKey
            </h1>
          </div>

          {/* Hero Text */}
          <div className="text-2xl text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
            A simple link to let people reach you without email, phone number or
            any social media.
          </div>
        </div>

        <div className="mb-16 flex justify-center">
          <Link
            href="/p/87b915fff950d6683f449edb8d283c04ac789c506daf49dbdbd97b344e5db383"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 shadow-lg hover:shadow-xl font-medium text-lg"
          >
            Check PingKey's Example Link
          </Link>
        </div>

        <div className="flex justify-center mt-32">
          <Image
            src="/img/user-flow.png"
            alt="User Flow"
            width={1200}
            height={1000}
          />
        </div>

        <div className="mb-16 mt-10">
          <h2 className="text-2xl font-light tracking-tight mb-10 text-neutral-900 dark:text-neutral-100 text-center border-b border-neutral-200 dark:border-neutral-700 pb-2">
            How it works
          </h2>

          <div className="space-y-8">
            <div className="text-left">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                1. Drop one link.
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Paste your PingKey URL anywhere you'd normally expose an email
                address—README, blog, profile bio. You identity is just a pure
                crypto key lives in your browser with password encrypted.
              </p>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                2. Visitor sends a note… and mints a Stamp.
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Any visitor(requires no signup) can just type a message and send
                it with a spam-proof Stamp forged from Proof-of-Work by their
                browser. Think of the Stamp as a digital post-mark nobody else
                can replicate.
              </p>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                3. Message + Stamp travel the open network.
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                The sealed note is broadcast over a open, verifiable and
                switchable network. Only you have the key to decrypt and read
                it.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16 mt-10">
          <h2 className="text-2xl font-light tracking-tight mb-10 text-neutral-900 dark:text-neutral-100 text-center border-b border-neutral-200 dark:border-neutral-700 pb-2">
            Who Should Use PingKey?
          </h2>
          <div className="flex justify-start gap-2">
            <div className="text-left">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Coder / Developers
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Leave a PingKey in your README to let people reach you
                encrypted.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Indie Bloggers
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Leave a PingKey in your blog to let people reach you encrypted.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Media / Journalists
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Leave a PingKey in your media profile to let people reach you
                encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
