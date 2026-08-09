# Admin and Auth SPA Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Cococord's Admin and Auth JSP/SiteMesh rendering with parity React screens, preserve legacy mock-backed behavior, and make Spring Boot serve the SPA safely for client routes.

**Architecture:** React Router owns Auth and Admin routes. Feature components reproduce the JSP structure, TanStack Query owns real API state, typed TypeScript constants preserve legacy `mock-data.js`, and Tailwind component layers reproduce the legacy CSS. Spring retains REST/WebSocket/security responsibilities, packages the Vite build, and resolves eligible application routes to React without rewriting API or static requests.

**Tech Stack:** Java 21, Spring Boot 3.5.9, Spring MVC/Security Test, React 18, TypeScript 5.7, Vite 6, Tailwind CSS 3.4, Zustand 5, TanStack Query 5, Vitest, React Testing Library.

## Global Constraints

- Treat the JSP, paired legacy JavaScript, paired legacy CSS, Java controllers, and DTOs listed in `docs/superpowers/specs/2026-08-09-admin-auth-spa-migration-design.md` as the source of truth.
- Do not add layouts, controls, fields, mock records, workflows, metrics, permissions, or backend capabilities absent from the legacy sources.
- Port existing legacy mocks and placeholder behavior exactly; do not create APIs for mock-only behavior.
- Preserve existing REST request and response JSON.
- Keep TanStack Query data out of Zustand.
- Use Tailwind utilities and Tailwind component layers; do not add CSS-in-JS or inline styles.
- Preserve unrelated user changes in the dirty worktree.
- Write each production change only after its focused test has failed for the expected reason.

---

## File Structure

### Frontend foundation

- Create `frontend/src/api/client.ts`: typed JSON requests, timeout handling, JWT attachment, refresh retry, and normalized API errors.
- Create `frontend/src/api/types.ts`: shared `ApiPage<T>`, `MessageResponse`, and API error-body types.
- Create `frontend/src/test/setup.ts`: jest-dom registration and test cleanup.
- Create `frontend/src/test/renderWithProviders.tsx`: QueryClient and MemoryRouter test wrapper.
- Create `frontend/vitest.config.ts`: jsdom test configuration.
- Modify `frontend/package.json`: test scripts and test dependencies.

### Auth feature

- Create `frontend/src/features/auth/api/authApi.ts`: login, register, forgot-password, and reset-password calls.
- Create `frontend/src/features/auth/api/types.ts`: exact Auth request/response contracts.
- Create `frontend/src/features/auth/components/AuthPageShell.tsx`: shared orb/card/back-link structure.
- Create `frontend/src/features/auth/components/AuthNotification.tsx`: legacy notification lifecycle.
- Create `frontend/src/features/auth/components/PasswordField.tsx`: legacy eye toggle.
- Modify `frontend/src/features/auth/components/Login.tsx`: use shared primitives and preserve login behavior.
- Create `frontend/src/features/auth/components/Register.tsx`.
- Create `frontend/src/features/auth/components/ForgotPassword.tsx`.
- Create `frontend/src/features/auth/components/ResetPassword.tsx`.
- Modify `frontend/src/features/auth/hooks/useLogin.ts` and add `useRegister.ts`, `useForgotPassword.ts`, and `useResetPassword.ts`.
- Create `frontend/src/features/auth/auth.css`: Tailwind component-layer translation of `auth-glass.css`.

### Admin feature

- Create `frontend/src/features/admin/api/types.ts`: exact Admin DTO and page contracts.
- Create `frontend/src/features/admin/api/adminApi.ts`: existing `/api/admin/**` calls only.
- Create `frontend/src/features/admin/api/queryKeys.ts`: stable Admin query keys.
- Create `frontend/src/features/admin/data/legacyMockData.ts`: typed verbatim port of `static/admin/js/mock-data.js`.
- Create `frontend/src/features/admin/hooks/`: query and mutation hooks grouped by legacy page.
- Create `frontend/src/features/admin/components/AdminShell.tsx`, `AdminSidebar.tsx`, `AdminHeader.tsx`, `AdminModal.tsx`, `AdminPageState.tsx`, and `Pagination.tsx`.
- Create `frontend/src/features/admin/pages/DashboardPage.tsx`, `UsersPage.tsx`, `ServersPage.tsx`, `ReportsPage.tsx`, `MessagesPage.tsx`, `RolesPage.tsx`, `StatsPage.tsx`, `AuditPage.tsx`, and `SettingsPage.tsx`.
- Create focused child components under `frontend/src/features/admin/components/dashboard/`, `users/`, `servers/`, `reports/`, `messages/`, `roles/`, `audit/`, and `settings/`.
- Create `frontend/src/features/admin/admin.css`: Tailwind component-layer translation of the legacy Admin CSS.

### Routing

- Modify `frontend/src/App.tsx`: Auth routes, protected Admin routes, direct Admin aliases, and existing application routes.
- Create `frontend/src/routes/AdminRoute.tsx`: authenticated ADMIN-role guard.
- Create `frontend/src/features/admin/routes/adminRoute.ts`: path/hash section parsing.

### Backend and packaging

- Add tests under `src/test/java/vn/cococord/controller/` and `src/test/java/vn/cococord/config/`.
- Modify `src/main/java/vn/cococord/config/WebMvcConfig.java`: static handling and SPA fallback resolver.
- Create `src/main/java/vn/cococord/config/SpaResourceResolver.java`: exclusion-aware SPA resolution.
- Modify `src/main/java/vn/cococord/security/SecurityConfig.java`: SPA/static matchers and obsolete JSP comments/matchers.
- Delete `src/main/java/vn/cococord/controller/ViewController.java`.
- Delete `src/main/java/vn/cococord/controller/admin/AdminController.java`.
- Delete `src/main/java/vn/cococord/controller/GlobalDataControllerAdvice.java` after confirming no non-view consumer.
- Delete `src/main/java/vn/cococord/config/SiteMeshConfig.java`.
- Delete `src/main/java/vn/cococord/config/JSPStaticResourceConfigurer.java`.
- Delete `src/main/java/vn/cococord/config/TomcatJSPConfiguration.java`.
- Delete `src/main/resources/sitemesh3.xml`.
- Modify `pom.xml`: remove SSR dependencies and build/copy `frontend/dist` into Spring static output.
- Modify `frontend/vite.config.ts`: deterministic production asset paths.

