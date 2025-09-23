import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

interface MetricsData {
  totalUsers: number;
  totalBanks: number;
  totalAccounts: number;
  totalTransactions: number;
  apiCalls: number;
  activeConnections: number;
}

interface ApiMetricsData {
  responseTime: number;
  errorRate: number;
  throughput: number;
  availability: number;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Check if we have API access based on authInfo
  const hasApiAccess = session.data.authInfo?.source === "obp_api";

  if (!hasApiAccess) {
    return {
      metrics: null,
      apiMetrics: null,
      hasApiAccess: false,
      lastUpdated: null,
      error: "Using fallback authentication - limited API access",
    };
  }

  // TODO: Implement real API calls to fetch metrics when API access is available
  // For now, return null until real API integration is implemented
  return {
    metrics: null,
    apiMetrics: null,
    hasApiAccess: true,
    lastUpdated: new Date().toISOString(),
    error: "Real API integration not yet implemented",
  };
};
