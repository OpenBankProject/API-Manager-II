/**
 * Maps route patterns to human-readable page descriptions.
 * Used by the Opey Insight Bar to give Opey context about where the user is.
 */

const routeDescriptions: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /^\/banks\/create$/, description: "Create Bank page" },
  { pattern: /^\/banks\/([^/]+)\/([^/]+)/, description: "Bank detail page" },
  { pattern: /^\/banks$/, description: "Banks list page" },
  { pattern: /^\/users$/, description: "Users list page" },
  { pattern: /^\/consumers$/, description: "API Consumers list page" },
  { pattern: /^\/aggregate-metrics/, description: "Aggregate Metrics page" },
  { pattern: /^\/connector-metrics/, description: "Connector Metrics page" },
  { pattern: /^\/connector-traces/, description: "Connector Traces page" },
  { pattern: /^\/connector-counts/, description: "Connector Counts page" },
  { pattern: /^\/metrics/, description: "API Metrics page" },
  { pattern: /^\/rbac\/entitlements\/create/, description: "Create Entitlement page" },
  { pattern: /^\/rbac\/entitlements/, description: "Entitlements page" },
  { pattern: /^\/rbac\/roles/, description: "Roles page" },
  { pattern: /^\/rbac\/groups/, description: "Groups page" },
  { pattern: /^\/rbac\/memberships/, description: "Memberships page" },
  { pattern: /^\/rbac\/entitlement-requests/, description: "Entitlement Requests page" },
  { pattern: /^\/rbac\/banks/, description: "RBAC Banks page" },
  { pattern: /^\/system\/cache/, description: "System Cache page" },
  { pattern: /^\/system\/config-props/, description: "System Config Props page" },
  { pattern: /^\/system\/database-pool/, description: "Database Pool page" },
  { pattern: /^\/system\/migrations/, description: "System Migrations page" },
  { pattern: /^\/system\/webui-props/, description: "WebUI Props page" },
  { pattern: /^\/system\/signal/, description: "Signals page" },
  { pattern: /^\/system\//, description: "System settings page" },
  { pattern: /^\/products\/financial/, description: "Financial Products page" },
  { pattern: /^\/products\/collections/, description: "Product Collections page" },
  { pattern: /^\/products\/bootstrap/, description: "Products Bootstrap page" },
  { pattern: /^\/products/, description: "API Products page" },
  { pattern: /^\/dynamic-entities\/diagnostics/, description: "Dynamic Entities Diagnostics page" },
  { pattern: /^\/dynamic-entities\/personal/, description: "Personal Dynamic Entities page" },
  { pattern: /^\/dynamic-entities/, description: "Dynamic Entities page" },
  { pattern: /^\/dynamic-endpoints/, description: "Dynamic Endpoints page" },
  { pattern: /^\/customers\/individual/, description: "Individual Customers page" },
  { pattern: /^\/customers\/corporate/, description: "Corporate Customers page" },
  { pattern: /^\/customers/, description: "Customers page" },
  { pattern: /^\/account-access\/system-views/, description: "System Views page" },
  { pattern: /^\/account-access\/custom-views/, description: "Custom Views page" },
  { pattern: /^\/account-access\/account-directory/, description: "Account Directory page" },
  { pattern: /^\/account-access\/accounts/, description: "My Accounts page" },
  { pattern: /^\/account-access/, description: "Account Access page" },
  { pattern: /^\/user\/consents/, description: "My Consents page" },
  { pattern: /^\/user\/entitlements/, description: "My Entitlements page" },
  { pattern: /^\/user$/, description: "My Profile page" },
  { pattern: /^\/abac/, description: "ABAC Rules page" },
  { pattern: /^\/integration/, description: "Integration / Method Routings page" },
  { pattern: /^\/api-collections/, description: "API Collections page" },
  { pattern: /^\/site-map$/, description: "Site Map page" },
  { pattern: /^\/about$/, description: "About page" },
];

/**
 * Get a human-readable description of the current page for Opey context.
 */
export function describeRoute(pathname: string): string {
  const match = routeDescriptions.find((r) => r.pattern.test(pathname));
  return match ? match.description : `Page: ${pathname}`;
}
