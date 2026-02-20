<script lang="ts">
  import { page } from "$app/state";
  import PageRoleCheck from "$lib/components/PageRoleCheck.svelte";
  import { SITE_MAP } from "$lib/utils/roleChecker";

  let { data, children } = $props();

  let routeKey = $derived(page.route.id?.replace("/(protected)", "") || "");
  let pageRoles = $derived(SITE_MAP[routeKey]);
</script>

{#if pageRoles}
  <PageRoleCheck
    userEntitlements={data.userEntitlements}
    required={pageRoles.required}
    optional={pageRoles.optional}
  >
    {@render children()}
  </PageRoleCheck>
{:else}
  {@render children()}
{/if}
