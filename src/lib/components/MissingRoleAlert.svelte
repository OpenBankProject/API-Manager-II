<script lang="ts">
  import { ShieldCheck } from "@lucide/svelte";

  interface Props {
    roles: string[];
    errorCode?: string;
    message?: string;
    onRequestEntitlement?: () => void;
  }

  let { roles, errorCode, message, onRequestEntitlement }: Props = $props();

  function handleRequestClick() {
    if (onRequestEntitlement) {
      onRequestEntitlement();
    } else {
      // Default behavior: navigate to entitlement request page
      window.location.href = "/user/entitlements";
    }
  }
</script>

<div class="alert alert-missing-role">
  <div class="alert-header">
    <span class="alert-icon">🔒</span>
    <strong>Missing Required Role{roles.length > 1 ? "s" : ""}</strong>
    {#if errorCode}
      <span class="error-code">OBP-{errorCode}</span>
    {/if}
  </div>

  <p class="alert-message">
    You need the following role{roles.length > 1 ? "s" : ""} to access this page:
  </p>

  <ul class="role-list">
    {#each roles as role}
      <li><code class="role-code">{role}</code></li>
    {/each}
  </ul>

  {#if message}
    <p class="alert-detail">{message}</p>
  {/if}

  <div class="alert-actions">
    <button class="btn-request" onclick={handleRequestClick}>
      <ShieldCheck size={18} />
      Request Entitlement
    </button>
  </div>
</div>

<style>
  .alert {
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .alert-missing-role {
    background: #fef3c7;
    border: 2px solid #f59e0b;
    color: #92400e;
    padding: 1.5rem;
  }

  :global([data-mode="dark"]) .alert-missing-role {
    background: rgb(var(--color-warning-900));
    border-color: rgb(var(--color-warning-600));
    color: rgb(var(--color-warning-200));
  }

  .alert-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 1.125rem;
  }

  .alert-icon {
    font-size: 1.5rem;
  }

  .error-code {
    font-size: 0.75rem;
    font-family: monospace;
    background: rgba(0, 0, 0, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    margin-left: auto;
  }

  :global([data-mode="dark"]) .error-code {
    background: rgba(255, 255, 255, 0.1);
  }

  .alert-message {
    margin: 0.5rem 0;
    font-size: 0.875rem;
  }

  .role-list {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
    list-style: disc;
  }

  .role-list li {
    margin: 0.25rem 0;
  }

  .role-code {
    background: rgba(0, 0, 0, 0.15);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875rem;
    font-weight: 600;
    color: #78350f;
  }

  :global([data-mode="dark"]) .role-code {
    background: rgba(255, 255, 255, 0.15);
    color: rgb(var(--color-warning-100));
  }

  .alert-detail {
    margin: 0.5rem 0;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .alert-actions {
    margin-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    padding-top: 1rem;
  }

  :global([data-mode="dark"]) .alert-actions {
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .btn-request {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: #f59e0b;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .btn-request:hover {
    background: #d97706;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  .btn-request:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  :global([data-mode="dark"]) .btn-request {
    background: rgb(var(--color-warning-600));
  }

  :global([data-mode="dark"]) .btn-request:hover {
    background: rgb(var(--color-warning-700));
  }
</style>
