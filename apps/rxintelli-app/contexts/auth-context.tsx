"use client";

import * as React from "react";

export type RxRole = "admin" | "rph" | "patient";

const ROLE_KEY = "role";
const PATIENT_ID_KEY = "rxintelli-patientId";

function getStoredRole(): RxRole {
  if (typeof window === "undefined") return "admin";
  const v = localStorage.getItem(ROLE_KEY);
  if (v === "admin" || v === "rph" || v === "patient") return v;
  return "admin";
}

function getStoredPatientId(): string | null {
  if (typeof window === "undefined") return "PAT-45678";
  return localStorage.getItem(PATIENT_ID_KEY) || "PAT-45678";
}

interface AuthContextValue {
  role: RxRole;
  setRole: (r: RxRole) => void;
  patientId: string | null;
  setPatientId: (id: string | null) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/**
 * Demo role switcher: persist role in localStorage.
 * For demo: localStorage.setItem('role', 'rph'); // or 'patient' | 'admin'
 * Then refresh or change via header selector.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<RxRole>("admin");
  const [patientId, setPatientIdState] = React.useState<string | null>("PAT-45678");
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    setRoleState(getStoredRole());
    setPatientIdState(getStoredPatientId());
  }, []);

  const setRole = React.useCallback((r: RxRole) => {
    if (typeof window !== "undefined") localStorage.setItem(ROLE_KEY, r);
    setRoleState(r);
  }, []);

  const setPatientId = React.useCallback((id: string | null) => {
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(PATIENT_ID_KEY, id);
      else localStorage.removeItem(PATIENT_ID_KEY);
    }
    setPatientIdState(id);
  }, []);

  const value = React.useMemo(
    () => ({ role, setRole, patientId, setPatientId }),
    [role, setRole, patientId, setPatientId]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
