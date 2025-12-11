# CoCoCord Authentication System

## Tổng quan

Hệ thống xác thực hoàn chỉnh cho ứng dụng CoCoCord sử dụng Spring Security + JWT với các tính năng:

✅ **1.1 Login** - Đăng nhập với JWT  
✅ **1.2 Register** - Đăng ký tài khoản  
✅ **1.3 Refresh Token** - Gia hạn token  
✅ **1.4 Change Password** - Đổi mật khẩu  
✅ **1.5 Forgot/Reset Password** - Quên mật khẩu  
✅ **1.6 Session Management** - Quản lý phiên đăng nhập đa thiết bị

---

## Cấu hình

### 1. Database

Cần chạy MySQL và MongoDB:

```bash
# MySQL
mysql -u root -p
CREATE DATABASE cococord_mysql;

# MongoDB
mongod --dbpath /path/to/data
```

### 2. Email Configuration

Cập nhật `application.properties`:

```properties
# Gmail SMTP (cần bật App Password)
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# JWT Secret (đổi key mới cho production)
jwt.secret=your-secret-key-minimum-256-bits
jwt.access-token-expiration=3600000
jwt.refresh-token-expiration=604800000

# Frontend URL
app.frontend.url=http://localhost:3000
```

**Lấy App Password Gmail:**

1. Vào Google Account → Security
2. Bật 2-Step Verification
3. Tạo App Password cho Mail

---

## API Endpoints

### 🔓 Public Endpoints (không cần authentication)

#### 1.1 Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "user123",
  "password": "Password@123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600000,
  "userId": 1,
  "username": "user123",
  "email": "user@example.com",
  "displayName": "User Display Name",
  "avatarUrl": null,
  "loginAt": "2025-12-11T14:00:00"
}
```

#### 1.2 Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "Password@123",
  "displayName": "User Display Name"
}
```

**Validation Rules:**

- `username`: 3-20 ký tự, chỉ chữ cái, số, gạch dưới
- `email`: Email hợp lệ
- `password`: Tối thiểu 6 ký tự, có chữ hoa, chữ thường, số
- `displayName`: 2-50 ký tự

**Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please check your email."
}
```

#### 1.3 Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": 3600000,
  ...
}
```

#### 1.5 Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset link sent to your email."
}
```

#### 1.5 Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

---

### 🔒 Protected Endpoints (cần JWT token)

**Header required:**

```http
Authorization: Bearer <access-token>
```

#### 1.4 Change Password

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

#### 1.6 Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "displayName": "User Display Name",
  "avatarUrl": null,
  "status": "ONLINE",
  "createdAt": "2025-12-11T10:00:00"
}
```

#### 1.6 Get All Sessions

```http
GET /api/auth/sessions
Authorization: Bearer <refresh-token>
```

**Response:**

```json
[
  {
    "id": 1,
    "deviceInfo": "Chrome on Windows",
    "ipAddress": "192.168.1.100",
    "isActive": true,
    "createdAt": "2025-12-11T10:00:00",
    "expiresAt": "2025-12-18T10:00:00",
    "isCurrent": true
  },
  {
    "id": 2,
    "deviceInfo": "Mobile Safari on iPhone",
    "ipAddress": "192.168.1.101",
    "isActive": true,
    "createdAt": "2025-12-10T15:30:00",
    "expiresAt": "2025-12-17T15:30:00",
    "isCurrent": false
  }
]
```

#### 1.6 Revoke Specific Session

```http
DELETE /api/auth/sessions/{sessionId}
Authorization: Bearer <token>
```

#### 1.6 Logout (current device)

```http
POST /api/auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "refreshToken": "current-refresh-token"
}
```

#### 1.6 Logout All Devices

```http
POST /api/auth/logout-all
Authorization: Bearer <token>
```

---

## Security Features

### 🔐 Password Security

- **BCrypt hashing** với salt tự động
- **Validation:** Tối thiểu 6 ký tự, có chữ hoa, chữ thường, số
- **Password reset:** Token hết hạn sau 1 giờ

### 🎫 JWT Tokens

- **Access Token:** Hết hạn sau 1 giờ (3600000ms)
- **Refresh Token:** Hết hạn sau 7 ngày (604800000ms)
- **Algorithm:** HMAC-SHA256

### 🛡️ Session Management

- **Multi-device support:** Theo dõi tất cả thiết bị đăng nhập
- **Device tracking:** IP address, User-Agent
- **Session expiration:** Tự động xóa session hết hạn
- **Logout all:** Revoke tất cả session khi đổi mật khẩu

### 📧 Email Notifications

