<script lang="ts">
  import MissingRoleAlert from "$lib/components/MissingRoleAlert.svelte";
  import type { RoleRequirement } from "$lib/utils/roleChecker";
  import { checkRoles, groupMissingRolesByBank } from "$lib/utils/roleChecker";
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

  // Group missing roles by bank for display
  let groupedMissingRoles = $derived.by(() => {
    return groupMissingRolesByBank(roleCheck.missingRoles);
  });

  // Determine if we should show content or only alerts
  let showContent = $derived(roleCheck.hasAllRoles);
</script>

{#if roleCheck.missingRoles.length > 0}
  <div class="role-alerts">
    {#each Array.from(groupedMissingRoles.entries()) as [bankKey, roles]}
      <MissingRoleAlert
        roles={roles.map((r) => r.role)}
        bankId={bankKey === "system-wide" ? undefined : bankKey}
        message={roles.length === 1
          ? `You need the following role to ${roles[0].action || "perform this action"}: ${roles[0].role}`
          : `You need the following roles for this page: ${roles.map((r) => r.role).join(", ")}`}
      />
    {/each}
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
