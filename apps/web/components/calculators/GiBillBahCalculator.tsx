"use client";

import { useMemo, useState } from "react";
import {
  calculateGiBillBah,
  ENROLLMENT_OPTIONS,
  findLocations,
  GI_BILL_TIER_OPTIONS,
  ONLINE_MHA_MONTHLY,
  schoolLocations,
  type AttendanceMode
} from "@/lib/gi-bill-bah-rates";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function GiBillBahCalculator() {
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>("campus");
  const [locationId, setLocationId] = useState("charleston-sc");
  const [locationQuery, setLocationQuery] = useState("");
  const [eligibilityTier, setEligibilityTier] = useState(100);
  const [rateOfPursuit, setRateOfPursuit] = useState(100);

  const filteredLocations = useMemo(() => findLocations(locationQuery), [locationQuery]);
  const selectedLocation = schoolLocations.find((entry) => entry.id === locationId) ?? schoolLocations[0];

  const result = useMemo(
    () =>
      calculateGiBillBah({
        attendanceMode,
        locationId,
        eligibilityTier,
        rateOfPursuit
      }),
    [attendanceMode, locationId, eligibilityTier, rateOfPursuit]
  );

  const campusEstimate = calculateGiBillBah({
    attendanceMode: "campus",
    locationId,
    eligibilityTier,
    rateOfPursuit
  });

  const onlineEstimate = calculateGiBillBah({
    attendanceMode: "online",
    locationId,
    eligibilityTier,
    rateOfPursuit
  });

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-[var(--navy-900)]">GI Bill BAH / MHA Calculator</h2>
      <p className="mt-2 text-sm text-slate-600">
        Estimate your monthly housing allowance for school online vs on campus. Uses E-5 with dependents BAH at your
        school&apos;s location.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-medium text-slate-700">How will you attend?</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {[
              { value: "online" as const, label: "Online only" },
              { value: "campus" as const, label: "On campus" },
              { value: "hybrid" as const, label: "Hybrid (1+ in-person class)" }
            ].map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm ${
                  attendanceMode === option.value
                    ? "border-[var(--gold-500)] bg-amber-50 font-medium"
                    : "border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="attendance"
                  className="sr-only"
                  checked={attendanceMode === option.value}
                  onChange={() => setAttendanceMode(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Search school location (city, state, or ZIP)</span>
          <input
            type="text"
            placeholder="e.g. Charleston, SC or 29401"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={locationQuery}
            onChange={(event) => setLocationQuery(event.target.value)}
          />
        </label>

        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-slate-700">School location</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
          >
            {(locationQuery ? filteredLocations : schoolLocations).map((location) => (
              <option key={location.id} value={location.id}>
                {location.label} — E-5 w/ deps BAH {formatCurrency(location.e5WithDependentsBah)}/mo
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">GI Bill eligibility tier</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={eligibilityTier}
            onChange={(event) => setEligibilityTier(Number(event.target.value))}
          >
            {GI_BILL_TIER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Enrollment level</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={rateOfPursuit}
            onChange={(event) => setRateOfPursuit(Number(event.target.value))}
          >
            {ENROLLMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-xl bg-[var(--navy-950)] p-6 text-white">
        <div className="text-sm text-slate-300">Estimated monthly housing allowance</div>
        <div className="mt-1 text-4xl font-bold text-[var(--gold-500)]">{formatCurrency(result.monthly)}</div>
        <div className="mt-2 text-sm text-slate-300">Estimated annual: {formatCurrency(result.annual)}</div>
        <div className="mt-3 text-xs text-slate-400">
          Base rate used: {formatCurrency(result.baseRate)}/mo · {selectedLocation.label}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="font-medium text-[var(--navy-900)]">If you attend on campus</div>
          <div className="mt-1 text-lg font-bold text-[var(--gold-500)]">{formatCurrency(campusEstimate.monthly)}/mo</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="font-medium text-[var(--navy-900)]">If you attend online only</div>
          <div className="mt-1 text-lg font-bold text-[var(--gold-500)]">{formatCurrency(onlineEstimate.monthly)}/mo</div>
          <div className="mt-1 text-xs text-slate-500">Flat national rate: {formatCurrency(ONLINE_MHA_MONTHLY)}/mo at 100%</div>
        </div>
      </div>

      <ul className="mt-4 space-y-1 text-xs text-slate-500">
        {result.notes.map((note) => (
          <li key={note}>• {note}</li>
        ))}
      </ul>
    </div>
  );
}
