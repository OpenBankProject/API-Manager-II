<script lang="ts">
  import { currentBank } from "$lib/stores/currentBank.svelte";
  import { Building2, Globe, KeyRound } from "@lucide/svelte";
  import RoleSearchWidget from "$lib/components/RoleSearchWidget.svelte";

  const { data, form } = $props();
  const userEntitlements = data.userEntitlements;
  const allEntitlements = data.allAvailableEntitlements;
  const allBanks = data.allBanks;

  let copiedId = $state<string | null>(null);

  async function copyToClipboard(
    roleName: string,
    entitlementId: string,
    bankId: string,
    id: string,
  ) {
    const textToCopy = `Role: ${roleName}\nEntitlement ID: ${entitlementId}\nBank ID: ${bankId}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      copiedId = id;
      setTimeout(() => {
        copiedId = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  const canCreateEntitlements = userEntitlements.some((entitlement: any) =>
    ["CanCreateEntitlementAtAnyBank", "CanCreateEntitlementAtOneBank"].includes(
      entitlement.role_name,
    ),
  );

  let selectedEntitlementRole = $state("");
  let roleScope = $state<"all" | "system" | "bank">("all");
  let selectedBankId = $state(currentBank.bankId);

  // Determine if selected role requires bank_id
  let selectedRoleRequiresBank = $derived.by(() => {
    if (selectedEntitlementRole) {
      const role = allEntitlements.find((r: any) => r.role === selectedEntitlementRole);
      if (role) return role.requires_bank_id;
    }
    // When no role selected yet, use scope as hint
    return roleScope === "bank";
  });

  // Sync bankId based on whether the role needs a bank
  $effect(() => {
    if (selectedRoleRequiresBank) {
      selectedBankId = currentBank.bankId;
    } else {
      selectedBankId = "";
    }
  });

  // Pre-select entitlement if form data exists (on validation errors)
  if (form?.entitlement && !form?.success) {
    selectedEntitlementRole = String(form.entitlement);
  }

  if (form?.bank_id && !form?.success) {
    selectedBankId = String(form.bank_id);
  }

  // Reset form on success
  if (form?.success) {
    selectedEntitlementRole = "";
  }
</script>

<h2 class="mb-4 text-xl font-semibold">Your Entitlements</h2>

{#if userEntitlements.length > 0}
  <div class="table-container">
    <!-- Native Table Element -->
    <table class="table-hover table">
      <thead>
        <tr>
          <th>Name</th>
          <th>ID</th>
          <th>Bank ID</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each userEntitlements as row, i}
          <tr>
            <td>{row.role_name}</td>
            <td>{row.entitlement_id}</td>
            <td>{row.bank_id}</td>
            <td>
              <button
                class="btn btn-sm variant-ghost-surface"
                onclick={() =>
                  copyToClipboard(
                    row.role_name,
                    row.entitlement_id,
                    row.bank_id,
                    row.entitlement_id,
                  )}
                title="Copy entitlement details"
              >
                {#if copiedId === row.entitlement_id}
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                {:else}
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    ></path>
                  </svg>
                {/if}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

{#if canCreateEntitlements}
  <h2 class="mt-8 mb-4 text-xl font-semibold">Add New Entitlement</h2>

  {#if form?.success}
    <div class="alert variant-filled-success mb-4">
      <p>{form.message}</p>
    </div>
  {/if}

  <form
    method="POST"
    action="?/create"
    class="w-full max-w-2xl space-y-4"
  >
    <!-- Hidden inputs for form submission -->
    <input type="hidden" name="entitlement" value={selectedEntitlementRole} />
    {#if selectedRoleRequiresBank}
      <input type="hidden" name="bank_id" value={selectedBankId} />
    {/if}

    <div class="form-group">
      <label class="form-label">
        <KeyRound size={18} />
        <span>Select Role</span>
      </label>
      <RoleSearchWidget
        roles={allEntitlements}
        bind:selectedRole={selectedEntitlementRole}
        bind:roleScope
      />
    </div>

    {#if form?.missing}<p class="text-error-500 text-xs">
        Please select an entitlement to add.
      </p>{/if}
    {#if form?.error}<p class="text-error-500 text-xs">{form.error}</p>{/if}

    <!-- Bank ID Field (shown for bank-level roles) -->
    {#if selectedRoleRequiresBank}
      <div class="form-group">
        <label for="bank-id-input" class="form-label">
          <Building2 size={18} />
          <span>Bank ID</span>
        </label>
        <input
          type="text"
          id="bank-id-input"
          class="form-input"
          bind:value={selectedBankId}
          placeholder="Enter bank ID"
        />
        <div class="form-hint">
          The bank to scope this entitlement to
        </div>
      </div>
    {:else if selectedEntitlementRole}
      <div class="scope-info">
        <Globe size={16} />
        <span>This is a system-wide role — no bank ID required</span>
      </div>
    {/if}

    <button class="btn preset-outlined-tertiary-500" type="submit"
      >Add Entitlement</button
    >
  </form>
{:else if !canCreateEntitlements}
  <h2 class="mt-8 mb-4 text-xl font-semibold">Request Entitlement</h2>
{/if}

<style>
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

  .form-input {
    width: 100%;
    padding: 0.625rem 0.75rem;
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

  :global([data-mode="dark"]) .form-input {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .form-input:focus {
    border-color: rgb(var(--color-primary-500));
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  .form-hint {
    font-size: 0.75rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .form-hint {
    color: var(--color-surface-400);
  }

  .scope-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #0369a1;
  }

  :global([data-mode="dark"]) .scope-info {
    background: rgba(14, 165, 233, 0.1);
    border-color: rgba(14, 165, 233, 0.3);
    color: rgb(var(--color-primary-300));
  }
</style>
