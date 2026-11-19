"use client";

import { isDiagnosticLab } from "@/features/dashboard/nav";
import { LabOverview } from "@/features/diagnostics/components/LabOverview";
import { PharmacyOverview } from "@/features/pharmacy/components/PharmacyOverview";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  // A Diagnostic Lab Center gets its own overview; pharmacies get the business dashboard.
  if (isDiagnosticLab(user?.role)) return <LabOverview />;
  return <PharmacyOverview />;
}
