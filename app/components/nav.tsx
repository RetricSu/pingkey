import Link from "next/link";
import { ThemeSwitch } from "./theme-switch";
import { SignIn } from "./sign-in";

const navItems = {
  "/": { name: "Home" },
  "/blog": { name: "Blog" },
  "/mailbox": { name: "Mailbox" },
};

export function ReachMeLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-75 transition-opacity"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simple connection nodes */}
        <circle
          cx="10"
          cy="10"
          r="2"
          className="fill-neutral-900 dark:fill-neutral-100"
        />
        <circle
          cx="4"
          cy="6"
          r="1.5"
          className="fill-neutral-600 dark:fill-neutral-400"
        />
        <circle
          cx="16"
          cy="6"
          r="1.5"
          className="fill-neutral-600 dark:fill-neutral-400"
        />
        <circle
          cx="4"
          cy="14"
          r="1.5"
          className="fill-neutral-600 dark:fill-neutral-400"
        />
        <circle
          cx="16"
          cy="14"
          r="1.5"
          className="fill-neutral-600 dark:fill-neutral-400"
        />

        {/* Simple connection lines */}
        <path
          d="M8 10L5.5 6.5M12 10L14.5 6.5M8 10L5.5 13.5M12 10L14.5 13.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-neutral-600 dark:text-neutral-400"
        />
      </svg>
      <span className="font-medium text-lg">ReachMe</span>
    </Link>
  );
}

export function Navbar() {
  return (
    <nav className="mb-12 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-8 items-center">
          {Object.entries(navItems).map(([path, { name }]) => (
            <Link
              key={path}
              href={path}
              className="text-sm text-neutral-600 dark:text-neutral-400 transition-all hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              {name}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitch />
          <SignIn />
        </div>
      </div>
    </nav>
  );
}
