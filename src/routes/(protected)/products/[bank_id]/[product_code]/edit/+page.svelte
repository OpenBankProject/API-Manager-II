<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { Package, ArrowLeft, Plus, Trash2 } from "@lucide/svelte";
  import { toast } from "$lib/utils/toastService";
  import { trackedFetch } from "$lib/utils/trackedFetch";

  let { data } = $props<{ data: PageData }>();

  const bankId = $page.params.bank_id;
  const productCode = $page.params.product_code;

  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);
  let collections = $derived(data.collections || []);
  const product = data.product;

  const ATTRIBUTE_TYPES = ["STRING", "INTEGER", "DOUBLE", "DATE_WITH_DAY"] as const;

  interface CustomAttribute {
    name: string;
    type: string;
    value: string;
  }

  // System attributes that are managed separately (not shown in custom attributes)
  const SYSTEM_ATTRIBUTES = [
    "api_collection_id",
    "monthly_subscription_amount",
    "calls_per_second",
    "calls_per_minute",
    "calls_per_hour",
    "calls_per_day",
    "calls_per_week",
    "calls_per_month",
  ];

  // Helper to extract an attribute value from the product
  const productAttrs = (product?.attributes || []) as Array<{ name: string; type: string; value: string }>;

  function getAttrValue(attrName: string): string {
    const attr = productAttrs.find((a) => a.name === attrName);
    return attr?.value || "";
  }

  // Pre-fill form state directly from product data
  let selectedCollectionId = $state(getAttrValue("api_collection_id"));
  let name = $state(product?.name || "");
  let description = $state(product?.description || "");
  let parentProductCode = $state(product?.parent_product_code || "");
  let isSubmitting = $state(false);

  // Rate limit attributes - initialized from existing product attributes
  let monthlySubscriptionAmount = $state(getAttrValue("monthly_subscription_amount"));
  let callsPerSecond = $state(getAttrValue("calls_per_second"));
  let callsPerMinute = $state(getAttrValue("calls_per_minute"));
  let callsPerHour = $state(getAttrValue("calls_per_hour"));
  let callsPerDay = $state(getAttrValue("calls_per_day"));
  let callsPerWeek = $state(getAttrValue("calls_per_week"));
  let callsPerMonth = $state(getAttrValue("calls_per_month"));

  // Custom attributes (non-system) - initialized from existing product attributes
  let customAttributes = $state<CustomAttribute[]>(
    productAttrs
      .filter((a) => !SYSTEM_ATTRIBUTES.includes(a.name))
      .map((a) => ({ name: a.name, type: a.type || "STRING", value: a.value })),
  );

  function handlePerSecondChange() {
    const perSecond = parseInt(String(callsPerSecond || ""), 10);

    if (!isNaN(perSecond) && perSecond > 0) {
      callsPerMinute = String(perSecond * 60);
      callsPerHour = String(perSecond * 3600);
      callsPerDay = String(perSecond * 86400);
      callsPerWeek = String(perSecond * 604800);
      callsPerMonth = String(perSecond * 2592000);
    }
  }

  function addAttribute() {
    customAttributes = [...customAttributes, { name: "", type: "STRING", value: "" }];
  }

  function removeAttribute(index: number) {
    customAttributes = customAttributes.filter((_, i) => i !== index);
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!selectedCollectionId.trim()) {
      toast.error("Validation Error", "API Collection is required");
      return;
    }

    isSubmitting = true;

    try {
      // Step 1: Update the product
      const productBody: Record<string, string> = {
        name: name.trim(),
        description: description.trim(),
        parent_product_code: parentProductCode.trim(),
      };

      const productResponse = await trackedFetch(
        `/api/products/${bankId}/${encodeURIComponent(productCode)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productBody),
        },
      );

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      // Step 2: Create/update attributes
      const attributesToCreate = [
        { name: "api_collection_id", type: "STRING", value: selectedCollectionId.trim() },
      ];

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

      // Add custom attributes
      for (const attr of customAttributes) {
        if (attr.name.trim() && attr.value.trim()) {
          attributesToCreate.push({
            name: attr.name.trim(),
            type: attr.type,
            value: attr.value.trim(),
          });
        }
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
            `/api/products/${bankId}/${encodeURIComponent(productCode)}/attribute`,
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
          "Product Updated with Warnings",
          `Product updated but these attributes failed: ${failedAttributes.join(", ")}`,
        );
      } else {
        toast.success(
          "Product Updated",
          `Successfully updated API Product "${productCode}"`,
        );
      }

      setTimeout(() => {
        goto(`/products/${bankId}/${productCode}`);
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update product";
      toast.error("Error", errorMessage);
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto(`/products/${bankId}/${productCode}`);
  }
</script>

<svelte:head>
  <title>Edit {productCode} - API Manager</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Breadcrumb Navigation -->
  <nav class="breadcrumb mb-6">
    <a href="/products" class="breadcrumb-link">API Products</a>
    <span class="breadcrumb-separator">></span>
    <a href="/products/{bankId}/{productCode}" class="breadcrumb-link">{productCode}</a>
    <span class="breadcrumb-separator">></span>
    <span class="breadcrumb-current">Edit</span>
  </nav>

  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">
          <Package size={32} />
        </div>
        <div>
          <h1 class="panel-title">Edit API Product</h1>
          <div class="panel-subtitle">
            Update product details and attributes
          </div>
        </div>
      </div>
    </div>

    <div class="panel-content">
      {#if error && !hasApiAccess}
        <div class="error-message">
          <p>{error}</p>
        </div>
      {:else if !product}
        <div class="error-message">
          <p>Product not found or could not be loaded.</p>
        </div>
      {:else}
        <form onsubmit={handleSubmit} class="form">
          <!-- Row 1: Bank + Product Code (read-only) + API Collection -->
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Bank</label>
              <div class="readonly-value">{bankId}</div>
              <div class="form-help">Bank cannot be changed</div>
            </div>

            <div class="form-group">
              <label class="form-label">Product Code</label>
              <div class="readonly-value">{productCode}</div>
              <div class="form-help">Product code cannot be changed</div>
            </div>

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
                The API Collection linked to this product
              </div>
            </div>
          </div>

          <!-- Row 2: Name + Parent Product Code + Monthly Subscription -->
          <div class="form-row-3">
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

          <!-- Additional Attributes -->
          <div class="attributes-section">
            <div class="section-header">
              <div class="section-title">Additional Attributes</div>
              <button
                type="button"
                class="btn-add-attribute"
                onclick={addAttribute}
                disabled={isSubmitting}
              >
                <Plus size={14} />
                Add Attribute
              </button>
            </div>

            {#if customAttributes.length > 0}
              <div class="attributes-list">
                {#each customAttributes as attr, index}
                  <div class="attribute-row">
                    <div class="form-group">
                      <label for="attr-name-{index}" class="form-label">Name</label>
                      <input
                        id="attr-name-{index}"
                        type="text"
                        class="form-input"
                        placeholder="Attribute name"
                        bind:value={attr.name}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div class="form-group">
                      <label for="attr-type-{index}" class="form-label">Type</label>
                      <select
                        id="attr-type-{index}"
                        class="form-input"
                        bind:value={attr.type}
                        disabled={isSubmitting}
                      >
                        {#each ATTRIBUTE_TYPES as attrType}
                          <option value={attrType}>{attrType}</option>
                        {/each}
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="attr-value-{index}" class="form-label">Value</label>
                      <input
                        id="attr-value-{index}"
                        type="text"
                        class="form-input"
                        placeholder="Attribute value"
                        bind:value={attr.value}
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      type="button"
                      class="btn-remove-attribute"
                      onclick={() => removeAttribute(index)}
                      disabled={isSubmitting}
                      title="Remove attribute"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="no-attributes">No additional attributes. Click "Add Attribute" to add one.</p>
            {/if}
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
                Saving...
              {:else}
                <Package size={16} />
                Save Changes
              {/if}
            </button>
          </div>
        </form>
      {/if}
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

  .form-row-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
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

  .readonly-value {
    padding: 0.75rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #6b7280;
    font-family: ui-monospace, monospace;
  }

  :global([data-mode="dark"]) .readonly-value {
    background: rgb(var(--color-surface-800));
    border-color: rgb(var(--color-surface-600));
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

  /* Attributes section */
  .attributes-section {
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .attributes-section {
    border-top-color: rgb(var(--color-surface-700));
  }

  .btn-add-attribute {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background: #eff6ff;
    color: #3b82f6;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-add-attribute:hover:not(:disabled) {
    background: #dbeafe;
  }

  .btn-add-attribute:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-add-attribute {
    background: rgba(59, 130, 246, 0.15);
    color: rgb(var(--color-primary-400));
    border-color: rgba(59, 130, 246, 0.3);
  }

  :global([data-mode="dark"]) .btn-add-attribute:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.25);
  }

  .attributes-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .attribute-row {
    display: grid;
    grid-template-columns: 1fr 0.6fr 1fr auto;
    gap: 0.75rem;
    align-items: end;
  }

  .attribute-row .form-group {
    gap: 0.25rem;
  }

  .attribute-row .form-label {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .btn-remove-attribute {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0.5rem;
  }

  .btn-remove-attribute:hover:not(:disabled) {
    background: #fee2e2;
  }

  .btn-remove-attribute:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-remove-attribute {
    background: rgba(239, 68, 68, 0.1);
    color: rgb(var(--color-error-400));
    border-color: rgba(239, 68, 68, 0.3);
  }

  :global([data-mode="dark"]) .btn-remove-attribute:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
  }

  .no-attributes {
    font-size: 0.8125rem;
    color: #9ca3af;
    font-style: italic;
    padding: 0.5rem 0;
  }

  :global([data-mode="dark"]) .no-attributes {
    color: var(--color-surface-500);
  }

  @media (max-width: 768px) {
    .form-row,
    .form-row-3 {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .rate-limits-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .attribute-row {
      grid-template-columns: 1fr;
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
