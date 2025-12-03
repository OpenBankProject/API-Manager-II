<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  export let data: PageData;

  $: entity = data.entity;
  $: definition = data.definition;
  $: schema = definition.schema || {};

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this entity? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/dynamic-entities/${entity.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entity");
      }

      alert("Entity deleted successfully");
      goto("/dynamic-entities");
    } catch (error) {
      alert("Failed to delete entity");
      console.error("Delete error:", error);
    }
  }

  function copyEntityId() {
    navigator.clipboard.writeText(entity.id);
    alert("Entity ID copied to clipboard");
  }

  function copyEntityData() {
    navigator.clipboard.writeText(JSON.stringify(entity.data, null, 2));
    alert("Entity data copied to clipboard");
  }

  function formatValue(value: any, fieldDef: any): string {
    if (value === null || value === undefined) {
      return "Not set";
    }

    if (fieldDef?.type === "boolean") {
      return value ? "Yes" : "No";
    }

    if (fieldDef?.type === "array" || fieldDef?.type === "object") {
      return JSON.stringify(value, null, 2);
    }

    if (fieldDef?.format === "date" || fieldDef?.format === "datetime") {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  function isComplexType(fieldDef: any): boolean {
    return fieldDef?.type === "array" || fieldDef?.type === "object";
  }
</script>

<svelte:head>
  <title>Entity {entity.id} - API Manager</title>
</svelte:head>

<div class="container mx-auto max-w-5xl px-4 py-8">
  <!-- Header -->
  <div class="mb-6">
    <a
      href="/dynamic-entities"
      class="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
    >
      <svg
        class="mr-2 h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Back to Entities
    </a>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Entity Details
        </h1>
        <span
          class="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          {definition.name}
        </span>
      </div>
      <div class="flex gap-2">
        <a
          href="/dynamic-entities/{entity.id}/edit"
          class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <svg
            class="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit
        </a>
        <button
          on:click={handleDelete}
          class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <svg
            class="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>
      </div>
    </div>
  </div>

  <!-- Entity Metadata -->
  <div
    class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
      Entity Information
    </h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="space-y-1">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Entity ID
        </p>
        <div class="flex items-center gap-2">
          <code
            class="rounded bg-gray-100 px-2 py-1 text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100"
            >{entity.id}</code
          >
          <button
            on:click={copyEntityId}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Copy ID"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>
      <div class="space-y-1">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Entity Type
        </p>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          >
            <svg
              class="mr-1 h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
            {definition.name}
          </span>
          {#if definition.version}
            <span
              class="inline-flex rounded-full border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              v{definition.version}
            </span>
          {/if}
        </div>
      </div>
      <div class="space-y-1">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Created
        </p>
        <div class="flex items-center gap-2">
          <svg
            class="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p class="text-sm text-gray-900 dark:text-gray-100">
            {new Date(entity.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <div class="space-y-1">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Last Updated
        </p>
        <div class="flex items-center gap-2">
          <svg
            class="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p class="text-sm text-gray-900 dark:text-gray-100">
            {new Date(entity.updated_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
    {#if definition.description}
      <div class="mt-4 border-t pt-4 dark:border-gray-700">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          Definition Description
        </p>
        <p class="text-sm text-gray-900 dark:text-gray-100">
          {definition.description}
        </p>
      </div>
    {/if}
  </div>

  <!-- Entity Data -->
  <div
    class="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div
      class="flex items-center justify-between border-b p-6 dark:border-gray-700"
    >
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Entity Data
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Field values based on the {definition.name} schema
        </p>
      </div>
      <a
        href="/dynamic-entities/{entity.id}/edit"
        class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg
          class="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Edit Data
      </a>
    </div>
    <div class="p-6">
      {#if Object.keys(schema).length === 0}
        <div class="py-8 text-center">
          <p class="text-gray-500 dark:text-gray-400">
            No schema defined for this entity type
          </p>
        </div>
      {:else}
        <div class="space-y-6">
          {#each Object.entries(schema) as [fieldName, fieldDef]}
            {@const fieldValue = entity.data[fieldName]}
            {@const typedFieldDef = fieldDef}
            <div class="space-y-2">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="mb-1 flex items-center gap-2">
                    <p class="font-medium text-gray-900 dark:text-gray-100">
                      {typedFieldDef.title || fieldName}
                    </p>
                    {#if typedFieldDef.required}
                      <span
                        class="inline-flex rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      >
                        Required
                      </span>
                    {/if}
                    <span
                      class="inline-flex rounded-full border border-gray-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {typedFieldDef.type}
                    </span>
                  </div>
                  {#if typedFieldDef.description}
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {typedFieldDef.description}
                    </p>
                  {/if}
                </div>
              </div>

              <div class="pl-0">
                {#if fieldValue === null || fieldValue === undefined}
                  <p class="italic text-sm text-gray-400 dark:text-gray-500">
                    Not set
                  </p>
                {:else if typedFieldDef.type === "boolean"}
                  <div class="flex items-center gap-2">
                    {#if fieldValue}
                      <svg
                        class="h-5 w-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span
                        class="font-medium text-sm text-gray-900 dark:text-gray-100"
                        >Yes</span
                      >
                    {:else}
                      <svg
                        class="h-5 w-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span
                        class="font-medium text-sm text-gray-900 dark:text-gray-100"
                        >No</span
                      >
                    {/if}
                  </div>
                {:else if isComplexType(typedFieldDef)}
                  <div
                    class="overflow-x-auto rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50"
                  >
                    <pre
                      class="text-sm font-mono text-gray-900 dark:text-gray-100">{formatValue(
                        fieldValue,
                        typedFieldDef,
                      )}</pre>
                  </div>
                {:else if typedFieldDef.format === "url"}
                  <a
                    href={fieldValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {fieldValue}
                  </a>
                {:else if typedFieldDef.format === "email"}
                  <a
                    href="mailto:{fieldValue}"
                    class="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {fieldValue}
                  </a>
                {:else}
                  <p
                    class="rounded bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-900/50 dark:text-gray-100"
                  >
                    {formatValue(fieldValue, typedFieldDef)}
                  </p>
                {/if}
              </div>
            </div>

            {#if Object.entries(schema).indexOf( [fieldName, fieldDef], ) < Object.entries(schema).length - 1}
              <div class="border-t dark:border-gray-700"></div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Raw JSON View -->
  <div
    class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div
      class="flex items-center justify-between border-b p-6 dark:border-gray-700"
    >
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Raw Data (JSON)
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Complete entity data in JSON format
        </p>
      </div>
      <button
        on:click={copyEntityData}
        class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg
          class="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Copy JSON
      </button>
    </div>
    <div class="p-6">
      <div
        class="overflow-x-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50"
      >
        <pre
          class="text-sm font-mono text-gray-900 dark:text-gray-100">{JSON.stringify(
            entity.data,
            null,
            2,
          )}</pre>
      </div>
    </div>
  </div>
</div>
