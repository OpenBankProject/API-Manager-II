<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import PageRoleCheck from "$lib/components/PageRoleCheck.svelte";
  import {
    extractErrorFromResponse,
    formatErrorForDisplay,
    logErrorDetails,
  } from "$lib/utils/errorHandler";

  let { data }: { data: PageData } = $props();

  // Form states
  let formName = $state("");
  let formDescription = $state("");
  let formMetadataView = $state("");
  let formIsPublic = $state(false);
  let formWhichAliasToUse = $state("public");
  let formHideMetadataIfAliasUsed = $state(false);
  let formError = $state("");
  let isSubmitting = $state(false);

  // All possible allowed actions
  const allAllowedActions = [
    "can_edit_owner_comment",
    "can_see_transaction_this_bank_account",
    "can_see_transaction_other_bank_account",
    "can_see_transaction_metadata",
    "can_see_transaction_amount",
    "can_see_transaction_type",
    "can_see_transaction_currency",
    "can_see_transaction_start_date",
    "can_see_transaction_finish_date",
    "can_see_transaction_balance",
    "can_see_comments",
    "can_see_tags",
    "can_see_images",
    "can_see_bank_account_owners",
    "can_see_bank_account_type",
    "can_see_bank_account_balance",
    "can_see_bank_account_currency",
    "can_see_bank_account_label",
    "can_see_bank_account_national_identifier",
    "can_see_bank_account_swift_bic",
    "can_see_bank_account_iban",
    "can_see_bank_account_number",
    "can_see_bank_account_bank_name",
    "can_see_other_account_national_identifier",
    "can_see_other_account_swift_bic",
    "can_see_other_account_iban",
    "can_see_other_account_bank_name",
    "can_see_other_account_number",
    "can_see_other_account_metadata",
    "can_see_other_account_kind",
    "can_see_more_info",
    "can_see_url",
    "can_see_image_url",
    "can_see_open_corporates_url",
    "can_see_corporate_location",
    "can_see_physical_location",
    "can_see_public_alias",
    "can_see_private_alias",
    "can_add_more_info",
    "can_add_url",
    "can_add_image_url",
    "can_add_open_corporates_url",
    "can_add_corporate_location",
    "can_add_physical_location",
    "can_add_public_alias",
    "can_add_private_alias",
    "can_delete_corporate_location",
    "can_delete_physical_location",
    "can_add_comment",
    "can_delete_comment",
    "can_add_tag",
    "can_delete_tag",
    "can_add_image",
    "can_delete_image",
    "can_add_where_tag",
    "can_see_where_tag",
    "can_delete_where_tag",
    "can_see_bank_routing_scheme",
    "can_see_bank_routing_address",
    "can_see_bank_account_routing_scheme",
    "can_see_bank_account_routing_address",
    "can_see_other_bank_routing_scheme",
    "can_see_other_bank_routing_address",
    "can_see_other_account_routing_scheme",
    "can_see_other_account_routing_address",
    "can_query_available_funds",
    "can_add_transaction_request_to_own_account",
    "can_add_transaction_request_to_any_account",
    "can_see_bank_account_credit_limit",
    "can_create_direct_debit",
    "can_create_standing_order",
    "can_see_transaction_request_types",
    "can_see_transaction_requests",
    "can_see_available_views_for_bank_account",
    "can_update_bank_account_label",
    "can_create_custom_view",
    "can_delete_custom_view",
    "can_update_custom_view",
    "can_see_views_with_permissions_for_one_user",
    "can_see_views_with_permissions_for_all_users",
    "can_grant_access_to_custom_views",
    "can_revoke_access_to_custom_views",
    "can_see_transaction_status",
  ];

  let selectedActions = $state<string[]>([]);
  let grantAccessViews = $state("");
  let revokeAccessViews = $state("");

  function toggleAction(action: string) {
    if (selectedActions.includes(action)) {
      selectedActions = selectedActions.filter((a) => a !== action);
    } else {
      selectedActions = [...selectedActions, action];
    }
  }

  function selectAllActions() {
    selectedActions = [...allAllowedActions];
  }

  function deselectAllActions() {
    selectedActions = [];
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!formName.trim()) {
      formError = "View name is required";
      return;
    }

    if (!formDescription.trim()) {
      formError = "Description is required";
      return;
    }

    isSubmitting = true;
    formError = "";

    try {
      const requestBody: any = {
        name: formName,
        description: formDescription,
        metadata_view: formMetadataView || formDescription,
        is_public: formIsPublic,
        which_alias_to_use: formWhichAliasToUse,
        hide_metadata_if_alias_used: formHideMetadataIfAliasUsed,
        allowed_actions: selectedActions,
      };

      // Add grant/revoke access views if provided
      if (grantAccessViews.trim()) {
        requestBody.can_grant_access_to_views = grantAccessViews
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v);
      }

      if (revokeAccessViews.trim()) {
        requestBody.can_revoke_access_to_views = revokeAccessViews
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v);
      }

      const response = await fetch("/api/system-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to create system view",
        );
        logErrorDetails("Create System View", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);

        throw new Error(errorMessage);
      }

      // Success - redirect back to the system views list
      goto("/account-access/system-views");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create system view";
      formError = errorMsg;
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto("/account-access/system-views");
  }
