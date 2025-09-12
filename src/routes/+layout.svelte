<script lang="ts">
  import "../app.css";
  import Navigation from "$lib/components/Navigation.svelte";
  import ObpStatusIndicator from "$lib/components/ObpStatusIndicator.svelte";

  // Get data from layout server
  export let data: any = {};
  $: user = data?.user;
  $: authInfo = data?.authInfo;
  $: hasApiAccess = authInfo?.source === "obp_api";
</script>

<svelte:head>
  <!-- Favicon configuration -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/favicon.png" />

  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json" />

  <!-- Meta tags -->
  <title>API Manager II</title>
  <meta
    name="description"
    content="Comprehensive API management and monitoring platform for Open Bank Project"
  />
  <meta name="theme-color" content="#3b82f6" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="API Manager II" />
</svelte:head>

<!-- Global Navigation -->
<Navigation {user} {authInfo} />

<!-- Main Content -->
<main class="main-content">
  <slot />
</main>

<!-- Footer with OBP Status -->
<footer class="app-footer">
  <div class="footer-content">
    <div class="footer-left">
      <span class="footer-text">API Manager II • Version 0.0.1</span>
    </div>
    <div class="footer-right">
      <ObpStatusIndicator {hasApiAccess} size="small" inline={true} />
    </div>
  </div>
</footer>

<style>
  :global(html) {
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
      Cantarell, sans-serif;
    line-height: 1.6;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #f9fafb;
    color: #1f2937;
  }

  .main-content {
    min-height: calc(
      100vh - 4rem - 3rem
    ); /* Account for navigation and footer height */
    flex: 1;
  }

  :global(body) {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  :global(#app) {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  :global(*) {
    box-sizing: border-box;
  }

  /* Global button styles */
  :global(button) {
    font-family: inherit;
  }

  /* Global link styles */
  :global(a) {
    color: #2563eb;
    text-decoration: none;
  }

  :global(a:hover) {
    text-decoration: underline;
  }

  /* Utility classes */
  :global(.container) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Footer Styles */
  .app-footer {
    background: #ffffff;
    border-top: 1px solid #e5e7eb;
    padding: 0.75rem 0;
    margin-top: auto;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
  }

  .footer-text {
    color: #6b7280;
    font-size: 0.75rem;
  }

  .footer-left,
  .footer-right {
    display: flex;
    align-items: center;
  }

  /* Responsive breakpoints */
  @media (max-width: 768px) {
    :global(.container) {
      padding: 0 0.75rem;
    }

    .footer-content {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
      padding: 0 0.75rem;
    }

    .footer-left,
    .footer-right {
      justify-content: center;
    }
  }
</style>