- **Welcome email:** Khi đăng ký thành công
- **Password reset:** Link reset password (1h expiry)
- **Password changed:** Thông báo bảo mật
- **Reset success:** Xác nhận reset thành công

### 🚫 Security Measures

- **CORS enabled:** Cho phép frontend gọi API
- **Stateless sessions:** Không lưu session server-side
- **XSS protection:** Sanitize input
- **CSRF protection:** Disabled (dùng JWT)

---

## Error Handling

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "username": "Username must be 3-20 characters",
    "password": "Password must contain uppercase, lowercase and digit"
  }
}
```

### Authentication Errors

```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

### Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### Resource Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Database Schema

### MySQL Tables

#### users

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url VARCHAR(500),
  status VARCHAR(20),
  is_online BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  last_login DATETIME,
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

#### user_sessions

```sql
CREATE TABLE user_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  refresh_token VARCHAR(500) UNIQUE NOT NULL,
  device_info VARCHAR(255),
  ip_address VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Testing với Postman/cURL

### 1. Register

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@123",
    "displayName": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser",
    "password": "Test@123"
  }'
```

### 3. Access Protected Endpoint

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <access-token>"
```

---

## Deployment Checklist

- [ ] Đổi `jwt.secret` thành key mạnh (256+ bits)
- [ ] Cấu hình email SMTP production
- [ ] Bật HTTPS
- [ ] Cấu hình CORS cho domain production
- [ ] Set `jwt.access-token-expiration` phù hợp
- [ ] Backup database định kỳ
- [ ] Monitor failed login attempts
- [ ] Set up rate limiting

---

## Architecture

```
┌─────────────┐
│   Client    │
│ (Frontend)  │
└─────┬───────┘
      │ HTTP Request + JWT
      ▼
┌─────────────────────────────────────┐
│      Spring Security Filter         │
│  JwtAuthenticationFilter            │
│  - Validate JWT                     │
│  - Set SecurityContext              │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│       AuthController                │
│  - /api/auth/login                  │
│  - /api/auth/register               │
│  - /api/auth/refresh                │
│  - /api/auth/change-password        │
│  - /api/auth/forgot-password        │
│  - /api/auth/reset-password         │
│  - /api/auth/logout                 │
│  - /api/auth/sessions               │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│       AuthService                   │
│  - Business Logic                   │
│  - Password Hashing                 │
│  - Token Generation                 │
│  - Session Management               │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  UserRepository / UserSessionRepo   │
│  - Database Operations              │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│         MySQL Database              │
│  - users                            │
│  - user_sessions                    │
└─────────────────────────────────────┘
```

---

## Files Created

```
src/main/java/vn/cococord/
├── config/
│   └── (existing JSP configs)
├── controller/user/
│   └── AuthController.java          ✅ REST API endpoints
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java        ✅ Login DTO
│   │   ├── RegisterRequest.java     ✅ Register DTO
│   │   ├── RefreshTokenRequest.java ✅ Refresh DTO
│   │   ├── ChangePasswordRequest.java ✅ Change password DTO
│   │   ├── ForgotPasswordRequest.java ✅ Forgot password DTO
│   │   └── ResetPasswordRequest.java  ✅ Reset password DTO
│   └── response/
│       ├── AuthResponse.java        ✅ Login response
│       ├── MessageResponse.java     ✅ Generic response
│       └── UserSessionResponse.java ✅ Session details
├── exception/
│   ├── BadRequestException.java     ✅ 400 errors
│   ├── UnauthorizedException.java   ✅ 401 errors
│   ├── ResourceNotFoundException.java ✅ 404 errors
│   └── GlobalExceptionHandler.java  ✅ Error handling
├── repository/
│   ├── UserRepository.java          ✅ User CRUD
│   └── UserSessionRepository.java   ✅ Session CRUD
├── security/
│   ├── JwtTokenProvider.java        ✅ JWT utilities
│   ├── JwtAuthenticationFilter.java ✅ Request filter
│   ├── SecurityConfig.java          ✅ Security config
│   └── CustomUserDetailsService.java ✅ User loading
└── service/
    ├── AuthService.java             ✅ Auth logic
    ├── EmailService.java            ✅ Email sending
    └── UserService.java             ✅ User management
```

---

## Next Steps

Hệ thống Authentication đã hoàn tất! Bạn có thể:

1. **Test API endpoints** với Postman
2. **Tích hợp Frontend** (React/Vue/Angular)
3. **Thêm Social Login** (Google, Facebook)
4. **Implement Rate Limiting** chống brute force
5. **Add 2FA** (Two-Factor Authentication)
6. **Monitor Sessions** với dashboard admin

**Cần hỗ trợ gì thêm?** 🚀
