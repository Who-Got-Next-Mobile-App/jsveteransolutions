import type { AuthSession } from "./types";

let activeSession: AuthSession | null = null;

export function setApiSession(session: AuthSession | null) {
  activeSession = session;
}

export function getApiSession() {
  return activeSession;
}