---

### Task 1: Install the Frontend Test Harness and Shared API Client

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/test/renderWithProviders.tsx`
- Create: `frontend/src/api/types.ts`
- Create: `frontend/src/api/client.ts`
- Test: `frontend/src/api/client.test.ts`

**Interfaces:**
- Produces: `ApiPage<T>`, `MessageResponse`, `ApiError`, and `apiRequest<T>(path, options)`.
- `apiRequest` accepts `method`, `body`, `headers`, `timeoutMs`, and `authenticated`; it returns parsed JSON or throws `ApiError`.
- A single 401 retry uses `POST /api/auth/refresh` with the stored refresh token, stores returned tokens, and repeats the original request.

- [ ] **Step 1: Add the failing API-client tests**

```ts
// frontend/src/api/client.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./client";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("apiRequest", () => {
  it("attaches the stored bearer token and parses JSON", async () => {
    localStorage.setItem("accessToken", "access-1");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: 7 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiRequest<{ value: number }>("/api/admin/stats")).resolves.toEqual({ value: 7 });
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/stats",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer access-1" }),
      }),
    );
  });

  it("exposes Spring validation messages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ errors: { email: "Email không hợp lệ" } }), { status: 400 }),
    );

    await expect(apiRequest("/api/auth/register", { authenticated: false })).rejects.toMatchObject<ApiError>({
      status: 400,
      message: "Email không hợp lệ",
    });
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/api/client.test.ts` from `frontend`.

Expected: FAIL because Vitest configuration and `apiRequest` do not exist.

- [ ] **Step 3: Add the test dependencies and configuration**

Add scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Add dev dependencies: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `@types/node`.

Configure `vitest.config.ts` with `environment: "jsdom"`, `setupFiles: ["./src/test/setup.ts"]`, CSS enabled, and Vite's React plugin.

- [ ] **Step 4: Implement the minimal shared contracts and client**

```ts
// frontend/src/api/types.ts
export interface ApiPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}
```

Implement `ApiError` with `status` and `body`, a 15-second default `AbortController`, JSON parsing, legacy `message`/`error`/`errors` extraction, token attachment, and one shared refresh promise.

- [ ] **Step 5: Run the test and full frontend build**

Run: `npm test -- src/api/client.test.ts`.

Expected: PASS.

Run: `npm run build`.

Expected: PASS without TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/src/test frontend/src/api
git commit -m "test: add frontend API test foundation"
```

### Task 2: Implement Auth API Hooks and Exact Request Behavior

**Files:**
- Create: `frontend/src/features/auth/api/types.ts`
- Create: `frontend/src/features/auth/api/authApi.ts`
- Modify: `frontend/src/features/auth/hooks/useLogin.ts`
- Create: `frontend/src/features/auth/hooks/useRegister.ts`
- Create: `frontend/src/features/auth/hooks/useForgotPassword.ts`
- Create: `frontend/src/features/auth/hooks/useResetPassword.ts`
- Test: `frontend/src/features/auth/api/authApi.test.ts`

**Interfaces:**
- `login(request: LoginRequest): Promise<AuthResponse>`
- `register(request: RegisterRequest): Promise<MessageResponse>`
- `forgotPassword(request: ForgotPasswordRequest): Promise<MessageResponse>`
- `resetPassword(request: ResetPasswordRequest): Promise<MessageResponse>`
- `persistAuthSession(response, rememberMe)` preserves the exact local-storage and cookie fields already used by `useAuthStore`.

- [ ] **Step 1: Write failing request-contract tests**

```ts
it("posts the legacy registration payload", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ success: true, message: "Đăng ký thành công! Bạn có thể đăng nhập ngay." }), { status: 200 }),
  );

  await register({
    username: "cococord_user",
    email: "user@example.com",
    displayName: "CoCoCord User",
    password: "Strong1!",
  });

  expect(fetch).toHaveBeenCalledWith(
    "/api/auth/register",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        username: "cococord_user",
        email: "user@example.com",
        displayName: "CoCoCord User",
        password: "Strong1!",
      }),
    }),
  );
});

it("posts reset token and newPassword only", async () => {
  await resetPassword({ token: "reset-token", newPassword: "Strong1!" });
  expect(fetch).toHaveBeenCalledWith(
    "/api/auth/reset-password",
    expect.objectContaining({ body: JSON.stringify({ token: "reset-token", newPassword: "Strong1!" }) }),
  );
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/auth/api/authApi.test.ts`.

Expected: FAIL because the typed Auth API module does not exist.

- [ ] **Step 3: Implement exact Auth transport types**

```ts
export interface LoginRequest { usernameOrEmail: string; password: string; deviceInfo?: string }
export interface RegisterRequest { username: string; email: string; password: string; displayName: string }
export interface ForgotPasswordRequest { email: string }
export interface ResetPasswordRequest { token: string; newPassword: string }
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: number | null;
  username?: string | null;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  loginAt?: string | null;
}
```

- [ ] **Step 4: Implement API calls and React Query mutations**

Use `apiRequest` with `authenticated: false` for Auth entry endpoints. Keep login's 15-second timeout, session persistence, seven-day remember-me cookie expiry, and Zustand update exactly.

