const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

import { getApiSession } from "@/lib/auth/api-session";

function authHeaders(): Record<string, string> {
  const session = getApiSession();
  if (session?.mode === "cognito" && session.idToken) {
    return { Authorization: `Bearer ${session.idToken}` };
  }

  if (process.env.NEXT_PUBLIC_DEV_AUTH === "true" && session?.mode === "dev") {
    return {
      "X-User-Sub": session.sub,
      "X-User-Email": session.email,
      "X-User-Role": session.role,
      "X-User-Name": session.displayName
    };
  }

  if (process.env.NEXT_PUBLIC_DEV_AUTH === "true") {
    return {
      "X-User-Sub": "dev-client-001",
      "X-User-Email": "client@example.com",
      "X-User-Role": "client",
      "X-User-Name": "James Mitchell"
    };
  }

  return {};
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...(init?.headers as Record<string, string> | undefined)
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? "API request failed");
  }

  return response.json() as Promise<T>;
}

export interface PortalProfileResponse {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    currentStage: string;
  };
  timeline: Array<{ id: string; summary: string; createdAt: string }>;
}

export interface DocumentsResponse {
  documents: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
    clientName?: string;
    clientProfileId?: string;
  }>;
}

export interface StaffProfilesResponse {
  profiles: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    currentStage: string;
    militaryService: Record<string, unknown>;
    updatedAt: string;
  }>;
}

export interface StaffStatsResponse {
  stats: {
    activeClients: number;
    documentsToReview: number;
    urgentDocuments: number;
  };
}
