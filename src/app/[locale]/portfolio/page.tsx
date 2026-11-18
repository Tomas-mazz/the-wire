import { Suspense } from "react";
import SectionDashboard from "@/components/portfolio/SectionDashboard";
import { SectionSkeleton } from "@/components/portfolio/Skeletons";

/** Overview tab: everything the user holds, crypto and stocks (M6). */
export default async function OverviewPage() {
  return (
    <Suspense fallback={<SectionSkeleton section="overview" />}>
      <SectionDashboard section="overview" />
    </Suspense>
  );
}
