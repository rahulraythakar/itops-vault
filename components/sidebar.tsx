"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import {
  KeyRound,
  Bookmark,
  FileText,
  Search,
  Settings
} from "lucide-react";

// Structural, not decorative: the nav mirrors the actual item hierarchy
// (Vault / Bookmarks / Docs / Search / Org settings) rather than a generic
// icon-grid dashboard shell.
const links = [
  { href: "/", label: "Overview", icon: null },
  { href: "/vault", label: "Vault", icon: KeyRound },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/docs", label: "Docs & SOPs", icon: FileText },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings/org", label: "Organization", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-surface">
      <div className="border-b border-border p-4">
        <OrganizationSwitcher
          appearance={{ variables: { colorPrimary: "#0E6E5F" } }}
        />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-bold",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-background hover:text-ink"
              )}
            >
              {Icon && <Icon size={17} strokeWidth={2.5} />}
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-t border-border p-4">
        <UserButton />
        <span className="text-sm text-muted">Signed in</span>
      </div>
    </aside>
  );
}
