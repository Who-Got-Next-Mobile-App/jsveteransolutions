import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { GiBillBahCalculator } from "@/components/calculators/GiBillBahCalculator";
import { VaCompensationCalculator } from "@/components/calculators/VaCompensationCalculator";

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">Veteran Benefit Calculators</h1>
        <p className="mt-3 max-w-3xl text-slate-600 leading-relaxed">
          Estimate how much you may receive from VA disability compensation and Post-9/11 GI Bill housing allowance
          (BAH/MHA) — whether you attend school online or on campus.
        </p>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <VaCompensationCalculator />
          <GiBillBahCalculator />
        </div>

        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Disclaimer:</strong> These calculators provide educational estimates only. Actual VA compensation and
          GI Bill housing payments depend on official rate tables, verified enrollment, eligibility tier, and VA
          processing. Confirm amounts with{" "}
          <a href="https://www.va.gov/disability/compensation-rates/veteran-rates/" className="underline">
            VA compensation rates
          </a>{" "}
          and the{" "}
          <a href="https://www.va.gov/education/gi-bill-comparison-tool/" className="underline">
            GI Bill Comparison Tool
          </a>{" "}
          before making financial decisions.
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
