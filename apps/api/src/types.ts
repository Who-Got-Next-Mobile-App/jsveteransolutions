import type { UserRole } from "@vsn/types";

export interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
  displayName: string;
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}
