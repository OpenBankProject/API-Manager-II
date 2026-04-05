import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ChatRoomParticipantsAPI");

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
    logger.info(`Fetching participants for chat room: ${chat_room_id}`);
    const endpoint = bankId
      ? `/obp/v6.0.0/banks/${encodeURIComponent(bankId)}/chat-rooms/${encodeURIComponent(chat_room_id)}/participants`
      : `/obp/v6.0.0/chat-rooms/${encodeURIComponent(chat_room_id)}/participants`;
    const response = await obp_requests.get(endpoint, accessToken);
    const participants = response.participants || [];
    logger.info(`Retrieved ${participants.length} participants`);
    return json({ participants }, { status: 200 });
  } catch (err) {
    logger.error("Error fetching participants:", err);
    const { message } = extractErrorDetails(err);
    return json({ error: message, participants: [] }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ locals, params, request, url }) => {
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
    const body = await request.json();
    logger.info(`Adding participant to chat room: ${chat_room_id}`);
    const endpoint = bankId
      ? `/obp/v6.0.0/banks/${encodeURIComponent(bankId)}/chat-rooms/${encodeURIComponent(chat_room_id)}/participants`
      : `/obp/v6.0.0/chat-rooms/${encodeURIComponent(chat_room_id)}/participants`;
    const result = await obp_requests.post(endpoint, body, accessToken);
    return json(result, { status: 201 });
  } catch (err) {
    logger.error("Error adding participant:", err);
    const { message } = extractErrorDetails(err);
    return json({ error: message }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ locals, params, url }) => {
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
  const userId = url.searchParams.get("user_id");
  const bankId = url.searchParams.get("bank_id");

  if (!chat_room_id || !userId) {
    return json({ error: "Chat Room ID and User ID are required" }, { status: 400 });
  }

  try {
    logger.info(`Removing participant ${userId} from chat room: ${chat_room_id}`);
    const endpoint = bankId
      ? `/obp/v6.0.0/banks/${encodeURIComponent(bankId)}/chat-rooms/${encodeURIComponent(chat_room_id)}/participants/${encodeURIComponent(userId)}`
      : `/obp/v6.0.0/chat-rooms/${encodeURIComponent(chat_room_id)}/participants/${encodeURIComponent(userId)}`;
    await obp_requests.delete(endpoint, accessToken);
    return json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error("Error removing participant:", err);
    const { message } = extractErrorDetails(err);
    return json({ error: message }, { status: 500 });
  }
};
