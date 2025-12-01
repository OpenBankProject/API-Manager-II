<script lang="ts">
  import { goto } from "$app/navigation";
  import { User, KeyRound, Building2, Search } from "@lucide/svelte";
  import { toast } from "$lib/utils/toastService";
  import PageRoleCheck from "$lib/components/PageRoleCheck.svelte";
  import type { PageData } from "./$types";

  let { data } = $props<{ data: PageData }>();

  let userEntitlements = $derived(data.userEntitlements || []);
  let requiredRoles = $derived(data.requiredRoles || []);
  let roles = $derived(data.roles || []);

  // Form state
  let userId = $state("");
  let roleName = $state("");
  let bankId = $state("");
  let isSubmitting = $state(false);
  let searchQuery = $state("");

  // Filter roles based on search
  let filteredRoles = $derived.by(() => {
    if (!searchQuery.trim()) return roles;
    const query = searchQuery.toLowerCase();
    return roles.filter((role: any) =>
      role.role.toLowerCase().includes(query),
    );
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!userId.trim()) {
      toast.error("Validation Error", "User ID is required");
      return;
    }

    if (!roleName) {
      toast.error("Validation Error", "Role is required");
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch("/api/rbac/entitlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId.trim(),
          role_name: roleName,
          bank_id: bankId.trim() || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create entitlement");
      }

      toast.success(
        "Entitlement Created",
        `Successfully granted ${roleName} to user ${userId}`,
      );

      // Redirect to entitlements list after short delay
      setTimeout(() => {
        goto("/rbac/entitlements");
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create entitlement";
      toast.error("Error", errorMessage);
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto("/rbac/entitlements");
  }
</script>

<svelte:head>
  <title>Create Entitlement - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Role Check - Display missing roles upfront -->
  <PageRoleCheck {userEntitlements} {requiredRoles} />

  <!-- Breadcrumb -->
  <nav class="breadcrumb mb-6">
    <a href="/rbac/entitlements" class="breadcrumb-link">Entitlements</a>
    <span class="breadcrumb-separator">/</span>
    <span class="breadcrumb-current">Create</span>
  </nav>

  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">➕</div>
        <div>
          <h1 class="panel-title">Create Entitlement</h1>
          <div class="panel-subtitle">
            Grant a role to a user for system-wide or bank-specific access
          </div>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <form onsubmit={handleSubmit} class="form">
        <!-- User ID Field -->
        <div class="form-group">
          <label for="user-id" class="form-label">
            <User size={18} />
            User ID
            <span class="required">*</span>
          </label>
          <input
            type="text"
            id="user-id"
            class="form-input"
            placeholder="Enter user ID (e.g., c7b6cb47-cb96-4441-8801-35b57456753a)"
            bind:value={userId}
            disabled={isSubmitting}
            required
          />
          <div class="form-hint">
            The unique identifier of the user to grant the entitlement to
          </div>
        </div>

        <!-- Role Selection Field -->
        <div class="form-group">
          <label for="role-name" class="form-label">
            <KeyRound size={18} />
            Role
            <span class="required">*</span>
          </label>

          <!-- Search Box -->
          <div class="search-wrapper">
            <Search class="search-icon" size={16} />
            <input
              type="text"
              class="search-input"
              placeholder="Search roles..."
              bind:value={searchQuery}
              disabled={isSubmitting}
            />
          </div>

          <!-- Role Selection -->
          <div class="role-selector">
            {#if filteredRoles.length === 0}
              <div class="empty-roles">
                <p>No roles found matching "{searchQuery}"</p>
              </div>
            {:else}
              <div class="roles-grid">
                {#each filteredRoles as role}
                  <label class="role-option">
                    <input
                      type="radio"
                      name="role"
                      value={role.role}
                      bind:group={roleName}
                      disabled={isSubmitting}
                    />
                    <div class="role-option-content">
                      <span class="role-option-name">{role.role}</span>
                      {#if role.entitlement_count !== undefined}
                        <span class="role-option-count">
                          {role.entitlement_count}
                          {role.entitlement_count === 1 ? "user" : "users"}
                        </span>
                      {/if}
                    </div>
                  </label>
                {/each}
              </div>
            {/if}
          </div>
          <div class="form-hint">Select the role to grant to the user</div>
        </div>

        <!-- Bank ID Field -->
        <div class="form-group">
          <label for="bank-id" class="form-label">
            <Building2 size={18} />
            Bank ID
            <span class="optional">(Optional)</span>
          </label>
          <input
            type="text"
            id="bank-id"
            class="form-input"
            placeholder="Leave empty for system-wide access (e.g., gh.29.uk)"
            bind:value={bankId}
            disabled={isSubmitting}
          />
          <div class="form-hint">
            Leave empty for system-wide roles, or specify a bank ID for
            bank-specific roles
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            onclick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" class="btn-primary" disabled={isSubmitting}>
            {#if isSubmitting}
              <span class="spinner">⏳</span>
              Creating...
            {:else}
              Create Entitlement
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 900px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .breadcrumb-link {
    color: #667eea;
    text-decoration: none;
    transition: color 0.2s;
  }

  .breadcrumb-link:hover {
    color: #5568d3;
    text-decoration: underline;
  }

  :global([data-mode="dark"]) .breadcrumb-link {
    color: rgb(var(--color-primary-400));
  }

  .breadcrumb-separator {
    color: #9ca3af;
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
    gap: 1.5rem;
  }

  .header-icon {
    font-size: 2.5rem;
  }

  .panel-title {
    font-size: 1.875rem;
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

  .panel-content {
    padding: 2rem;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
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
    color: #ef4444;
  }

  .optional {
    color: #9ca3af;
    font-weight: 400;
  }

  .form-input {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
  }

  :global([data-mode="dark"]) .form-input {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .form-input:focus {
    border-color: rgb(var(--color-primary-500));
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  :global([data-mode="dark"]) .form-input:disabled {
    background: rgb(var(--color-surface-800));
  }

  .form-hint {
    font-size: 0.75rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .form-hint {
    color: var(--color-surface-400);
  }

  .search-wrapper {
    position: relative;
    margin-bottom: 1rem;
  }

  .search-wrapper :global(.search-icon) {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 0.75rem 0.625rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  :global([data-mode="dark"]) .search-input {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  .role-selector {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem;
  }

  :global([data-mode="dark"]) .role-selector {
    border-color: rgb(var(--color-surface-700));
  }

  .roles-grid {
    display: grid;
    gap: 0.5rem;
  }

  .role-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .role-option:has(input:checked) {
    background: #ede9fe;
    border-color: #667eea;
  }

  .role-option:hover {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .role-option {
    border-color: rgb(var(--color-surface-700));
  }

  :global([data-mode="dark"]) .role-option:has(input:checked) {
    background: rgba(102, 126, 234, 0.15);
    border-color: rgb(var(--color-primary-500));
  }

  :global([data-mode="dark"]) .role-option:hover {
    background: rgb(var(--color-surface-700));
  }

  .role-option input[type="radio"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .role-option-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .role-option-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  }

  :global([data-mode="dark"]) .role-option-name {
    color: var(--color-surface-100);
  }

  .role-option-count {
    font-size: 0.75rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .role-option-count {
    color: var(--color-surface-400);
  }

  .empty-roles {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .empty-roles {
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

  .btn-secondary,
  .btn-primary {
    display: flex;
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

  .btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .btn-secondary {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-200);
    border-color: rgb(var(--color-surface-600));
  }

  :global([data-mode="dark"]) .btn-secondary:hover:not(:disabled) {
    background: rgb(var(--color-surface-600));
  }

  .btn-primary {
    background: #667eea;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #5568d3;
  }

  :global([data-mode="dark"]) .btn-primary {
    background: rgb(var(--color-primary-600));
  }

  :global([data-mode="dark"]) .btn-primary:hover:not(:disabled) {
    background: rgb(var(--color-primary-500));
  }

  .btn-secondary:disabled,
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
    .panel-header {
      padding: 1.5rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .panel-content {
      padding: 1.5rem;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .btn-secondary,
    .btn-primary {
      width: 100%;
      justify-content: center;
    }
  }
</style>
