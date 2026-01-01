# CoCoCord – Project structure & responsibilities

Tài liệu này mô tả cấu trúc project, vai trò các thư mục/file chính, và công nghệ đang dùng.

> Mục tiêu: giúp bạn (hoặc contributor) biết “file nào phụ trách gì” để debug / mở rộng nhanh.

## 1) Tech stack (high-level)

- **Backend**: Spring Boot 3.5.x (Java 21), Maven
- **View layer**: JSP + SiteMesh 3 (layout/decorators)
- **REST API**: Spring Web + Validation
- **Realtime**: Spring WebSocket + STOMP (`/ws`, `/app/**`, `/topic/**`)
- **Persistence**:
  - MySQL (Spring Data JPA) – dữ liệu chính
  - MongoDB (Spring Data MongoDB) – một số dữ liệu realtime/DM/voice session
- **Auth/Security**: Spring Security + JWT (`jjwt`)
- **GraphQL**: Spring for GraphQL + schema file
- **Caching/Presence (tùy chọn)**: Redis starter (đang có config bật/tắt)
- **Frontend**: Vanilla JS + CSS (static assets), UI kiểu Discord

## 2) Top-level layout

- `pom.xml`: dependencies, Java version (21), Spring Boot parent version.
- `mvnw`, `mvnw.cmd`: Maven wrapper.
- `src/main/java/vn/cococord/**`: source code backend.
- `src/main/resources/`:
  - `application.properties`: cấu hình runtime (DB, JWT, mail, redis, view).
  - `sitemesh3.xml`: cấu hình SiteMesh.
  - `graphql/schema.graphqls`: schema GraphQL.
  - `META-INF/resources/`: static + JSP views (WAR-style resource layout).
  - `static/`: JS/CSS/HTML public assets.
- `src/test/java/vn/cococord/**`: test.

## 3) Backend packages (src/main/java/vn/cococord)

### 3.1 Entry point

- `CococordApplication.java`: Spring Boot main.

### 3.2 `config/`

Chứa cấu hình Spring: Web config, WebSocket config, SiteMesh filter, CORS, v.v. (tùy file cụ thể).

### 3.3 `security/`

- JWT filter / provider
- `SecurityConfig` (HTTP security + route access rules)

### 3.4 `controller/`

- `ViewController.java`: điều hướng JSP pages (`/chat`, `/friends`, …)
- `AdminController.java`: admin JSP pages (`/admin/**`)
- `HomeController.java`: public info/health endpoints
- `GlobalDataControllerAdvice.java`: inject dữ liệu chung cho views (nếu có)

#### `controller/user/` (REST + WebSocket controllers)

- `AuthController.java`: login/register/refresh/logout/sessions/me
- `ProfileController.java`: user profile, settings, status, avatar/banner upload
- `FriendController.java`: friend requests, block list
- `ServerController.java`: server CRUD, member/role/invite utilities
- `ChannelController.java`: channel CRUD trong server
- `CategoryController.java`: category CRUD trong server
- `MessageRestController.java`: lấy history message theo channel, message detail
- `MessageSearchController.java`: search message (channel/server)
- `MessageActionController.java`: upload, reactions, pin
- `DirectMessageController.java`: DM groups + DM messages
- `NotificationController.java`: notification list/unread/count/read/cleanup
- `AdminApiController.java`: admin REST endpoints

**WebSocket/STOMP**

- `WebSocketMessageController.java`: chat realtime (send/edit/delete/typing), presence, DM realtime
- `VoiceController.java`: voice join/leave/mute/deafen + broadcast participants state

### 3.5 `service/`

Chứa business logic (ví dụ: send/edit/delete message, DM service, friend logic, server/channel/category logic). Controllers nên gọi service thay vì thao tác repository trực tiếp.

### 3.6 `repository/`

Spring Data repositories cho MySQL (JPA) và MongoDB.

### 3.7 `entity/`

- `entity/mysql/`: các entity lưu trong MySQL (User/Server/Channel/Message…)
- `entity/mongodb/`: các document lưu trong Mongo (DirectMessage/VoiceSession…)

### 3.8 `dto/`

- `dto/request/`: payload request từ REST/WS
- `dto/response/`: response trả về client

### 3.9 `graphql/`

Resolvers, DTO hoặc wiring liên quan GraphQL.

### 3.10 `exception/`, `aspect/`, `annotation/`

- `exception/`: custom exceptions, error responses
- `aspect/`: AOP logging/audit (nếu có)
- `annotation/`: custom annotations

## 4) Resources & UI

### 4.1 JSP Views (src/main/resources/META-INF/resources/WEB-INF/views)

Các file JSP là “page shells”, phần logic tương tác nằm chủ yếu ở JS.

- `index.jsp`: landing/public home
- `auth/`:
  - `login.jsp`: login page
- `register.jsp`, `forgot-password.jsp`, `reset-password.jsp`, `change-password.jsp`
- `chat.jsp`: UI chat chính (server channels + voice UI)
- `friends.jsp`, `messages.jsp`, `sessions.jsp`
- `admin/`: các trang admin

### 4.2 Static JS (src/main/resources/static/js)

- `app.js`: core bootstrap + shared helpers (tuỳ implementation hiện tại)
- `auth.js`: login/register/token handling
- `chat.js`: file quan trọng nhất cho chat page:
  - load servers/channels/categories
  - load messages + realtime STOMP subscribe/send
  - context menu actions (edit/delete message)
  - voice UI integration (join/leave, participants rendering, mute/deafen/camera/screen-share toggles)
- `server-sidebar.js`, `channel-panel.js` (nếu tách logic): xử lý sidebar/server list
- `friends.js`, `friends-new.js`: friends page logic
- `messages.js`, `messages-new.js`: DM/messages page logic
- `notification.js`: notification UI + APIs
- `user-panel.js`: UCP (User Control Panel) popup logic
- `user-settings-modal.js`, `user-profile-modal.js`: modal logic
- `file-upload.js`: upload attachments
- `enhanced-message.js`, `rich-message-integration.js`: UI/formatting message nâng cao
- `public.js`, `app-home.js`: các trang public/home

### 4.3 Static CSS (src/main/resources/static/css)

- `app.css`, `style.css`: base styles
- `chat.css`: layout chat + message list styling
- `voice-channel.css`: styling cho voice view (participants grid + bottom controls)
- `server-sidebar.css`, `channel-panel.css`, `user-panel.css`, `settings-modal.css`, `profile-modal.css`
- `friends.css`, `friends-new.css`, `messages.css`, `notification.css`, `file-upload.css`, `enhanced-message.css`

## 5) WebSocket contract quick reference

Chi tiết xem ROUTES ở [ROUTES.md](ROUTES.md).

- Connect: `/ws`
- Client send prefix: `/app/**`
- Subscribe prefix: `/topic/**` và `/queue/**`

Các nhóm chính:

- Channel chat: `/app/chat.*` ↔ `/topic/channel/{channelId}` (+ `/delete`, `/typing`)
- DM chat: `/app/dm.*` ↔ `/topic/dm/{dmGroupId}` (+ `/delete`, `/typing`)
- Presence: `/app/presence.update` ↔ `/topic/presence`
- Voice: `/app/voice.*` ↔ `/topic/voice/{channelId}`

## 6) Local development notes

- DB connections nằm trong `application.properties`.
- Khuyến nghị: **không commit secret** (DB password, mail password, JWT secret production). Nên dùng env vars hoặc file local override.

Build/run thường dùng:

- `./mvnw test`
- `./mvnw spring-boot:run`
