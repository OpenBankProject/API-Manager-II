export interface BootstrapEndpoint {
  operation_id: string;
  summary: string;
}

export interface BootstrapProduct {
  id: string;
  product_code: string;
  name: string;
  description: string;
  capabilities: string[];
}

export interface BootstrapCollection {
  id: string;
  collection_name: string;
  description: string;
  functional_scope: string[];
  is_sharable: boolean;
  endpoints: BootstrapEndpoint[];
  products: BootstrapProduct[];
}

export const bootstrapJourneys: BootstrapCollection[] = [
  // ── 1. Account Intelligence ────────────────────────────────────────
  {
    id: "1",
    collection_name: "Account-Intelligence",
    description:
      "Endpoints for account data, balances, transactions, and customer insights that power financial intelligence products.",
    functional_scope: [
      "Account Data",
      "Balances",
      "Transactions",
      "Customer KYC",
      "Counterparties",
    ],
    is_sharable: true,
    endpoints: [
      { operation_id: "OBPv4.0.0-getBanks", summary: "Get Banks" },
      { operation_id: "OBPv4.0.0-getPrivateAccountsAtOneBank", summary: "Get Accounts at Bank" },
      { operation_id: "OBPv4.0.0-getAccount", summary: "Get Account by Id" },
      { operation_id: "OBPv4.0.0-getAccountByAccountRouting", summary: "Get Account by Routing" },
      { operation_id: "OBPv4.0.0-getBalancesAtBank", summary: "Get Balances at Bank" },
      { operation_id: "OBPv4.0.0-getTransactionsForBankAccount", summary: "Get Transactions for Account" },
      { operation_id: "OBPv4.0.0-getTransactionByIdForBankAccount", summary: "Get Transaction by Id" },
      { operation_id: "OBPv4.0.0-getCoreTransactionsForBankAccount", summary: "Get Core Transactions" },
      { operation_id: "OBPv4.0.0-getCustomersByCustomerPhoneNumber", summary: "Get Customers by Phone" },
      { operation_id: "OBPv4.0.0-getCustomersAtOneBank", summary: "Get Customers at Bank" },
      { operation_id: "OBPv4.0.0-getCounterpartiesForBankAccount", summary: "Get Counterparties" },
      { operation_id: "OBPv4.0.0-getExplictCounterpartiesForAccount", summary: "Get Explicit Counterparties" },
    ],
    products: [
      {
        id: "1.1",
        product_code: "personal-financial-insights",
        name: "Personal Financial Insights",
        description:
          "Real-time account, balance, and transaction data for consumer-facing PFM dashboards and spending analytics.",
        capabilities: [
          "Account listing & details",
          "Real-time balances",
          "Transaction history with search",
          "Counterparty enrichment",
        ],
      },
      {
        id: "1.2",
        product_code: "sme-cash-flow-cockpit",
        name: "SME Cash-Flow Cockpit",
        description:
          "Multi-account cash-flow views and counterparty analysis for small and medium enterprise treasury tools.",
        capabilities: [
          "Multi-account aggregation",
          "Balance snapshots across accounts",
          "Transaction categorisation",
          "Counterparty frequency analysis",
        ],
      },
    ],
  },

  // ── 2. Lending & Credit Enablement ─────────────────────────────────
  {
    id: "2",
    collection_name: "Lending-Credit-Enablement",
    description:
      "Endpoints supporting credit decisioning, affordability checks, and relationship-based pricing through account and customer data.",
    functional_scope: [
      "Transaction Analysis",
      "Customer Data",
      "Account Verification",
      "KYC Attributes",
      "Balances",
    ],
    is_sharable: true,
    endpoints: [
      { operation_id: "OBPv4.0.0-getTransactionsForBankAccount", summary: "Get Transactions for Account" },
      { operation_id: "OBPv4.0.0-getCoreTransactionsForBankAccount", summary: "Get Core Transactions" },
      { operation_id: "OBPv4.0.0-getBalancesAtBank", summary: "Get Balances at Bank" },
      { operation_id: "OBPv4.0.0-getAccount", summary: "Get Account by Id" },
      { operation_id: "OBPv4.0.0-getCustomersAtOneBank", summary: "Get Customers at Bank" },
      { operation_id: "OBPv4.0.0-getCustomerByCustomerId", summary: "Get Customer by Id" },
      { operation_id: "OBPv4.0.0-getKycDocuments", summary: "Get KYC Documents" },
      { operation_id: "OBPv4.0.0-getKycStatuses", summary: "Get KYC Statuses" },
      { operation_id: "OBPv4.0.0-getPrivateAccountsAtOneBank", summary: "Get Accounts at Bank" },
      { operation_id: "OBPv4.0.0-getAccountByAccountRouting", summary: "Get Account by Routing" },
    ],
    products: [
      {
        id: "2.1",
        product_code: "instant-credit-decisioning",
        name: "Instant Credit Decisioning",
        description:
          "Transaction and balance data feeds that power real-time affordability checks and credit scoring models.",
        capabilities: [
          "Income & expenditure analysis",
          "Balance trend monitoring",
          "Account verification",
          "KYC status checks",
        ],
      },
      {
        id: "2.2",
        product_code: "relationship-based-pricing",
        name: "Relationship-Based Pricing Inputs",
        description:
          "Customer relationship depth and product holding data to support personalised pricing and loyalty tiers.",
        capabilities: [
          "Customer product holdings",
          "Account tenure & history",
          "Multi-product relationship view",
          "KYC attribute access",
        ],
      },
    ],
  },

  // ── 3. Multi-Bank & Group Treasury ─────────────────────────────────
  {
    id: "3",
    collection_name: "Multi-Bank-Group-Treasury",
    description:
      "Cross-bank account aggregation and payment initiation endpoints for corporate treasury and group liquidity management.",
    functional_scope: [
      "Multi-Bank Accounts",
      "Cross-Bank Balances",
      "Payments",
      "Transaction Monitoring",
      "FX",
    ],
    is_sharable: true,
    endpoints: [
      { operation_id: "OBPv4.0.0-getBanks", summary: "Get Banks" },
      { operation_id: "OBPv4.0.0-getPrivateAccountsAtOneBank", summary: "Get Accounts at Bank" },
      { operation_id: "OBPv4.0.0-getBalancesAtBank", summary: "Get Balances at Bank" },
      { operation_id: "OBPv4.0.0-getTransactionsForBankAccount", summary: "Get Transactions for Account" },
      { operation_id: "OBPv4.0.0-createTransactionRequestAccount", summary: "Create Transaction Request (Account)" },
      { operation_id: "OBPv4.0.0-getTransactionRequests", summary: "Get Transaction Requests" },
      { operation_id: "OBPv4.0.0-getCounterpartiesForBankAccount", summary: "Get Counterparties" },
      { operation_id: "OBPv4.0.0-getCurrentFxRate", summary: "Get Current FX Rate" },
    ],
    products: [
      {
        id: "3.1",
        product_code: "corporate-treasury-dashboard",
        name: "Corporate Treasury Dashboard",
        description:
          "Real-time multi-bank balance aggregation, payment initiation, and FX rate visibility for corporate treasurers.",
        capabilities: [
          "Multi-bank account aggregation",
          "Real-time balance consolidation",
          "Payment initiation",
          "FX rate look-up",
        ],
      },
      {
        id: "3.2",
        product_code: "intra-group-liquidity",
        name: "Intra-Group Liquidity Intelligence",
        description:
          "Group-level liquidity views and intra-company fund transfer support for multi-entity organisations.",
        capabilities: [
          "Group balance views",
          "Intra-group transfers",
          "Transaction monitoring",
          "Counterparty management",
        ],
      },
    ],
  },

  // ── 4. Partner & Ecosystem Enablement ──────────────────────────────
  {
    id: "4",
    collection_name: "Partner-Ecosystem-Enablement",
    description:
      "Sandbox-friendly endpoints for fintech partners and internal innovation teams to rapidly build and test new propositions.",
    functional_scope: [
      "Account Access",
      "Payments",
      "Customer On-boarding",
      "Consent Management",
      "Webhooks",
    ],
    is_sharable: true,
    endpoints: [
      { operation_id: "OBPv4.0.0-getPrivateAccountsAtOneBank", summary: "Get Accounts at Bank" },
      { operation_id: "OBPv4.0.0-getAccount", summary: "Get Account by Id" },
      { operation_id: "OBPv4.0.0-getBalancesAtBank", summary: "Get Balances at Bank" },
      { operation_id: "OBPv4.0.0-getTransactionsForBankAccount", summary: "Get Transactions for Account" },
      { operation_id: "OBPv4.0.0-createTransactionRequestAccount", summary: "Create Transaction Request (Account)" },
      { operation_id: "OBPv4.0.0-createCustomer", summary: "Create Customer" },
      { operation_id: "OBPv4.0.0-getConsents", summary: "Get Consents" },
      { operation_id: "OBPv4.0.0-createConsentByConsentRequestId", summary: "Create Consent" },
    ],
    products: [
      {
        id: "4.1",
        product_code: "fintech-fast-track",
        name: "Fintech Fast-Track",
        description:
          "Pre-packaged account, payment, and consent APIs enabling fintech partners to go live quickly in a sandboxed environment.",
        capabilities: [
          "Account & balance access",
          "Payment initiation",
          "Consent management",
          "Customer on-boarding",
        ],
      },
      {
        id: "4.2",
        product_code: "internal-fintech-mode",
        name: "Internal Fintech Mode",
        description:
          "Internal innovation teams get the same API surface as external fintechs, enabling rapid prototyping and internal hackathons.",
        capabilities: [
          "Full sandbox API access",
          "Transaction simulation",
          "Customer creation",
          "Consent workflows",
        ],
      },
    ],
  },

  // ── 5. Compliance & Control ────────────────────────────────────────
  {
    id: "5",
    collection_name: "Compliance-Control",
    description:
      "Regulatory and audit-focused endpoints for consent tracking, transaction monitoring, and KYC/AML compliance reporting.",
    functional_scope: [
      "Consent Audit",
      "Transaction Monitoring",
      "KYC/AML",
      "Regulatory Reporting",
      "User Management",
    ],
    is_sharable: true,
    endpoints: [
      { operation_id: "OBPv4.0.0-getConsents", summary: "Get Consents" },
      { operation_id: "OBPv4.0.0-getTransactionsForBankAccount", summary: "Get Transactions for Account" },
      { operation_id: "OBPv4.0.0-getKycDocuments", summary: "Get KYC Documents" },
      { operation_id: "OBPv4.0.0-getKycStatuses", summary: "Get KYC Statuses" },
      { operation_id: "OBPv4.0.0-getCustomersAtOneBank", summary: "Get Customers at Bank" },
      { operation_id: "OBPv4.0.0-getCustomerByCustomerId", summary: "Get Customer by Id" },
      { operation_id: "OBPv4.0.0-getUsers", summary: "Get Users" },
      { operation_id: "OBPv4.0.0-getEntitlementsForBank", summary: "Get Entitlements for Bank" },
    ],
    products: [
      {
        id: "5.1",
        product_code: "regulator-ready-open-banking",
        name: "Regulator-Ready Open Banking",
        description:
          "Consent audit trails, KYC status monitoring, and transaction surveillance endpoints for compliance teams and regulators.",
        capabilities: [
          "Consent lifecycle audit",
          "KYC document & status access",
          "Transaction surveillance feeds",
          "User entitlement reporting",
        ],
      },
    ],
  },
];
