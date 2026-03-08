<script lang="ts">
  import { X, MessageCircle } from "@lucide/svelte";

  let { message, prompt }: { message: string; prompt: string } = $props();

  let dismissed = $state(false);
</script>

{#if !dismissed}
  <div
    data-testid="opey-insight-bar"
    class="flex items-center gap-3 border-b border-surface-200-800 bg-surface-50-950 px-4 py-2 text-sm"
  >
    <MessageCircle class="size-4 shrink-0 text-tertiary-500" />
    <span class="flex-1">{message}</span>
    <a
      href="/?ask={encodeURIComponent(prompt)}"
      data-testid="opey-insight-ask-button"
      class="btn btn-sm preset-tonal-tertiary shrink-0"
    >
      Ask Opey
    </a>
    <button
      type="button"
      data-testid="opey-insight-dismiss"
      class="hover:text-tertiary-400"
      onclick={() => (dismissed = true)}
      aria-label="Dismiss insight bar"
    >
      <X class="size-4" />
    </button>
  </div>
{/if}
