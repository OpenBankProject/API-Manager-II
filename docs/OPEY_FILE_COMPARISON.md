# Opey & Chat File Comparison: OBP-Portal vs API-Manager-II

> Generated: 2026-03-08
>
> OBP-Portal is the **master** for all Opey-related code.
> API-Manager-II should match it exactly.

## Identical Files (19 of 24)

| # | File | Status |
|---|------|--------|
| 1 | `src/lib/opey/types.ts` | IDENTICAL |
| 2 | `src/lib/opey/controllers/ChatController.ts` | IDENTICAL |
| 3 | `src/lib/opey/controllers/SessionController.ts` | IDENTICAL |
| 4 | `src/lib/opey/controllers/ToolCallController.ts` | IDENTICAL |
| 5 | `src/lib/opey/state/ChatState.ts` | IDENTICAL |
| 6 | `src/lib/opey/state/SessionState.ts` | IDENTICAL |
| 7 | `src/lib/opey/services/ChatService.ts` | IDENTICAL |
| 8 | `src/lib/opey/services/RestChatService.ts` | IDENTICAL |
| 9 | `src/lib/opey/services/SessionService.ts` | IDENTICAL |
| 10 | `src/lib/opey/services/ConsentSessionService.ts` | IDENTICAL |
| 11 | `src/lib/opey/services/AuthStrategy.ts` | IDENTICAL |
| 12 | `src/lib/opey/utils/roles.ts` | IDENTICAL |
| 13 | `src/lib/opey/utils/chatToMarkdown.ts` | IDENTICAL |
| 14 | `src/lib/components/OpeyChat.svelte` | IDENTICAL |
| 15 | `src/lib/components/ChatMessage.svelte` | IDENTICAL |
| 16 | `src/lib/components/tool-messages/index.ts` | IDENTICAL |
| 17 | `src/lib/components/tool-messages/ToolMessage.svelte` | IDENTICAL |
| 18 | `src/lib/components/tool-messages/ToolError.svelte` | IDENTICAL |
| 19 | `src/lib/markdown/helper-funcs.ts` | IDENTICAL |
| 20 | `src/routes/api/opey/auth/+server.ts` | IDENTICAL |

## Files With Trivial Whitespace-Only Differences (4 of 24)

These have no functional code differences -- only trailing whitespace on some lines.

| # | File | Difference |
|---|------|------------|
| 21 | `src/lib/opey/services/OBPIntegrationService.ts` | Line 83: OBP-Portal has trailing tab, API-Manager-II does not |
| 22 | `src/lib/components/tool-messages/ObpApiResponse.svelte` | Lines 5, 7, 10-11, 17, 19-20: OBP-Portal has trailing spaces |
| 23 | `src/lib/components/tool-messages/DefaultToolResponse.svelte` | Line 5: OBP-Portal has trailing space |
| 24 | `src/routes/api/opey/consent/+server.ts` | Lines 11, 16: OBP-Portal has trailing space in comment |

## Files Only in API-Manager-II (not in OBP-Portal)

| File | Purpose |
|------|---------|
| `src/lib/opey/bootstrap/opeyNotebook.ts` | Bootstraps `opey_notebook` dynamic entity in OBP at startup |
| `src/routes/api/opey/stream/+server.ts` | SSE stream proxy (legacy, no longer used for streaming) |
| `src/routes/api/opey/stream/[threadId]/stop/+server.ts` | Stop stream proxy |
| `src/routes/api/opey/stream/[threadId]/regenerate/+server.ts` | Regenerate stream proxy |

> **Note:** The stream proxy routes exist because API-Manager-II originally proxied
> Opey streaming through SvelteKit. As of 2026-03-08, API-Manager-II connects directly
> to the Opey backend (via `PUBLIC_OPEY_BASE_URL`), matching OBP-Portal's architecture.
> These proxy routes are no longer used for the main chat flow but remain for reference.

## Files Only in OBP-Portal (not in API-Manager-II)

None.

## Key Architecture Notes

- **Svelte version**: Both projects must use Svelte `5.33.2`. Newer versions (5.43+) have a reactivity regression that breaks streaming (keyed `{#each}` blocks skip re-renders for mutated objects).
- **Opey connection**: Both projects connect directly to the Opey backend from the browser using `PUBLIC_OPEY_BASE_URL`. No SvelteKit proxy for streaming.
- **CORS**: The Opey backend's `CORS_ALLOWED_ORIGINS` must include the origin of each frontend (e.g. `http://localhost:5174` for Portal, `http://localhost:3003` for API-Manager-II).
- **Auth/consent**: Both projects proxy auth (`/api/opey/auth`) and consent (`/api/opey/consent`) through SvelteKit server-side routes (these need server-side secrets).
