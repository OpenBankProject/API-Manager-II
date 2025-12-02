<script lang="ts">
  import type { PageData } from "./$types";
  import { Eye, ArrowLeft, Shield, AlertCircle, Save } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import MissingRoleAlert from "$lib/components/MissingRoleAlert.svelte";
  import PageRoleCheck from "$lib/components/PageRoleCheck.svelte";

  let { data } = $props<{ data: PageData }>();

  let banks = $derived(data.banks || []);
  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);

  // Form state
  let formData = $state({
    bank_id: "",
    name: "",
    description: "",
    metadata_view: "",
    is_public: false,
    which_alias_to_use: "",
    hide_metadata_if_alias_used: false,
    allowed_actions: [] as string[],
  });

  let isSubmitting = $state(false);
  let submitError = $state<string | null>(null);
  let submitSuccess = $state(false);

  // Permission checkboxes state - organized by category
  let transactionPermissions = $state({
    can_see_transaction_this_bank_account: false,
    can_see_transaction_other_bank_account: false,
    can_see_transaction_metadata: false,
    can_see_transaction_label: false,
    can_see_transaction_amount: false,
    can_see_transaction_type: false,
    can_see_transaction_currency: false,
    can_see_transaction_start_date: false,
    can_see_transaction_finish_date: false,
    can_see_transaction_balance: false,
  });

  let accountPermissions = $state({
    can_see_bank_account_owners: false,
    can_see_bank_account_type: false,
    can_see_bank_account_balance: false,
    can_see_bank_account_currency: false,
    can_see_bank_account_label: false,
    can_see_bank_account_national_identifier: false,
    can_see_bank_account_swift_bic: false,
    can_see_bank_account_iban: false,
    can_see_bank_account_number: false,
    can_see_bank_account_bank_name: false,
    can_see_bank_account_credit_limit: false,
  });

  let counterpartyPermissions = $state({
    can_see_other_account_national_identifier: false,
    can_see_other_account_swift_bic: false,
    can_see_other_account_iban: false,
    can_see_other_account_bank_name: false,
    can_see_other_account_number: false,
    can_see_other_account_metadata: false,
    can_see_other_account_kind: false,
    can_see_public_alias: false,
    can_see_private_alias: false,
  });

  let otherPermissions = $state({
    can_see_comments: false,
    can_see_narrative: false,
    can_see_tags: false,
    can_see_images: false,
    can_see_more_info: false,
    can_see_url: false,
    can_see_image_url: false,
    can_see_where_tag: false,
  });

  let writePermissions = $state({
    can_add_comment: false,
    can_delete_comment: false,
    can_add_tag: false,
    can_delete_tag: false,
    can_add_image: false,
    can_delete_image: false,
    can_edit_narrative: false,
    can_create_counterparty: false,
    can_add_transaction_request_to_own_account: false,
    can_add_transaction_request_to_any_account: false,
  });

  // Helper functions for bulk selection
  function selectAllInCategory(category: any) {
    Object.keys(category).forEach((key) => {
      category[key] = true;
    });
  }

  function deselectAllInCategory(category: any) {
    Object.keys(category).forEach((key) => {
      category[key] = false;
    });
  }

  // Validation
  let validationErrors = $derived.by(() => {
    const errors: string[] = [];
    if (!formData.bank_id) errors.push("Bank is required");
    if (!formData.name || formData.name.trim().length === 0)
      errors.push("Name is required");
    if (!formData.description || formData.description.trim().length === 0)
      errors.push("Description is required");
    return errors;
  });

  let isValid = $derived(validationErrors.length === 0);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!isValid || isSubmitting) return;

    isSubmitting = true;
    submitError = null;
    submitSuccess = false;

    try {
      // Build the request payload
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_public: formData.is_public,
        metadata_view: formData.metadata_view.trim() || "_0",
        which_alias_to_use: formData.which_alias_to_use.trim(),
        hide_metadata_if_alias_used: formData.hide_metadata_if_alias_used,
        allowed_actions: formData.allowed_actions,
      };

      // Add all enabled permissions to the payload
      Object.entries({
        ...transactionPermissions,
        ...accountPermissions,
        ...counterpartyPermissions,
        ...otherPermissions,
        ...writePermissions,
      }).forEach(([key, value]) => {
        if (value) {
          payload[key] = [];
        }
      });

      // Make the API call
      const response = await fetch(`/api/obp/banks/${formData.bank_id}/views`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create custom view");
      }

      const result = await response.json();
      submitSuccess = true;

      // Redirect to the new view's detail page after a short delay
      setTimeout(() => {
        goto(`/account-access/custom-views/${result.id}`);
      }, 1000);
    } catch (err) {
      submitError =
        err instanceof Error ? err.message : "Failed to create custom view";
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Create Custom View - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <PageRoleCheck
    userEntitlements={data.userEntitlements}
    requiredRoles={data.requiredRoles}
  />

  <!-- Breadcrumb -->
  <nav class="breadcrumb mb-6">
    <a href="/account-access/custom-views" class="breadcrumb-link"
      >Custom Views</a
    >
    <span class="breadcrumb-separator">›</span>
    <span class="breadcrumb-current">Create</span>
  </nav>

  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <Eye size={32} />
          </div>
          <div>
            <h1 class="panel-title">Create Custom View</h1>
            <div class="panel-subtitle">
              Define a new custom view with specific permissions
            </div>
          </div>
        </div>
        <div class="header-actions">
          <a href="/account-access/custom-views" class="btn-secondary">
            <ArrowLeft size={16} />
            Back
          </a>
        </div>
      </div>
    </div>

    <div class="panel-content">
      {#if error}
        <div class="error-message">
          <p>⚠️ {error}</p>
        </div>
      {/if}

      {#if submitError}
        <div class="error-message">
          <p>⚠️ {submitError}</p>
        </div>
      {/if}

      {#if submitSuccess}
        <div class="success-message">
          <p>✅ Custom view created successfully! Redirecting...</p>
        </div>
      {/if}

      {#if !hasApiAccess}
        <div class="error-message">
          <p>⚠️ No API access available. Please authenticate first.</p>
        </div>
      {:else}
        <form onsubmit={handleSubmit} class="form">
          <!-- Basic Information Section -->
          <section class="form-section">
            <h2 class="section-title">
              <Shield size={20} />
              Basic Information
            </h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="bank_id" class="form-label">
                  Bank <span class="required">*</span>
                </label>
                <select
                  id="bank_id"
                  class="form-select"
                  bind:value={formData.bank_id}
                  required
                >
                  <option value="">Select a bank...</option>
                  {#each banks as bank}
                    <option value={bank.id}>{bank.full_name || bank.id}</option>
                  {/each}
                </select>
              </div>

              <div class="form-group">
                <label for="metadata_view" class="form-label">
                  Metadata View
                </label>
                <input
                  type="text"
                  id="metadata_view"
                  class="form-input"
                  bind:value={formData.metadata_view}
                  placeholder="_0 (default)"
                />
                <p class="form-help">
                  Leave empty for default metadata view (_0)
                </p>
              </div>

              <div class="form-group full-width">
                <label for="name" class="form-label">
                  Name <span class="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  class="form-input"
                  bind:value={formData.name}
                  placeholder="e.g., Customer View, Auditor View"
                  required
                />
              </div>

              <div class="form-group full-width">
                <label for="description" class="form-label">
                  Description <span class="required">*</span>
                </label>
                <textarea
                  id="description"
                  class="form-textarea"
                  bind:value={formData.description}
                  placeholder="Describe the purpose of this custom view..."
                  rows="3"
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label for="which_alias_to_use" class="form-label">
                  Which Alias to Use
                </label>
                <input
                  type="text"
                  id="which_alias_to_use"
                  class="form-input"
                  bind:value={formData.which_alias_to_use}
                  placeholder="e.g., public, private"
                />
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    class="form-checkbox"
                    bind:checked={formData.is_public}
                  />
                  <span>Public View</span>
                </label>
                <p class="form-help">Make this view accessible to all users</p>
              </div>

              <div class="form-group full-width">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    class="form-checkbox"
                    bind:checked={formData.hide_metadata_if_alias_used}
                  />
                  <span>Hide Metadata if Alias Used</span>
                </label>
              </div>
            </div>
          </section>

          <!-- Transaction Permissions Section -->
          <section class="form-section">
            <div class="section-header">
              <h2 class="section-title">
                <Shield size={20} />
                Transaction Permissions
              </h2>
              <div class="section-actions">
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => selectAllInCategory(transactionPermissions)}
                >
                  Select All
                </button>
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => deselectAllInCategory(transactionPermissions)}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div class="permissions-grid">
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    transactionPermissions.can_see_transaction_this_bank_account
                  }
                />
                <span>This Bank Account</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    transactionPermissions.can_see_transaction_other_bank_account
                  }
                />
                <span>Other Bank Account</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    transactionPermissions.can_see_transaction_metadata
                  }
                />
                <span>Metadata</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    transactionPermissions.can_see_transaction_label
                  }
                />
                <span>Label</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    transactionPermissions.can_see_transaction_amount
                  }
                />
                <span>Amount</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={transactionPermissions.can_see_transaction_type}
                />
                <span>Type</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    transactionPermissions.can_see_transaction_currency
                  }
                />
                <span>Currency</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    transactionPermissions.can_see_transaction_start_date
                  }
                />
                <span>Start Date</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    transactionPermissions.can_see_transaction_finish_date
                  }
                />
                <span>Finish Date</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    transactionPermissions.can_see_transaction_balance
                  }
                />
                <span>Balance</span>
              </label>
            </div>
          </section>

          <!-- Account Permissions Section -->
          <section class="form-section">
            <div class="section-header">
              <h2 class="section-title">
                <Shield size={20} />
                Account Permissions
              </h2>
              <div class="section-actions">
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => selectAllInCategory(accountPermissions)}
                >
                  Select All
                </button>
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => deselectAllInCategory(accountPermissions)}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div class="permissions-grid">
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={accountPermissions.can_see_bank_account_owners}
                />
                <span>Owners</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={accountPermissions.can_see_bank_account_type}
                />
                <span>Type</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={accountPermissions.can_see_bank_account_balance}
                />
                <span>Balance</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    accountPermissions.can_see_bank_account_currency
                  }
                />
                <span>Currency</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={accountPermissions.can_see_bank_account_label}
                />
                <span>Label</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    accountPermissions.can_see_bank_account_national_identifier
                  }
                />
                <span>National Identifier</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    accountPermissions.can_see_bank_account_swift_bic
                  }
                />
                <span>SWIFT BIC</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={accountPermissions.can_see_bank_account_iban}
                />
                <span>IBAN</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={accountPermissions.can_see_bank_account_number}
                />
                <span>Number</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    accountPermissions.can_see_bank_account_bank_name
                  }
                />
                <span>Bank Name</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    accountPermissions.can_see_bank_account_credit_limit
                  }
                />
                <span>Credit Limit</span>
              </label>
            </div>
          </section>

          <!-- Counterparty Permissions Section -->
          <section class="form-section">
            <div class="section-header">
              <h2 class="section-title">
                <Shield size={20} />
                Counterparty Permissions
              </h2>
              <div class="section-actions">
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => selectAllInCategory(counterpartyPermissions)}
                >
                  Select All
                </button>
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => deselectAllInCategory(counterpartyPermissions)}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div class="permissions-grid">
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    counterpartyPermissions.can_see_other_account_national_identifier
                  }
                />
                <span>National Identifier</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    counterpartyPermissions.can_see_other_account_swift_bic
                  }
                />
                <span>SWIFT BIC</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    counterpartyPermissions.can_see_other_account_iban
                  }
                />
                <span>IBAN</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    counterpartyPermissions.can_see_other_account_bank_name
                  }
                />
                <span>Bank Name</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    counterpartyPermissions.can_see_other_account_number
                  }
                />
                <span>Number</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    counterpartyPermissions.can_see_other_account_metadata
                  }
                />
                <span>Metadata</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    counterpartyPermissions.can_see_other_account_kind
                  }
                />
                <span>Kind</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={counterpartyPermissions.can_see_public_alias}
                />
                <span>Public Alias</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={counterpartyPermissions.can_see_private_alias}
                />
                <span>Private Alias</span>
              </label>
            </div>
          </section>

          <!-- Other Permissions Section -->
          <section class="form-section">
            <div class="section-header">
              <h2 class="section-title">
                <Shield size={20} />
                Other Permissions
              </h2>
              <div class="section-actions">
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => selectAllInCategory(otherPermissions)}
                >
                  Select All
                </button>
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => deselectAllInCategory(otherPermissions)}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div class="permissions-grid">
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={otherPermissions.can_see_comments}
                />
                <span>Comments</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={otherPermissions.can_see_narrative}
                />
                <span>Narrative</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={otherPermissions.can_see_tags}
                />
                <span>Tags</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={otherPermissions.can_see_images}
                />
                <span>Images</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={otherPermissions.can_see_more_info}
                />
                <span>More Info</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={otherPermissions.can_see_url}
                />
                <span>URL</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={otherPermissions.can_see_image_url}
                />
                <span>Image URL</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={otherPermissions.can_see_where_tag}
                />
                <span>Where Tag</span>
              </label>
            </div>
          </section>

          <!-- Write Permissions Section -->
          <section class="form-section">
            <div class="section-header">
              <h2 class="section-title">
                <AlertCircle size={20} />
                Write Permissions
              </h2>
              <div class="section-actions">
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => selectAllInCategory(writePermissions)}
                >
                  Select All
                </button>
                <button
                  type="button"
                  class="btn-link"
                  onclick={() => deselectAllInCategory(writePermissions)}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div class="alert-warning">
              <AlertCircle size={16} />
              <span
                >Write permissions allow users to modify data. Use with caution.</span
              >
            </div>

            <div class="permissions-grid">
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={writePermissions.can_add_comment}
                />
                <span>Add Comment</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={writePermissions.can_delete_comment}
                />
                <span>Delete Comment</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={writePermissions.can_add_tag}
                />
                <span>Add Tag</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={writePermissions.can_delete_tag}
                />
                <span>Delete Tag</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={writePermissions.can_add_image}
                />
                <span>Add Image</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={writePermissions.can_delete_image}
                />
                <span>Delete Image</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={writePermissions.can_edit_narrative}
                />
                <span>Edit Narrative</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={writePermissions.can_create_counterparty}
                />
                <span>Create Counterparty</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    writePermissions.can_add_transaction_request_to_own_account
                  }
                />
                <span>Transaction Request (Own)</span>
              </label>
              <label class="permission-checkbox">
                <input
                  type="checkbox"
                  bind:checked={
                    writePermissions.can_add_transaction_request_to_any_account
                  }
                />
                <span>Transaction Request (Any)</span>
              </label>
            </div>
          </section>

          <!-- Validation Errors -->
          {#if validationErrors.length > 0}
            <div class="validation-errors">
              <h3>Please fix the following errors:</h3>
              <ul>
                {#each validationErrors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn-primary"
              disabled={!isValid || isSubmitting}
            >
              {#if isSubmitting}
                <span class="spinner">⏳</span>
                Creating...
              {:else}
                <Save size={18} />
                Create Custom View
              {/if}
            </button>
            <a href="/account-access/custom-views" class="btn-secondary">
              Cancel
            </a>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1400px;
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
    transition: color 0.2s;
  }

  .breadcrumb-link:hover {
    color: #2563eb;
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
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .panel-header {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
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
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  :global([data-mode="dark"]) .panel-title {
    color: var(--color-surface-100);
  }

  .panel-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }

  :global([data-mode="dark"]) .panel-subtitle {
    color: var(--color-surface-400);
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
  }

  .btn-secondary:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  :global([data-mode="dark"]) .btn-secondary {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-200);
    border-color: rgb(var(--color-surface-600));
  }

  :global([data-mode="dark"]) .btn-secondary:hover {
    background: rgb(var(--color-surface-600));
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

  .success-message {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #d1fae5;
    border: 1px solid #a7f3d0;
    border-radius: 6px;
    color: #065f46;
    font-size: 0.875rem;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .success-message {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.4);
    color: rgb(var(--color-success-200));
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .form-section {
    padding-bottom: 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-section:last-child {
    border-bottom: none;
  }

  :global([data-mode="dark"]) .form-section {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  :global([data-mode="dark"]) .section-title {
    color: var(--color-surface-100);
  }

  .section-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-link {
    background: none;
    border: none;
    color: #3b82f6;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    transition: color 0.2s;
  }

  .btn-link:hover {
    color: #2563eb;
    text-decoration: underline;
  }

  :global([data-mode="dark"]) .btn-link {
    color: rgb(var(--color-primary-400));
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  :global([data-mode="dark"]) .form-label {
    color: var(--color-surface-200);
  }

  .required {
    color: #ef4444;
  }

  .form-input,
  .form-select,
  .form-textarea {
    padding: 0.625rem 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s;
    background: white;
    color: #111827;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  :global([data-mode="dark"]) .form-input,
  :global([data-mode="dark"]) .form-select,
  :global([data-mode="dark"]) .form-textarea {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .form-input:focus,
  :global([data-mode="dark"]) .form-select:focus,
  :global([data-mode="dark"]) .form-textarea:focus {
    border-color: rgb(var(--color-primary-500));
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .form-textarea {
    resize: vertical;
    font-family: inherit;
  }

  .form-help {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
  }

  :global([data-mode="dark"]) .form-help {
    color: var(--color-surface-400);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
  }

  :global([data-mode="dark"]) .checkbox-label {
    color: var(--color-surface-200);
  }

  .form-checkbox {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }

  .permissions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .permission-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .permission-checkbox:hover {
    background: #f3f4f6;
    border-color: #3b82f6;
  }

  :global([data-mode="dark"]) .permission-checkbox {
    background: rgb(var(--color-surface-900));
    border-color: rgb(var(--color-surface-700));
    color: var(--color-surface-200);
  }

  :global([data-mode="dark"]) .permission-checkbox:hover {
    background: rgb(var(--color-surface-800));
    border-color: rgb(var(--color-primary-500));
  }

  .permission-checkbox input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }

  .alert-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 6px;
    color: #92400e;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  :global([data-mode="dark"]) .alert-warning {
    background: rgba(251, 191, 36, 0.2);
    border-color: rgba(251, 191, 36, 0.4);
    color: rgb(var(--color-warning-200));
  }

  .validation-errors {
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #991b1b;
  }

  :global([data-mode="dark"]) .validation-errors {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: rgb(var(--color-error-200));
  }

  .validation-errors h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .validation-errors ul {
    margin: 0;
    padding-left: 1.5rem;
    font-size: 0.875rem;
  }

  .validation-errors li {
    margin: 0.25rem 0;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .form-actions {
    border-top-color: rgb(var(--color-surface-700));
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-primary {
    background: rgb(var(--color-primary-600));
  }

  :global([data-mode="dark"]) .btn-primary:hover:not(:disabled) {
    background: rgb(var(--color-primary-500));
  }

  .spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .header-left {
      width: 100%;
    }

    .header-actions {
      width: 100%;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .permissions-grid {
      grid-template-columns: 1fr;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
