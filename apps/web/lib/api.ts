const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

import { getApiSession } from "@/lib/auth/api-session";

function authHeaders(): Record<string, string> {
  const session = getApiSession();
  if (session?.mode === "cognito" && session.idToken) {
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return {};
    }
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
      "X-User-Name": "Dev Client"
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
    assignedAssistantUserId?: string | null;
    assignedOwnerUserId?: string | null;
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
    unassignedClients?: number;
    documentsToReview: number;
    urgentDocuments: number;
    openTasks?: number;
  };
}

export interface ProviderInvitesResponse {
  invites: Array<{
    id: string;
    email: string;
    token: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  }>;
}

export interface StaffProvidersResponse {
  providers: Array<{
    id: string;
    email: string;
    displayName: string;
    role: string;
    acceptingClients: boolean;
  }>;
}

export interface StaffMeResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    acceptingClients: boolean;
  };
}

export interface TasksResponse {
  tasks: Array<{
    id: string;
    clientProfileId: string;
    title: string;
    description?: string | null;
    status: string;
    visibility: string;
    dueAt?: string | null;
    completedAt?: string | null;
    createdAt: string;
  }>;
}

export interface ThreadsResponse {
  threads: Array<{
    id: string;
    clientProfileId: string;
    subject: string;
    isClosed: boolean;
    updatedAt: string;
    createdAt: string;
  }>;
}

export interface ThreadDetailResponse {
  thread: {
    id: string;
    clientProfileId: string;
    subject: string;
    isClosed: boolean;
  };
  messages: Array<{
    id: string;
    senderUserId: string;
    body: string;
    createdAt: string;
  }>;
}

export interface AvailabilityResponse {
  slots: Array<{
    id: string;
    consultationType: string;
    startsAt: string;
    endsAt: string;
    status: string;
    notes?: string | null;
  }>;
}

export interface AppointmentsResponse {
  appointments: Array<{
    id: string;
    clientProfileId: string;
    type: string;
    scheduledStartAt?: string | null;
    scheduledEndAt?: string | null;
    attendanceStatus: string;
    createdAt: string;
  }>;
}

export interface AssignedResourcesResponse {
  resources: Array<{
    id: string;
    status: string;
    assignedAt: string;
    completedAt?: string | null;
    resource: {
      id: string;
      title: string;
      type: string;
      category: string;
      description?: string | null;
      estimatedMinutes?: number | null;
      downloadableAssetUrl?: string | null;
    };
  }>;
}

export interface CatalogResourcesResponse {
  resources: Array<{
    id: string;
    slug: string;
    title: string;
    type: string;
    category: string;
    description?: string | null;
  }>;
}
