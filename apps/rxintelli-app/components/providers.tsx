"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/contexts/toast-context";
import { OverrideRoleProvider } from "@/contexts/override-role-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <OverrideRoleProvider>{children}</OverrideRoleProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