- [ ] **Step 5: Run Auth API tests and build**

Run: `npm test -- src/features/auth/api/authApi.test.ts`.

Expected: PASS.

Run: `npm run build`.

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/auth/api frontend/src/features/auth/hooks
git commit -m "feat: add typed auth mutations"
```

### Task 3: Migrate All Auth JSP Screens and Routes

**Files:**
- Create: `frontend/src/features/auth/components/AuthPageShell.tsx`
- Create: `frontend/src/features/auth/components/AuthNotification.tsx`
- Create: `frontend/src/features/auth/components/PasswordField.tsx`
- Modify: `frontend/src/features/auth/components/Login.tsx`
- Create: `frontend/src/features/auth/components/Register.tsx`
- Create: `frontend/src/features/auth/components/ForgotPassword.tsx`
- Create: `frontend/src/features/auth/components/ResetPassword.tsx`
- Create: `frontend/src/features/auth/auth.css`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/features/auth/components/AuthPages.test.tsx`

**Interfaces:**
- `AuthPageShell` receives `title`, `subtitle`, `logo`, `backLabel`, `maxWidthClass`, and children.
- `AuthNotification` receives `{ message, type, onClose }` and auto-dismisses after 5,000 ms.
- `PasswordField` receives the legacy input attributes and owns only visibility state.

- [ ] **Step 1: Write failing parity tests**

```tsx
it("renders the registration constraints from register.jsp", () => {
  renderWithProviders(<Register />, { route: "/register" });
  expect(screen.getByRole("heading", { name: "Tạo tài khoản" })).toBeInTheDocument();
  expect(screen.getByLabelText(/Tên đăng nhập/)).toHaveAttribute("pattern", "[a-zA-Z0-9_]+");
  expect(screen.getByLabelText(/Tên đăng nhập/)).toHaveAttribute("minlength", "3");
  expect(screen.getByLabelText("Email")).toHaveAttribute("maxlength", "150");
  expect(screen.getByLabelText("Tên hiển thị")).toHaveAttribute("maxlength", "50");
  expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("minlength", "8");
  expect(screen.getByRole("checkbox")).toBeRequired();
});

it("redirects reset-password without a token to forgot-password", () => {
  renderWithProviders(
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<div>forgot-password-route</div>} />
    </Routes>,
    { route: "/reset-password" },
  );
  expect(screen.getByText("forgot-password-route")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/auth/components/AuthPages.test.tsx`.

Expected: FAIL because three pages and shared components are missing.

- [ ] **Step 3: Translate the JSP markup without structural invention**

Use these exact sources:

- Login: `views/auth/login.jsp`
- Register: `views/register.jsp`
- Forgot password: `views/forgot-password.jsp`
- Reset password: `views/reset-password.jsp`

Preserve field order, Vietnamese text, SVG paths, links, button copy, password toggles, confirm-password client validation, password-strength rules, token parsing, notification text, and 1,000 ms success redirects.

- [ ] **Step 4: Translate auth styling into Tailwind layers**

Create `auth.css` with `@layer components` definitions for the existing `auth-*` class contract. Translate every selector used by the four React screens from `static/css/auth-glass.css`, including orbs, glass card, responsive widths, focus states, spinner, success state, and notification fadeout. Replace JSP inline widths with `w-full` and the register card width with `max-w-[480px]`.

- [ ] **Step 5: Add the four React Router routes**

```tsx
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

- [ ] **Step 6: Run parity tests and build**

Run: `npm test -- src/features/auth/components/AuthPages.test.tsx`.

Expected: PASS.

Run: `npm run build`.

Expected: PASS with correctly encoded Vietnamese source text.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/auth frontend/src/index.css frontend/src/App.tsx
git commit -m "feat: migrate auth pages to React"
```

### Task 4: Port Admin Contracts, Legacy Mocks, Shell, and Routing

**Files:**
- Create: `frontend/src/features/admin/api/types.ts`
- Create: `frontend/src/features/admin/api/queryKeys.ts`
- Create: `frontend/src/features/admin/api/adminApi.ts`
- Create: `frontend/src/features/admin/data/legacyMockData.ts`
- Create: `frontend/src/features/admin/routes/adminRoute.ts`
- Create: `frontend/src/features/admin/components/AdminShell.tsx`
- Create: `frontend/src/features/admin/components/AdminSidebar.tsx`
- Create: `frontend/src/features/admin/components/AdminHeader.tsx`
- Create: `frontend/src/features/admin/components/AdminModal.tsx`
- Create: `frontend/src/features/admin/components/AdminPageState.tsx`
- Create: `frontend/src/features/admin/components/Pagination.tsx`
- Create: `frontend/src/features/admin/admin.css`
- Create: `frontend/src/routes/AdminRoute.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/features/admin/data/legacyMockData.test.ts`
- Test: `frontend/src/features/admin/routes/adminRoute.test.ts`
- Test: `frontend/src/features/admin/components/AdminShell.test.tsx`

**Interfaces:**
- `AdminSection = "dashboard" | "users" | "servers" | "reports" | "messages" | "roles" | "stats" | "audit" | "settings"`.
- `resolveAdminSection(pathname, hash): AdminSection` accepts both direct URLs and legacy hashes.
- `legacyMockData` preserves the six top-level objects `dashboard`, `users`, `servers`, `reports`, `messages`, and `roles`.
- `AdminRoute` requires a token and `currentUser.role` equal to `ADMIN` or `ROLE_ADMIN`.

- [ ] **Step 1: Write failing mock and route tests**

