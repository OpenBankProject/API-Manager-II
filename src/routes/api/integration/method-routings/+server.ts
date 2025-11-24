import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("MethodRoutingsAPI");

// GET - Fetch all method routings
export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  logger.info("=== METHOD ROUTINGS GET API CALL ===");
  logger.info(`Session exists: ${!!session}`);
  logger.info(`User exists: ${!!session?.data?.user}`);

  if (!session?.data?.user) {
    logger.error("No user in session - returning 401");
    return json(
      { error: "Unauthorized - No user in session" },
      { status: 401 },
    );
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.error("No access token available for method routings API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const endpoint = `/obp/v3.1.0/management/method_routings`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Method routings fetched successfully");
    logger.info("Response type:", typeof response);
    logger.info(
      "Response keys:",
      response ? Object.keys(response).join(", ") : "none",
    );
    logger.debug("Full response:", JSON.stringify(response, null, 2));

    return json(response);
  } catch (err: any) {
    logger.error("ERROR FETCHING METHOD ROUTINGS:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );
    logger.error(
      `  Error stack: ${err instanceof Error ? err.stack : "No stack"}`,
    );

    if (err.response) {
      logger.error(`  HTTP Status: ${err.response.status}`);
      logger.error(`  Response body: ${JSON.stringify(err.response.data)}`);
    }

    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch method routings",
      },
      { status: 500 },
    );
  }
};

// POST - Create a new method routing
export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  logger.info("=== METHOD ROUTING CREATE API CALL ===");

  if (!session?.data?.user) {
    logger.error("No user in session - returning 401");
    return json(
      { error: "Unauthorized - No user in session" },
      { status: 401 },
    );
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.error("No access token available for creating method routing");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    logger.info("Creating method routing with data:", body);

    const endpoint = `/obp/v3.1.0/management/method_routings`;
    logger.info(`Request: POST ${endpoint}`);

    const response = await obp_requests.post(endpoint, body, accessToken);

    logger.info("Method routing created successfully");
    logger.debug(JSON.stringify(response, null, 2));

    return json(response, { status: 201 });
  } catch (err) {
    logger.error("ERROR CREATING METHOD ROUTING:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create method routing",
      },
      { status: 500 },
    );
  }
};

// PUT - Update an existing method routing
export const PUT: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  logger.info("=== METHOD ROUTING UPDATE API CALL ===");

  if (!session?.data?.user) {
    logger.error("No user in session - returning 401");
    return json(
      { error: "Unauthorized - No user in session" },
      { status: 401 },
    );
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.error("No access token available for updating method routing");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const methodRoutingId = body.method_routing_id;

    if (!methodRoutingId) {
      return json(
        { error: "method_routing_id is required for update" },
        { status: 400 },
      );
    }

    logger.info(`Updating method routing ${methodRoutingId} with data:`, body);

    const endpoint = `/obp/v3.1.0/management/method_routings/${methodRoutingId}`;
    logger.info(`Request: PUT ${endpoint}`);

    const response = await obp_requests.put(endpoint, body, accessToken);

    logger.info("Method routing updated successfully");
    logger.debug(JSON.stringify(response, null, 2));

    return json(response);
  } catch (err) {
    logger.error("ERROR UPDATING METHOD ROUTING:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to update method routing",
      },
      { status: 500 },
    );
  }
};
