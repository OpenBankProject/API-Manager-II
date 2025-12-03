<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  export let data: PageData;

  let selectedDefinitionId = "";
  let entityData: Record<string, any> = {};
  let isSubmitting = false;
  let validationErrors: Record<string, string> = {};

  $: selectedDefinition = data.definitions.find(
    (d) => d.id === selectedDefinitionId,
  );
  $: schema = selectedDefinition?.schema || {};
  $: schemaFields = Object.entries(schema);

  function initializeEntityData() {
    if (!selectedDefinition) return;

    entityData = {};
    Object.entries(schema).forEach(([fieldName, fieldDef]: [string, any]) => {
      if (fieldDef.default !== undefined) {
        entityData[fieldName] = fieldDef.default;
      } else if (fieldDef.type === "string") {
        entityData[fieldName] = "";
      } else if (fieldDef.type === "number" || fieldDef.type === "integer") {
        entityData[fieldName] = 0;
      } else if (fieldDef.type === "boolean") {
        entityData[fieldName] = false;
      } else if (fieldDef.type === "array") {
        entityData[fieldName] = [];
      } else if (fieldDef.type === "object") {
        entityData[fieldName] = {};
      } else {
        entityData[fieldName] = null;
      }
    });
  }

  $: if (selectedDefinitionId) {
    initializeEntityData();
  }

  function validateField(
    fieldName: string,
    fieldDef: any,
    value: any,
  ): string | null {
    if (
      fieldDef.required &&
      (value === null || value === undefined || value === "")
    ) {
      return "This field is required";
    }

    if (value !== null && value !== undefined && value !== "") {
      if (fieldDef.type === "number" || fieldDef.type === "integer") {
        const num = Number(value);
        if (isNaN(num)) {
          return "Must be a valid number";
        }
        if (fieldDef.type === "integer" && !Number.isInteger(num)) {
          return "Must be an integer";
        }
        if (fieldDef.minimum !== undefined && num < fieldDef.minimum) {
          return `Must be at least ${fieldDef.minimum}`;
        }
        if (fieldDef.maximum !== undefined && num > fieldDef.maximum) {
          return `Must be at most ${fieldDef.maximum}`;
        }
      }

      if (fieldDef.type === "string") {
        const str = String(value);
        if (
          fieldDef.minLength !== undefined &&
          str.length < fieldDef.minLength
        ) {
          return `Must be at least ${fieldDef.minLength} characters`;
        }
        if (
          fieldDef.maxLength !== undefined &&
          str.length > fieldDef.maxLength
        ) {
          return `Must be at most ${fieldDef.maxLength} characters`;
        }
        if (fieldDef.pattern) {
          const regex = new RegExp(fieldDef.pattern);
          if (!regex.test(str)) {
            return "Invalid format";
          }
        }
      }

      if (fieldDef.enum && !fieldDef.enum.includes(value)) {
        return `Must be one of: ${fieldDef.enum.join(", ")}`;
      }
    }

    return null;
  }

  function validateAllFields(): boolean {
    validationErrors = {};
    let isValid = true;

    Object.entries(schema).forEach(([fieldName, fieldDef]: [string, any]) => {
      const error = validateField(fieldName, fieldDef, entityData[fieldName]);
      if (error) {
        validationErrors[fieldName] = error;
        isValid = false;
      }
    });

    return isValid;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!selectedDefinitionId) {
      alert("Please select an entity definition");
      return;
    }

    if (!validateAllFields()) {
      alert("Please fix validation errors before submitting");
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch("/api/dynamic-entities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          definition_id: selectedDefinitionId,
          data: entityData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create entity");
      }

      const result = await response.json();
      alert("Dynamic entity created successfully");
      goto(`/dynamic-entities/${result.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create entity");
      console.error("Submit error:", error);
    } finally {
      isSubmitting = false;
    }
  }

  function handleFieldChange(fieldName: string) {
    if (validationErrors[fieldName]) {
      validationErrors = { ...validationErrors };
      delete validationErrors[fieldName];
    }
  }

  function renderFieldInput(fieldName: string, fieldDef: any) {
    if (fieldDef.enum && Array.isArray(fieldDef.enum)) {
      return "enum-select";
    }

    switch (fieldDef.type) {
      case "string":
        if (
          fieldDef.format === "textarea" ||
          (fieldDef.maxLength && fieldDef.maxLength > 200)
        ) {
          return "textarea";
        }
        return "text";
      case "number":
      case "integer":
        return "number";
      case "boolean":
        return "checkbox";
      case "array":
      case "object":
        return "json";
      default:
        return "text";
    }
  }

  function getFieldInputType(fieldDef: any): string {
    if (fieldDef.format === "email") return "email";
    if (fieldDef.format === "url") return "url";
    if (fieldDef.format === "date") return "date";
    if (fieldDef.format === "datetime") return "datetime-local";
    if (fieldDef.type === "number" || fieldDef.type === "integer")
      return "number";
    return "text";
  }
</script>

<svelte:head>
  <title>Create Dynamic Entity - API Manager</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
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
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
      Create Dynamic Entity
    </h1>
    <p class="mt-1 text-gray-600 dark:text-gray-400">
      Create a new entity based on a definition
    </p>
  </div>

  <!-- Definition Selection -->
  <div
    class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
      Select Entity Definition
    </h2>
    <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
      Choose the type of entity you want to create
    </p>

    {#if data.definitions.length === 0}
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <svg
          class="mb-4 h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          No Definitions Available
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          You need to create an entity definition before you can create
          entities.
        </p>
        <a
          href="/dynamic-entities/definitions"
          class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to Definitions
        </a>
      </div>
    {:else}
      <div class="space-y-4">
        <div>
          <label
            for="definition-select"
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Entity Type
          </label>
          <select
            id="definition-select"
            class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            bind:value={selectedDefinitionId}
          >
            <option value="">Select a definition...</option>
            {#each data.definitions as definition}
              <option value={definition.id}>
                {definition.name}
                {#if definition.description}
                  - {definition.description}
                {/if}
              </option>
            {/each}
          </select>
        </div>

        {#if selectedDefinition}
          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
            <h4 class="mb-2 font-semibold text-gray-900 dark:text-gray-100">
              {selectedDefinition.name}
            </h4>
            {#if selectedDefinition.description}
              <p class="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {selectedDefinition.description}
              </p>
            {/if}
            <div class="mt-2 flex gap-2">
              <span
                class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {Object.keys(schema).length} fields
              </span>
              {#if selectedDefinition.version}
                <span
                  class="inline-flex rounded-full border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  v{selectedDefinition.version}
                </span>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Entity Data Form -->
  {#if selectedDefinition && schemaFields.length > 0}
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Entity Data
      </h2>
      <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Fill in the entity fields
      </p>

      <form on:submit={handleSubmit} class="space-y-6">
        {#each schemaFields as [fieldName, fieldDef]}
          {@const inputType = renderFieldInput(fieldName, fieldDef)}
          <div class="space-y-2">
            <label
              for={fieldName}
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {fieldDef.title || fieldName}
              {#if fieldDef.required}
                <span class="text-red-600">*</span>
              {/if}
            </label>
            {#if fieldDef.description}
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {fieldDef.description}
              </p>
            {/if}

            {#if inputType === "textarea"}
              <textarea
                id={fieldName}
                bind:value={entityData[fieldName]}
                placeholder={fieldDef.placeholder || ""}
                rows="4"
                on:input={() => handleFieldChange(fieldName)}
                class="block w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 {validationErrors[
                  fieldName
                ]
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'}"
              ></textarea>
            {:else if inputType === "checkbox"}
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={fieldName}
                  bind:checked={entityData[fieldName]}
                  on:change={() => handleFieldChange(fieldName)}
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <label
                  for={fieldName}
                  class="text-sm font-normal text-gray-700 dark:text-gray-300"
                >
                  {fieldDef.label || "Enable"}
                </label>
              </div>
            {:else if inputType === "json"}
              <textarea
                id={fieldName}
                value={JSON.stringify(entityData[fieldName], null, 2)}
                on:input={(e) => {
                  try {
                    entityData[fieldName] = JSON.parse(e.currentTarget.value);
                    handleFieldChange(fieldName);
                  } catch (err) {
                    // Invalid JSON
                  }
                }}
                placeholder={fieldDef.placeholder || "Enter JSON..."}
                rows="6"
                class="block w-full rounded-lg border px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 {validationErrors[
                  fieldName
                ]
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'}"
              ></textarea>
            {:else if inputType === "enum-select"}
              <select
                id={fieldName}
                bind:value={entityData[fieldName]}
                on:change={() => handleFieldChange(fieldName)}
                class="block w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 {validationErrors[
                  fieldName
                ]
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'}"
              >
                <option value="">Select an option...</option>
                {#each fieldDef.enum as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
            {:else if inputType === "number"}
              <input
                id={fieldName}
                type="number"
                bind:value={entityData[fieldName]}
                placeholder={fieldDef.placeholder || ""}
                min={fieldDef.minimum}
                max={fieldDef.maximum}
                step={fieldDef.type === "integer" ? "1" : "any"}
                on:input={() => handleFieldChange(fieldName)}
                class="block w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 {validationErrors[
                  fieldName
                ]
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'}"
              />
            {:else}
              <input
                id={fieldName}
                type={getFieldInputType(fieldDef)}
                bind:value={entityData[fieldName]}
                placeholder={fieldDef.placeholder || ""}
                minlength={fieldDef.minLength}
                maxlength={fieldDef.maxLength}
                on:input={() => handleFieldChange(fieldName)}
                class="block w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 {validationErrors[
                  fieldName
                ]
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'}"
              />
            {/if}

            {#if validationErrors[fieldName]}
              <p class="flex items-center gap-1 text-sm text-red-600">
                <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                {validationErrors[fieldName]}
              </p>
            {/if}
          </div>
        {/each}

        <div class="flex justify-end gap-2 border-t pt-4 dark:border-gray-700">
          <a
            href="/dynamic-entities"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={isSubmitting || !selectedDefinitionId}
            class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {#if isSubmitting}
              Creating...
            {:else}
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
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Create Entity
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