```ts
it("preserves the legacy mock dashboard and role values", () => {
  expect(legacyMockData.dashboard.kpis[0]).toEqual({
    id: "total_users",
    label: "Total Users",
    value: 40689,
    trend: 8.5,
    trendDirection: "up",
    period: "vs last month",
  });
  expect(legacyMockData.roles.list.map((role) => role.name)).toEqual([
    "Administrator", "Moderator", "Support", "Verified", "Member",
  ]);
});

it.each([
  ["/admin", "", "dashboard"],
  ["/admin/users", "", "users"],
  ["/admin", "#servers", "servers"],
  ["/admin/dashboard", "#audit", "audit"],
])("resolves %s%s", (pathname, hash, expected) => {
  expect(resolveAdminSection(pathname, hash)).toBe(expected);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/admin/data/legacyMockData.test.ts src/features/admin/routes/adminRoute.test.ts`.

Expected: FAIL because the Admin feature does not exist.

- [ ] **Step 3: Define exact Admin transport interfaces**

Copy field names and nullable types from the Java DTOs used by `AdminApiController`, including dashboard/stat responses, `UserProfileResponse`, `ServerResponse`, `AdminReportResponse`, `AdminMessageResponse`, `AdminRoleResponse`, `AdminAuditLogResponse`, `AdminSettingsResponse`, `ServerMemberResponse`, and `ChannelResponse`. Represent Java `Long` as `number`, Mongo IDs as `string`, and timestamps as `string | null`.

- [ ] **Step 4: Port `mock-data.js` verbatim**

Convert object syntax and export it as a readonly TypeScript value. Preserve all records, values, labels, ordering, dates, colors, and permission groups. Do not normalize misspellings or rewrite text while porting.

- [ ] **Step 5: Implement Admin route resolution and guard**

Direct paths take precedence unless a valid legacy hash is present. Invalid paths and hashes resolve to `dashboard`. Unauthorized users navigate to `/login?next=<encoded admin URL>`; authenticated non-admin users navigate to `/app`.

- [ ] **Step 6: Translate the Admin decorator shell**

Use `decorators/admin.jsp`, `views/admin/index.jsp`, `static/admin/js/sidebar.js`, and `static/admin/js/router.js` as the exact shell source. Preserve sidebar groups, labels, icons, breadcrumbs, active states, mobile toggle, collapsible behavior, keyboard behavior, and page container structure.

- [ ] **Step 7: Establish Tailwind component layers**

Port the shared selectors from `variables.css`, `base.css`, `layout.css`, `components.css`, `buttons.css`, `forms.css`, `tables.css`, `modals.css`, `utilities.css`, `skeleton.css`, and `responsive.css` into `admin.css`. Retain the legacy class names used by translated JSX.

- [ ] **Step 8: Add Admin routes**

```tsx
<Route element={<AdminRoute />}>
  <Route path="/admin/*" element={<AdminShell />} />
</Route>
```

- [ ] **Step 9: Run tests and build**

Run: `npm test -- src/features/admin/data/legacyMockData.test.ts src/features/admin/routes/adminRoute.test.ts src/features/admin/components/AdminShell.test.tsx`.

Expected: PASS.

Run: `npm run build`.

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/features/admin frontend/src/routes/AdminRoute.tsx frontend/src/App.tsx frontend/src/index.css
git commit -m "feat: add admin SPA foundation"
```

### Task 5: Migrate Dashboard, Statistics, and Audit Pages

**Files:**
- Create: `frontend/src/features/admin/hooks/useAdminDashboard.ts`
- Create: `frontend/src/features/admin/hooks/useAdminStats.ts`
- Create: `frontend/src/features/admin/hooks/useAdminAudit.ts`
- Create: `frontend/src/features/admin/pages/DashboardPage.tsx`
- Create: `frontend/src/features/admin/pages/StatsPage.tsx`
- Create: `frontend/src/features/admin/pages/AuditPage.tsx`
- Create: focused components under `frontend/src/features/admin/components/dashboard/` and `audit/`
- Modify: `frontend/src/features/admin/admin.css`
- Test: `frontend/src/features/admin/pages/DashboardPage.test.tsx`
- Test: `frontend/src/features/admin/pages/StatsAndAuditPages.test.tsx`

**Interfaces:**
- Dashboard queries use `/api/admin/dashboard/summary`, `/api/admin/stats/overview`, `/api/admin/stats/new-users`, `/api/admin/audit-log/recent`, and `/api/admin/servers/top` exactly.
- Stats queries use `/api/admin/dashboard/stats?period=<period>` and `/api/admin/servers` exactly.
- Audit query uses `/api/admin/audit-log` with existing page, size, actionType, and actorId parameters.
- Legacy API failure falls back only where `dashboard.js`, `dashboard-v2.js`, `new-users-chart.js`, `stats.js`, or `audit.js` did so.

- [ ] **Step 1: Write failing page tests**

Test these exact visible structures:

```tsx
expect(screen.getByText("Hoạt động Server (7 ngày gần nhất)")).toBeInTheDocument();
expect(screen.getByText("Tổng quan nền tảng")).toBeInTheDocument();
expect(screen.getByText("Người dùng mới theo ngày")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "7 ngày" })).toHaveClass("active");
expect(screen.getByRole("heading", { name: "Audit Log" })).toBeInTheDocument();
expect(screen.getByLabelText("Action")).toBeInTheDocument();
```

Also test that a failed dashboard request renders the existing `legacyMockData.dashboard` values rather than new fallback values.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/admin/pages/DashboardPage.test.tsx src/features/admin/pages/StatsAndAuditPages.test.tsx`.

Expected: FAIL because the pages are missing.

- [ ] **Step 3: Implement hooks with exact fallback decisions**

Use TanStack Query for server state. Preserve range values `7`, `14`, and `30`, stats period values from the JSP, existing pagination defaults, and legacy export behavior. Do not introduce polling intervals beyond those already present in the legacy scripts.

