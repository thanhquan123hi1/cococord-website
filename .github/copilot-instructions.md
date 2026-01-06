# CoCoCord Project - AI Coding Agent Instructions

## Project Overview

Discord-like realtime chat application built with **Spring Boot 3.5.9 + Java 21 + JSP + Sitemesh3**. Uses a **polyglot persistence** pattern: MySQL for relational data (users, servers, channels, roles) and MongoDB for messages/chat history.

## Architecture

### Data Layer Split

- **MySQL entities** → `entity/mysql/` - Users, Servers, Channels, Roles, Permissions (JPA/Hibernate)
- **MongoDB documents** → `entity/mongodb/` - Messages, DirectMessages, UserPresence, VoiceSession (Spring Data MongoDB)
- Repositories use `I` prefix convention: `IUserRepository`, `IMessageRepository`

### Service Pattern

- Interfaces in `service/` with `I` prefix (e.g., `IMessageService`)
- Implementations in `service/impl/` with `Impl` suffix
- Use `@Transactional` for MySQL ops, `@Transactional(readOnly = true)` for read-only queries

### Permission System (Discord-style Bitmask)

```java
// Check: (bitmask & SEND_MESSAGES.getValue()) != 0
// Grant: bitmask |= SEND_MESSAGES.getValue()
// Revoke: bitmask &= ~SEND_MESSAGES.getValue()
```

- `PermissionBit.java` defines all permissions with bit positions
- Use AOP annotations for controller-level checks:
  - `@RequiresPermission({"MANAGE_CHANNELS"})` - permission check
  - `@RequiresServerMembership` - membership check
  - `@RequiresOwnerOrPermission` - owner OR permission check

### Realtime Communication

- **WebSocket/STOMP** for realtime messaging via `/ws` endpoint
- Client destinations: `/app/chat.sendMessage`, `/app/chat.editMessage`
- Server broadcasts: `/topic/channel/{channelId}`, `/user/{userId}/queue/notifications`
- Wrap payloads in `WebSocketEvent(type, payload)` for consistent event handling

### Frontend Architecture

- **JSP views** in `resources/META-INF/resources/WEB-INF/views/`
- **Sitemesh3 decorators** apply layouts: `public.jsp`, `app.jsp`, `admin.jsp`
- Static JS/CSS in `resources/static/` - modular JS files per feature (e.g., `chat.js`, `voice-manager.js`)
- Authentication via JWT stored in localStorage, passed as `Authorization: Bearer {token}`

## Key Patterns

### DTO Conventions

- Requests: `dto/request/` - e.g., `SendMessageRequest`, `CreateServerRequest`
- Responses: `dto/response/` - e.g., `ChatMessageResponse`, `ServerResponse`
- WebSocket events: `dto/websocket/` - e.g., `WebSocketEvent`, `PresenceChangeEvent`

### Exception Handling

- `ResourceNotFoundException` → 404
- `UnauthorizedException` → 401
- `ForbiddenException` → 403
- `BadRequestException` → 400
- Global handler in `GlobalExceptionHandler.java`

### GraphQL

- Schema at `resources/graphql/schema.graphqls` - primarily for friend system queries
- Resolvers in `graphql/` package

## Development Commands

```bash
# Run locally (requires MySQL + MongoDB running)
./mvnw spring-boot:run

# Run tests (uses H2 in-memory, no external DB needed)
./mvnw test

# Build
./mvnw clean package
```

## Configuration

- Main config: `application.properties`
- Test profile: `application-test.properties` (H2 database, Redis disabled)
- JWT settings: `jwt.secret`, `jwt.access-token-expiration`
- File uploads: `uploads/` directory, max 10MB

## Important Files

- [SecurityConfig.java](src/main/java/vn/cococord/security/SecurityConfig.java) - JWT filter chain, route security
- [WebSocketConfig.java](src/main/java/vn/cococord/config/WebSocketConfig.java) - STOMP broker setup
- [PermissionBit.java](src/main/java/vn/cococord/entity/mysql/PermissionBit.java) - All permission definitions
- [sitemesh3.xml](src/main/resources/sitemesh3.xml) - URL-to-decorator mappings
