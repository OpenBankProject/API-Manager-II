/**
 * Route-based contextual insight messages for the Opey Insight Bar.
 * Maps route patterns to short hints that help users discover Opey.
 */

const routeInsights: Array<{ pattern: RegExp; message: string; prompt: string }> = [
  { pattern: /^\/banks\/create$/, message: "I can help you set up a new bank and configure its settings.", prompt: "Help me create a new bank" },
  { pattern: /^\/banks$/, message: "I can help you explore banks and their settings.", prompt: "Tell me about the banks on this instance" },
  { pattern: /^\/banks\//, message: "I can help you understand this bank's configuration.", prompt: "Tell me about this bank" },
  { pattern: /^\/users$/, message: "I can help you find users and manage their roles.", prompt: "Help me find a user" },
  { pattern: /^\/consumers$/, message: "I can help you understand API consumers and their access.", prompt: "Tell me about API consumers" },
  { pattern: /^\/metrics/, message: "I can help you analyse API usage and performance metrics.", prompt: "Help me understand API metrics" },
  { pattern: /^\/aggregate-metrics/, message: "I can help you understand aggregate API usage patterns.", prompt: "Explain aggregate metrics" },
  { pattern: /^\/connector-/, message: "I can help you understand connector performance.", prompt: "Tell me about connector metrics" },
  { pattern: /^\/rbac\//, message: "I can help you manage roles, entitlements, and access control.", prompt: "Help me with RBAC" },
  { pattern: /^\/system\//, message: "I can help you understand system configuration and settings.", prompt: "Tell me about system settings" },
  { pattern: /^\/products/, message: "I can help you manage API and financial products.", prompt: "Tell me about products" },
  { pattern: /^\/dynamic-entities/, message: "I can help you work with dynamic entities.", prompt: "Explain dynamic entities" },
  { pattern: /^\/dynamic-endpoints/, message: "I can help you manage dynamic endpoints.", prompt: "Explain dynamic endpoints" },
  { pattern: /^\/customers/, message: "I can help you manage customer records.", prompt: "Help me with customers" },
  { pattern: /^\/account-access/, message: "I can help you manage account access and views.", prompt: "Tell me about account access" },
  { pattern: /^\/user\/consents/, message: "I can help you understand and manage your consents.", prompt: "Explain consents" },
  { pattern: /^\/user\/entitlements/, message: "I can help you understand your entitlements.", prompt: "Tell me about my entitlements" },
  { pattern: /^\/user$/, message: "I can help you with your account settings.", prompt: "Help me with my account" },
  { pattern: /^\/abac/, message: "I can help you understand attribute-based access control rules.", prompt: "Explain ABAC rules" },
  { pattern: /^\/integration/, message: "I can help you configure method routings and integrations.", prompt: "Help me with integrations" },
  { pattern: /^\/api-collections/, message: "I can help you organise your API collections.", prompt: "Tell me about API collections" },
  { pattern: /^\/site-map$/, message: "I can help you navigate the API Manager.", prompt: "Help me find what I need" },
];

const fallback = { message: "I can help you navigate and understand the Open Bank Project API.", prompt: "What can you help me with?" };

export function getInsightForRoute(pathname: string): { message: string; prompt: string } {
  const match = routeInsights.find((r) => r.pattern.test(pathname));
  return match ? { message: match.message, prompt: match.prompt } : fallback;
}
