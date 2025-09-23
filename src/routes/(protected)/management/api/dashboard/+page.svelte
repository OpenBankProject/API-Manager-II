<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import type { PageData } from "./$types";
  import { configHelpers } from "$lib/config";

  export let data: PageData;

  $: metrics = data.metrics;
  $: apiMetrics = data.apiMetrics;
  $: hasApiAccess = data.hasApiAccess;
  $: error = data.error;
  $: lastUpdated = data.lastUpdated;

  let currentTime = new Date().toLocaleString();

  // Configuration information
  $: obpInfo = configHelpers.getObpConnectionInfo();
  $: configDisplay = configHelpers.formatForDisplay();

  onMount(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      currentTime = new Date().toLocaleString();
    }, 60000);

    return () => clearInterval(interval);
  });

  function refreshMetrics() {
    window.location.reload();
  }

  function getStatusClass(status: number) {
    if (status >= 200 && status < 300) return "obp-portal-status online";
    if (status >= 400 && status < 500) return "obp-portal-status warning";
    return "obp-portal-status offline";
  }

  function getChangeClass(value: number) {
    if (value > 0) return "positive";
    if (value < 0) return "negative";
    return "neutral";
  }
</script>

<svelte:head>
  <title>API Dashboard - API Manager II</title>
  <link rel="stylesheet" href="/obp-manager.css" />
</svelte:head>

