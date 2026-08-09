# Admin and Auth SPA Migration Design

**Date:** 2026-08-09

**Status:** Approved

## Objective

Complete the Cococord Admin and Auth migration from JSP/SiteMesh rendering to the existing React, Vite, TypeScript, Tailwind CSS, Zustand, and TanStack Query frontend while preserving the legacy screens and behavior exactly.

The migration must not invent new layouts, controls, data, workflows, or backend capabilities. The current JSP files, their paired static JavaScript and CSS, and the existing Java controllers and DTOs are the source of truth.

## Source of Truth

The legacy views currently live under `src/main/resources/META-INF/resources/WEB-INF/`, despite older references to `src/main/resources/WEB-INF/`.

The parity sources are:

- `views/auth/login.jsp`
- `views/register.jsp`
- `views/forgot-password.jsp`
- `views/reset-password.jsp`
- `views/admin/index.jsp`
- every JSP under `views/admin/fragments/`
- `decorators/public.jsp` and `decorators/admin.jsp`
- `static/css/auth-glass.css`
- every relevant stylesheet under `static/admin/css/`
- `static/admin/js/*.js`, including `mock-data.js`
- `ViewController`, `AdminController`, `AuthController`, and `AdminApiController`
- the request and response DTOs exposed by the existing Auth and Admin APIs

When the sources disagree, visible JSP structure and text take precedence for presentation, paired legacy JavaScript takes precedence for interaction behavior, and existing REST DTOs take precedence for wire formats.

## Scope

### Auth screens

- Login
- Registration
- Forgot password
- Reset password
- Existing password visibility controls
- Existing validation rules and messages
- Existing loading, success, error, timeout, and notification states
- Existing query-parameter behavior for `registered`, `reset`, `next`, and reset tokens
- Existing role-aware post-login redirects
- Existing local-storage and cookie session persistence

### Admin shell and sections

- Dashboard
- Users
- Servers
- Reports
- Message moderation
- Roles and permissions
- Statistics
- Audit log
- Settings
- Sidebar, header, breadcrumbs, navigation, tabs, tables, filters, pagination, bulk actions, charts, details, context menus, dialogs, notifications, loading states, empty states, and responsive behavior present in the legacy UI

### Backend and platform work

- Preserve and test existing Auth REST endpoints.
- Use and adjust existing Admin REST endpoints only when an existing real-data screen requires a compatible response.
- Do not add APIs for legacy mock-only behavior.
- Remove MVC view controllers once their URL behavior is represented by React routing.
- Remove Jasper, JSTL, and SiteMesh dependencies.
- Forward eligible application routes to the packaged React `index.html`.

## Explicit Non-Goals

- No redesign or modernization of legacy presentation.
- No new admin workflows, fields, filters, actions, metrics, or permissions.
- No real backend implementation for legacy mock-only AutoMod, global-role, audit, or statistics behavior.
- No replacement of legacy mock values with newly invented values.
- No unrelated refactoring of chat, navigation, voice, server, or direct-message features.
- No changes to established REST, JWT, STOMP, or WebRTC contracts outside compatibility fixes required by this migration.

## Architecture

The React application becomes the only page renderer. Spring Boot remains responsible for REST APIs, WebSocket endpoints, security, uploads, and static resource delivery.

The frontend is divided into four boundaries:

1. Route components select Auth, Admin, or the existing application shell.
2. Feature components reproduce the JSP structure and render state.
3. TanStack Query hooks own server-backed Admin and Auth request state.
4. Typed legacy-mock modules own only data that already came from `mock-data.js` or equivalent legacy fallback functions.

Zustand remains limited to client-owned session and cross-route UI state. Server response collections are not duplicated into Zustand.

## Frontend Design

### Auth feature

`frontend/src/features/auth/` will contain focused components and hooks for the four Auth pages. Shared presentation and request behavior may be extracted only where the JSP pages already repeat it, such as the glass page shell, password visibility control, notifications, timeout/error parsing, and message-response mutation handling.

Each component will retain the legacy:

- Vietnamese copy
- form field order
- labels, placeholders, hints, required markers, and constraints
- SVG icons
- links and destinations
- button text and transitions
- 15-second request timeout behavior
- five-second notification dismissal behavior
- delayed success redirects

