import Link from "next/link";
import { ThemeSwitch } from "./theme-switch";
import { SignIn } from "./auth";

const navItems = {
  "/blog": { name: "Blog" },
  "/dashboard": { name: "Dashboard" },
};

export function ReachMeLogo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-colors"
    >
      {/* Connection dots */}
      <circle cx="4" cy="10" r="2.5" className="fill-neutral-600 dark:fill-neutral-400" />
      <circle cx="16" cy="6" r="2" className="fill-neutral-500 dark:fill-neutral-500" />
      <circle cx="16" cy="14" r="2" className="fill-neutral-500 dark:fill-neutral-500" />
      
      {/* Connection lines */}
      <path
        d="M6.5 10L14 6M6.5 10L14 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-neutral-600 dark:stroke-neutral-400"
      />
    </svg>
  );
}

export function Navbar() {
  return (
    <nav className="mb-8 py-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-6 items-center">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors capitalize"
          >
            Home
          </Link>
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