<div class="obp-manager">
  <!-- Header Section -->
  <div class="obp-manager-header">
    <div class="obp-manager-container">
      <h1>API Dashboard</h1>
      <p class="subtitle">
        Real-time monitoring and analytics for Open Bank Project API
      </p>
    </div>
  </div>

  <div class="obp-manager-container">
    <!-- Breadcrumb Navigation -->
    <nav class="obp-manager-breadcrumb">
      <a href="/">Home</a>
      <span class="separator">›</span>
      <a href="/management">Management</a>
      <span class="separator">›</span>
      <a href="/management/api">API</a>
      <span class="separator">›</span>
      <span>Dashboard</span>
    </nav>

    <!-- Error Alert -->
    {#if error}
      <div class="obp-manager-alert error">
        <strong
          >{hasApiAccess
            ? "API Integration Pending"
            : "API Access Limited"}:</strong
        >
        {error}
        {#if !hasApiAccess}
          - No data available in fallback mode.
        {/if}
      </div>
    {/if}

    <!-- Success Alert -->
    {#if hasApiAccess && !error}
      <div class="obp-manager-alert success">
        <strong>Live Data:</strong> Connected to OBP API server. Metrics updated
        at {lastUpdated ? new Date(lastUpdated).toLocaleString() : currentTime}.
      </div>
    {/if}

    {#if hasApiAccess && metrics}
      <!-- Key Metrics Cards -->
      <div class="obp-manager-grid obp-manager-grid-4">
        <div class="obp-manager-metric-card">
          <div class="obp-manager-metric-value">{metrics.totalBanks || 0}</div>
          <div class="obp-manager-metric-label">Total Banks</div>
          <div class="obp-manager-metric-change neutral">
            Active institutions
          </div>
        </div>

        <div class="obp-manager-metric-card">
          <div class="obp-manager-metric-value">{metrics.totalUsers || 0}</div>
          <div class="obp-manager-metric-label">Active Users</div>
          <div class="obp-manager-metric-change neutral">Registered users</div>
        </div>

        <div class="obp-manager-metric-card">
          <div class="obp-manager-metric-value">
            {metrics.apiCalls?.toLocaleString() || 0}
          </div>
          <div class="obp-manager-metric-label">API Calls Today</div>
          <div class="obp-manager-metric-change neutral">Total requests</div>
        </div>

        <div class="obp-manager-metric-card">
          <div class="obp-manager-metric-value">
            {apiMetrics?.availability?.toFixed(1) || "0"}%
          </div>
          <div class="obp-manager-metric-label">API Availability</div>
          <div class="obp-manager-metric-change neutral">Service uptime</div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="obp-manager-grid obp-manager-grid-3">
        <div class="obp-manager-card">
          <div class="obp-manager-card-header">
            <h3 class="obp-manager-card-title">Response Time</h3>
            <span
              class="obp-manager-status {apiMetrics?.responseTime
                ? 'online'
                : 'offline'}"
            >
              {apiMetrics?.responseTime ? "Active" : "No Data"}
            </span>
          </div>
          <div class="obp-manager-metric-value" style="font-size: 1.8rem;">
            {apiMetrics?.responseTime || 0}ms
          </div>
          <div class="obp-manager-metric-change neutral">Average response</div>
        </div>

        <div class="obp-manager-card">
          <div class="obp-manager-card-header">
            <h3 class="obp-manager-card-title">Error Rate</h3>
            <span
              class="obp-manager-status {apiMetrics?.errorRate
                ? 'warning'
                : 'offline'}"
            >
              {apiMetrics?.errorRate ? "Monitoring" : "No Data"}
            </span>
          </div>
          <div class="obp-manager-metric-value" style="font-size: 1.8rem;">
            {(apiMetrics?.errorRate || 0).toFixed(2)}%
          </div>
          <div class="obp-manager-metric-change neutral">Error percentage</div>
        </div>

        <div class="obp-manager-card">
          <div class="obp-manager-card-header">
            <h3 class="obp-manager-card-title">Throughput</h3>
            <span
              class="obp-manager-status {apiMetrics?.throughput
                ? 'online'
                : 'offline'}"
            >
              {apiMetrics?.throughput ? "Active" : "No Data"}
            </span>
          </div>
          <div class="obp-manager-metric-value" style="font-size: 1.8rem;">
            {apiMetrics?.throughput || 0}
          </div>
          <div class="obp-manager-metric-label">requests/min</div>
          <div class="obp-manager-metric-change neutral">Request rate</div>
        </div>
      </div>
    {:else}
      <!-- No Data Available -->
      <div class="obp-manager-card" style="text-align: center; padding: 3rem;">
        <div class="obp-manager-card-header">
          <h3 class="obp-manager-card-title">No Data Available</h3>
        </div>
        <div class="obp-manager-metric-label" style="margin-top: 1rem;">
          {#if !hasApiAccess}
            API dashboard requires full OBP API access. Currently running in
            fallback authentication mode.
          {:else}
            Real API integration is not yet implemented. No metrics data to
            display.
          {/if}
        </div>

        {#if hasApiAccess}
          <button
            class="obp-manager-btn obp-manager-btn-primary"
            on:click={refreshMetrics}
            style="margin-top: 1.5rem;"
          >
            Refresh
          </button>
        {/if}
      </div>
    {/if}

    <!-- System Information -->
    <div class="obp-manager-card" style="margin-top: 2rem;">
      <div class="obp-manager-card-header">
        <h3 class="obp-manager-card-title">System Configuration</h3>
      </div>
      <div class="obp-manager-grid obp-manager-grid-2">
        <div>
          <div class="obp-manager-metric-label">OBP API Server</div>
          <div class="obp-manager-metric-value" style="font-size: 1rem;">
            {obpInfo.host}:{obpInfo.port}
          </div>
        </div>
        <div>
          <div class="obp-manager-metric-label">Authentication Status</div>
          <div class="obp-manager-metric-value" style="font-size: 1rem;">
            <span
              class="obp-manager-status {hasApiAccess ? 'online' : 'warning'}"
            >
              {hasApiAccess ? "Full API Access" : "Fallback Mode"}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div style="margin-top: 2rem; text-align: center;">
      <a
        href="/management/api"
        class="obp-manager-btn obp-manager-btn-secondary"
        style="margin-right: 1rem;"
      >
        ← Back to API Management
      </a>
      <a
        href="/management/metrics"
        class="obp-manager-btn obp-manager-btn-primary"
      >
        View Detailed Metrics →
      </a>
    </div>
  </div>
</div>
