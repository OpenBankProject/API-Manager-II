import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("SystemChatRoomOpenRoomApi");

export const PUT: RequestHandler = async ({ locals, params, request }) => {
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

  if (!chat_room_id) {
    return json({ error: "Chat Room ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    logger.info(`Setting is_open_room for system chat room: ${chat_room_id}`);
    const endpoint = `/obp/v6.0.0/chat-rooms/${encodeURIComponent(chat_room_id)}/open-room`;
    const result = await obp_requests.put(endpoint, body, accessToken);
    return json(result, { status: 200 });
  } catch (err) {
    logger.error("Error setting is_open_room:", err);
    const { message } = extractErrorDetails(err);
    return json({ error: message }, { status: 500 });
  }
};
