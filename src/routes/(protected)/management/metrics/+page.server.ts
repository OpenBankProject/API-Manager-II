import { createLogger } from "$lib/utils/logger";
const logger = createLogger("MetricsPageServer");
import type { PageServerLoad } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";

interface MetricRecord {
  date: string;
  duration: number;
  user_name: string;
  app_name: string;
  developer_email: string;
  consumer_id: string;
  verb: string;
  url: string;
  correlation_id: string;
  implemented_by_partial_function: string;
  implemented_in_version: string;
  user_id?: string;
}

interface MetricsResponse {
  metrics: MetricRecord[];
  count: number;
  error?: string;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for metrics API calls");
    return {
      recentMetrics: null,
      queryMetrics: null,
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  try {
    // Fetch recent metrics for real-time panel (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const now = new Date(Date.now() + 1000).toISOString(); // +1 second to avoid cache issues

    const recentMetricsData = await fetchMetrics(accessToken, {
      from_date: fiveMinutesAgo,
      to_date: now,
      limit: 50,
      sort_by: "date",
      direction: "desc"
    });

    // If there are query parameters, also fetch filtered metrics
    let queryMetricsData = null;
    const searchParams = url.searchParams;

    if (searchParams.has('from_date') || searchParams.has('to_date') ||
        searchParams.has('user_name') || searchParams.has('app_name') ||
        searchParams.has('verb') || searchParams.has('url')) {

      const queryParams: Record<string, string> = {};

      // Date filters
      if (searchParams.has('from_date')) queryParams.from_date = searchParams.get('from_date')!;
      if (searchParams.has('to_date')) queryParams.to_date = searchParams.get('to_date')!;

      // Pagination
      queryParams.limit = searchParams.get('limit') || '100';
      queryParams.offset = searchParams.get('offset') || '0';

      // Sorting
      queryParams.sort_by = searchParams.get('sort_by') || 'date';
      queryParams.direction = searchParams.get('direction') || 'desc';

      // Filters
      if (searchParams.has('consumer_id')) queryParams.consumer_id = searchParams.get('consumer_id')!;
      if (searchParams.has('user_id')) queryParams.user_id = searchParams.get('user_id')!;
      if (searchParams.has('anon')) queryParams.anon = searchParams.get('anon')!;
      if (searchParams.has('url')) queryParams.url = searchParams.get('url')!;
      if (searchParams.has('app_name')) queryParams.app_name = searchParams.get('app_name')!;
      if (searchParams.has('implemented_by_partial_function')) {
        queryParams.implemented_by_partial_function = searchParams.get('implemented_by_partial_function')!;
      }
      if (searchParams.has('implemented_in_version')) {
        queryParams.implemented_in_version = searchParams.get('implemented_in_version')!;
      }
      if (searchParams.has('verb')) queryParams.verb = searchParams.get('verb')!;
      if (searchParams.has('correlation_id')) queryParams.correlation_id = searchParams.get('correlation_id')!;
      if (searchParams.has('duration')) queryParams.duration = searchParams.get('duration')!;

      queryMetricsData = await fetchMetrics(accessToken, queryParams);
    }

    return {
      recentMetrics: recentMetricsData,
      queryMetrics: queryMetricsData,
      hasApiAccess: true,
      lastUpdated: new Date().toISOString(),
    };

  } catch (err) {
    logger.error("Error loading metrics:", err);

    return {
      recentMetrics: null,
      queryMetrics: null,
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load metrics",
    };
  }
};

async function fetchMetrics(
  accessToken: string,
  params: Record<string, string>
): Promise<MetricsResponse> {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/obp/v5.1.0/management/metrics?${queryParams.toString()}`;
    logger.debug("Fetching metrics from:", endpoint);

    const response = await obp_requests.get(endpoint, accessToken);

    if (response?.metrics) {
      return {
        metrics: response.metrics,
        count: response.metrics.length,
      };
    } else {
      logger.warn("No metrics data in response:", response);
      return {
        metrics: [],
        count: 0,
        error: "No metrics data found",
      };
    }

  } catch (err) {
    logger.error("Error fetching metrics:", err);

    return {
      metrics: [],
      count: 0,
      error: err instanceof Error ? err.message : "Failed to fetch metrics",
    };
  }
}

// Helper function to validate and format date
function formatDateForAPI(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Helper function to get default date range (last hour)
function getDefaultDateRange() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  return {
    from_date: oneHourAgo.toISOString(),
    to_date: now.toISOString(),
  };
}
