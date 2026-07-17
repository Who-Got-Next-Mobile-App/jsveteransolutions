import type { UserRole } from "@vsn/types";

export type PortalKind = "client" | "staff";

export interface AuthSession {
  mode: "dev" | "cognito";
  sub: string;
  email: string;
  role: UserRole;
  displayName: string;
  idToken?: string;
  accessToken?: string;
  expiresAt?: number;
}

export interface DevPersona {
  sub: string;
  email: string;
  role: "client" | "assistant" | "owner";
  name: string;
  label: string;
  description: string;
}

export const DEV_PERSONAS: DevPersona[] = [
  {
    sub: "dev-client-001",
    email: "client@example.com",
    role: "client",
    name: "Dev Client",
    label: "Local Dev Client",
    description: "Upload documents and track claim progress (local development only)."
  },
  {
    sub: "dev-owner-001",
    email: "dr.lee@jsveteransolutions.com",
    role: "owner",
    name: "Dr. Lee",
    label: "Owner / Provider",
    description: "Full access to all clients, documents, and operations."
  },
  {
    sub: "dev-assistant-001",
    email: "assistant@jsveteransolutions.com",
    role: "assistant",
    name: "Sarah Assistant",
    label: "Assistant",
    description: "Review documents and manage assigned clients."
  }
];
