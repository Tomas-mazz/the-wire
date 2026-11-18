import { Suspense } from "react";
import SectionDashboard from "@/components/portfolio/SectionDashboard";
import { SectionSkeleton } from "@/components/portfolio/Skeletons";

/** Stocks tab: US stocks and ETFs (M6). */
export default async function StocksPage() {
  return (
    <Suspense fallback={<SectionSkeleton section="stocks" />}>
      <SectionDashboard section="stocks" />
    </Suspense>
  );
}
