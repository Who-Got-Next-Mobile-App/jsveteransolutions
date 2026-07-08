import { PortalNav } from "@/components/PortalShell";

export default function PortalPaymentsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Payments</h1>
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3">Navigator Package</td>
                <td className="px-4 py-3">$500.00</td>
                <td className="px-4 py-3 text-emerald-600">Paid</td>
                <td className="px-4 py-3 text-slate-500">Mar 10, 2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
