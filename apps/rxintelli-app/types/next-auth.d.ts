import type { RxRole } from "@/lib/auth";

declare module "next-auth" {
  interface User {
    role?: RxRole;
    patientId?: string | null;
  }

  interface Session {
    user: User & {
      role?: RxRole;
      patientId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: RxRole;
    patientId?: string | null;
  }
}
