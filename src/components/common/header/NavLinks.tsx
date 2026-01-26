"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "./constants";

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2">
      {NAV_LINKS.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={`nav-link-${link.label}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition hover:bg-surface-soft hover:text-ink ${
              isActive
                ? "font-semibold text-ink underline decoration-accent decoration-2 underline-offset-8"
                : "text-ink-muted"
            }`}
            href={{ pathname: link.href }}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
