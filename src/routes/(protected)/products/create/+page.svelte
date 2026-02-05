<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { Package, ArrowLeft, Plus, Trash2 } from "@lucide/svelte";
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

  // Custom attributes
  const ATTRIBUTE_TYPES = ["STRING", "INTEGER", "DOUBLE", "DATE_WITH_DAY"];

  interface CustomAttribute {
    name: string;
    type: string;
    value: string;
    is_active: boolean;
  }

  let customAttributes: CustomAttribute[] = $state([]);

  function addAttribute() {
    customAttributes.push({ name: "", type: "STRING", value: "", is_active: true });
  }

  function removeAttribute(index: number) {
    customAttributes.splice(index, 1);
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

      // Step 2: Create the api_collection_id attribute
      const attributeBody = {
        name: "api_collection_id",
        type: "STRING",
        value: selectedCollectionId.trim(),
        is_active: true,
      };

      const attributeResponse = await trackedFetch(
        `/api/products/${selectedBankId}/${productCode.trim()}/attribute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attributeBody),
        },
      );

      if (!attributeResponse.ok) {
        const errorData = await attributeResponse.json();
        throw new Error(
          errorData.error || "Product created but failed to set API Collection attribute",
        );
      }

      // Step 3: Create custom attributes
      const attributesToCreate = customAttributes.filter((a) => a.name.trim() !== "");
      const failedAttributes: string[] = [];

      for (const attr of attributesToCreate) {
        try {
          const customAttrBody = {
            name: attr.name.trim(),
            type: attr.type,
            value: attr.value.trim(),
            is_active: attr.is_active,
          };

          const customAttrResponse = await trackedFetch(
            `/api/products/${selectedBankId}/${productCode.trim()}/attribute`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(customAttrBody),
            },
          );

          if (!customAttrResponse.ok) {
            failedAttributes.push(attr.name.trim());
          }
        } catch {
          failedAttributes.push(attr.name.trim());
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
        <!-- API Collection -->
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

        <!-- Bank -->
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

        <!-- Product Code -->
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

        <!-- Name -->
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

        <!-- Description -->
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
            rows="4"
          ></textarea>
          <div class="form-help">
            Optional description of this product
          </div>
        </div>

        <!-- Parent Product Code -->
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
            Optional parent product code for product hierarchy
          </div>
        </div>

        <!-- Additional Attributes -->
        <div class="attributes-section">
          <div class="attributes-header">
            <label class="form-label">Additional Attributes</label>
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
          <div class="form-help">
            Define custom attributes such as rate limits, pricing tiers, or metadata for this product
          </div>

          {#each customAttributes as attr, i}
            <div class="attribute-row">
              <input
                type="text"
                class="form-input"
                placeholder="calls_per_month"
                bind:value={attr.name}
                disabled={isSubmitting}
              />
              <select
                class="form-input"
                bind:value={attr.type}
                disabled={isSubmitting}
              >
                {#each ATTRIBUTE_TYPES as attrType}
                  <option value={attrType}>{attrType}</option>
                {/each}
              </select>
              <input
                type="text"
                class="form-input"
                placeholder="10000"
                bind:value={attr.value}
                disabled={isSubmitting}
              />
              <label class="attribute-active-label">
                <input
                  type="checkbox"
                  bind:checked={attr.is_active}
                  disabled={isSubmitting}
                />
                Active
              </label>
              <button
                type="button"
                class="btn-remove-attribute"
                onclick={() => removeAttribute(i)}
                disabled={isSubmitting}
                title="Remove attribute"
              >
                <Trash2 size={16} />
              </button>
            </div>
          {/each}
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

  .attributes-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .attributes-section {
    border-top-color: rgb(var(--color-surface-700));
  }

  .attributes-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .attribute-row {
    display: grid;
    grid-template-columns: 1fr 150px 1fr 60px 36px;
    gap: 0.5rem;
    align-items: center;
  }

  .attribute-active-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #374151;
    white-space: nowrap;
  }

  :global([data-mode="dark"]) .attribute-active-label {
    color: var(--color-surface-300);
  }

  .btn-add-attribute {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid #3b82f6;
    border-radius: 6px;
    background: transparent;
    color: #3b82f6;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-add-attribute:hover:not(:disabled) {
    background: #eff6ff;
  }

  .btn-add-attribute:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-add-attribute {
    border-color: rgb(var(--color-primary-400));
    color: rgb(var(--color-primary-400));
  }

  :global([data-mode="dark"]) .btn-add-attribute:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.15);
  }

  .btn-remove-attribute {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-remove-attribute:hover:not(:disabled) {
    background: #fef2f2;
    color: #dc2626;
  }

  .btn-remove-attribute:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-remove-attribute {
    color: var(--color-surface-500);
  }

  :global([data-mode="dark"]) .btn-remove-attribute:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.15);
    color: rgb(var(--color-error-400));
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

    .attribute-row {
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .attribute-row .btn-remove-attribute {
      grid-column: 2;
      justify-self: end;
    }
  }
</style>
