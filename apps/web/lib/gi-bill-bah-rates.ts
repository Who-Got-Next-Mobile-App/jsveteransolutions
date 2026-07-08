export type AttendanceMode = "online" | "campus" | "hybrid";

export interface SchoolLocation {
  id: string;
  label: string;
  zip: string;
  state: string;
  e5WithDependentsBah: number;
}

/** 2026–2027 academic year online-only MHA (half national average). */
export const ONLINE_MHA_MONTHLY = 1261;

export const GI_BILL_TIER_OPTIONS = [
  { value: 100, label: "100% (36+ months qualifying service)" },
  { value: 90, label: "90%" },
  { value: 80, label: "80%" },
  { value: 70, label: "70%" },
  { value: 60, label: "60%" },
  { value: 50, label: "50% (6–18 months)" },
  { value: 40, label: "40% (90 days–6 months)" }
];

export const ENROLLMENT_OPTIONS = [
  { value: 100, label: "Full-time (12+ credits / 100% pursuit)" },
  { value: 75, label: "Three-quarter time (~9 credits / 75%)" },
  { value: 60, label: "Half-time (~6 credits / 50%+ required for MHA)" }
];

export const schoolLocations: SchoolLocation[] = [
  { id: "charleston-sc", label: "Charleston, SC", zip: "29401", state: "SC", e5WithDependentsBah: 2145 },
  { id: "columbia-sc", label: "Columbia, SC", zip: "29201", state: "SC", e5WithDependentsBah: 1566 },
  { id: "greenville-sc", label: "Greenville, SC", zip: "29601", state: "SC", e5WithDependentsBah: 1488 },
  { id: "myrtle-beach-sc", label: "Myrtle Beach, SC", zip: "29577", state: "SC", e5WithDependentsBah: 1620 },
  { id: "atlanta-ga", label: "Atlanta, GA", zip: "30303", state: "GA", e5WithDependentsBah: 2286 },
  { id: "jacksonville-fl", label: "Jacksonville, FL", zip: "32202", state: "FL", e5WithDependentsBah: 1896 },
  { id: "tampa-fl", label: "Tampa, FL", zip: "33602", state: "FL", e5WithDependentsBah: 2412 },
  { id: "raleigh-nc", label: "Raleigh, NC", zip: "27601", state: "NC", e5WithDependentsBah: 2016 },
  { id: "fayetteville-nc", label: "Fayetteville, NC", zip: "28301", state: "NC", e5WithDependentsBah: 1428 },
  { id: "dallas-tx", label: "Dallas, TX", zip: "75201", state: "TX", e5WithDependentsBah: 2184 },
  { id: "houston-tx", label: "Houston, TX", zip: "77002", state: "TX", e5WithDependentsBah: 2244 },
  { id: "san-antonio-tx", label: "San Antonio, TX", zip: "78205", state: "TX", e5WithDependentsBah: 1896 },
  { id: "denver-co", label: "Denver, CO", zip: "80202", state: "CO", e5WithDependentsBah: 2484 },
  { id: "colorado-springs-co", label: "Colorado Springs, CO", zip: "80903", state: "CO", e5WithDependentsBah: 2184 },
  { id: "san-diego-ca", label: "San Diego, CA", zip: "92101", state: "CA", e5WithDependentsBah: 3456 },
  { id: "los-angeles-ca", label: "Los Angeles, CA", zip: "90012", state: "CA", e5WithDependentsBah: 3816 },
  { id: "seattle-wa", label: "Seattle, WA", zip: "98101", state: "WA", e5WithDependentsBah: 3240 },
  { id: "honolulu-hi", label: "Honolulu, HI", zip: "96813", state: "HI", e5WithDependentsBah: 4188 },
  { id: "new-york-ny", label: "New York, NY", zip: "10001", state: "NY", e5WithDependentsBah: 4326 },
  { id: "chicago-il", label: "Chicago, IL", zip: "60601", state: "IL", e5WithDependentsBah: 2484 },
  { id: "phoenix-az", label: "Phoenix, AZ", zip: "85004", state: "AZ", e5WithDependentsBah: 2124 },
  { id: "national-avg", label: "National average (estimate)", zip: "00000", state: "US", e5WithDependentsBah: 2338 }
];

export interface GiBillBahInput {
  attendanceMode: AttendanceMode;
  locationId: string;
  eligibilityTier: number;
  rateOfPursuit: number;
}

export function calculateGiBillBah(input: GiBillBahInput): {
  monthly: number;
  annual: number;
  baseRate: number;
  notes: string[];
} {
  const notes: string[] = [];
  const location = schoolLocations.find((entry) => entry.id === input.locationId) ?? schoolLocations[0];

  if (input.rateOfPursuit <= 50) {
    return {
      monthly: 0,
      annual: 0,
      baseRate: 0,
      notes: ["You must be enrolled more than half-time to receive housing allowance (MHA)."]
    };
  }

  let baseRate = location.e5WithDependentsBah;

  if (input.attendanceMode === "online") {
    baseRate = ONLINE_MHA_MONTHLY;
    notes.push("Online-only enrollment uses the national flat rate, not your school's local BAH.");
  } else {
    notes.push(`On-campus rate uses E-5 with dependents BAH for ${location.label} (${location.zip}).`);
    if (input.attendanceMode === "hybrid") {
      notes.push("Hybrid with at least one in-person class may qualify for the local campus rate.");
    }
  }

  const tierMultiplier = input.eligibilityTier / 100;
  const pursuitMultiplier = input.rateOfPursuit / 100;
  const monthly = Math.round(baseRate * tierMultiplier * pursuitMultiplier);

  notes.push("MHA is prorated by GI Bill eligibility tier and your rate of pursuit.");
  notes.push("Estimate only — confirm with the VA GI Bill Comparison Tool before enrolling.");

  return {
    monthly,
    annual: monthly * 12,
    baseRate,
    notes
  };
}

export function findLocations(query: string): SchoolLocation[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return schoolLocations;

  return schoolLocations.filter(
    (location) =>
      location.label.toLowerCase().includes(normalized) ||
      location.zip.includes(normalized) ||
      location.state.toLowerCase().includes(normalized)
  );
}
