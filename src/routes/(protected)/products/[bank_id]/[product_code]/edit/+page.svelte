<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { Package } from "@lucide/svelte";
  import { toast } from "$lib/utils/toastService";
  import { trackedFetch } from "$lib/utils/trackedFetch";
  import ProductForm from "$lib/components/ProductForm.svelte";

  let { data } = $props<{ data: PageData }>();

  const bankId = $page.params.bank_id;
  const productCode = $page.params.product_code;

  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);
  let collections = $derived(data.collections || []);
  const product = data.product;

  // System attributes managed via dedicated form fields
  const SYSTEM_ATTRIBUTES = [
    "api_collection_id",
    "monthly_subscription_amount",
    "monthly_subscription_currency",
    "calls_per_second",
    "calls_per_minute",
    "calls_per_hour",
    "calls_per_day",
    "calls_per_week",
    "calls_per_month",
  ];

  const productAttrs = (product?.attributes || []) as Array<{ name: string; type: string; value: string }>;

  function getAttrValue(attrName: string): string {
    const attr = productAttrs.find((a) => a.name === attrName);
    return attr?.value || "";
  }

  const initialCustomAttributes = productAttrs
    .filter((a) => !SYSTEM_ATTRIBUTES.includes(a.name))
    .map((a) => ({ name: a.name, type: a.type || "STRING", value: a.value }));

  async function handleSubmit(formData: {
    name: string;
    description: string;
    productCode: string;
    parentProductCode: string;
    collectionId: string;
    monthlySubscription: string;
    monthlySubscriptionCurrency: string;
    rateLimits: { perSecond: string; perMinute: string; perHour: string; perDay: string; perWeek: string; perMonth: string };
    customAttributes: Array<{ name: string; type: string; value: string }>;
  }) {
    if (!formData.collectionId) {
      toast.error("Validation Error", "API Collection is required");
      return;
    }

    try {
      // Step 1: Update the product
      const productResponse = await trackedFetch(
        `/api/products/${bankId}/${encodeURIComponent(productCode)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            parent_product_code: formData.parentProductCode,
          }),
        },
      );

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      // Step 2: Create/update attributes
      const attributesToCreate: Array<{ name: string; type: string; value: string }> = [
        { name: "api_collection_id", type: "STRING", value: formData.collectionId },
      ];

      if (formData.monthlySubscription) {
        attributesToCreate.push({ name: "monthly_subscription_amount", type: "DOUBLE", value: formData.monthlySubscription });
      }
      if (formData.monthlySubscriptionCurrency) {
        attributesToCreate.push({ name: "monthly_subscription_currency", type: "STRING", value: formData.monthlySubscriptionCurrency });
      }
      if (formData.rateLimits.perSecond) {
        attributesToCreate.push({ name: "calls_per_second", type: "INTEGER", value: formData.rateLimits.perSecond });
      }
      if (formData.rateLimits.perMinute) {
        attributesToCreate.push({ name: "calls_per_minute", type: "INTEGER", value: formData.rateLimits.perMinute });
      }
      if (formData.rateLimits.perHour) {
        attributesToCreate.push({ name: "calls_per_hour", type: "INTEGER", value: formData.rateLimits.perHour });
      }
      if (formData.rateLimits.perDay) {
        attributesToCreate.push({ name: "calls_per_day", type: "INTEGER", value: formData.rateLimits.perDay });
      }
      if (formData.rateLimits.perWeek) {
        attributesToCreate.push({ name: "calls_per_week", type: "INTEGER", value: formData.rateLimits.perWeek });
      }
      if (formData.rateLimits.perMonth) {
        attributesToCreate.push({ name: "calls_per_month", type: "INTEGER", value: formData.rateLimits.perMonth });
      }

      // Add custom attributes
      for (const attr of formData.customAttributes) {
        attributesToCreate.push(attr);
      }

      const failedAttributes: string[] = [];

      for (const attr of attributesToCreate) {
        try {
          const attrResponse = await trackedFetch(
            `/api/products/${bankId}/${encodeURIComponent(productCode)}/attribute`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: attr.name, type: attr.type, value: attr.value, is_active: true }),
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
        <ProductForm
          mode="edit"
          {collections}
          initialName={product.name || ""}
          initialDescription={product.description || ""}
          initialProductCode={productCode}
          initialParentProductCode={product.parent_product_code || ""}
          initialCollectionId={getAttrValue("api_collection_id")}
          initialSubscription={getAttrValue("monthly_subscription_amount")}
          initialSubscriptionCurrency={getAttrValue("monthly_subscription_currency") || "EUR"}
          initialRateLimits={{
            perSecond: getAttrValue("calls_per_second"),
            perMinute: getAttrValue("calls_per_minute"),
            perHour: getAttrValue("calls_per_hour"),
            perDay: getAttrValue("calls_per_day"),
            perWeek: getAttrValue("calls_per_week"),
            perMonth: getAttrValue("calls_per_month"),
          }}
          {initialCustomAttributes}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
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

  @media (max-width: 640px) {
    .header-content {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
