# CoCoCord Routes & URL Flow

Tài liệu này liệt kê các URL chính của project (View routes, REST API, GraphQL, WebSocket/STOMP) dựa trên code hiện tại.

> Ghi chú về base path:
>
> - Mặc định ứng dụng chạy ở root context `/`.
> - Nếu deploy dưới context path khác, hãy prefix tất cả route bằng context path đó.

## 1) View routes (JSP pages)

Nguồn: `ViewController`, `AdminController`.

### Public pages

- `GET /` → `index.jsp`
- `GET /login` → `auth/login.jsp`
- `GET /register` → `register.jsp`
- `GET /forgot-password` → `forgot-password.jsp`
- `GET /reset-password` → `reset-password.jsp`

### Auth-required (UI pages)

> Lưu ý: theo `SecurityConfig`, các trang view dưới đây `permitAll`; việc “đã login hay chưa” chủ yếu được kiểm tra ở client-side (JS) khi gọi API.

- `GET /dashboard` → redirect sang `/friends`
- `GET /chat` → `chat.jsp`
- `GET /friends` → `friends.jsp`
- `GET /messages` → `messages.jsp`
- `GET /sessions` → `sessions.jsp`
- `GET /change-password` → `change-password.jsp`

### Admin views

> Các view `/admin/**` được `permitAll` ở `SecurityConfig`, nhưng controller có `@PreAuthorize("hasRole('ADMIN')")` (bị chặn ở tầng method security).

- `GET /admin` → `admin/dashboard.jsp`
- `GET /admin/users` → `admin/users.jsp`
- `GET /admin/servers` → `admin/servers.jsp`
- `GET /admin/stats` → `admin/stats.jsp`
- `GET /admin/audit` → `admin/audit.jsp`

## 2) REST API routes

### 2.1 Public API

Nguồn: `HomeController`.

- `GET /api/public/health` → health check
- `GET /api/public/info` → thông tin API + list nhóm endpoint

### 2.2 Auth API

Nguồn: `AuthController`.

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `POST /api/auth/change-password` (requires auth)
- `GET /api/auth/sessions` (requires auth; hiện đọc refresh token từ header `Authorization` theo code)
- `DELETE /api/auth/sessions/{sessionId}` (requires auth)
- `GET /api/auth/me` (requires auth)

### 2.3 User profile / presence

Nguồn: `ProfileController`.

- `GET /api/users/search?query=...`
- `GET /api/users/me/profile`
- `GET /api/users/{userId}/profile`
- `PUT /api/users/me/settings`
- `PUT /api/users/me/status`
- `DELETE /api/users/me/custom-status`
- `POST /api/users/me/avatar` (multipart/form-data)
- `POST /api/users/me/banner` (multipart/form-data)
- `POST /api/users/{userId}/note`
- `GET /api/users/{userId}/mutual-servers`
- `GET /api/users/presence?userIds=1&userIds=2...`
- `POST /api/users/me/activity`

### 2.4 Friends

Nguồn: `FriendController`.

- `GET /api/friends`
- `GET /api/friends/requests`
- `GET /api/friends/requests/pending`
- `GET /api/friends/requests/sent`
- `POST /api/friends/requests`
- `POST /api/friends/requests/{requestId}/accept`
- `POST /api/friends/requests/{requestId}/decline`
- `POST /api/friends/requests/{requestId}/cancel`
- `DELETE /api/friends/{userId}`
- `GET /api/friends/blocked`
- `POST /api/friends/blocked/{userId}`
- `DELETE /api/friends/blocked/{userId}`

> DM-groups trong `FriendController` hiện là stub (trả về rỗng/placeholder):
>
> - `GET /api/friends/dm-groups`
> - `POST /api/friends/dm-groups`
> - `GET /api/friends/dm-groups/{groupId}`
> - `DELETE /api/friends/dm-groups/{groupId}`
> - `POST /api/friends/dm-groups/{groupId}/members?userId=...`
> - `DELETE /api/friends/dm-groups/{groupId}/members/{userId}`

### 2.5 Servers

Nguồn: `ServerController`.

