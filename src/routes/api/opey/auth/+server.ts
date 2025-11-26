import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/public";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("OpeyAuthAPI");

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const opeyBaseUrl = env.PUBLIC_OPEY_BASE_URL || "http://localhost:5000";

    logger.info("Proxying auth request to Opey service:", opeyBaseUrl);

    // Forward the request to the Opey service
    const response = await fetch(`${opeyBaseUrl}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Opey auth failed:", data);
      return json(data, { status: response.status });
    }

    logger.info("Opey auth successful");
    return json(data);
  } catch (err) {
    logger.error("Error proxying to Opey:", err);
    return json(
      {
        error: err instanceof Error ? err.message : "Failed to authenticate with Opey service",
      },
      { status: 500 }
    );
  }
};
