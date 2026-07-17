import Link from "next/link";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { COMPANY_NAME } from "@/lib/brand";
import { servicePackages } from "@/lib/services-catalog";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">Plans & Pricing</h1>
        <p className="mt-3 text-slate-600">{COMPANY_NAME} veteran service packages. Stripe-powered checkout in the full platform.</p>
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Package</th>
                <th className="px-6 py-3 font-semibold">Price</th>
                <th className="px-6 py-3 font-semibold">Includes</th>
                <th className="px-6 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {servicePackages.map((service) => (
                <tr key={service.id} className="border-t border-slate-100">
                  <td className="px-6 py-4 font-medium">{service.name}</td>
                  <td className="px-6 py-4 font-bold text-[var(--gold-500)]">{service.price}</td>
                  <td className="px-6 py-4 text-slate-600">{service.description}</td>
                  <td className="px-6 py-4">
                    <Link href="/book" className="text-sm font-medium text-[var(--navy-900)] hover:underline">
                      Book
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
