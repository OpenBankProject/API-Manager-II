import { createLogger } from "$lib/utils/logger";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const logger = createLogger("ConnectorTracesPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];
  const requiredRoles = [
    {
      role: "CanGetConnectorTrace",
      description: "View connector traces",
      action: "view connector traces",
    },
  ];

  return {
    userEntitlements,
    requiredRoles,
  };
};
