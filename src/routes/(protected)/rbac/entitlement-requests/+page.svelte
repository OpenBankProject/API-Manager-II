<script lang="ts">
  import type { PageData } from "./$types";
  import {
    Search,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Calendar,
  } from "@lucide/svelte";

  interface EntitlementRequest {
    entitlement_request_id: string;
    user: {
      user_id: string;
      username: string;
      email: string;
    };
    role_name: string;
    bank_id?: string;
    status: string;
    created: string;
  }

  let { data } = $props<{ data: PageData }>();

  let entitlementRequests = $derived(data.entitlementRequests || []);
  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);

  // Search state
  let searchQuery = $state("");

  // Filter requests based on search query
  let filteredRequests = $derived.by(() => {
    if (!searchQuery.trim()) {
      return entitlementRequests;
    }
    const query = searchQuery.toLowerCase().replace(/\s+/g, "");
    return entitlementRequests.filter(
      (request: EntitlementRequest) =>
        request.role_name.toLowerCase().includes(query) ||
        request.user.username.toLowerCase().includes(query) ||
        request.user.email.toLowerCase().includes(query) ||
        (request.bank_id && request.bank_id.toLowerCase().includes(query)),
    );
  });

  // Group requests by status
  let groupedRequests = $derived.by(() => {
    const grouped = new Map<string, EntitlementRequest[]>();

    filteredRequests.forEach((request: EntitlementRequest) => {
      const status = request.status || "PENDING";
      if (!grouped.has(status)) {
        grouped.set(status, []);
      }
      grouped.get(status)!.push(request);
    });

    return grouped;
  });

  // Helper function to format date
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  }

  // Helper function to get status badge class
  function getStatusBadgeClass(status: string): string {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "status-approved";
      case "REJECTED":
        return "status-rejected";
      case "PENDING":
        return "status-pending";
      default:
        return "status-default";
    }
  }

  // Helper function to get status icon
  function getStatusIcon(status: string) {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return CheckCircle;
      case "REJECTED":
        return XCircle;
      case "PENDING":
        return Clock;
      default:
        return Clock;
    }
  }
</script>

