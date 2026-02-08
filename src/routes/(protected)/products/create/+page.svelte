<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { Package, ArrowLeft } from "@lucide/svelte";
  import { toast } from "$lib/utils/toastService";
  import { trackedFetch } from "$lib/utils/trackedFetch";
  import BankSelectWidget from "$lib/components/BankSelectWidget.svelte";

  let { data } = $props<{ data: PageData }>();

  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);
  let collections = $derived(data.collections || []);

  // Pre-fill bank from query param
  let selectedBankId = $state($page.url.searchParams.get("bank_id") || "");

  // Form state
  let selectedCollectionId = $state("");
  let productCode = $state("");
  let name = $state("");
  let description = $state("");
  let parentProductCode = $state("");
  let isSubmitting = $state(false);

  // API Product specific attributes
  let monthlySubscriptionAmount = $state("");
  let callsPerSecond = $state("");
  let callsPerMinute = $state("");
  let callsPerHour = $state("");
  let callsPerDay = $state("");
  let callsPerWeek = $state("");
  let callsPerMonth = $state("");

  // Auto-calculate other rate limits when per second changes
  function handlePerSecondChange() {
    const perSecond = parseInt(String(callsPerSecond || ""), 10);

    if (!isNaN(perSecond) && perSecond > 0) {
      callsPerMinute = String(perSecond * 60);
      callsPerHour = String(perSecond * 3600);
      callsPerDay = String(perSecond * 86400);
      callsPerWeek = String(perSecond * 604800);
      callsPerMonth = String(perSecond * 2592000); // 30 days
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!selectedBankId.trim()) {
      toast.error("Validation Error", "Please select a bank");
      return;
    }

    if (!productCode.trim()) {
      toast.error("Validation Error", "Product code is required");
      return;
    }

    if (!selectedCollectionId.trim()) {
      toast.error("Validation Error", "API Collection is required");
      return;
    }

    isSubmitting = true;

    try {
      // Step 1: Create the product
      const productBody: Record<string, string> = {
        name: name.trim(),
        description: description.trim(),
        parent_product_code: parentProductCode.trim(),
      };

      const productResponse = await trackedFetch(
        `/api/products/${selectedBankId}/${productCode.trim()}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productBody),
        },
      );

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.error || "Failed to create product");
      }

      // Step 2: Create the API Product attributes
      const attributesToCreate = [
        { name: "product_type", type: "STRING", value: "API_PRODUCT" },
        { name: "api_collection_id", type: "STRING", value: selectedCollectionId.trim() },
      ];

      // Add rate limit attributes if provided (convert to string for safety)
      const subscriptionVal = String(monthlySubscriptionAmount || "").trim();
      const perSecondVal = String(callsPerSecond || "").trim();
      const perMinuteVal = String(callsPerMinute || "").trim();
      const perHourVal = String(callsPerHour || "").trim();
      const perDayVal = String(callsPerDay || "").trim();
      const perWeekVal = String(callsPerWeek || "").trim();
      const perMonthVal = String(callsPerMonth || "").trim();

      if (subscriptionVal) {
        attributesToCreate.push({ name: "monthly_subscription_amount", type: "DOUBLE", value: subscriptionVal });
      }
      if (perSecondVal) {
        attributesToCreate.push({ name: "calls_per_second", type: "INTEGER", value: perSecondVal });
      }
      if (perMinuteVal) {
        attributesToCreate.push({ name: "calls_per_minute", type: "INTEGER", value: perMinuteVal });
      }
      if (perHourVal) {
        attributesToCreate.push({ name: "calls_per_hour", type: "INTEGER", value: perHourVal });
      }
      if (perDayVal) {
        attributesToCreate.push({ name: "calls_per_day", type: "INTEGER", value: perDayVal });
      }
      if (perWeekVal) {
        attributesToCreate.push({ name: "calls_per_week", type: "INTEGER", value: perWeekVal });
      }
      if (perMonthVal) {
        attributesToCreate.push({ name: "calls_per_month", type: "INTEGER", value: perMonthVal });
      }

      const failedAttributes: string[] = [];

      for (const attr of attributesToCreate) {
        try {
          const attrBody = {
            name: attr.name,
            type: attr.type,
            value: attr.value,
            is_active: true,
          };

          const attrResponse = await trackedFetch(
            `/api/products/${selectedBankId}/${productCode.trim()}/attribute`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(attrBody),
            },
          );

          if (!attrResponse.ok) {
            failedAttributes.push(attr.name);
          }
        } catch {
          failedAttributes.push(attr.name);
        }
      }

      if (failedAttributes.length > 0) {
        toast.warning(
          "Product Created with Warnings",
          `Product created but these attributes failed: ${failedAttributes.join(", ")}`,
        );
      } else {
        toast.success(
          "Product Created",
          `Successfully created API Product "${productCode.trim()}"`,
        );
      }

      setTimeout(() => {
        goto("/products");
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create product";
      toast.error("Error", errorMessage);
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto("/products");
  }
</script>

<svelte:head>
  <title>Create API Product - API Manager</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Breadcrumb Navigation -->
  <nav class="breadcrumb mb-6">
    <a href="/products" class="breadcrumb-link">API Products</a>
    <span class="breadcrumb-separator">></span>
    <span class="breadcrumb-current">Create API Product</span>
  </nav>

  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">
          <Package size={32} />
        </div>
        <div>
          <h1 class="panel-title">Create API Product</h1>
          <div class="panel-subtitle">
            Create a new API product and link it to an API Collection
          </div>
        </div>
      </div>
    </div>

    <div class="panel-content">
      {#if error && !hasApiAccess}
        <div class="error-message">
          <p>{error}</p>
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="form">
        <!-- Row 1: API Collection + Bank -->
        <div class="form-row">
          <div class="form-group">
            <label for="api-collection" class="form-label">
              API Collection
              <span class="required">*</span>
            </label>
            {#if collections.length > 0}
              <select
                id="api-collection"
                class="form-input"
                bind:value={selectedCollectionId}
                disabled={isSubmitting}
                required
              >
                <option value="">Select an API Collection...</option>
                {#each collections as collection}
                  <option value={collection.api_collection_id}>
                    {collection.api_collection_name}
                  </option>
                {/each}
              </select>
            {:else}
              <input
                id="api-collection"
                type="text"
                class="form-input"
                placeholder="Enter API Collection ID"
                bind:value={selectedCollectionId}
                disabled={isSubmitting}
                required
              />
            {/if}
            <div class="form-help">
              The API Collection to link to this product
            </div>
          </div>

          <div class="form-group">
            <label for="bank" class="form-label">
              Bank
              <span class="required">*</span>
            </label>
            <BankSelectWidget
              bind:selectedBankId
              allowEmpty={false}
              emptyLabel="Select a bank"
            />
            <div class="form-help">The bank this product belongs to</div>
          </div>
        </div>

        <!-- Row 2: Product Code + Name -->
        <div class="form-row">
          <div class="form-group">
            <label for="product-code" class="form-label">
              Product Code
              <span class="required">*</span>
            </label>
            <input
              id="product-code"
              type="text"
              class="form-input"
              placeholder="e.g., payments-api-v2"
              bind:value={productCode}
              disabled={isSubmitting}
              required
            />
            <div class="form-help">
              A unique code to identify this product
            </div>
          </div>

          <div class="form-group">
            <label for="product-name" class="form-label">
              Name
            </label>
            <input
              id="product-name"
              type="text"
              class="form-input"
              placeholder="e.g., Payments API"
              bind:value={name}
              disabled={isSubmitting}
            />
            <div class="form-help">A display name for this product</div>
          </div>
        </div>

        <!-- Description (full width) -->
        <div class="form-group">
          <label for="product-description" class="form-label">
            Description
          </label>
          <textarea
            id="product-description"
            class="form-textarea"
            placeholder="e.g., API product bundling payment initiation and status endpoints"
            bind:value={description}
            disabled={isSubmitting}
            rows="3"
          ></textarea>
          <div class="form-help">
            Optional description of this product
          </div>
        </div>

        <!-- Row 3: Parent Product Code + Monthly Subscription -->
        <div class="form-row">
          <div class="form-group">
            <label for="parent-product-code" class="form-label">
              Parent Product Code
            </label>
            <input
              id="parent-product-code"
              type="text"
              class="form-input"
              placeholder="e.g., banking-apis"
              bind:value={parentProductCode}
              disabled={isSubmitting}
            />
            <div class="form-help">
              Optional parent product code for hierarchy
            </div>
          </div>

          <div class="form-group">
            <label for="monthly-subscription" class="form-label">
              Monthly Subscription
            </label>
            <div class="input-with-prefix">
              <span class="input-prefix">$</span>
              <input
                id="monthly-subscription"
                type="number"
                step="0.01"
                min="0"
                class="form-input with-prefix"
                placeholder="e.g., 99.99"
                bind:value={monthlySubscriptionAmount}
                disabled={isSubmitting}
              />
            </div>
            <div class="form-help">Monthly subscription fee</div>
          </div>
        </div>

        <!-- Rate Limits -->
        <div class="rate-limits-section">
          <div class="section-header">
            <div class="section-title">Rate Limits</div>
            <div class="form-help">Enter Per Second to auto-fill others, then adjust as needed</div>
          </div>
          <div class="rate-limits-grid">
            <div class="form-group">
              <label for="calls-per-second" class="form-label">Per Second</label>
              <input
                id="calls-per-second"
                type="number"
                min="0"
                class="form-input primary-input"
                placeholder="Enter"
                bind:value={callsPerSecond}
                onchange={handlePerSecondChange}
                disabled={isSubmitting}
              />
            </div>

            <div class="form-group">
              <label for="calls-per-minute" class="form-label">Per Minute</label>
              <input
                id="calls-per-minute"
                type="number"
                min="0"
                class="form-input"
                placeholder="Auto"
                bind:value={callsPerMinute}
                disabled={isSubmitting}
              />
            </div>

            <div class="form-group">
              <label for="calls-per-hour" class="form-label">Per Hour</label>
              <input
                id="calls-per-hour"
                type="number"
                min="0"
                class="form-input"
                placeholder="Auto"
                bind:value={callsPerHour}
                disabled={isSubmitting}
              />
            </div>

            <div class="form-group">
              <label for="calls-per-day" class="form-label">Per Day</label>
              <input
                id="calls-per-day"
                type="number"
                min="0"
                class="form-input"
                placeholder="Auto"
                bind:value={callsPerDay}
                disabled={isSubmitting}
              />
            </div>

            <div class="form-group">
              <label for="calls-per-week" class="form-label">Per Week</label>
              <input
                id="calls-per-week"
                type="number"
                min="0"
                class="form-input"
                placeholder="Auto"
                bind:value={callsPerWeek}
                disabled={isSubmitting}
              />
            </div>

            <div class="form-group">
              <label for="calls-per-month" class="form-label">Per Month</label>
              <input
                id="calls-per-month"
                type="number"
                min="0"
                class="form-input"
                placeholder="Auto"
                bind:value={callsPerMonth}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            onclick={handleCancel}
            disabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            Cancel
          </button>
          <button type="submit" class="btn-primary" disabled={isSubmitting}>
            {#if isSubmitting}
              Creating...
            {:else}
              <Package size={16} />
              Create API Product
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1000px;
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

  .error-message {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #991b1b;
    font-size: 0.875rem;
  }

  :global([data-mode="dark"]) .error-message {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: rgb(var(--color-error-200));
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  :global([data-mode="dark"]) .form-label {
    color: var(--color-surface-200);
  }

  .required {
    color: #dc2626;
  }

  .form-input,
  .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input:disabled,
  .form-textarea:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
  }

  :global([data-mode="dark"]) .form-input,
  :global([data-mode="dark"]) .form-textarea {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .form-input:focus,
  :global([data-mode="dark"]) .form-textarea:focus {
    border-color: rgb(var(--color-primary-500));
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  :global([data-mode="dark"]) .form-input:disabled,
  :global([data-mode="dark"]) .form-textarea:disabled {
    background: rgb(var(--color-surface-800));
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-help {
    font-size: 0.75rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .form-help {
    color: var(--color-surface-400);
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .form-actions {
    border-top-color: rgb(var(--color-surface-700));
  }

  .btn-primary,
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-primary {
    background: rgb(var(--color-primary-600));
  }

  :global([data-mode="dark"]) .btn-primary:hover:not(:disabled) {
    background: rgb(var(--color-primary-700));
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-secondary {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-200);
  }

  :global([data-mode="dark"]) .btn-secondary:hover:not(:disabled) {
    background: rgb(var(--color-surface-600));
  }

  .section-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #374151;
  }

  :global([data-mode="dark"]) .section-title {
    color: var(--color-surface-200);
  }

  .input-with-prefix {
    display: flex;
    align-items: center;
    position: relative;
  }

  .input-prefix {
    position: absolute;
    left: 0.75rem;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 1;
  }

  :global([data-mode="dark"]) .input-prefix {
    color: var(--color-surface-400);
  }

  .form-input.with-prefix {
    padding-left: 1.75rem;
  }

  .rate-limits-section {
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .rate-limits-section {
    border-top-color: rgb(var(--color-surface-700));
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .section-header .form-help {
    margin: 0;
  }

  .rate-limits-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.75rem;
  }

  .rate-limits-grid .form-group {
    gap: 0.25rem;
  }

  .rate-limits-grid .form-label {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .rate-limits-grid .form-input {
    padding: 0.5rem 0.5rem;
    font-size: 0.8125rem;
  }

  .rate-limits-grid .form-input.primary-input {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  :global([data-mode="dark"]) .rate-limits-grid .form-input.primary-input {
    border-color: rgb(var(--color-primary-500));
    background: rgba(59, 130, 246, 0.15);
  }

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .rate-limits-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column-reverse;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
      justify-content: center;
    }

    .header-content {
      flex-direction: column;
      text-align: center;
    }

    .rate-limits-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
