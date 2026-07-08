"use client";

import { useMemo, useState } from "react";
import {
  calculateVaCompensation,
  disabilityRatingOptions,
  type DisabilityRating
} from "@/lib/va-compensation-rates";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function VaCompensationCalculator() {
  const [rating, setRating] = useState<DisabilityRating>(70);
  const [hasSpouse, setHasSpouse] = useState(false);
  const [childrenUnder18, setChildrenUnder18] = useState(0);
  const [childrenInSchool, setChildrenInSchool] = useState(0);
  const [dependentParents, setDependentParents] = useState<0 | 1 | 2>(0);
  const [spouseAidAndAttendance, setSpouseAidAndAttendance] = useState(false);

  const result = useMemo(
    () =>
      calculateVaCompensation({
        rating,
        hasSpouse,
        childrenUnder18,
        childrenInSchool,
        dependentParents,
        spouseAidAndAttendance
      }),
    [rating, hasSpouse, childrenUnder18, childrenInSchool, dependentParents, spouseAidAndAttendance]
  );

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-[var(--navy-900)]">VA Compensation Calculator</h2>
      <p className="mt-2 text-sm text-slate-600">
        Estimate your monthly tax-free disability pay based on your combined rating and dependents.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Combined disability rating</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value) as DisabilityRating)}
          >
            {disabilityRatingOptions.map((option) => (
              <option key={option} value={option}>
                {option === 0 ? "Select rating" : `${option}%`}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Dependent parents</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={dependentParents}
            onChange={(event) => setDependentParents(Number(event.target.value) as 0 | 1 | 2)}
          >
            <option value={0}>None</option>
            <option value={1}>1 parent</option>
            <option value={2}>2 parents</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Children under 18</span>
          <input
            type="number"
            min={0}
            max={10}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={childrenUnder18}
            onChange={(event) => setChildrenUnder18(Number(event.target.value))}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Children 18–23 in school</span>
          <input
            type="number"
            min={0}
            max={10}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={childrenInSchool}
            onChange={(event) => setChildrenInSchool(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hasSpouse} onChange={(event) => setHasSpouse(event.target.checked)} />
          Married / have spouse
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={spouseAidAndAttendance}
            onChange={(event) => setSpouseAidAndAttendance(event.target.checked)}
            disabled={!hasSpouse}
          />
          Spouse requires Aid &amp; Attendance
        </label>
      </div>

      <div className="mt-6 rounded-xl bg-[var(--navy-950)] p-6 text-white">
        <div className="text-sm text-slate-300">Estimated monthly compensation</div>
        <div className="mt-1 text-4xl font-bold text-[var(--gold-500)]">{formatCurrency(result.monthly)}</div>
        <div className="mt-2 text-sm text-slate-300">Estimated annual: {formatCurrency(result.annual)}</div>
      </div>

      {result.note && <p className="mt-4 text-xs text-slate-500">{result.note}</p>}
    </div>
  );
}
