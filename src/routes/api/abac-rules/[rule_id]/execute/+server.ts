import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("AbacRuleExecuteAPI");

export const POST: RequestHandler = async ({ request, locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for ABAC rule execution");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const ruleId = params.rule_id;

  if (!ruleId) {
    return json({ error: "Rule ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { rule_code, parameters } = body;

    if (!rule_code || typeof rule_code !== "string") {
      return json(
        { error: "rule_code is required and must be a string" },
        { status: 400 },
      );
    }

    logger.info(`Executing ABAC rule: ${ruleId}`);
    logger.info(`Rule Code: ${rule_code}`);
    logger.info(`Parameters:`, JSON.stringify(parameters, null, 2));

    // Simulate rule execution
    // In a real implementation, this would call the OBP API or evaluate the rule
    // For now, we'll create a mock evaluation
    const result = evaluateRule(rule_code, parameters);

    logger.info("ABAC rule executed successfully");
    logger.info("Execution result:", JSON.stringify(result, null, 2));

    return json(result);
  } catch (err) {
    logger.error(`Error executing ABAC rule ${ruleId}:`, err);

    let errorMessage = "Failed to execute ABAC rule";

    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return json({ error: errorMessage }, { status: 500 });
  }
};

/**
 * Mock rule evaluation function
 * In production, this would be replaced with actual OBP API call
 * or a proper rule evaluation engine
 */
function evaluateRule(ruleCode: string, parameters: Record<string, any>): any {
  try {
    // Create a safe evaluation context
    const context: Record<string, any> = {};

    // Parse parameters and build context
    Object.keys(parameters).forEach((key) => {
      const parts = key.split(".");
      let current = context;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = parameters[key];
    });

    logger.debug("Evaluation context:", JSON.stringify(context, null, 2));

    // For safety, we'll return a mock result instead of using eval()
    // In production, this should use a proper expression evaluator or OBP API
    const mockResult: any = {
      success: true,
      result: true,
      message: "Rule evaluation simulated successfully",
      evaluated_at: new Date().toISOString(),
      context: context,
      rule_code: ruleCode,
      evaluation_details: {
        note: "This is a simulated evaluation. In production, this would call the OBP API or use a secure expression evaluator.",
        parameters_received: Object.keys(parameters).length,
        context_built: true,
      } as any,
    };

    // Simple pattern matching for common rule patterns
    if (ruleCode.includes("contains")) {
      const match = ruleCode.match(/(\w+\.\w+)\.contains\("([^"]+)"\)/);
      if (match) {
        const [, path, searchTerm] = match;
        const value = getNestedValue(context, path);
        mockResult.result =
          typeof value === "string" && value.includes(searchTerm);
        mockResult.evaluation_details = {
          ...mockResult.evaluation_details,
          pattern: "contains",
          path: path,
          search_term: searchTerm,
          actual_value: value,
        };
      }
    } else if (ruleCode.includes("==")) {
      const match = ruleCode.match(/(\w+\.\w+)\s*==\s*(\w+\.\w+)/);
      if (match) {
        const [, leftPath, rightPath] = match;
        const leftValue = getNestedValue(context, leftPath);
        const rightValue = getNestedValue(context, rightPath);
        mockResult.result = leftValue === rightValue;
        mockResult.evaluation_details = {
          ...mockResult.evaluation_details,
          pattern: "equality",
          left_path: leftPath,
          right_path: rightPath,
          left_value: leftValue,
          right_value: rightValue,
        };
      }
    } else if (ruleCode.includes("hasRole")) {
      const match = ruleCode.match(/(\w+)\.hasRole\("([^"]+)"\)/);
      if (match) {
        const [, object, roleName] = match;
        // Mock role check - in reality this would check actual roles
        mockResult.result = false;
        mockResult.evaluation_details = {
          ...mockResult.evaluation_details,
          pattern: "hasRole",
          object: object,
          role_name: roleName,
          note: "Role checking requires integration with actual user roles",
        };
      }
    }

    return mockResult;
  } catch (err) {
    logger.error("Error in rule evaluation:", err);
    return {
      success: false,
      result: false,
      error: err instanceof Error ? err.message : "Unknown evaluation error",
      evaluated_at: new Date().toISOString(),
    };
  }
}

/**
 * Helper function to get nested values from an object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}