- `GET /api/servers`
- `GET /api/servers/{serverId}`
- `POST /api/servers`
- `PUT /api/servers/{serverId}`
- `DELETE /api/servers/{serverId}`
- `POST /api/servers/{serverId}/leave`

Members:

- `GET /api/servers/{serverId}/members`
- `POST /api/servers/{serverId}/kick`
- `POST /api/servers/{serverId}/ban`
- `DELETE /api/servers/{serverId}/bans/{userId}`

Invites:

- `POST /api/servers/{serverId}/invites`
- `GET /api/servers/{serverId}/invites`
- `DELETE /api/servers/{serverId}/invites/{inviteLinkId}`
- `POST /api/servers/join/{code}`
- `GET /api/servers/invite/{code}` (public preview)

Roles:

- `POST /api/servers/{serverId}/roles`
- `GET /api/servers/{serverId}/roles`
- `DELETE /api/servers/{serverId}/roles/{roleId}`

Utility:

- `GET /api/servers/{serverId}/is-owner`

### 2.6 Channels

Nguồn: `ChannelController`.

- `GET /api/servers/{serverId}/channels`
- `POST /api/servers/{serverId}/channels`
- `GET /api/channels/{channelId}`
- `PUT /api/channels/{channelId}`
- `DELETE /api/channels/{channelId}`
- `PATCH /api/channels/{channelId}/position`

WebSocket broadcast (server-side emit):

- `/topic/server/{serverId}/channels`

### 2.7 Categories

Nguồn: `CategoryController`.

- `GET /api/servers/{serverId}/categories`
- `POST /api/servers/{serverId}/categories`
- `GET /api/categories/{categoryId}`
- `PUT /api/categories/{categoryId}`
- `DELETE /api/categories/{categoryId}`
- `PATCH /api/categories/{categoryId}/position`

WebSocket broadcast (server-side emit):

- `/topic/server/{serverId}/categories`

### 2.8 Messages (channel history + search)

Nguồn: `MessageRestController`, `MessageSearchController`.

History:

- `GET /api/messages/channel/{channelId}?page=0&size=50`
- `GET /api/messages/{messageId}`
- `GET /api/messages/{messageId}/replies`

Search:

- `GET /api/messages/search?keyword=...&channelId=&serverId=&userId=&messageType=&hasAttachments=&page=0&size=20`
- `GET /api/messages/search/channel/{channelId}?keyword=...&page=0&size=20`
- `GET /api/messages/search/server/{serverId}?keyword=...&page=0&size=20`

### 2.9 Message actions (upload/reactions/pin)

Nguồn: `MessageActionController`.

- `POST /api/upload` (multipart/form-data)
- `POST /api/messages/{messageId}/reactions`
- `DELETE /api/messages/{messageId}/reactions/{emoji}`
- `POST /api/messages/{messageId}/pin`
- `DELETE /api/messages/{messageId}/pin`

### 2.10 Notifications

Nguồn: `NotificationController`.

- `GET /api/notifications?page=0&size=20`
- `GET /api/notifications/unread`
- `GET /api/notifications/count`
- `POST /api/notifications/{id}/read`
- `POST /api/notifications/read-all`
- `DELETE /api/notifications/{id}`
- `POST /api/notifications/cleanup?daysOld=30`

### 2.11 Direct messages (DM)

Nguồn: `DirectMessageController`.

Conversations & groups:

- `GET /api/direct-messages/sidebar`
- `GET /api/direct-messages/conversations`
- `POST /api/direct-messages/create-dm/{userId}`
- `POST /api/direct-messages/create-group`
- `GET /api/direct-messages/{dmGroupId}`
- `PUT /api/direct-messages/{dmGroupId}`
- `DELETE /api/direct-messages/{dmGroupId}`

Members:

- `POST /api/direct-messages/{dmGroupId}/members/{userId}`
- `DELETE /api/direct-messages/{dmGroupId}/members/{userId}`

Messages:

