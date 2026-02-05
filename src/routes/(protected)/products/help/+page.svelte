<script lang="ts">
  import {
    CircleHelp,
    FolderOpen,
    Package,
    Gauge,
    CreditCard,
    Rocket,
  } from "@lucide/svelte";
</script>

<svelte:head>
  <title>API Products Help - API Manager</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Breadcrumb Navigation -->
  <nav class="breadcrumb mb-6">
    <a href="/products" class="breadcrumb-link">API Products</a>
    <span class="breadcrumb-separator">></span>
    <span class="breadcrumb-current">Help</span>
  </nav>

  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">
          <CircleHelp size={32} />
        </div>
        <div>
          <h1 class="panel-title">API Products Guide</h1>
          <div class="panel-subtitle">
            Learn how to define and publish an API Product
          </div>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <!-- What is an API Product? -->
      <section class="section">
        <h2 class="section-title">What is an API Product?</h2>
        <p class="section-text">
          An API Product bundles a set of API endpoints (via an <strong>API Collection</strong>)
          with access controls, rate limits, and pricing. Third-party providers (TPPs) subscribe to
          an API Product to gain access to the endpoints it contains, subject to the quotas and
          pricing you configure.
        </p>
      </section>

      <!-- Step-by-step workflow -->
      <section class="section">
        <h2 class="section-title">Step-by-step Workflow</h2>

        <div class="steps">
          <div class="step-card">
            <div class="step-number">1</div>
            <div class="step-icon">
              <FolderOpen size={24} />
            </div>
            <div class="step-body">
              <h3 class="step-title">Create an API Collection</h3>
              <p class="step-text">
                Curate the endpoints you want to offer. An API Collection is a named set of API
                endpoints that forms the core of your product.
              </p>
              <a href="/api-collections" class="step-link">
                Go to My Collections &rarr;
              </a>
            </div>
          </div>

          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-icon">
              <Package size={24} />
            </div>
            <div class="step-body">
              <h3 class="step-title">Create an API Product</h3>
              <p class="step-text">
                Link your product to the API Collection, give it a name and a unique product code.
                The product code identifies it across the system.
              </p>
              <a href="/products/create" class="step-link">
                Create a Product &rarr;
              </a>
            </div>
          </div>

          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-icon">
              <Gauge size={24} />
            </div>
            <div class="step-body">
              <h3 class="step-title">Set Rate Limits</h3>
              <p class="step-text">
                Configure call quotas using <strong>Product Attributes</strong>. For example, set
                <code>calls_per_month</code> to control how many API calls a subscriber can make.
              </p>
            </div>
          </div>

          <div class="step-card">
            <div class="step-number">4</div>
            <div class="step-icon">
              <CreditCard size={24} />
            </div>
            <div class="step-body">
              <h3 class="step-title">Set Pricing</h3>
              <p class="step-text">
                Connect to Stripe or configure pricing details via Product Attributes such as
                <code>price_per_month</code> or <code>stripe_product_id</code>.
              </p>
            </div>
          </div>

          <div class="step-card">
            <div class="step-number">5</div>
            <div class="step-icon">
              <Rocket size={24} />
            </div>
            <div class="step-body">
              <h3 class="step-title">Publish</h3>
              <p class="step-text">
                Make the product available for TPPs to discover and subscribe to. Once published,
                consumers can request access through the API Marketplace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Concepts -->
      <section class="section">
        <h2 class="section-title">Key Concepts</h2>

        <div class="concepts-grid">
          <div class="concept-card">
            <h3 class="concept-title">API Collection</h3>
            <p class="concept-text">
              A named group of API endpoints. Collections let you curate which endpoints are
              included in a product offering.
            </p>
          </div>

          <div class="concept-card">
            <h3 class="concept-title">Product Attribute</h3>
            <p class="concept-text">
              A key-value pair attached to a product. Attributes store configuration such as rate
              limits, pricing, and the linked API Collection ID.
            </p>
          </div>

          <div class="concept-card">
            <h3 class="concept-title">Rate Limit</h3>
            <p class="concept-text">
              A quota that controls how many API calls a subscriber can make within a given time
              period (e.g. per month or per day).
            </p>
          </div>

          <div class="concept-card">
            <h3 class="concept-title">Product Code</h3>
            <p class="concept-text">
              A unique identifier for a product (e.g. <code>payments-api-v2</code>). Used to
              reference the product across the system and in API calls.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 800px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .breadcrumb-link {
    color: #3b82f6;
    text-decoration: none;
  }

  .breadcrumb-link:hover {
    text-decoration: underline;
  }

  :global([data-mode="dark"]) .breadcrumb-link {
    color: rgb(var(--color-primary-400));
  }

  .breadcrumb-separator {
    color: #9ca3af;
  }

  :global([data-mode="dark"]) .breadcrumb-separator {
    color: var(--color-surface-500);
  }

  .breadcrumb-current {
    color: #6b7280;
  }

  :global([data-mode="dark"]) .breadcrumb-current {
    color: var(--color-surface-400);
  }

  .panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  :global([data-mode="dark"]) .panel {
    background: rgb(var(--color-surface-800));
  }

  .panel-header {
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .panel-header {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 12px;
    flex-shrink: 0;
  }

  :global([data-mode="dark"]) .header-icon {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(var(--color-primary-400));
  }

  .panel-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  :global([data-mode="dark"]) .panel-title {
    color: var(--color-surface-100);
  }

  .panel-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  :global([data-mode="dark"]) .panel-subtitle {
    color: var(--color-surface-400);
  }

  .panel-content {
    padding: 2rem;
  }

  .section {
    margin-bottom: 2.5rem;
  }

  .section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.75rem 0;
  }

  :global([data-mode="dark"]) .section-title {
    color: var(--color-surface-100);
  }

  .section-text {
    font-size: 0.875rem;
    color: #4b5563;
    line-height: 1.6;
    margin: 0;
  }

  :global([data-mode="dark"]) .section-text {
    color: var(--color-surface-300);
  }

  .section-text code {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.8125rem;
  }

  :global([data-mode="dark"]) .section-text code {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-200);
  }

  /* Steps */
  .steps {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .step-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  :global([data-mode="dark"]) .step-card {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    font-size: 0.8125rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .step-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 8px;
    flex-shrink: 0;
  }

  :global([data-mode="dark"]) .step-icon {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(var(--color-primary-400));
  }

  .step-body {
    flex: 1;
    min-width: 0;
  }

  .step-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  :global([data-mode="dark"]) .step-title {
    color: var(--color-surface-100);
  }

  .step-text {
    font-size: 0.8125rem;
    color: #4b5563;
    line-height: 1.5;
    margin: 0;
  }

  :global([data-mode="dark"]) .step-text {
    color: var(--color-surface-300);
  }

  .step-text code {
    background: #e5e7eb;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  :global([data-mode="dark"]) .step-text code {
    background: rgb(var(--color-surface-600));
    color: var(--color-surface-200);
  }

  .step-link {
    display: inline-block;
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #3b82f6;
    text-decoration: none;
  }

  .step-link:hover {
    text-decoration: underline;
  }

  :global([data-mode="dark"]) .step-link {
    color: rgb(var(--color-primary-400));
  }

  /* Key Concepts Grid */
  .concepts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .concept-card {
    padding: 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  :global([data-mode="dark"]) .concept-card {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
  }

  .concept-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.375rem 0;
  }

  :global([data-mode="dark"]) .concept-title {
    color: var(--color-surface-100);
  }

  .concept-text {
    font-size: 0.8125rem;
    color: #4b5563;
    line-height: 1.5;
    margin: 0;
  }

  :global([data-mode="dark"]) .concept-text {
    color: var(--color-surface-300);
  }

  .concept-text code {
    background: #e5e7eb;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  :global([data-mode="dark"]) .concept-text code {
    background: rgb(var(--color-surface-600));
    color: var(--color-surface-200);
  }

  @media (max-width: 640px) {
    .header-content {
      flex-direction: column;
      text-align: center;
    }

    .step-card {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .concepts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