- [ ] **Step 4: Translate the three JSP fragments**

Translate `dashboard.jsp`, `stats.jsp`, and `audit.jsp` section-for-section. Port chart drawing with the same datasets, labels, colors, legends, summaries, and empty/loading behavior used by the legacy scripts.

- [ ] **Step 5: Port page-specific CSS**

Translate `dashboard-v2.css`, `dashboard-top-servers.css`, `dashboard-platform-overview.css`, `charts.css`, and `audit.css` into the Admin Tailwind layer without changing dimensions or breakpoints.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/features/admin/pages/DashboardPage.test.tsx src/features/admin/pages/StatsAndAuditPages.test.tsx`.

Expected: PASS.

Run: `npm run build`.

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/admin/hooks frontend/src/features/admin/pages frontend/src/features/admin/components/dashboard frontend/src/features/admin/components/audit frontend/src/features/admin/admin.css
git commit -m "feat: migrate admin dashboard stats and audit"
```

### Task 6: Migrate User Management

**Files:**
- Create: `frontend/src/features/admin/hooks/useAdminUsers.ts`
- Create: `frontend/src/features/admin/pages/UsersPage.tsx`
- Create: `frontend/src/features/admin/components/users/UserFilters.tsx`
- Create: `frontend/src/features/admin/components/users/UserTable.tsx`
- Create: `frontend/src/features/admin/components/users/UserDetailModal.tsx`
- Create: `frontend/src/features/admin/components/users/UserModerationPanel.tsx`
- Create: `frontend/src/features/admin/components/users/UserBulkActions.tsx`
- Modify: `frontend/src/features/admin/admin.css`
- Test: `frontend/src/features/admin/pages/UsersPage.test.tsx`

**Interfaces:**
- List: `GET /api/admin/users?page&size&search&status&role&sortBy&sortDir`.
- Detail: `GET /api/admin/users/{userId}`.
- Create: `POST /api/admin/users` with the existing `AdminCreateUserRequest` fields.
- Ban/unban/mute/unmute/role/delete use the exact existing methods and query parameters.
- Presence continues to use the existing presence endpoints/realtime behavior; no Admin presence API is added.

- [ ] **Step 1: Write failing user-management tests**

Cover exact filters, columns, pagination, selection, bulk toolbar visibility, detail tabs, moderation forms, add-user form, and endpoint parameters. Include this request assertion:

```ts
expect(fetch).toHaveBeenCalledWith(
  "/api/admin/users/42/ban?reason=Spam&duration=7d",
  expect.objectContaining({ method: "POST" }),
);
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/admin/pages/UsersPage.test.tsx`.

Expected: FAIL because `UsersPage` is missing.

- [ ] **Step 3: Implement user queries and mutations**

Map Spring pages directly. Invalidate the user list, selected detail, dashboard summary, and affected presence display after successful mutations. Preserve the legacy debounce, page size, sort defaults, status text, role badges, avatar initials/colors, and notification messages.

- [ ] **Step 4: Translate `users.jsp`, `users.js`, and `user-detail-modal.js`**

Preserve every visible table column, stat card, context-menu action, modal tab, form field, confirmation, disabled state, and generated legacy mock audit event. Keep generated user-detail audit events mock-backed because the legacy code generated them locally.

- [ ] **Step 5: Port user modal styling**

Translate the user-related rules from `tables.css`, `modals.css`, and `user-detail-modal.css` into `admin.css`.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/features/admin/pages/UsersPage.test.tsx`.

Expected: PASS.

Run: `npm run build`.

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/admin/hooks/useAdminUsers.ts frontend/src/features/admin/pages/UsersPage.tsx frontend/src/features/admin/components/users frontend/src/features/admin/admin.css
git commit -m "feat: migrate admin user management"
```

### Task 7: Migrate Server Management

**Files:**
- Create: `frontend/src/features/admin/hooks/useAdminServers.ts`
- Create: `frontend/src/features/admin/pages/ServersPage.tsx`
- Create focused components under `frontend/src/features/admin/components/servers/`
- Modify: `frontend/src/features/admin/admin.css`
- Test: `frontend/src/features/admin/pages/ServersPage.test.tsx`

**Interfaces:**
- Preserve every existing server endpoint in `AdminApiController`, including stats, top, detail, members, channels, reports, audit, lock, unlock, suspend, unsuspend, delete, and transfer.
- Mutation parameters remain query parameters with the same names: `reason`, `durationHours`, `duration`, and `newOwnerId`.

- [ ] **Step 1: Write failing server-management tests**

Test the exact nine table columns, filters, sort controls, selection bar, context menu, modal tabs, member/channel/report/audit loading, and action dialogs. Assert lock requests:

```ts
expect(fetch).toHaveBeenCalledWith(
  "/api/admin/servers/7/lock?reason=Investigation&durationHours=24",
  expect.objectContaining({ method: "POST" }),
);
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/admin/pages/ServersPage.test.tsx`.

Expected: FAIL because `ServersPage` is missing.

- [ ] **Step 3: Implement server hooks**

Use exact pagination and filtering defaults from `servers.js`. Preserve list refresh, selected IDs, bulk action sequencing, mutation notifications, detail lazy loading, and query invalidation.

- [ ] **Step 4: Translate `servers.jsp` and paired scripts**

Translate `servers.js`, `server-detail-modal.js`, and `server-action-modals.js` into React state and focused components. Preserve context-menu placement, tab selection, confirmations, lock/suspend state-dependent copy, owner transfer, and destructive action wording.

- [ ] **Step 5: Port server styling**

