/** Turn identity strings like "jerrel.cooper" into display names like "Jerrel Cooper". */

function titleCaseToken(token: string) {
  if (!token) return token;
  if (token.length <= 2 && token === token.toUpperCase()) return token;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function splitPersonName(raw: string): { firstName: string; lastName: string; fullName: string } {
  const cleaned = raw
    .trim()
    .replace(/@.*$/, "")
    .replace(/[._+-]+/g, " ")
    .replace(/\s+/g, " ");

  const parts = cleaned
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part.toLowerCase() !== "user")
    .map(titleCaseToken);

  const firstName = parts[0] ?? "Client";
  const lastName = parts.slice(1).join(" ");
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  return { firstName, lastName, fullName };
}

export function formatProfileName(firstName: string, lastName: string) {
  return splitPersonName(`${firstName} ${lastName}`.trim()).fullName;
}

export function displayNameFromClaims(input: {
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  email?: string | null;
}) {
  const given = input.givenName?.trim();
  const family = input.familyName?.trim();
  if (given || family) {
    return splitPersonName([given, family].filter(Boolean).join(" ")).fullName;
  }

  const name = input.name?.trim();
  if (name && (name.includes(" ") || /[._+-]/.test(name)) && !name.includes("@")) {
    return splitPersonName(name).fullName;
  }

  const emailLocal = input.email?.split("@")[0];
  if (emailLocal) return splitPersonName(emailLocal).fullName;
  if (name) return splitPersonName(name).fullName;
  return "Client";
}

export function formatSessionDisplayName(displayName: string, email?: string) {
  if (displayName?.includes(" ") || /[._+-]/.test(displayName ?? "")) {
    return splitPersonName(displayName).fullName;
  }
  if (email) return splitPersonName(email.split("@")[0] ?? displayName).fullName;
  return splitPersonName(displayName || "Client").fullName;
}
