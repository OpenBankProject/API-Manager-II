<script lang="ts">
  import { PAGE_ROLES, checkRoles } from "$lib/utils/roleChecker";
  import type { UserEntitlement, RoleRequirement } from "$lib/utils/roleChecker";
  import { Check, X, Search } from "@lucide/svelte";

  const { data } = $props();

  let userEntitlements: UserEntitlement[] = $derived(data.userEntitlements);
  let searchQuery = $state("");

  // Section grouping based on route prefix
  const SECTION_ORDER = [
    { key: "rbac", label: "RBAC", prefix: "/rbac/" },
    { key: "system", label: "System", prefix: "/system/" },
    { key: "consumers", label: "Consumers", prefix: "/consumers" },
    { key: "metrics", label: "Metrics", prefix: "/connector-" },
    { key: "abac", label: "ABAC", prefix: "/abac/" },
    { key: "account-access", label: "Account Access", prefix: "/account-access/" },
    { key: "users", label: "Users", prefix: "/users" },
    { key: "dynamic-entities", label: "Dynamic Entities", prefix: "/dynamic-entities/" },
  ];

  function getSection(route: string): string {
    for (const s of SECTION_ORDER) {
      if (route.startsWith(s.prefix)) return s.key;
    }
    return "other";
  }

  function hasRole(role: RoleRequirement): boolean {
    return userEntitlements.some((e) => {
      if (e.role_name !== role.role) return false;
      if (role.bankId) return e.bank_id === role.bankId;
      return true;
    });
  }

  interface PageEntry {
    route: string;
    required: RoleRequirement[];
    optional: RoleRequirement[];
    accessible: boolean;
  }

  let allPages: PageEntry[] = $derived(
    Object.entries(PAGE_ROLES).map(([route, config]) => {
      const result = checkRoles(userEntitlements, config.required);
      return {
        route,
        required: config.required,
        optional: config.optional || [],
        accessible: result.hasAllRoles,
      };
    })
  );

  let filteredPages = $derived(
    searchQuery.trim() === ""
      ? allPages
      : allPages.filter((p) => {
          const q = searchQuery.toLowerCase();
          if (p.route.toLowerCase().includes(q)) return true;
          if (p.required.some((r) => r.role.toLowerCase().includes(q))) return true;
          if (p.optional.some((r) => r.role.toLowerCase().includes(q))) return true;
          return false;
        })
  );

  let groupedPages = $derived.by(() => {
    const groups: Record<string, PageEntry[]> = {};
    for (const p of filteredPages) {
      const section = getSection(p.route);
      if (!groups[section]) groups[section] = [];
      groups[section].push(p);
    }
    return groups;
  });

  // Ordered section keys for display
  let orderedSections = $derived(
    [...SECTION_ORDER.map((s) => s.key), "other"].filter((k) => groupedPages[k]?.length)
  );

  function sectionLabel(key: string): string {
    const found = SECTION_ORDER.find((s) => s.key === key);
    return found ? found.label : "Other";
  }

  // Summary counts
  let totalPages = $derived(filteredPages.length);
  let accessiblePages = $derived(filteredPages.filter((p) => p.accessible).length);
  let blockedPages = $derived(totalPages - accessiblePages);
</script>

<!-- Summary -->
<div class="summary-bar">
  <div class="summary-item">
    <span class="summary-count">{totalPages}</span>
    <span class="summary-label">Total pages</span>
  </div>
  <div class="summary-item accessible">
    <span class="summary-count">{accessiblePages}</span>
    <span class="summary-label">Accessible</span>
  </div>
  <div class="summary-item blocked">
    <span class="summary-count">{blockedPages}</span>
    <span class="summary-label">Blocked</span>
  </div>
</div>

<!-- Search -->
<div class="search-box">
  <Search size={16} />
  <input
    type="text"
    placeholder="Filter by route or role name..."
    bind:value={searchQuery}
  />
</div>