Translate `servers.css`, `server-detail-modal.css`, and `server-action-modals.css` into `admin.css` with the same modal sizes, grids, responsive behavior, badge colors, and warning states.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/features/admin/pages/ServersPage.test.tsx`.

Expected: PASS.

Run: `npm run build`.

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/admin/hooks/useAdminServers.ts frontend/src/features/admin/pages/ServersPage.tsx frontend/src/features/admin/components/servers frontend/src/features/admin/admin.css
git commit -m "feat: migrate admin server management"
```

### Task 8: Migrate Reports, Messages, Roles, and Settings

**Files:**
- Create: `frontend/src/features/admin/hooks/useAdminReports.ts`
- Create: `frontend/src/features/admin/hooks/useAdminMessages.ts`
- Create: `frontend/src/features/admin/hooks/useAdminRoles.ts`
- Create: `frontend/src/features/admin/hooks/useAdminSettings.ts`
- Create: `frontend/src/features/admin/pages/ReportsPage.tsx`
- Create: `frontend/src/features/admin/pages/MessagesPage.tsx`
- Create: `frontend/src/features/admin/pages/RolesPage.tsx`
- Create: `frontend/src/features/admin/pages/SettingsPage.tsx`
- Create focused child components under corresponding feature directories.
- Modify: `frontend/src/features/admin/admin.css`
- Test: `frontend/src/features/admin/pages/ModerationAndSettingsPages.test.tsx`

**Interfaces:**
- Reports use existing list/detail/resolve/reject APIs and legacy mock fallback.
- Messages use existing list/delete APIs; approve is the existing client-only state change; AutoMod rules remain legacy mock data.
- Roles attempt existing list/create/update/delete APIs and preserve legacy fallback to `legacyMockData.roles`; permission groups remain mock-only.
- Settings use existing GET/PUT APIs; test email retains the legacy mock-success behavior because `/api/admin/settings/test-email` does not exist.

- [ ] **Step 1: Write failing parity tests**

Cover all legacy tabs, filters, stat cards, empty states, modal controls, role color fields, permission matrix groups, settings sections, save/reset buttons, and placeholder actions. Include assertions that:

```tsx
await user.click(screen.getByRole("button", { name: "Configure AutoMod" }));
expect(screen.getByText("AutoMod configuration (coming soon)")).toBeInTheDocument();
expect(screen.getByText("Administrator")).toBeInTheDocument();
expect(screen.getByText("Moderator")).toBeInTheDocument();
```

and that no request is sent for mock-only AutoMod rule creation or test-email success.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/admin/pages/ModerationAndSettingsPages.test.tsx`.

Expected: FAIL because the four pages are missing.

- [ ] **Step 3: Implement the four hook modules**

Encode the legacy real-versus-mock decision in each hook. Keep mock data read-only at module level; component-local copies may change for the duration of the page exactly where the old JavaScript changed arrays in memory.

- [ ] **Step 4: Translate the four JSP fragments and scripts**

Translate `reports.jsp/reports.js`, `messages.jsp/messages.js`, `roles.jsp/roles.js`, and `settings.jsp/settings.js`. Preserve every dummy pagination button, toast-only control, local toggle, mocked modal, and existing incomplete behavior.

- [ ] **Step 5: Port page-specific styling**

Translate `reports.css`, `messages.css`, `roles.css`, and `settings.css` into `admin.css` without changing visual hierarchy or responsive rules.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/features/admin/pages/ModerationAndSettingsPages.test.tsx`.

Expected: PASS.

