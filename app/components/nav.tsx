import Link from "next/link";
import { ThemeSwitch } from "./theme-switch";
import { SignIn } from "./auth";

const navItems = {
  "/blog": { name: "Blog" },
  "/dashboard": { name: "Dashboard" },
};

export function Navbar() {
  return (
    <nav className="mb-8 py-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-6 items-center">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors capitalize"
          >
            home
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
