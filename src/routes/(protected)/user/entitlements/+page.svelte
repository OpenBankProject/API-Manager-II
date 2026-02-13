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

  // Split entitlements into system-wide and bank-level (for current bank)
  let systemEntitlements = $derived(
    userEntitlements.filter((e: any) => !e.bank_id),
  );

  let bankEntitlements = $derived(
    userEntitlements.filter(
      (e: any) => e.bank_id && e.bank_id === currentBank.bankId,
    ),
  );

  let otherBankEntitlementCount = $derived(
    userEntitlements.filter(
      (e: any) => e.bank_id && e.bank_id !== currentBank.bankId,
    ).length,
  );
</script>

<div class="columns-grid mb-6">
  <!-- System-wide Roles -->
  <div class="section">
    <div class="section-header">
      <Globe size={18} />
      <h3 class="section-title">System-wide Roles</h3>
      <span class="section-count">{systemEntitlements.length}</span>
    </div>
    {#if systemEntitlements.length > 0}
      <ul class="role-list">
        {#each systemEntitlements as row}
          <li class="role-item">
            <span class="role-name">{row.role_name}</span>
            <button
              class="copy-btn"
              onclick={() =>
                copyToClipboard(row.role_name, row.entitlement_id, row.bank_id, row.entitlement_id)}
              title="Copy entitlement details"
            >
              {#if copiedId === row.entitlement_id}
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              {:else}
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty-text">No system-wide roles</p>
    {/if}
  </div>

  <!-- Bank-level Roles -->
  <div class="section">
    <div class="section-header">
      <Building2 size={18} />
      <h3 class="section-title">Bank Roles: {currentBank.bankId || "—"}</h3>
      <span class="section-count">{bankEntitlements.length}</span>
    </div>
    {#if bankEntitlements.length > 0}
      <ul class="role-list">
        {#each bankEntitlements as row}
          <li class="role-item">
            <span class="role-name">{row.role_name}</span>
            <button
              class="copy-btn"
              onclick={() =>
                copyToClipboard(row.role_name, row.entitlement_id, row.bank_id, row.entitlement_id)}
              title="Copy entitlement details"
            >
              {#if copiedId === row.entitlement_id}
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              {:else}
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty-text">No bank-level roles for this bank</p>
    {/if}
    {#if otherBankEntitlementCount > 0}
      <p class="other-banks-note">
        +{otherBankEntitlementCount} role{otherBankEntitlementCount === 1 ? "" : "s"} at other banks (switch bank to view)
      </p>
    {/if}
  </div>
</div>

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

    <!-- Bank ID info -->
    {#if selectedRoleRequiresBank}
      <div class="scope-info">
        <Building2 size={16} />
        <span>Bank-level role — using current bank: <strong>{selectedBankId || "none selected"}</strong></span>
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
  .columns-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: start;
  }

  @media (max-width: 768px) {
    .columns-grid {
      grid-template-columns: 1fr;
    }
  }

  .section {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  :global([data-mode="dark"]) .section {
    background: rgb(var(--color-surface-800));
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .section-header {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  :global([data-mode="dark"]) .section-title {
    color: var(--color-surface-100);
  }

  .section-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.25rem;
    background: #f3f4f6;
    color: #6b7280;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .section-count {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-300);
  }

  .role-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .role-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .role-item:last-child {
    border-bottom: none;
  }

  :global([data-mode="dark"]) .role-item {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .role-name {
    font-size: 0.8rem;
    color: #111827;
  }

  :global([data-mode="dark"]) .role-name {
    color: var(--color-surface-100);
  }

  .copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    color: #9ca3af;
    background: none;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: color 0.2s;
  }

  .copy-btn:hover {
    color: #374151;
  }

  :global([data-mode="dark"]) .copy-btn {
    color: var(--color-surface-500);
  }

  :global([data-mode="dark"]) .copy-btn:hover {
    color: var(--color-surface-200);
  }

  .empty-text {
    padding: 1.5rem;
    text-align: center;
    color: #6b7280;
    font-size: 0.8rem;
  }

  :global([data-mode="dark"]) .empty-text {
    color: var(--color-surface-400);
  }

  .other-banks-note {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: #6b7280;
    border-top: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .other-banks-note {
    color: var(--color-surface-400);
    border-top-color: rgb(var(--color-surface-700));
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