Run: `npm run build`.

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/admin/hooks frontend/src/features/admin/pages frontend/src/features/admin/components frontend/src/features/admin/admin.css
git commit -m "feat: migrate remaining admin sections"
```

### Task 9: Add Backend API Compatibility and Security Tests

**Files:**
- Create: `src/test/java/vn/cococord/controller/AuthControllerContractTest.java`
- Create: `src/test/java/vn/cococord/controller/admin/AdminApiControllerContractTest.java`
- Modify only if a test proves mismatch: `src/main/java/vn/cococord/controller/admin/AdminApiController.java`
- Modify only if a test proves mismatch: existing Admin DTO or service mapper files.

**Interfaces:**
- Auth paths and JSON fields remain unchanged.
- Admin page responses retain Spring `Page<T>` and existing DTO property names.
- No mock-only endpoint may be introduced.

- [ ] **Step 1: Write failing/characterization MockMvc tests**

Use `@WebMvcTest`, mocked services, `@WithMockUser`, and JSON assertions. Representative assertions:

```java
mockMvc.perform(post("/api/auth/register")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
            {"username":"cococord_user","email":"user@example.com","password":"Strong1!","displayName":"CoCoCord User"}
            """))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.success").value(true))
    .andExpect(jsonPath("$.message").isString());

mockMvc.perform(get("/api/admin/users").with(user("admin").roles("ADMIN")))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.content").isArray())
    .andExpect(jsonPath("$.number").isNumber())
    .andExpect(jsonPath("$.totalElements").isNumber());
```

Add forbidden coverage for a USER role and unauthorized coverage without authentication.

- [ ] **Step 2: Run the tests and record RED or characterization PASS**

Run: `./mvnw -Dtest=AuthControllerContractTest,AdminApiControllerContractTest test`.

Expected: New tests initially fail on missing test wiring or any actual response mismatch; existing matching contracts may pass immediately as characterization tests.

- [ ] **Step 3: Make only evidence-backed compatibility corrections**

Correct controller/DTO serialization only when a React-required field already exists in the legacy contract but is absent or malformed. Do not add endpoints for AutoMod, test email, role permission groups, mock audit records, or mock statistics.

- [ ] **Step 4: Run focused and full backend tests**

Run: `./mvnw -Dtest=AuthControllerContractTest,AdminApiControllerContractTest test`.

Expected: PASS.

Run: `./mvnw test`.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/test/java/vn/cococord/controller/AuthControllerContractTest.java src/test/java/vn/cococord/controller/admin/AdminApiControllerContractTest.java
git commit -m "test: lock admin and auth API contracts"
```

If a failing contract test required a production correction, add only the exact controller, DTO, or mapper file changed by that correction before committing.

### Task 10: Add SPA Fallback, Package the Vite Build, and Remove SSR Runtime Code

**Files:**
- Create: `src/main/java/vn/cococord/config/SpaResourceResolver.java`
- Modify: `src/main/java/vn/cococord/config/WebMvcConfig.java`
- Modify: `src/main/java/vn/cococord/security/SecurityConfig.java`
- Create: `src/test/java/vn/cococord/config/SpaResourceResolverTest.java`
- Create: `src/test/java/vn/cococord/config/SpaRoutingIntegrationTest.java`
- Create: `src/test/resources/static/index.html`
- Create: `src/test/resources/static/assets/app.js`
- Modify: `frontend/vite.config.ts`
- Modify: `pom.xml`
- Delete: `src/main/java/vn/cococord/controller/ViewController.java`
- Delete: `src/main/java/vn/cococord/controller/admin/AdminController.java`
- Delete: `src/main/java/vn/cococord/controller/GlobalDataControllerAdvice.java`
- Delete: `src/main/java/vn/cococord/config/SiteMeshConfig.java`
- Delete: `src/main/java/vn/cococord/config/JSPStaticResourceConfigurer.java`
- Delete: `src/main/java/vn/cococord/config/TomcatJSPConfiguration.java`
- Delete: `src/main/resources/sitemesh3.xml`

**Interfaces:**
- `SpaResourceResolver.isSpaRoute(String resourcePath)` returns false for excluded roots and file-extension paths.
- Existing resources resolve before SPA fallback.
- Vite outputs `frontend/dist/index.html` and `frontend/dist/assets/*`.
- Maven runs the frontend build and copies `frontend/dist` into `${project.build.outputDirectory}` before packaging.

- [ ] **Step 1: Write failing resolver and routing tests**

```java
@ParameterizedTest
@ValueSource(strings = {"login", "register", "admin/users", "app", "invite/abc123"})
void acceptsSpaRoutes(String path) {
    assertThat(SpaResourceResolver.isSpaRoute(path)).isTrue();
}

@ParameterizedTest
@ValueSource(strings = {"api/admin/users", "ws/info", "upload/avatar.png", "css/app.css", "js/app.js", "images/logo.png", "assets/app.js", "swagger-ui/index.html", "v3/api-docs", "favicon.ico"})
void rejectsExcludedAndFileRoutes(String path) {
    assertThat(SpaResourceResolver.isSpaRoute(path)).isFalse();
}
```

Integration assertions:

```java
mockMvc.perform(get("/login"))
    .andExpect(status().isOk())
    .andExpect(content().string(containsString("<div id=\"root\"></div>")));

mockMvc.perform(get("/api/does-not-exist"))
    .andExpect(status().isNotFound())
    .andExpect(content().string(not(containsString("<div id=\"root\"></div>"))));

mockMvc.perform(get("/assets/app.js"))
    .andExpect(status().isOk())
    .andExpect(content().contentTypeCompatibleWith("text/javascript"));
```

- [ ] **Step 2: Run and verify RED**

Run: `./mvnw -Dtest=SpaResourceResolverTest,SpaRoutingIntegrationTest test`.

Expected: FAIL because SPA fallback does not exist and MVC view controllers still intercept routes.

- [ ] **Step 3: Implement the exclusion-aware resource resolver**

```java
static final Set<String> EXCLUDED_ROOTS = Set.of(
        "api", "ws", "upload", "css", "js", "images", "assets", "swagger-ui", "v3");

static boolean isSpaRoute(String resourcePath) {
    String normalized = resourcePath.replace('\\', '/').replaceFirst("^/+", "");
    if (normalized.isBlank()) return true;
    String root = normalized.split("/", 2)[0];
    String leaf = normalized.substring(normalized.lastIndexOf('/') + 1);
    return !EXCLUDED_ROOTS.contains(root) && !leaf.contains(".");
}
```

Resolve an existing static resource first. If it is absent and `isSpaRoute` is true, resolve `index.html`; otherwise return `null` so Spring produces the normal 404/security response.

- [ ] **Step 4: Update `WebMvcConfig` and security matchers**

Keep the explicit upload handler. Add classpath static handling with the resolver. Permit `/assets/**`, remove `/WEB-INF/**`, remove JSP/SiteMesh comments, retain JSON handling for `/api/**`, and retain ADMIN protection for `/admin/**` and `/api/admin/**`.

- [ ] **Step 5: Configure frontend packaging**

Keep Vite's production output at `frontend/dist` with root-relative `/assets/` paths. Add Maven executions that run `npm ci`, run `npm run build` in `frontend`, and copy `frontend/dist` into `${project.build.outputDirectory}` during resource processing. The copy must not delete existing classpath static resources.

Add this deterministic Vite build configuration:

```ts
build: {
  outDir: "dist",
  emptyOutDir: true,
  assetsDir: "assets",
},
base: "/",
```

Add these Maven plugins under `<build><plugins>`:

```xml
<plugin>
    <groupId>com.github.eirslett</groupId>
    <artifactId>frontend-maven-plugin</artifactId>
    <version>1.15.1</version>
    <configuration>
        <workingDirectory>frontend</workingDirectory>
        <installDirectory>target</installDirectory>
    </configuration>
    <executions>
        <execution>
            <id>install-node-and-npm</id>
            <goals><goal>install-node-and-npm</goal></goals>
            <configuration>
                <nodeVersion>v24.16.0</nodeVersion>
                <npmVersion>11.13.0</npmVersion>
            </configuration>
        </execution>
        <execution>
            <id>npm-ci</id>
            <goals><goal>npm</goal></goals>
            <configuration><arguments>ci</arguments></configuration>
        </execution>
        <execution>
            <id>npm-build</id>
            <goals><goal>npm</goal></goals>
            <configuration><arguments>run build</arguments></configuration>
        </execution>
    </executions>
</plugin>
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <version>3.3.1</version>
    <executions>
        <execution>
            <id>copy-react-build</id>
            <phase>process-resources</phase>
            <goals><goal>copy-resources</goal></goals>
            <configuration>
                <outputDirectory>${project.build.outputDirectory}</outputDirectory>
                <resources>
                    <resource>
                        <directory>${project.basedir}/frontend/dist</directory>
                        <filtering>false</filtering>
                    </resource>
                </resources>
            </configuration>
        </execution>
    </executions>
</plugin>
```

- [ ] **Step 6: Remove SSR dependencies and runtime configuration**

Remove these exact dependencies from `pom.xml`:

```xml
org.apache.tomcat.embed:tomcat-embed-jasper
jakarta.servlet.jsp.jstl:jakarta.servlet.jsp.jstl-api
org.glassfish.web:jakarta.servlet.jsp.jstl
org.sitemesh:sitemesh
```

Delete the listed MVC/SiteMesh/JSP configuration classes and `sitemesh3.xml`. Do not delete the legacy JSP/static source files in this task; they remain an auditable parity reference and are no longer executable without the removed runtime.

- [ ] **Step 7: Run focused routing tests**

Run: `./mvnw -Dtest=SpaResourceResolverTest,SpaRoutingIntegrationTest test`.

Expected: PASS.

- [ ] **Step 8: Verify packaged SPA assets**

Run: `./mvnw clean package`.

Expected: PASS and the executable JAR contains `BOOT-INF/classes/index.html` plus `BOOT-INF/classes/assets/`.

Run: `jar tf target/cococord-0.0.1-SNAPSHOT.jar | Select-String 'BOOT-INF/classes/(index.html|assets/)'` on PowerShell.

Expected: at least one `index.html` entry and hashed assets.

- [ ] **Step 9: Commit**

```bash
git add pom.xml frontend/vite.config.ts src/main/java/vn/cococord/config/WebMvcConfig.java src/main/java/vn/cococord/config/SpaResourceResolver.java src/main/java/vn/cococord/config/SiteMeshConfig.java src/main/java/vn/cococord/config/JSPStaticResourceConfigurer.java src/main/java/vn/cococord/config/TomcatJSPConfiguration.java src/main/java/vn/cococord/security/SecurityConfig.java src/main/java/vn/cococord/controller/ViewController.java src/main/java/vn/cococord/controller/admin/AdminController.java src/main/java/vn/cococord/controller/GlobalDataControllerAdvice.java src/main/resources/sitemesh3.xml src/test/java/vn/cococord/config/SpaResourceResolverTest.java src/test/java/vn/cococord/config/SpaRoutingIntegrationTest.java src/test/resources/static/index.html src/test/resources/static/assets/app.js
git commit -m "feat: cut over MVC routes to the React SPA"
```

### Task 11: Final Parity and Regression Verification

**Files:**
- Modify only files with failures proven by the commands below.
- Create: `docs/superpowers/reports/2026-08-09-admin-auth-spa-verification.md`

**Interfaces:**
- The report records commands, exit codes, and the exact parity/exclusion checks completed.

- [ ] **Step 1: Run all frontend tests**

Run: `npm test` from `frontend`.

Expected: PASS with no unhandled promise rejections or React act warnings.

- [ ] **Step 2: Run the frontend production build**

Run: `npm run build` from `frontend`.

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Run all backend tests**

Run: `./mvnw test`.

Expected: PASS.

- [ ] **Step 4: Run the complete package build**

Run: `./mvnw clean package`.

Expected: PASS without Jasper, JSTL, or SiteMesh on the dependency tree.

Run: `./mvnw dependency:tree | Select-String 'jasper|jstl|sitemesh'`.

Expected: no matches.

- [ ] **Step 5: Check source and route cleanup**

Run:

```powershell
rg -n 'return "(admin/|auth/|register|forgot-password|reset-password)|InternalResourceViewResolver|SiteMesh|ConfigurableSiteMeshFilter|JSPStaticResourceConfigurer' src/main/java
```

Expected: no MVC/JSP rendering references.

- [ ] **Step 6: Perform browser smoke tests**

Verify `/login`, `/register`, `/forgot-password`, `/reset-password?token=test`, all nine Admin sections, direct Admin URLs, legacy Admin hashes, browser refreshes, representative real API data, representative legacy mock fallback data, and the existing placeholder actions. Compare against the source JSP/CSS/JS, not a redesigned interpretation.

- [ ] **Step 7: Check the dirty worktree carefully**

Run: `git status --short` and `git diff --stat`.

Expected: only planned migration changes plus the user's pre-existing unrelated changes. Do not stage or rewrite unrelated chat/navigation/store files.

- [ ] **Step 8: Write the verification report**

Record the successful commands, packaged asset entries, tested route exclusions, mock-parity samples, and any intentionally retained legacy source files.

- [ ] **Step 9: Commit verification fixes and report**

```bash
git add docs/superpowers/reports/2026-08-09-admin-auth-spa-verification.md
git commit -m "docs: record admin auth SPA verification"
```

---

## Execution Notes

- Before each task, re-check `git status --short` because the existing frontend is largely untracked and contains user work.
- Stage exact paths only; never use `git add .`.
- For the large JSP translations, preserve source order and test one bounded section at a time.
- If a legacy script and current REST response differ, first determine whether the legacy script used a mock fallback. Preserve that fallback instead of creating an API.
- If a real API contract is incomplete, add a failing backend contract test before the smallest compatible correction.
