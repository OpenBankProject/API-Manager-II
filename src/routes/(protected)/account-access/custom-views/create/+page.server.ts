import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("CreateCustomViewPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for create custom view page");
    return {
      hasApiAccess: false,
      banks: [],
      error: "No API access token available",
    };
  }

  // Fetch available banks
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

  return {
    hasApiAccess: true,
    banks,
  };
};
