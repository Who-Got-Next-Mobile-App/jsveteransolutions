import type { Metadata } from "next";
import { AffiliationDisclaimer } from "@/components/AffiliationDisclaimer";
import { AppProviders } from "@/components/AppProviders";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: COMPANY_NAME,
  description: `${COMPANY_TAGLINE}. Pathfinder Session, Compass Review, Navigator, Advocate, and Elite packages for VA claim support.`
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <AppProviders>
          <div className="flex-1">{children}</div>
        </AppProviders>
        <AffiliationDisclaimer />
      </body>
    </html>
  );
}
