"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/app", label: "Heute" },
  { href: "/app/clients", label: "Klienten" },
  { href: "/app/exports", label: "Export" },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-amber-50 text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">
              MOVA
            </div>
            <span className="text-sm font-semibold text-slate-900">
              Rechnungen
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                pathname.startsWith("/app/settings")
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              href="/app/settings"
              aria-label="Settings"
            >
              ⚙
            </Link>
          </nav>
          <Link
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
            href="/operator"
          >
            Advanced / Operator
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