The existing `/api/auth/*` endpoints and DTO fields remain authoritative. React adapters may normalize errors but must not change request or response JSON.

### Admin feature

`frontend/src/features/admin/` will contain an Admin shell, one page component for each legacy fragment, feature-local API types and adapters, query/mutation hooks, and reusable controls extracted from repeated legacy markup.

The React component tree will preserve the semantic grouping and class-level visual structure of the JSP fragments. Large legacy scripts will be separated by responsibility instead of becoming one monolithic component, while retaining the same visible behavior.

Examples of bounded units include:

- dashboard KPI cards, platform overview, resource bars, activity list, and charts
- user table, filters, pagination, presence display, bulk controls, and detail/moderation dialogs
- server table, filters, context menu, details, reports, audit, and action dialogs
- report tabs, filters, list, pagination, and detail dialog
- message tabs, selection, mock AutoMod rules, and existing placeholder actions
- role cards, permission matrix, and the legacy mock-backed editor states
- audit filters, timeline, and export behavior
- settings navigation, forms, save/reset behavior, and legacy test-email behavior

### Legacy mock data

The existing `static/admin/js/mock-data.js` values will be ported without semantic changes into TypeScript. Additional legacy fallback generators may be ported where their exact behavior is part of a screen.

Rules for mock migration:

- Preserve existing values, identifiers, labels, statuses, timestamps, grouping, and ordering.
- Preserve the legacy decision of when API data is used and when mock fallback data is used.
- Do not create new mock records or fields.
- Do not create backend endpoints for mock-only behavior.
- Preserve existing `coming soon`, no-op, disabled, dummy, and toast-only actions.

### Styling

The old CSS is a visual specification, not a runtime dependency of the migrated feature.

Legacy selectors will be translated into Tailwind utilities and Tailwind component-layer classes. Existing class names may be retained when they make exact parity and component reuse clearer. Complex animations, pseudo-elements, CSS variables, chart canvas sizing, responsive rules, and state selectors may remain as feature-scoped declarations inside Tailwind layers when direct utility classes cannot express them faithfully.

The migration will not introduce CSS-in-JS, a second component framework, or newly designed visual tokens. Inline styles will be replaced by equivalent Tailwind utilities or approved component-layer declarations.

The existing Bootstrap Icons and chart behavior may be retained through their current assets or package equivalents only to reproduce legacy visuals; they must not be used to add new UI.

## Routing Design

React Router will own page routing.

Auth routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Admin routes and compatibility aliases:

- `/admin`
- `/admin/dashboard`
- `/admin/users`
- `/admin/servers`
- `/admin/reports`
- `/admin/messages`
- `/admin/roles`
- `/admin/stats`
- `/admin/audit`
- `/admin/settings`

Legacy `/admin#<section>` links will continue to select the same section. Existing direct admin URLs will resolve without server redirects.

The current application routes outside Admin and Auth remain intact. This migration will not invent replacements for unrelated JSP pages.

## Data Flow

### Real API-backed behavior

React Query hooks will call the existing endpoints used by the legacy scripts, including the existing Auth endpoints and Admin dashboard, user, server, report, message, role, audit, statistics, and settings endpoints.

API modules will:

- attach the current access token consistently
- preserve existing query parameter names and request-body fields
- parse Spring `Page<T>` responses without changing their shape
- surface existing backend validation and authorization messages
- invalidate only affected query keys after successful mutations
- preserve the legacy timeout and redirect behavior where applicable

### Mock-backed behavior

Mock-backed pages and controls read from the typed legacy mock module. If the legacy code attempted an API request and then fell back to mock data, the React hook will preserve that sequence and fallback condition.

No request will be added solely to replace an existing mock-backed interaction.

## Backend Design

### Controllers

`AuthController` remains the REST authority for Auth operations.

`AdminApiController` remains the REST authority for real Admin operations. It may receive narrowly scoped compatibility corrections when a legacy real-data screen proves that its JSON does not match its existing DTO contract.

`ViewController` and `AdminController` will be removed after React route parity is covered because they only render JSPs or redirect between JSP routes. Their route behavior will be represented in React and the SPA fallback instead of replacement MVC views.

No new REST endpoint will be introduced for a feature that was mock-only in the legacy frontend.

### SSR dependency cleanup

Remove from `pom.xml`:

