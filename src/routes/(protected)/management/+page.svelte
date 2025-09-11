<script lang="ts">
  import { goto } from "$app/navigation";

  const managementModules = [
    {
      title: "Metrics Dashboard",
      description: "Real-time monitoring and analytics for OBP API performance",
      icon: "📊",
      path: "/management/metrics",
      status: "available",
      features: ["API Performance", "System Health", "Usage Analytics", "Error Monitoring"]
    },
    {
      title: "User Management",
      description: "Manage user accounts, permissions, and access controls",
      icon: "👥",
      path: "/management/users",
      status: "planned",
      features: ["User Accounts", "Role Management", "Access Controls", "Activity Logs"]
    },
    {
      title: "API Configuration",
      description: "Configure API endpoints, rate limiting, and security settings",
      icon: "⚙️",
      path: "/management/config",
      status: "planned",
      features: ["Endpoint Config", "Rate Limiting", "Security Rules", "API Keys"]
    },
    {
      title: "System Logs",
      description: "View and analyze system logs, audit trails, and error reports",
      icon: "📝",
      path: "/management/logs",
      status: "planned",
      features: ["Error Logs", "Audit Trail", "Performance Logs", "Security Events"]
    },
    {
      title: "Bank Management",
      description: "Manage connected banks, accounts, and financial data",
      icon: "🏦",
      path: "/management/banks",
      status: "planned",
      features: ["Bank Connections", "Account Overview", "Transaction Monitoring", "Compliance"]
    },
    {
      title: "Security Center",
      description: "Monitor security events, manage certificates, and review access",
      icon: "🔒",
      path: "/management/security",
      status: "planned",
      features: ["Security Events", "SSL Certificates", "Access Reviews", "Threat Detection"]
    }
  ];

  function navigateTo(path: string, status: string) {
    if (status === "available") {
      goto(path);
    }
  }
</script>

<svelte:head>
  <title>Management - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <header class="text-center mb-12">
    <h1 class="text-4xl font-bold text-gray-800 mb-4">Management Console</h1>
    <p class="text-lg text-gray-600 max-w-2xl mx-auto">
      Comprehensive management interface for Open Bank Project API monitoring, configuration, and administration
    </p>
  </header>

  <!-- Navigation Breadcrumb -->
  <nav class="breadcrumb mb-8">
    <a href="/" class="breadcrumb-link">Home</a>
    <span class="breadcrumb-separator">›</span>
    <span class="breadcrumb-current">Management</span>
  </nav>

  <!-- Management Modules Grid -->
  <section class="modules-grid">
    {#each managementModules as module}
      <div
        class="module-card {module.status}"
        on:click={() => navigateTo(module.path, module.status)}
        on:keydown={(e) => e.key === "Enter" && navigateTo(module.path, module.status)}
        role="button"
        tabindex="0"
      >
        <div class="module-header">
          <div class="module-icon">{module.icon}</div>
          <div class="module-status-badge status-{module.status}">
            {module.status === "available" ? "Available" : "Coming Soon"}
          </div>
        </div>

        <div class="module-content">
          <h3 class="module-title">{module.title}</h3>
          <p class="module-description">{module.description}</p>

          <div class="module-features">
            {#each module.features as feature}
              <span class="feature-tag">{feature}</span>
            {/each}
          </div>
        </div>

        <div class="module-footer">
          <div class="module-path">{module.path}</div>
          {#if module.status === "available"}
            <div class="module-action">Click to access →</div>
          {:else}
            <div class="module-action coming-soon">Under development</div>
          {/if}
        </div>
      </div>
    {/each}
  </section>

  <!-- Quick Actions -->
  <section class="quick-actions">
    <h2 class="section-title">Quick Actions</h2>
    <div class="actions-grid">
      <button class="action-btn primary" on:click={() => goto("/management/metrics")}>
        📊 View Live Metrics
      </button>
      <button class="action-btn secondary" on:click={() => window.location.reload()}>
        🔄 Refresh Dashboard
      </button>
      <button class="action-btn secondary" on:click={() => goto("/")}>
        ← Back to Home
      </button>
    </div>
  </section>

  <!-- System Status Summary -->
  <section class="system-status">
    <h2 class="section-title">System Status</h2>
    <div class="status-grid">
      <div class="status-item">
        <div class="status-indicator online"></div>
        <div class="status-info">
          <div class="status-label">API Manager</div>
          <div class="status-value">Online</div>
        </div>
      </div>
      <div class="status-item">
        <div class="status-indicator online"></div>
        <div class="status-info">
          <div class="status-label">OIDC Provider</div>
          <div class="status-value">Connected</div>
        </div>
      </div>
      <div class="status-item">
        <div class="status-indicator warning"></div>
        <div class="status-info">
          <div class="status-label">OBP API Server</div>
          <div class="status-value">Limited Access</div>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .container {
    max-width: 1200px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .breadcrumb-link {
    color: #3b82f6;
    text-decoration: none;
  }

  .breadcrumb-link:hover {
    color: #1d4ed8;
  }

  .breadcrumb-separator {
    margin: 0 0.5rem;
    color: #d1d5db;
  }

  .breadcrumb-current {
    color: #374151;
    font-weight: 500;
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .module-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .module-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  .module-card.available {
    border-left: 4px solid #10b981;
  }

  .module-card.planned {
    border-left: 4px solid #f59e0b;
    opacity: 0.8;
  }

  .module-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .module-icon {
    font-size: 2rem;
    line-height: 1;
  }

  .module-status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-available {
    background-color: #d1fae5;
    color: #065f46;
  }

  .status-planned {
    background-color: #fef3c7;
    color: #92400e;
  }

  .module-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .module-description {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .module-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .feature-tag {
    background-color: #f3f4f6;
    color: #374151;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .module-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
  }

  .module-path {
    font-family: monospace;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .module-action {
    font-size: 0.75rem;
    font-weight: 500;
    color: #3b82f6;
  }

  .module-action.coming-soon {
    color: #f59e0b;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .quick-actions {
    margin-bottom: 3rem;
  }

  .actions-grid {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn.primary {
    background-color: #3b82f6;
    color: white;
  }

  .action-btn.primary:hover {
    background-color: #2563eb;
  }

  .action-btn.secondary {
    background-color: #f3f4f6;
    color: #374151;
  }

  .action-btn.secondary:hover {
    background-color: #e5e7eb;
  }

  .system-status {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .status-grid {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-indicator.online {
    background-color: #10b981;
  }

  .status-indicator.warning {
    background-color: #f59e0b;
  }

  .status-indicator.offline {
    background-color: #ef4444;
  }

  .status-info {
    display: flex;
    flex-direction: column;
  }

  .status-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .status-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1f2937;
  }

  @media (max-width: 768px) {
    .modules-grid {
      grid-template-columns: 1fr;
    }

    .actions-grid {
      flex-direction: column;
    }

    .status-grid {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>
