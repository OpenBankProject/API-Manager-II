import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("EntitlementRequestDeleteAPI");

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for entitlement request deletion");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { requestId } = params;

    if (!requestId) {
      return json({ error: "request_id is required" }, { status: 400 });
    }

    logger.info("=== DELETE ENTITLEMENT REQUEST ===");
    logger.info(`Request ID: ${requestId}`);

    const endpoint = `/obp/v6.0.0/entitlement-requests/${requestId}`;
    logger.info(`DELETE ${endpoint}`);

    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info("Entitlement request deleted successfully");
    logger.info(`Response: ${JSON.stringify(response)}`);

    return json(response);
  } catch (err) {
    logger.error("Error deleting entitlement request:", err);

    // Extract OBP error code if available
    let errorMessage = "Failed to delete entitlement request";
    let obpErrorCode = undefined;

    if (err instanceof Error) {
      errorMessage = err.message;
      // Check if it's an OBPRequestError with obpErrorCode property
      if ("obpErrorCode" in err) {
        obpErrorCode = (err as any).obpErrorCode;
      }
    }

    const errorResponse: any = { error: errorMessage };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
