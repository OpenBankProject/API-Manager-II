import { createLogger } from "$lib/utils/logger";
const logger = createLogger("RolesPageServer");
import type { PageServerLoad } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";
import { getRolesPageRoles } from "$lib/utils/roleChecker";

interface Role {
  role: string;
  bank_id?: string;
  entitlement_count?: number;
}

interface RolesResponse {
  roles: Role[];
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for roles API calls");
    return {
      roles: [],
      userEntitlements: [],
      requiredRoles: getRolesPageRoles(),
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];
  const requiredRoles = getRolesPageRoles();

  try {
    logger.info("=== ROLES WITH ENTITLEMENT COUNTS API CALL ===");
    const endpoint = `/obp/v6.0.0/management/roles-with-entitlement-counts`;
    logger.info(`Request: ${endpoint}`);

    const response: RolesResponse = await obp_requests.get(
      endpoint,
      accessToken,
    );

    logger.info(`Response: ${response.roles?.length || 0} roles`);

    return {
      roles: response.roles || [],
      userEntitlements,
      requiredRoles,
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading roles:", err);

    return {
      roles: [],
      userEntitlements,
      requiredRoles,
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load roles",
    };
  }
};
