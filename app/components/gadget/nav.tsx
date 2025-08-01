import Link from "next/link";
import { ThemeSwitch } from "./theme-switch";
import { SignIn } from "../sign-in";

const navItems = {
  "/": { name: "Home" },
  "/blog/getting-started": { name: "Get Started" },
};

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
