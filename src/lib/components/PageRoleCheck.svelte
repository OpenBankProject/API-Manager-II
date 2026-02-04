<script lang="ts">
  import MissingRoleAlert from "$lib/components/MissingRoleAlert.svelte";
  import type { RoleRequirement } from "$lib/utils/roleChecker";
  import { checkRoles } from "$lib/utils/roleChecker";
  import type { Snippet } from "svelte";

  interface Props {
    userEntitlements: any[];
    requiredRoles: RoleRequirement[];
    children?: Snippet;
  }

  let { userEntitlements, requiredRoles, children }: Props = $props();

  // Check which roles are missing
  let roleCheck = $derived.by(() => {
    return checkRoles(userEntitlements || [], requiredRoles);
  });

  // Get just the first missing role (so request entitlement button can request a single role)
  let firstMissingRole = $derived(roleCheck.missingRoles[0] || null);

  // Determine if we should show content or only alerts
  let showContent = $derived(roleCheck.hasAllRoles);
</script>

{#if firstMissingRole}
  <div class="role-alerts">
    <MissingRoleAlert
      roles={[firstMissingRole.role]}
      bankId={firstMissingRole.bankId || undefined}
      message={`You need the following role to ${firstMissingRole.action || "access this page"}: ${firstMissingRole.role}`}
    />
  </div>
{/if}

{#if showContent && children}
  {@render children()}
{/if}

<style>
  .role-alerts {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
</style>
