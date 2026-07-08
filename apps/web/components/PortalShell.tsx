import type { ClaimStage } from "@vsn/types";
import { claimStageLabels } from "@/lib/mock-data";

export { AdminNav, PortalNav } from "@/components/PortalNav";

interface ClaimTrackerProps {
  currentStage: ClaimStage;
}

export function ClaimTracker({ currentStage }: ClaimTrackerProps) {
  const stages = Object.entries(claimStageLabels) as [ClaimStage, string][];
  const currentIndex = stages.findIndex(([stage]) => stage === currentStage);

  return (
    <div className="space-y-3">
      {stages.map(([stage, label], index) => {
        const isComplete = index < currentIndex;
        const isCurrent = stage === currentStage;
        return (
          <div
            key={stage}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
              isCurrent ? "stage-active" : isComplete ? "stage-complete" : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isCurrent
                  ? "bg-[var(--gold-500)] text-[var(--navy-950)]"
                  : isComplete
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {isComplete ? "✓" : index + 1}
            </div>
            <div>
              <div className="text-sm font-medium">{label}</div>
              {isCurrent && <div className="text-xs text-amber-700">Current stage</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-[var(--navy-900)]">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
