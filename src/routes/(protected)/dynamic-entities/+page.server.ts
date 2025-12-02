import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("DynamicEntitiesPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];

  // Define required roles for viewing dynamic entities
  const requiredRoles = [
    {
      role: "CanGetDynamicEntity",
      description: "View dynamic entities",
      action: "view dynamic entities",
    },
  ];

  if (!accessToken) {
    logger.warn("No access token available for dynamic entities page");
    return {
      userEntitlements,
      requiredRoles,
      hasApiAccess: false,
      dynamicEntities: [],
      banks: [],
      error: "No API access token available",
    };
  }

  // Fetch available banks for filtering
  let banks = [];
  try {
    const banksResponse = await obp_requests.get(
      "/obp/v6.0.0/banks",
      accessToken,
    );
    banks = banksResponse.banks || [];
  } catch (err) {
    logger.error("Error fetching banks:", err);
  }

  // Fetch dynamic entities
  let dynamicEntities = [];
  try {
    logger.info("Fetching dynamic entities...");
    const response = await obp_requests.get(
      "/obp/v6.0.0/management/dynamic-entities",
      accessToken,
    );
    dynamicEntities = response.dynamic_entities || [];
    logger.info(`Found ${dynamicEntities.length} dynamic entities`);
  } catch (err) {
    logger.error("Error fetching dynamic entities:", err);
    return {
      userEntitlements,
      requiredRoles,
      hasApiAccess: true,
      dynamicEntities: [],
      banks,
      error: err instanceof Error ? err.message : "Failed to fetch dynamic entities",
    };
  }

  return {
    userEntitlements,
    requiredRoles,
    hasApiAccess: true,
    dynamicEntities,
    banks,
  };
};
