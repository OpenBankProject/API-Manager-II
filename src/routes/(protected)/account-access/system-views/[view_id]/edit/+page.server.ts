import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("EditSystemViewServer");

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = locals.session;
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const token = sessionOAuth?.accessToken;

  if (!token) {
    error(401, {
      message: "Unauthorized: No access token found in session.",
    });
  }

  const { view_id } = params;

  if (!view_id) {
    error(400, {
      message: "View ID is required",
    });
  }

  // Fetch the current system view
  let view = null;
  try {
    const endpoint = `/obp/v6.0.0/management/system-views/${view_id}`;
    view = await obp_requests.get(endpoint, token);
    logger.debug(`Retrieved system view: ${view.short_name}`);
  } catch (e) {
    logger.error("Error fetching system view:", e);
    error(500, {
      message: "Could not fetch system view at this time. Please try again later.",
    });
  }

  // Fetch available view permissions from OBP API
  let viewPermissions: string[] = [];
  try {
    const response = await obp_requests.get(
      "/obp/v6.0.0/management/view-permissions",
      token,
    );

    // Log the response to see structure
    logger.debug(
      "View permissions response:",
      JSON.stringify(response, null, 2),
    );

    // Extract permission names - response.permissions might be an array of objects
    const permissions = response.permissions || [];

    // If permissions are objects with a 'permission' field, extract it
    if (permissions.length > 0 && typeof permissions[0] === "object") {
      viewPermissions = permissions.map(
        (p: any) => p.permission || p.name || p,
      );
    } else {
      viewPermissions = permissions;
    }

    // Sort permissions alphabetically
    viewPermissions.sort();

    logger.debug(
      `Retrieved ${viewPermissions.length} view permissions from API`,
    );
  } catch (e) {
    logger.error("Error fetching view permissions:", e);
    // Don't fail the page load, just use empty array
    viewPermissions = [];
  }

  logger.debug("Edit system view page loaded");

  return {
    view,
    viewPermissions,
  };
};
