# Dynamic Endpoints — Expansion Plan

## Goal

Turn the Dynamic Endpoints section from "create and delete" into a complete operator workflow: create a Dynamic Endpoint, route it to a real backend, constrain the request bodies with JSON Schema validation, and see at a glance which OBP roles are required for every action.

---

## Current state

Already implemented:

- `src/routes/(protected)/dynamic-endpoints/system` — list / detail / create / host update
- `src/routes/(protected)/dynamic-endpoints/bank/[bank_id]` — same for bank-level
- `src/routes/(protected)/integration/method-routings` — generic Method Routing CRUD (not linked from Dynamic Endpoints)
- `src/routes/(protected)/rbac/...` — role / entitlement management

Not yet implemented:

- No JSON Schema Validation UI anywhere.
- No Endpoint Mapping UI (needed when a Dynamic Endpoint's `host` is `dynamic_entity`).
- No role-requirement surfacing on the Dynamic Endpoint pages.
- Method Routing exists only as a standalone page; no deep link from a specific Dynamic Endpoint's operation.

---

## Key concepts (so design decisions make sense)

A Dynamic Endpoint is a Swagger/OpenAPI doc that OBP ingests. Each operation in that doc gets a generated OBP `operation_id` (e.g. `OBPv4.0.0-GET_account`). From there, three OBP features can be attached per `operation_id`:

1. **Host** on the Swagger doc selects the behaviour class:
   - `obp_mock` — return the Swagger `example` response.
   - `dynamic_entity` — route to an OBP Dynamic Entity (needs Endpoint Mapping).
   - a URL — proxy to an external backend (typically paired with a Method Routing for transformation).
2. **Method Routing** — routes a method/operation to a connector (`mapped`, `rest_vMar2019`, `rabbitmq_vOct2024`, `cardano_vJun2025`, ...) with optional `bank_id_pattern`, `parameters`, and in/out JSON mapping. This is how you get **real data** out of an endpoint.
3. **JSON Schema Validation** — attached per `operation_id`, constrains POST/PUT request bodies. Independent of host/method routing.

---

## Relevant OBP endpoints (reference)

### Dynamic Endpoint (existing UI)
- `POST /obp/v4.0.0/management/dynamic-endpoints` — role `CanCreateDynamicEndpoint`
- `GET /obp/v4.0.0/management/dynamic-endpoints` — role `CanGetDynamicEndpoints`
- `GET /obp/v4.0.0/management/dynamic-endpoints/{id}`
- `DELETE /obp/v4.0.0/management/dynamic-endpoints/{id}` — role `CanDeleteDynamicEndpoint`
- `PUT /obp/v4.0.0/management/dynamic-endpoints/{id}/host` — role `CanUpdateDynamicEndpoint`
- Bank-level equivalents under `/management/banks/{bank_id}/dynamic-endpoints/...`

### Method Routing
- `POST /obp/v3.1.0/management/method_routings` — role `CanCreateMethodRouting`
- `GET /obp/v3.1.0/management/method_routings`
- `PUT /obp/v3.1.0/management/method_routings/{id}`
- `DELETE /obp/v3.1.0/management/method_routings/{id}`
- Helper: `GET /obp/v6.0.0/system/connector-method-names`
- Fields: `method_name`, `connector_name`, `is_bank_id_exact_match`, `bank_id_pattern?`, `parameters[]`

### JSON Schema Validation (per operation_id)
- `POST /obp/v4.0.0/management/json-schema-validations/{OPERATION_ID}` — role `CanCreateJsonSchemaValidation`
- `GET /obp/v4.0.0/management/json-schema-validations/{OPERATION_ID}`
- `PUT /obp/v4.0.0/management/json-schema-validations/{OPERATION_ID}`
- `DELETE /obp/v4.0.0/management/json-schema-validations/{OPERATION_ID}`
- `GET /obp/v4.0.0/management/json-schema-validations` — list all
- `GET /obp/v4.0.0/endpoints/json-schema-validations` — public, no auth (useful for read-only preview)
- Request body: a JSON Schema doc (draft-07 is the OBP example).

### Endpoint Mapping (for `host: dynamic_entity`)
- `POST /obp/v4.0.0/management/endpoint-mappings` — role `CanCreateEndpointMapping`
- plus GET/PUT/DELETE + bank-level equivalents

### Role names (to surface on the UI)
System-level unless noted:
- `CanCreateDynamicEndpoint`, `CanGetDynamicEndpoints`, `CanDeleteDynamicEndpoint`, `CanUpdateDynamicEndpoint`
- Bank equivalents (`...AtBank`) for `/banks/{bank_id}/dynamic-endpoints` routes — confirm via schema when wiring up
- `CanCreateMethodRouting`, `CanGetMethodRoutings`, `CanUpdateMethodRouting`, `CanDeleteMethodRouting`
- `CanCreateJsonSchemaValidation`, `CanGetJsonSchemaValidation`, `CanUpdateJsonSchemaValidation`, `CanDeleteJsonSchemaValidation`
- `CanCreateEndpointMapping`, `CanGetEndpointMappings`, `CanUpdateEndpointMapping`, `CanDeleteEndpointMapping`

---

## Proposed UX: make the detail page the operator hub

Right now `/dynamic-endpoints/system/[id]` and the bank equivalent show the Swagger summary and a host-update form. Everything else lives elsewhere or nowhere. The plan turns the detail page into a per-operation table with inline actions.

Page layout after the changes:

```
┌─ Dynamic Endpoint: <title>
│  host: <host>  [Edit Host]     dynamic_endpoint_id: <id>
│
├─ Operations (from the Swagger doc)
│  ┌─ GET /accounts/{account_id}    operation_id: OBPv6.0.0-GET_account ─┐
│  │   Method Routing:   mapped → <connector>   [Configure routing]        │
│  │   JSON Schema:      none                    [Add validation]          │
│  │   Endpoint Mapping: n/a (host != dynamic_entity)                     │
│  └───────────────────────────────────────────────────────────────────────┘
│  ... one row per operation ...
│
├─ Roles required (collapsible help panel)
│     Listed per action, same pattern as /consumers/:id/edit
│
└─ Danger zone: Delete endpoint
```

The existing `/integration/method-routings` stays as a cross-cutting admin page; from the Dynamic Endpoint detail page we **deep-link into it with prefilled query params** for the first iteration, then upgrade to inline forms later.

---

## Phased delivery

Each phase ships independently.

### Phase 1 — Roles surfacing (smallest, highest leverage)

- Add an `actionRoles` dict to the Dynamic Endpoint server load (same pattern as `consumers/[consumer_id]/edit/+page.server.ts`).
- Pull user entitlements via `user.entitlements` (already available in other pages).
- Pass `canCreate`, `canDelete`, `canUpdate` derivations into the detail and list pages.
- Use the existing `MissingRoleAlert` component on action attempts.
- No new OBP calls, no new routes.

**Files touched:** 4 existing server+page files in `dynamic-endpoints/`.

### Phase 2 — Per-operation table on the detail page

- Parse the Swagger doc on the server (already parsed on the client) to produce `operations: [{path, method, operation_id, summary}]`.
- Render the operation table described above with empty Method Routing / JSON Schema cells.
- No backend changes yet — this is just UI scaffolding the next phases hang off.

### Phase 3 — JSON Schema Validation per operation

- On detail page load, fire one `GET /management/json-schema-validations` call and match existing validations to each operation's `operation_id` (one list call beats N per-operation calls).
- Per-operation actions:
  - "Add validation" → opens a panel with a JSON textarea seeded from the operation's Swagger schema (if any), POST to `/management/json-schema-validations/{operation_id}`.
  - "Edit validation" → PUT.
  - "Delete validation" → DELETE.
- Reuse the existing JSON-textarea pattern from the create-dynamic-endpoint page.

**New SvelteKit routes:**
- `/dynamic-endpoints/.../operation/[operation_id]/schema-validation/+page.server.ts` (optional — could be inline panel instead).

**Decision:** inline panel on the detail page is simpler for v1; split to its own route only if the editor grows.

### Phase 4 — Method Routing deep-link

- Add "Configure routing" per operation that opens `/integration/method-routings?method_name=<derived>&operation_id=<op>&prefilled=true`.
- Teach `method-routings/+page.svelte` to honour those query params and pre-open the create form with fields populated.
- Show the current routing summary on the operation row by calling `GET /method_routings?active=true` once at page load and filtering by `method_name`.

**Open question:** the OBP `method_name` on a `method_routing` isn't always the same as the Dynamic Endpoint's `operation_id` — it's the Scala connector method (e.g. `getBank`). For `obp_mock` endpoints there is no connector call, so a method routing is only meaningful when host is `dynamic_entity` or an external URL. We should only show "Configure routing" in those cases, and document the mapping rule clearly.

### Phase 5 — Endpoint Mapping (only when `host: dynamic_entity`)

- Conditionally render an "Endpoint Mapping" cell per operation when the endpoint's host is `dynamic_entity`.
- CRUD via `/management/endpoint-mappings` + bank variant.
- Cross-links into `/dynamic-entities/...` so operators can jump to the referenced entity.

### Phase 6 (stretch) — Try it panel

- Inline "Send test request" that calls the created dynamic endpoint via `/proxy/...` and shows the response. This closes the loop: create → route → validate → try.

---

## Cross-cutting decisions

**One server load, many features.** The detail page server load should do all the related-resource fetches (endpoint, validations list, routings list, entitlements, maybe endpoint-mappings) in parallel and fail non-fatally per feature — same pattern as `consumers/[consumer_id]/edit/+page.server.ts`. This keeps the client dumb.

**Follow the passthrough convention.** Per `CLAUDE.md` memory: prefer `/proxy/obp/...` for reads and only add `/backend/...` routes when the browser can't talk directly (auth-bound mutations already use `/backend`). Match the existing dynamic-endpoint code — it uses `/proxy/` for create and `/backend/` for host-update; pick one and be consistent going forward.

**Don't hide OBP errors.** The existing dynamic-endpoint pages already use `extractErrorFromResponse`/`formatErrorForDisplay`. Reuse.

**Bank vs system.** Mirror whatever system-level UI ends up looking like for the bank routes. Avoid duplicating logic — factor a `DynamicEndpointDetail.svelte` component that both routes render.

---

## Open questions / decisions needed before coding

1. **Method Routing linkage.** Is the mapping "Dynamic Endpoint operation ↔ method_routing.method_name" ever 1:1, or do operators typically point multiple operations at one routing? This affects whether Phase 4 shows a 1:1 "current routing" cell or a "routings that match this operation" list.
2. **Bank-level roles.** Confirm via `get_endpoint_schema` whether bank-level create/update/delete dynamic-endpoint endpoints use `Can...AtAnyBank`-style roles. Schema query pending for the bank routes.
3. **Inline vs routed editors.** JSON Schema editing inline is fine for small schemas, but a Monaco/codemirror editor on a full route is nicer once schemas get large. Start inline; upgrade only if users complain.
4. **Try-it panel (Phase 6).** Worth doing, or leave to the API Explorer? The appeal is "verify the whole chain without leaving the page" — even a curl snippet on the operation row beats nothing.
