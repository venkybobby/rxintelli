"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useOverrideRole } from "@/contexts/override-role-context";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/intake", label: "Intake" },
  { href: "/verification", label: "Verification" },
  { href: "/entry", label: "Entry" },
  { href: "/adjudication", label: "Adjudication" },
  { href: "/schedule", label: "Schedule" },
  { href: "/control-tower", label: "Control Tower" },
  { href: "/flow-demo", label: "Flow Demo" },
] as const;

function roleLabel(role?: string | null): string {
  if (role === "admin") return "Admin";
  if (role === "rph") return "RPh";
  if (role === "patient") return "Patient";
  return "User";
}

const OVERRIDE_OPTIONS: { value: "admin" | "rph"; label: string }[] = [
  { value: "rph", label: "RPh" },
  { value: "admin", label: "Admin" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { overrideRole, setOverrideRole } = useOverrideRole();
  const role = session?.user?.role;
  const isRphOrAdmin = role === "rph" || role === "admin";
  const effectiveRole = overrideRole ?? role;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-teal-700">
            RxIntelli
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {status === "loading" && (
            <span className="text-xs text-slate-400">Loading…</span>
          )}
          {status === "unauthenticated" && (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          )}
          {status === "authenticated" && session?.user && (
            <>
              <span className="hidden text-xs text-slate-500 sm:inline">
                Logged as {roleLabel(effectiveRole)}
              </span>
              {isRphOrAdmin && (
                <select
                  value={overrideRole ?? ""}
                  onChange={(e) =>
                    setOverrideRole(
                      (e.target.value as "admin" | "rph") || null
                    )
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  aria-label="Override role (demo)"
                >
                  <option value="">Override: —</option>
                  {OVERRIDE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOverrideRole(null);
                  signOut({ callbackUrl: "/" });
                }}
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
