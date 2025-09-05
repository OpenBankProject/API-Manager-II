<script lang="ts">
  import { goto } from "$app/navigation";

  const availablePages = [
    {
      path: "/",
      title: "Home",
      description: "Main dashboard and overview",
      status: "active",
    },
    // Future pages to be implemented:
    // {
    //   path: '/apis',
    //   title: 'API Management',
    //   description: 'Manage your APIs, endpoints, and configurations',
    //   status: 'planned'
    // },
    // {
    //   path: '/auth',
    //   title: 'Authentication',
    //   description: 'OAuth2 and authentication management',
    //   status: 'planned'
    // },
    // {
    //   path: '/documentation',
    //   title: 'API Documentation',
    //   description: 'View and manage API documentation',
    //   status: 'planned'
    // },
    // {
    //   path: '/monitoring',
    //   title: 'Monitoring & Analytics',
    //   description: 'API usage statistics and monitoring',
    //   status: 'planned'
    // },
    // {
    //   path: '/settings',
    //   title: 'Settings',
    //   description: 'Application configuration and preferences',
    //   status: 'planned'
    // }
  ];

  function navigateToPage(path: string, status: string) {
    if (status === "active") {
      goto(path);
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <header class="text-center mb-12">
    <h1 class="text-4xl font-bold text-gray-800 mb-4">API Manager II</h1>
    <p class="text-lg text-gray-600">
      Comprehensive API management and monitoring platform
    </p>
  </header>

  <section class="mb-12">
    <h2 class="text-2xl font-semibold text-gray-700 mb-6">Available Pages</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each availablePages as page}
        <div
          class="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
          class:opacity-50={page.status !== "active"}
          class:cursor-not-allowed={page.status !== "active"}
          on:click={() => navigateToPage(page.path, page.status)}
          on:keydown={(e) =>
            e.key === "Enter" && navigateToPage(page.path, page.status)}
          role="button"
          tabindex="0"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xl font-semibold text-gray-800">{page.title}</h3>
            <span
              class="px-2 py-1 rounded-full text-xs font-medium"
              class:bg-green-100={page.status === "active"}
              class:text-green-800={page.status === "active"}
              class:bg-yellow-100={page.status === "planned"}
              class:text-yellow-800={page.status === "planned"}
            >
              {page.status === "active" ? "Available" : "Coming Soon"}
            </span>
          </div>
          <p class="text-gray-600 text-sm">{page.description}</p>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <span class="text-xs text-gray-500">Route: {page.path}</span>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="bg-blue-50 rounded-lg p-6">
    <h2 class="text-xl font-semibold text-blue-800 mb-4">Getting Started</h2>
    <div class="text-blue-700">
      <p class="mb-3">
        Welcome to API Manager II! This application will help you:
      </p>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li>Manage and configure your APIs</li>
        <li>Handle OAuth2 authentication flows</li>
        <li>Monitor API usage and performance</li>
        <li>Generate and maintain API documentation</li>
        <li>Configure application settings</li>
      </ul>
      <p class="mt-4 text-sm">
        <strong>Note:</strong> Additional pages are currently in development. Check
        back soon for new features!
      </p>
    </div>
  </section>

  <footer class="text-center mt-12 pt-8 border-t border-gray-200">
    <p class="text-gray-500 text-sm">Built with SvelteKit • Version 0.0.1</p>
  </footer>
</div>

<style>
  .container {
    max-width: 1200px;
  }
</style>
