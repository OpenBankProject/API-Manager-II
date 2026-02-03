import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { error, fail, redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("EditConsumerServer");

interface Consumer {
  consumer_id: string;
  key?: string;
  secret?: string;
  app_name: string;
  app_type: string;
  description: string;
  developer_email: string;
  redirect_url: string;
  company: string;
  enabled: boolean;
  created: string;
  created_by_user?: {
    user_id: string;
    email: string;
    provider_id: string;
    provider: string;
    username: string;
  };
}

interface Scope {
  scope_id: string;
  role_name: string;
  bank_id: string;
}

interface Role {
  role: string;
  requires_bank_id: boolean;
}

export async function load(event: RequestEvent) {
  const session = event.locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const token = sessionOAuth?.accessToken;

  if (!token) {
    throw error(401, "Unauthorized: No access token found in session.");
  }

  const consumerId = event.params.consumer_id;

  if (!consumerId) {
    throw error(400, "Consumer ID is required.");
  }

  let consumer: Consumer | undefined = undefined;
  let scopes: Scope[] = [];
  let availableRoles: Role[] = [];
  let banks: Array<{ bank_id: string; short_name: string }> = [];

  // Fetch consumer details
  try {
    consumer = await obp_requests.get(
      `/obp/v6.0.0/management/consumers/${consumerId}`,
      token,
    );
    logger.debug(`Retrieved consumer: ${consumer?.app_name}`);
  } catch (e) {
    logger.error("Error fetching consumer:", e);
    throw error(404, "Consumer not found.");
  }

  if (!consumer) {
    throw error(404, "Consumer not found.");
  }

  // Fetch scopes for this consumer
  try {
    const scopesResponse = await obp_requests.get(
      `/obp/v6.0.0/consumers/${consumerId}/scopes`,
      token,
    );
    scopes = scopesResponse?.list || [];
    logger.debug(`Retrieved ${scopes.length} scopes for consumer`);
  } catch (e) {
    logger.error("Error fetching scopes:", e);
    // Non-fatal - continue without scopes
  }

  // Fetch available roles
  try {
    const rolesResponse = await obp_requests.get(
      `/obp/v6.0.0/roles`,
      token,
    );
    availableRoles = rolesResponse?.roles || [];
    logger.debug(`Retrieved ${availableRoles.length} available roles`);
  } catch (e) {
    logger.error("Error fetching roles:", e);
    // Non-fatal - continue without roles
  }

  // Fetch banks for bank_id dropdown
  try {
    const banksResponse = await obp_requests.get(
      `/obp/v6.0.0/banks`,
      token,
    );
    banks = (banksResponse?.banks || []).map((b: any) => ({
      bank_id: b.bank_id,
      short_name: b.short_name || b.bank_id,
    }));
    logger.debug(`Retrieved ${banks.length} banks`);
  } catch (e) {
    logger.error("Error fetching banks:", e);
    // Non-fatal - continue without banks
  }

  return {
    consumer,
    scopes,
    availableRoles,
    banks,
  };
}

export const actions = {
  // Action to enable/disable consumer
  toggleEnabled: async (event: RequestEvent) => {
    const session = event.locals.session;

    if (!session?.data?.user) {
      return fail(401, { error: "Unauthorized" });
    }

    const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
    const token = sessionOAuth?.accessToken;

    if (!token) {
      return fail(401, { error: "Unauthorized: No access token found in session." });
    }

    const consumerId = event.params.consumer_id;

    if (!consumerId) {
      return fail(400, { error: "Consumer ID is required." });
    }

    const formData = await event.request.formData();
    const enabled = formData.get("enabled") === "true";

    try {
      logger.info(`Setting consumer ${consumerId} enabled=${enabled}`);

      await obp_requests.put(
        `/obp/v6.0.0/management/consumers/${consumerId}`,
        { enabled },
        token,
      );

      logger.info(`Successfully updated consumer ${consumerId} enabled status`);

      return { success: true, action: "toggleEnabled" };
    } catch (e: any) {
      logger.error("Error updating consumer:", e);
      const { message } = extractErrorDetails(e);
      return fail(500, { error: message, action: "toggleEnabled" });
    }
  },

  // Action to add a scope
  addScope: async (event: RequestEvent) => {
    const session = event.locals.session;

    if (!session?.data?.user) {
      return fail(401, { error: "Unauthorized" });
    }

    const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
    const token = sessionOAuth?.accessToken;

    if (!token) {
      return fail(401, { error: "Unauthorized: No access token found in session." });
    }

    const consumerId = event.params.consumer_id;

    if (!consumerId) {
      return fail(400, { error: "Consumer ID is required." });
    }

    const formData = await event.request.formData();
    const role_name = formData.get("role_name") as string;
    const bank_id = formData.get("bank_id") as string || "";

    if (!role_name) {
      return fail(400, { error: "Role name is required.", action: "addScope" });
    }

    try {
      logger.info(`Adding scope ${role_name} to consumer ${consumerId}`);

      await obp_requests.post(
        `/obp/v6.0.0/consumers/${consumerId}/scopes`,
        { role_name, bank_id },
        token,
      );

      logger.info(`Successfully added scope to consumer ${consumerId}`);

      return { success: true, action: "addScope" };
    } catch (e: any) {
      logger.error("Error adding scope:", e);
      const { message } = extractErrorDetails(e);
      return fail(500, { error: message, action: "addScope" });
    }
  },

  // Action to delete a scope
  deleteScope: async (event: RequestEvent) => {
    const session = event.locals.session;

    if (!session?.data?.user) {
      return fail(401, { error: "Unauthorized" });
    }

    const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
    const token = sessionOAuth?.accessToken;

    if (!token) {
      return fail(401, { error: "Unauthorized: No access token found in session." });
    }

    const consumerId = event.params.consumer_id;

    if (!consumerId) {
      return fail(400, { error: "Consumer ID is required." });
    }

    const formData = await event.request.formData();
    const scope_id = formData.get("scope_id") as string;

    if (!scope_id) {
      return fail(400, { error: "Scope ID is required.", action: "deleteScope" });
    }

    try {
      logger.info(`Deleting scope ${scope_id} from consumer ${consumerId}`);

      await obp_requests.delete(
        `/obp/v6.0.0/consumers/${consumerId}/scope/${scope_id}`,
        token,
      );

      logger.info(`Successfully deleted scope from consumer ${consumerId}`);

      return { success: true, action: "deleteScope" };
    } catch (e: any) {
      logger.error("Error deleting scope:", e);
      const { message } = extractErrorDetails(e);
      return fail(500, { error: message, action: "deleteScope" });
    }
  },
};
