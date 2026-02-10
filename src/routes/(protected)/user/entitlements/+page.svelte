<script lang="ts">
  import { currentBank } from "$lib/stores/currentBank.svelte";

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
  let selectedBankId = $state(currentBank.bankId);

  $effect(() => {
    selectedBankId = currentBank.bankId;
  });

  // Derived state to get the full entitlement object
  let selectedEntitlement = $derived(
    allEntitlements.find((ent) => ent.role === selectedEntitlementRole) || {
      role: "",
      requires_bank_id: false,
    },
  );

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

  // console.debug('User Entitlements:', userEntitlements);
  // console.debug('All Entitlements:', allEntitlements);
  console.log("Can Create Entitlements:", canCreateEntitlements);
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
    class="mx-auto w-full max-w-md space-y-4"
  >
    <label class="label">
      <span class="label-text">Select Entitlement</span>
      <select
        class="select"
        name="entitlement"
        bind:value={selectedEntitlementRole}
      >
        <option value="" disabled>Select an entitlement</option>
        {#each allEntitlements as ent}
          <option value={ent.role}>{ent.role}</option>
        {/each}
      </select>
    </label>

    {#if form?.missing}<p class="text-error-500 text-xs">
        Please select an entitlement to add.
      </p>{/if}
    {#if form?.error}<p class="text-error-500 text-xs">{form.error}</p>{/if}

    {#if selectedEntitlement.requires_bank_id}
      <input type="hidden" name="bank_id" value={selectedBankId} />
      <div class="label">
        <span class="label-text">Bank</span>
        {#if selectedBankId}
          <div class="rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {selectedBankId}
          </div>
        {:else}
          <p class="text-sm text-amber-600 dark:text-amber-400">
            Please select a bank in <a href="/user" class="underline">My Account</a> first.
          </p>
        {/if}
      </div>
    {/if}
    <button class="btn preset-outlined-tertiary-500" type="submit"
      >Add Entitlement</button
    >
  </form>
{:else if !canCreateEntitlements}
  <h2 class="mt-8 mb-4 text-xl font-semibold">Request Entitlement</h2>
{/if}
