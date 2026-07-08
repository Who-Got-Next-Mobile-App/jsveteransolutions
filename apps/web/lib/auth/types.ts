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
    name: "James Mitchell",
    label: "Demo Client",
    description: "Upload documents and track claim progress."
  },
  {
    sub: "dev-owner-001",
    email: "owner@jsveteransolutions.com",
    role: "owner",
    name: "Dr. Provider",
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