<svelte:head>
  <title>RBAC Entitlement Requests - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Error Alert -->
  {#if error}
    <div class="alert alert-error mb-6">
      <strong>Error:</strong>
      {error}
    </div>
  {/if}

  <div class="panel">
    <div class="panel-header">
      <div class="header-top">
        <div>
          <h1 class="panel-title">Entitlement Requests</h1>
          <div class="panel-subtitle">
            Review and manage entitlement requests for your organization
          </div>
        </div>
        <div class="request-count">
          <span class="count-number">{entitlementRequests.length}</span>
          <span class="count-label">Total Requests</span>
        </div>
      </div>

      <!-- Search Box -->
      <div class="search-container">
        <div class="search-input-wrapper">
          <Search class="search-icon" size={20} />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search by role, user, or bank..."
            class="search-input"
          />
          {#if searchQuery}
            <button
              class="clear-button"
              onclick={() => (searchQuery = "")}
              aria-label="Clear search"
            >
              ×
            </button>
          {/if}
        </div>
        {#if searchQuery}
          <div class="search-results-info">
            Showing {filteredRequests.length} of {entitlementRequests.length} requests
          </div>
        {/if}
      </div>
    </div>

    <div class="panel-content">
      {#if !hasApiAccess}
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h4 class="empty-title">No API Access</h4>
          <p class="empty-text">
            You need API access to view entitlement requests. Please contact
            your administrator.
          </p>
        </div>
      {:else if entitlementRequests.length === 0}
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h4 class="empty-title">No Entitlement Requests Found</h4>
          <p class="empty-text">
            There are currently no entitlement requests in the system.
          </p>
        </div>
      {:else if filteredRequests.length === 0}
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h4 class="empty-title">No Matching Requests</h4>
          <p class="empty-text">
            No entitlement requests match your search criteria. Try a different
            search term.
          </p>
        </div>
      {:else}
        <div class="requests-container">
          {#each Array.from(groupedRequests.entries()) as [status, requests]}
            {@const StatusIcon = getStatusIcon(status)}
            <div class="request-group">
              <div class="group-header">
                <div class="group-header-left">
                  <StatusIcon class="group-icon" size={20} />
                  <h3 class="group-title">{status}</h3>
                </div>
                <span class="group-count">{requests.length} requests</span>
              </div>
              <div class="requests-list">
                {#each requests as request}
                  <div class="request-card">
                    <div class="request-header">
                      <div class="request-title">
                        <h4 class="role-name">{request.role_name}</h4>
                        <span
                          class="status-badge {getStatusBadgeClass(
                            request.status,
                          )}"
                        >
                          {request.status}
                        </span>
                      </div>
                      <div class="request-id">
                        ID: {request.entitlement_request_id}
                      </div>
                    </div>

                    <div class="request-body">
                      <div class="request-info">
                        <div class="info-item">
                          <User size={16} class="info-icon" />
                          <div class="info-content">
                            <span class="info-label">User:</span>
                            <span class="info-value"
                              >{request.user.username}</span
                            >
                            <span class="info-detail"
                              >({request.user.email})</span
                            >
                          </div>
                        </div>

                        {#if request.bank_id}
                          <div class="info-item">
                            <span class="info-icon">🏦</span>
                            <div class="info-content">
                              <span class="info-label">Bank:</span>
                              <span class="info-value">{request.bank_id}</span>
                            </div>
                          </div>
                        {:else}
                          <div class="info-item">
                            <span class="info-icon">🌐</span>
                            <div class="info-content">
                              <span class="info-label">Scope:</span>
                              <span class="info-value">System-wide</span>
                            </div>
                          </div>
                        {/if}

                        <div class="info-item">
                          <Calendar size={16} class="info-icon" />
                          <div class="info-content">
                            <span class="info-label">Created:</span>
                            <span class="info-value"
                              >{formatDate(request.created)}</span
                            >
                          </div>
                        </div>
                      </div>

                      <div class="request-actions">
                        <a
                          href="/rbac/entitlement-requests/{request.entitlement_request_id}"
                          class="btn-view"
                        >
                          View Details
                        </a>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1600px;
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
    padding-bottom: 0;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
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

  .request-count {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 1.5rem;
    background: #f3f4f6;
    border-radius: 8px;
  }

  :global([data-mode="dark"]) .request-count {
    background: rgb(var(--color-surface-700));
  }

  .count-number {
    font-size: 2rem;
    font-weight: 700;
    color: #3b82f6;
    line-height: 1;
  }

  :global([data-mode="dark"]) .count-number {
    color: rgb(var(--color-primary-400));
  }

  .count-label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  :global([data-mode="dark"]) .count-label {
    color: var(--color-surface-400);
  }

  .search-container {
    padding: 0 1.5rem 1.5rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .search-container {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 33.333%;
  }

  .search-input-wrapper :global(.search-icon) {
    position: absolute;
    left: 1rem;
    color: #9ca3af;
    pointer-events: none;
  }

  :global([data-mode="dark"]) .search-input-wrapper :global(.search-icon) {
    color: var(--color-surface-400);
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 3rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    transition: all 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  :global([data-mode="dark"]) .search-input {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .search-input:focus {
    border-color: rgb(var(--color-primary-500));
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .clear-button {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .clear-button:hover {
    color: #4b5563;
  }

  :global([data-mode="dark"]) .clear-button {
    color: var(--color-surface-400);
  }

  :global([data-mode="dark"]) .clear-button:hover {
    color: var(--color-surface-200);
  }

  .search-results-info {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .search-results-info {
    color: var(--color-surface-400);
  }

  .panel-content {
    padding: 1.5rem;
  }

  .alert {
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1.5rem;
  }

  .alert-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  :global([data-mode="dark"]) .alert-error {
    background: rgb(var(--color-error-900));
    color: rgb(var(--color-error-200));
    border-color: rgb(var(--color-error-800));
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .empty-state {
    color: var(--color-surface-400);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-title {
    color: #4a5568;
    margin-bottom: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .empty-title {
    color: var(--color-surface-300);
  }

  .empty-text {
    color: #6b7280;
  }

  :global([data-mode="dark"]) .empty-text {
    color: var(--color-surface-400);
  }

  .requests-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .request-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .group-header {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .group-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .group-icon {
    color: #6b7280;
  }

  :global([data-mode="dark"]) .group-icon {
    color: var(--color-surface-400);
  }

  .group-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    text-transform: uppercase;
  }

  :global([data-mode="dark"]) .group-title {
    color: var(--color-surface-100);
  }

  .group-count {
    font-size: 0.875rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
  }

  :global([data-mode="dark"]) .group-count {
    color: var(--color-surface-400);
    background: rgb(var(--color-surface-700));
  }

  .requests-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .request-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .request-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  :global([data-mode="dark"]) .request-card {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
  }

  :global([data-mode="dark"]) .request-card:hover {
    border-color: rgb(var(--color-surface-500));
  }

  .request-header {
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .request-header {
    background: rgb(var(--color-surface-800));
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .request-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .role-name {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  :global([data-mode="dark"]) .role-name {
    color: var(--color-surface-100);
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-approved {
    background: #d1fae5;
    color: #065f46;
  }

  :global([data-mode="dark"]) .status-approved {
    background: rgb(var(--color-success-900));
    color: rgb(var(--color-success-200));
  }

  .status-rejected {
    background: #fee2e2;
    color: #991b1b;
  }

  :global([data-mode="dark"]) .status-rejected {
    background: rgb(var(--color-error-900));
    color: rgb(var(--color-error-200));
  }

  .status-pending {
    background: #fef3c7;
    color: #92400e;
  }

  :global([data-mode="dark"]) .status-pending {
    background: rgb(var(--color-warning-900));
    color: rgb(var(--color-warning-200));
  }

  .status-default {
    background: #f3f4f6;
    color: #4b5563;
  }

  :global([data-mode="dark"]) .status-default {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-300);
  }

  .request-id {
    font-size: 0.75rem;
    color: #6b7280;
    font-family: monospace;
  }

  :global([data-mode="dark"]) .request-id {
    color: var(--color-surface-400);
  }

  .request-body {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
  }

  .request-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .info-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .info-icon {
    color: #6b7280;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  :global([data-mode="dark"]) .info-icon {
    color: var(--color-surface-400);
  }

  .info-content {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    align-items: baseline;
  }

  .info-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .info-label {
    color: var(--color-surface-400);
  }

  .info-value {
    font-size: 0.875rem;
    color: #111827;
    font-weight: 500;
  }

  :global([data-mode="dark"]) .info-value {
    color: var(--color-surface-100);
  }

  .info-detail {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  :global([data-mode="dark"]) .info-detail {
    color: var(--color-surface-500);
  }

  .request-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-view {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .btn-view:hover {
    background: #2563eb;
  }

  :global([data-mode="dark"]) .btn-view {
    background: rgb(var(--color-primary-500));
  }

  :global([data-mode="dark"]) .btn-view:hover {
    background: rgb(var(--color-primary-600));
  }

  @media (max-width: 768px) {
    .header-top {
      flex-direction: column;
      gap: 1rem;
    }

    .request-count {
      width: 100%;
    }

    .search-input-wrapper {
      max-width: 100%;
    }

    .request-body {
      flex-direction: column;
      align-items: flex-start;
    }

    .request-actions {
      width: 100%;
    }

    .btn-view {
      width: 100%;
      text-align: center;
    }
  }
</style>