- `POST /api/direct-messages/{dmGroupId}/messages`
- `GET /api/direct-messages/{dmGroupId}/messages?page=0&size=50`
- `PUT /api/direct-messages/messages/{messageId}`
- `DELETE /api/direct-messages/messages/{messageId}`
- `POST /api/direct-messages/{dmGroupId}/read`
- `GET /api/direct-messages/{dmGroupId}/unread-count`
- `GET /api/direct-messages/{dmGroupId}/search?query=...`
- `POST /api/direct-messages/{dmGroupId}/mute`

### 2.12 Admin API

Nguồn: `AdminApiController`.

Users:

- `GET /api/admin/users?page=0&size=20&search=&sortBy=createdAt&sortDir=desc`
- `POST /api/admin/users/{userId}/ban`
- `POST /api/admin/users/{userId}/unban`
- `PUT /api/admin/users/{userId}/role?role=...`
- `DELETE /api/admin/users/{userId}`

Servers:

- `GET /api/admin/servers?page=0&size=20&search=&sortBy=createdAt&sortDir=desc`
- `DELETE /api/admin/servers/{serverId}`

Stats:

- `GET /api/admin/stats`
- `GET /api/admin/stats/online`

## 3) WebSocket (STOMP)

Nguồn: `WebSocketConfig`, `WebSocketMessageController`, `VoiceController`.

### Connection endpoint

- WebSocket endpoint: `GET/WS /ws` (SockJS enabled + native WS)

### Broker prefixes

- Server → client (subscribe): `/topic/**`, `/queue/**`
- Client → server (send): `/app/**`
- User-specific: `/user/**`

### Chat messaging (channels)

- Send: `/app/chat.sendMessage`
- Edit: `/app/chat.editMessage`
- Delete: `/app/chat.deleteMessage`
- Typing: `/app/chat.typing`

Broadcast:

- New/edited messages: `/topic/channel/{channelId}`
- Delete events: `/topic/channel/{channelId}/delete`
- Typing events: `/topic/channel/{channelId}/typing`

### Presence

- Send: `/app/presence.update`
- Broadcast: `/topic/presence`

### Direct messages (DM)

- Send: `/app/dm.sendMessage`
- Edit: `/app/dm.editMessage`
- Delete: `/app/dm.deleteMessage`
- Typing: `/app/dm.typing`

Broadcast:

- Messages: `/topic/dm/{dmGroupId}`
- Delete events: `/topic/dm/{dmGroupId}/delete`
- Typing events: `/topic/dm/{dmGroupId}/typing`

### Voice

- Send: `/app/voice.join`, `/app/voice.leave`, `/app/voice.mute`, `/app/voice.deafen`
- Broadcast: `/topic/voice/{channelId}`

## 4) GraphQL

Nguồn: dependency `spring-boot-starter-graphql` + schema `src/main/resources/graphql/schema.graphqls`.

- GraphQL HTTP endpoint: `POST /graphql`
- Resolvers hiện có: `FriendGraphQLResolver` (queries/mutations liên quan friend).

## 5) Auth & security notes (thực tế vận hành)

Nguồn: `SecurityConfig`, `JwtAuthenticationFilter`.

- Server authenticate REST chủ yếu bằng header `Authorization: Bearer <accessToken>`.
- `/api/auth/**` và `/api/public/**` là public.
- `/ws/**` được permit ở tầng HTTP (STOMP auth tuỳ cấu hình interceptor; hiện không thấy interceptor trong `WebSocketConfig`).

## 6) End-to-end flows (tóm tắt)

### 6.1 Login

1. User mở `GET /login`.
2. Frontend gọi `POST /api/auth/login`.
3. Frontend lưu token và dùng `Authorization: Bearer ...` cho các API sau.

### 6.2 Add friend

1. UI search: `GET /api/users/search?query=...`
2. Send request: `POST /api/friends/requests`.

### 6.3 Chat (server/channel)

1. User mở `GET /chat` (thường kèm query `serverId`, `channelId` ở client-side logic).
2. Fetch servers/channels/categories qua:
   - `GET /api/servers`
   - `GET /api/servers/{serverId}/channels`
   - `GET /api/servers/{serverId}/categories`
3. Load message history:
   - `GET /api/messages/channel/{channelId}`
4. Realtime messaging:
   - Connect `/ws`, subscribe `/topic/channel/{channelId}`, send `/app/chat.sendMessage`.
