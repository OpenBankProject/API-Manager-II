import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("CustomViewDetailPageServer");

interface SystemView {
  id: string;
  short_name: string;
  description: string;
  is_public: boolean;
  alias?: string;
  hide_metadata_if_alias_used?: boolean;
  can_see_transaction_this_bank_account?: string[];
  can_see_transaction_other_bank_account?: string[];
  can_see_transaction_metadata?: string[];
  can_see_transaction_label?: string[];
  can_see_transaction_amount?: string[];
  can_see_transaction_type?: string[];
  can_see_transaction_currency?: string[];
  can_see_transaction_start_date?: string[];
  can_see_transaction_finish_date?: string[];
  can_see_transaction_balance?: string[];
  can_see_comments?: string[];
  can_see_narrative?: string[];
  can_see_tags?: string[];
  can_see_images?: string[];
  can_see_bank_account_owners?: string[];
  can_see_bank_account_type?: string[];
  can_see_bank_account_balance?: string[];
  can_see_bank_account_currency?: string[];
  can_see_bank_account_label?: string[];
  can_see_bank_account_national_identifier?: string[];
  can_see_bank_account_swift_bic?: string[];
  can_see_bank_account_iban?: string[];
  can_see_bank_account_number?: string[];
  can_see_bank_account_bank_name?: string[];
  can_see_other_account_national_identifier?: string[];
  can_see_other_account_swift_bic?: string[];
  can_see_other_account_iban?: string[];
  can_see_other_account_bank_name?: string[];
  can_see_other_account_number?: string[];
  can_see_other_account_metadata?: string[];
  can_see_other_account_kind?: string[];
  can_see_more_info?: string[];
  can_see_url?: string[];
  can_see_image_url?: string[];
  can_see_open_corporates_url?: string[];
  can_see_corporate_location?: string[];
  can_see_physical_location?: string[];
  can_see_public_alias?: string[];
  can_see_private_alias?: string[];
  can_add_more_info?: string[];
  can_add_url?: string[];
  can_add_image_url?: string[];
  can_add_open_corporates_url?: string[];
  can_add_corporate_location?: string[];
  can_add_physical_location?: string[];
  can_add_public_alias?: string[];
  can_add_private_alias?: string[];
  can_delete_corporate_location?: string[];
  can_delete_physical_location?: string[];
  can_edit_narrative?: string[];
  can_add_comment?: string[];
  can_delete_comment?: string[];
  can_add_tag?: string[];
  can_delete_tag?: string[];
  can_add_image?: string[];
  can_delete_image?: string[];
  can_add_where_tag?: string[];
  can_see_where_tag?: string[];
  can_delete_where_tag?: string[];
  can_create_counterparty?: string[];
  can_see_bank_routing_scheme?: string[];
  can_see_bank_routing_address?: string[];
  can_see_bank_account_routing_scheme?: string[];
  can_see_bank_account_routing_address?: string[];
  can_see_other_bank_routing_scheme?: string[];
  can_see_other_bank_routing_address?: string[];
  can_see_other_account_routing_scheme?: string[];
  can_see_other_account_routing_address?: string[];
  can_add_transaction_request_to_own_account?: string[];
  can_add_transaction_request_to_any_account?: string[];
  can_see_bank_account_credit_limit?: string[];
}

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const { view_id } = params;

  if (!view_id) {
    throw error(400, "View ID is required");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for system view detail page");
    return {
      view: null,
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  try {
    logger.info("=== FETCHING CUSTOM VIEW DETAIL ===");
    logger.info(`View ID: ${view_id}`);
    const endpoint = `/obp/v6.0.0/management/custom-views/${view_id}`;
    logger.info(`Request: ${endpoint}`);

    const response: SystemView = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: View ${response.short_name}`);

    return {
      view: response,
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading custom view:", err);

    return {
      view: null,
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load custom view",
    };
  }
};