- `org.apache.tomcat.embed:tomcat-embed-jasper`
- `jakarta.servlet.jsp.jstl:jakarta.servlet.jsp.jstl-api`
- `org.glassfish.web:jakarta.servlet.jsp.jstl`
- `org.sitemesh:sitemesh`

Any JSP/SiteMesh-only configuration that becomes uncompilable or unused after this removal will also be removed, but unrelated static resources will be preserved until no migrated screen references them.

### SPA asset packaging

The production React build must place or copy Vite's `dist` output into Spring Boot's classpath static output so that `index.html` and hashed assets are available in the packaged application. This integration must not erase existing static uploads, images, or unrelated resources.

Development continues to use Vite and its existing backend proxy.

### SPA fallback

`WebMvcConfig` will serve existing static resources first and forward eligible client routes to React's `index.html`.

The fallback must not forward:

- `/api` or `/api/**`
- `/ws` or `/ws/**`
- `/upload` or `/upload/**`
- `/css/**`
- `/js/**`
- `/images/**`
- `/assets/**`
- Swagger/OpenAPI paths
- requests for files with extensions

Mapped REST and WebSocket handlers retain precedence. Unknown excluded paths return their normal 404/authorization response rather than HTML.

## Security

Spring Security remains authoritative for `/api/admin/**` and Admin page entry. React route guards improve client navigation but do not replace backend authorization.

Auth pages remain public. Existing JWT storage and cookie behavior are preserved for compatibility. API error responses remain JSON; browser page routes may resolve through the SPA shell.

## Error and State Handling

Every migrated screen must preserve applicable legacy states:

- initial loading or skeleton
- successful content
- empty content
- validation failure
- request timeout
- network/API failure
- mock fallback where the legacy script used one
- unauthorized or forbidden response
- mutation success and failure notification
- disabled, pending, selected, active, expanded, modal-open, and placeholder states

Error handling must not silently replace a real-data failure with newly invented content.

## Testing Strategy

### Frontend

Add Vitest, React Testing Library, and a browser-like test environment because the current Vite project has no frontend test runner.

Parity tests will cover:

- exact Auth fields, constraints, links, visibility toggles, notifications, request payloads, and redirects
- Admin route and legacy-hash selection
- representative page structure and controls for all nine Admin sections
- real API response rendering and mutation requests
- exact legacy mock fallback records and ordering
- existing `coming soon`, disabled, dummy, and no-op states
- loading, empty, error, timeout, and unauthorized states

### Backend

Add Spring MVC tests for:

- existing Auth and Admin endpoint paths and representative JSON shapes
- Admin authorization
- SPA forwarding for extensionless application routes
- non-forwarding for API, WebSocket, upload, static, asset, Swagger, and file-extension paths
- direct Auth and Admin deep links resolving to React `index.html`

### Verification

Completion requires:

- frontend tests passing
- frontend TypeScript/Vite build passing
- backend tests passing
- Maven package passing without JSP/SiteMesh dependencies
- a production artifact containing React `index.html` and hashed assets
- no new mock data or mock-only backend APIs
- no unintended changes to the user's existing unrelated frontend work

## Migration Sequence

1. Establish frontend and backend compatibility tests.
2. Build shared Auth primitives and migrate all Auth routes.
3. Build the Admin shell, routing, styling foundation, and exact legacy mock module.
4. Migrate Admin pages in bounded groups, preserving real-versus-mock data behavior.
5. Verify API shapes and make only required compatibility corrections.
6. Replace MVC view routing with React routing and the SPA fallback.
7. Remove SSR dependencies and obsolete SSR configuration.
8. Verify tests, builds, packaging, deep links, and excluded routes.

## Acceptance Criteria

- Auth and Admin no longer depend on JSP rendering.
- Every legacy Auth page and Admin section is available as React UI with 1:1 structure and behavior.
- Existing mock-backed content and placeholder actions behave as before.
- Existing real API-backed actions use the same endpoints and wire formats.
- No new feature, layout, control, mock record, or mock-only API exists.
- Legacy Admin hash links and direct Admin URLs work.
- Non-API application routes support browser refresh through the React fallback.
- API, WebSocket, upload, static, asset, Swagger, and file requests are never rewritten to HTML.
- Jasper, JSTL, and SiteMesh dependencies are absent.
- Frontend and backend automated verification passes.
