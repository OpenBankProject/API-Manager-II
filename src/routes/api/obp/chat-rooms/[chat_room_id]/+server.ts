import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ChatRoomApi");

export const GET: RequestHandler = async ({ locals, params, url }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { chat_room_id } = params;
  const bankId = url.searchParams.get("bank_id");

  if (!chat_room_id) {
    return json({ error: "Chat Room ID is required" }, { status: 400 });
  }

  try {
    logger.info(`Fetching chat room: ${chat_room_id}`);
    const endpoint = bankId
      ? `/obp/v6.0.0/banks/${encodeURIComponent(bankId)}/chat-rooms/${encodeURIComponent(chat_room_id)}`
      : `/obp/v6.0.0/chat-rooms/${encodeURIComponent(chat_room_id)}`;
    const result = await obp_requests.get(endpoint, accessToken);
    return json(result, { status: 200 });
  } catch (err) {
    logger.error("Error fetching chat room:", err);
    const { message } = extractErrorDetails(err);
    return json({ error: message }, { status: 500 });
  }
};
