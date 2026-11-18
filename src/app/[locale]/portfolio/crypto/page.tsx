import { Suspense } from "react";
import SectionDashboard from "@/components/portfolio/SectionDashboard";
import { SectionSkeleton } from "@/components/portfolio/Skeletons";

/** Crypto tab: every coin, with BTC's average buy price and P/L first (M6). */
export default async function CryptoPage() {
  return (
    <Suspense fallback={<SectionSkeleton section="crypto" />}>
      <SectionDashboard section="crypto" />
    </Suspense>
  );
}
