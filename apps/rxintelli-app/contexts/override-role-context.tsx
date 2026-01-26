"use client";

import * as React from "react";

export type OverrideRole = "admin" | "rph" | null;

type Context = {
  overrideRole: OverrideRole;
  setOverrideRole: (r: OverrideRole) => void;
};

const Ctx = React.createContext<Context | null>(null);

export function OverrideRoleProvider({ children }: { children: React.ReactNode }) {
  const [overrideRole, setOverrideRole] = React.useState<OverrideRole>(null);
  const value = React.useMemo(
    () => ({ overrideRole, setOverrideRole }),
    [overrideRole]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOverrideRole() {
  const ctx = React.useContext(Ctx);
  if (!ctx) return { overrideRole: null as OverrideRole, setOverrideRole: () => {} };
  return ctx;
}
