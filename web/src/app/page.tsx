import { getAiInsights, getHealthMetrics } from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";

export const revalidate = 0; // Disable static caching so it always reads the latest DB values

export default function Home() {
  const metrics = getHealthMetrics();
  const insights = getAiInsights();

  return <DashboardClient metrics={metrics} insights={insights} />;
}
