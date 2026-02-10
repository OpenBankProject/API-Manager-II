import { createLogger } from "$lib/utils/logger";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const logger = createLogger("ConnectorCountsPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];
  const requiredRoles = [
    {
      role: "CanGetConnectorMetrics",
      description: "View connector call counts",
      action: "view connector call counts",
    },
  ];

  return {
    userEntitlements,
    requiredRoles,
  };
};
