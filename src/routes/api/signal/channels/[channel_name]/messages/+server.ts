import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { checkAPIAuth } from "$lib/utils/apiAuth";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("SignalMessagesAPI");

export const GET: RequestHandler = async ({ locals, params, url }) => {
  const auth = checkAPIAuth(locals);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const accessToken = auth.accessToken!;
  const channelName = params.channel_name;
  const offset = url.searchParams.get("offset") || "0";
  const limit = url.searchParams.get("limit") || "50";

  try {
    logger.info(`=== SIGNAL MESSAGES API CALL: ${channelName} ===`);
    const endpoint = `/obp/v6.0.0/signal/channels/${encodeURIComponent(channelName)}/messages?offset=${offset}&limit=${limit}`;

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(
      `Retrieved ${response?.messages?.length ?? 0} messages for channel: ${channelName}`,
    );

    return json(response);
  } catch (err) {
    logger.error(`ERROR FETCHING SIGNAL MESSAGES for ${channelName}:`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch channel messages",
      },
      { status: 500 },
    );
  }
};