</script>

<svelte:head>
  <title>Create System View - API Manager II</title>
</svelte:head>

<PageRoleCheck
  userEntitlements={data.userEntitlements}
  requiredRoles={data.requiredRoles}
>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Create System View
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Create a new system view to control account data visibility
      </p>
    </div>

    <div class="mx-auto max-w-4xl">
      <div
        class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 dark:shadow-gray-900/50"
      >
        {#if formError}
          <div
            class="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
          >
            <p class="text-sm text-red-800 dark:text-red-200">{formError}</p>
          </div>
        {/if}

        <form onsubmit={handleSubmit}>
          <div class="space-y-6">
            <!-- Name Field -->
            <div>
              <label
                for="name"
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                View Name <span class="text-red-600">*</span>
              </label>
              <input
                id="name"
                type="text"
                bind:value={formName}
                required
                placeholder="e.g., owner"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
              />
            </div>

            <!-- Description Field -->
            <div>
              <label
                for="description"
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description <span class="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                bind:value={formDescription}
                required
                rows="3"
                placeholder="Describe the purpose and scope of this view"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
              ></textarea>
            </div>

            <!-- Metadata View Field -->
            <div>
              <label
                for="metadata_view"
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Metadata View
              </label>
              <textarea
                id="metadata_view"
                bind:value={formMetadataView}
                rows="2"
                placeholder="Optional metadata description (defaults to description)"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
              ></textarea>
            </div>

            <!-- Two Column Layout for Settings -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <!-- Is Public -->
              <div>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    bind:checked={formIsPublic}
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span
                    class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Public View
                  </span>
                </label>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Accessible to all users
                </p>
              </div>

              <!-- Hide Metadata If Alias Used -->
              <div>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    bind:checked={formHideMetadataIfAliasUsed}
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span
                    class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Hide Metadata If Alias Used
                  </span>
                </label>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Hide metadata when alias is shown
                </p>
              </div>
            </div>

            <!-- Which Alias to Use -->
            <div>
              <label
                for="alias"
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Which Alias to Use
              </label>
              <select
                id="alias"
                bind:value={formWhichAliasToUse}
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="none">None</option>
              </select>
            </div>

            <!-- Grant Access to Views -->
            <div>
              <label
                for="grant_access"
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Can Grant Access to Views
              </label>
              <input
                id="grant_access"
                type="text"
                bind:value={grantAccessViews}
                placeholder="e.g., owner, public (comma-separated)"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Comma-separated list of views
              </p>
            </div>

            <!-- Revoke Access to Views -->
            <div>
              <label
                for="revoke_access"
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Can Revoke Access to Views
              </label>
              <input
                id="revoke_access"
                type="text"
                bind:value={revokeAccessViews}
                placeholder="e.g., owner, public (comma-separated)"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Comma-separated list of views
              </p>
            </div>

            <!-- Allowed Actions -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Allowed Actions ({selectedActions.length} selected)
                </label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onclick={selectAllActions}
                    class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onclick={deselectAllActions}
                    class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div
                class="max-h-96 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900"
              >
                <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {#each allAllowedActions as action}
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedActions.includes(action)}
                        onchange={() => toggleAction(action)}
                        class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span
                        class="ml-2 text-xs text-gray-700 dark:text-gray-300"
                      >
                        {action}
                      </span>
                    </label>
                  {/each}
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onclick={handleCancel}
              disabled={isSubmitting}
              class="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {#if isSubmitting}
                <span class="flex items-center">
                  <svg
                    class="mr-2 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </span>
              {:else}
                Create System View
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</PageRoleCheck>