<!-- Grouped pages -->
{#each orderedSections as sectionKey}
  <div class="section">
    <div class="section-header">
      <h3 class="section-title">{sectionLabel(sectionKey)}</h3>
      <span class="section-count">{groupedPages[sectionKey].length}</span>
    </div>

    <div class="page-list">
      {#each groupedPages[sectionKey] as entry}
        <div class="page-entry" class:blocked={!entry.accessible}>
          <a href={entry.route} class="route-link">
            {entry.route}
          </a>
          <div class="roles-list">
            {#each entry.required as role}
              <span class="role-badge" class:has={hasRole(role)} class:missing={!hasRole(role)}>
                {#if hasRole(role)}
                  <Check size={12} />
                {:else}
                  <X size={12} />
                {/if}
                {role.role}
              </span>
            {/each}
            {#each entry.optional as role}
              <span class="role-badge optional" class:has={hasRole(role)} class:missing={!hasRole(role)}>
                {#if hasRole(role)}
                  <Check size={12} />
                {:else}
                  <X size={12} />
                {/if}
                {role.role}
                <span class="optional-label">optional</span>
              </span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/each}

{#if filteredPages.length === 0}
  <p class="empty-text">No pages match your search.</p>
{/if}

<style>
  /* Summary bar */
  .summary-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    min-width: 100px;
  }

  :global([data-mode="dark"]) .summary-item {
    background: rgb(var(--color-surface-800));
  }

  .summary-item.accessible .summary-count {
    color: #16a34a;
  }

  .summary-item.blocked .summary-count {
    color: #dc2626;
  }

  .summary-count {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }

  :global([data-mode="dark"]) .summary-count {
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .summary-item.accessible .summary-count {
    color: rgb(var(--color-success-400));
  }

  :global([data-mode="dark"]) .summary-item.blocked .summary-count {
    color: rgb(var(--color-error-400));
  }

  .summary-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  :global([data-mode="dark"]) .summary-label {
    color: var(--color-surface-400);
  }

  /* Search */
  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  :global([data-mode="dark"]) .search-box {
    background: rgb(var(--color-surface-800));
    border-color: rgb(var(--color-surface-700));
  }

  .search-box input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.875rem;
    color: #111827;
  }

  :global([data-mode="dark"]) .search-box input {
    color: var(--color-surface-100);
  }

  .search-box input::placeholder {
    color: #9ca3af;
  }

  :global([data-mode="dark"]) .search-box input::placeholder {
    color: var(--color-surface-500);
  }

  /* Sections */
  .section {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
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

  /* Page entries */
  .page-list {
    display: flex;
    flex-direction: column;
  }

  .page-entry {
    padding: 0.625rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .page-entry:last-child {
    border-bottom: none;
  }

  :global([data-mode="dark"]) .page-entry {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .page-entry.blocked {
    background: #fef2f2;
  }

  :global([data-mode="dark"]) .page-entry.blocked {
    background: rgba(220, 38, 38, 0.05);
  }

  .route-link {
    font-size: 0.8rem;
    font-weight: 500;
    color: #2563eb;
    text-decoration: none;
  }

  .route-link:hover {
    text-decoration: underline;
  }

  :global([data-mode="dark"]) .route-link {
    color: rgb(var(--color-primary-400));
  }

  /* Roles */
  .roles-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .role-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 500;
  }

  .role-badge.has {
    background: #f0fdf4;
    color: #166534;
  }

  :global([data-mode="dark"]) .role-badge.has {
    background: rgba(34, 197, 94, 0.15);
    color: rgb(var(--color-success-300));
  }

  .role-badge.missing {
    background: #fef2f2;
    color: #991b1b;
  }

  :global([data-mode="dark"]) .role-badge.missing {
    background: rgba(220, 38, 38, 0.15);
    color: rgb(var(--color-error-300));
  }

  .role-badge.optional {
    border: 1px dashed currentColor;
    opacity: 0.85;
  }

  .optional-label {
    font-size: 0.6rem;
    opacity: 0.7;
    font-style: italic;
  }

  .empty-text {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
  }

  :global([data-mode="dark"]) .empty-text {
    color: var(--color-surface-400);
  }
</style>
