# React Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define Cococord's scalable React folder layout and provide the first UI-state store and channel STOMP hook.

**Architecture:** Use a hybrid feature-first layout: app composition and shared infrastructure are centralized, while chat/server/channel capabilities live inside feature folders. Zustand stores only navigation UI state. Channel messages remain TanStack Query server state and realtime events update the `['messages', channelId]` infinite-query cache.

**Tech Stack:** Vite, React, TypeScript strict mode, Zustand, TanStack Query, @stomp/stompjs, sockjs-client, Vitest.

**Execution override:** The user explicitly requested production code only for Tasks 1–3 and directed that all test-writing and test-running steps be skipped for this pass. Verification is therefore limited to static/source checks; tests remain a follow-up requirement.

## Global Constraints

- No React component may create REST or WebSocket connections directly.
- Zustand stores only `activeServerId` and `activeChannelId` for this slice.
- Current-user data is owned by the `['auth', 'me']` query.
- Channel messages are owned by `['messages', channelId]`.
- STOMP connects to `/ws` with the JWT in the native `Authorization` CONNECT header.
- Channel events arrive on `/topic/channel/{channelId}` as `{ type, payload }` envelopes.
- Incoming message events are deduplicated by MongoDB message ID.
- Every STOMP subscription and connection has idempotent cleanup.

---

### Task 1: UI navigation store

**Files:**
- Create: `frontend/src/store/useAppStore.ts`
- Test: `frontend/src/store/useAppStore.test.ts`

**Interfaces:**
- Produces: `useAppStore`, `AppState`, `MysqlId`.

- [ ] **Step 1: Write a failing test** proving server changes clear the active channel, channel changes retain the server, and reset clears both IDs.
- [ ] **Step 2: Run the focused store test and confirm it fails because the store does not exist.**
- [ ] **Step 3: Implement a strict typed Zustand store with `setActiveServerId`, `setActiveChannelId`, and `resetNavigation`.**
- [ ] **Step 4: Run the focused store test and confirm all assertions pass.**

### Task 2: Chat contracts and realtime cache reducer

**Files:**
- Create: `frontend/src/features/chat/types/chat.ts`
- Create: `frontend/src/features/chat/realtime/updateMessageCache.ts`
- Test: `frontend/src/features/chat/realtime/updateMessageCache.test.ts`

**Interfaces:**
- Produces: `ChatMessage`, `MessagePage`, `MessageEvent`, `upsertMessageInCache`.

- [ ] **Step 1: Write failing reducer tests** for insert, duplicate suppression, update replacement, and empty-page safety.
- [ ] **Step 2: Run the focused reducer test and confirm failure.**
- [ ] **Step 3: Implement immutable updates for `InfiniteData<MessagePage, number>`.**
- [ ] **Step 4: Run reducer tests and confirm they pass.**

### Task 3: Channel STOMP hook

**Files:**
- Create: `frontend/src/features/chat/hooks/useChatSocket.ts`
- Test: `frontend/src/features/chat/hooks/useChatSocket.test.tsx`

**Interfaces:**
- Consumes: `ChatMessage`, `MessageEvent`, `upsertMessageInCache`.
- Produces: `useChatSocket({ channelId, accessToken, enabled })` returning connection status and `sendMessage`.

- [ ] **Step 1: Write failing hook tests** with mocked STOMP Client and SockJS for CONNECT authorization, topic subscription, query-cache update, channel resubscription, and cleanup.
- [ ] **Step 2: Run the focused hook test and confirm failure.**
- [ ] **Step 3: Implement separate connection and subscription effects with stable refs.**
- [ ] **Step 4: Run the focused hook tests and confirm they pass.**
- [ ] **Step 5: Run TypeScript checking and the full frontend test suite.**
