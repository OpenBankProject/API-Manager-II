import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("BankChatRoomsAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  try {
    logger.info(`Fetching chat rooms for bank: ${bank_id}`);
    const endpoint = `/obp/v6.0.0/banks/${encodeURIComponent(bank_id)}/chat-rooms`;
    const response = await obp_requests.get(endpoint, accessToken);
    const chatRooms = response.chat_rooms || [];
    logger.info(`Retrieved ${chatRooms.length} chat rooms for bank ${bank_id}`);
    return json({ chat_rooms: chatRooms }, { status: 200 });
  } catch (err) {
    logger.error("Error fetching bank chat rooms:", err);
    const { message } = extractErrorDetails(err);
    return json({ error: message, chat_rooms: [] }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    logger.info(`Creating chat room for bank: ${bank_id}`);
    const endpoint = `/obp/v6.0.0/banks/${encodeURIComponent(bank_id)}/chat-rooms`;
    const result = await obp_requests.post(endpoint, body, accessToken);
    return json(result, { status: 201 });
  } catch (err) {
    logger.error("Error creating bank chat room:", err);
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

  const { bank_id } = params;
  const chatRoomId = url.searchParams.get("chat_room_id");

  if (!bank_id || !chatRoomId) {
    return json({ error: "Bank ID and Chat Room ID are required" }, { status: 400 });
  }

  try {
    logger.info(`Deleting chat room ${chatRoomId} for bank: ${bank_id}`);
    const endpoint = `/obp/v6.0.0/banks/${encodeURIComponent(bank_id)}/chat-rooms/${encodeURIComponent(chatRoomId)}`;
    await obp_requests.delete(endpoint, accessToken);
    return json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error("Error deleting bank chat room:", err);
    const { message } = extractErrorDetails(err);
    return json({ error: message }, { status: 500 });
  }
};
