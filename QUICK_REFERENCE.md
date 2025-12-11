# 🎯 CoCoCord - Quick Reference

## 🚀 Khởi động nhanh

### 1. Prerequisites

```bash
# Java 21+
java -version

# MySQL
mysql -V

# MongoDB
mongod --version
```

### 2. Database Setup

```bash
# MySQL
mysql -u root -p
CREATE DATABASE cococord_mysql;
USE cococord_mysql;
source test-data.sql;

# MongoDB - Auto created
```

### 3. Start Application

```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

## 📱 URLs

| Page        | URL                                       | Description        |
| ----------- | ----------------------------------------- | ------------------ |
| Home        | http://localhost:8080                     | Redirect to login  |
| Register    | http://localhost:8080/register            | Create account     |
| Login       | http://localhost:8080/login               | Sign in            |
| Dashboard   | http://localhost:8080/dashboard           | User dashboard     |
| **Chat**    | **http://localhost:8080/chat**            | **Real-time chat** |
| Test Client | http://localhost:8080/websocket-test.html | WebSocket testing  |

## 🔑 API Endpoints

### REST APIs

```
GET  /api/messages/channel/{channelId}     - Get messages
GET  /api/messages/{messageId}             - Get message
GET  /api/messages/{messageId}/replies     - Get replies
```

### WebSocket

```
Connect: /ws
Auth: Bearer {JWT_TOKEN}

Send:
  /app/chat.sendMessage
  /app/chat.editMessage
  /app/chat.deleteMessage
  /app/chat.typing
  /app/presence.update

Subscribe:
  /topic/channel/{channelId}
  /topic/channel/{channelId}/delete
  /topic/channel/{channelId}/typing
  /user/queue/errors
```

## 🧪 Testing Steps

### Test 1: Đăng ký & Đăng nhập

1. Đăng ký tài khoản tại `/register`
2. Đăng nhập tại `/login`
3. Kiểm tra dashboard

### Test 2: Real-time Chat

1. Mở 2 browser windows
2. Đăng nhập 2 users khác nhau
3. Vào `/chat` ở cả 2 windows
4. Gửi message từ window 1
5. Check message xuất hiện ngay ở window 2

### Test 3: Edit Message

1. Gửi message
2. Hover → click Edit
3. Sửa nội dung
4. Check "(edited)" badge xuất hiện

### Test 4: Delete Message

1. Gửi message
2. Hover → click Delete
3. Confirm
4. Message biến mất ở tất cả clients

## 💻 Code Structure

```
WebSocket Flow:
Client → SockJS → STOMP → Spring Controller → Service → MongoDB
                                           ↓
                                    Broadcast ← All Subscribers

Security:
Request → JWT Filter → WebSocket Interceptor → Validate → Allow/Deny
```

## 🎨 UI Components

### Chat Interface

```
┌─────────────────────────────────────────────┐
│ [Servers] [Channels]    [Chat Messages]    │
│  • Home    #general     User1: Hello!      │
│  + Add     #random      User2: Hi there    │
│            🔊Voice      [Message Input]     │
│           [UserPanel]                       │
└─────────────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Issue: WebSocket không connect

**Solution:**

- Check JWT token: `localStorage.getItem('accessToken')`
- Refresh page
- Re-login

### Issue: Messages không load

**Solution:**

- Check MongoDB running: `mongod`
- Check console errors (F12)
- Restart server

### Issue: Cannot edit/delete

**Solution:**

- Only own messages can be edited
- Check user authentication
- Verify message ownership

## 📊 Performance Tips

### Client Side

- Messages cached in `Map`
- Pagination: 50 messages/page
- Auto-reconnect on disconnect

### Server Side

- MongoDB indexed on `channelId`
- JWT token validation cached
- WebSocket connections pooled

## 🔒 Security Checklist

- [x] JWT authentication
- [x] Password hashing (BCrypt)
- [x] XSS protection (HTML escaping)
- [x] CSRF protection
- [x] Input validation
- [ ] Rate limiting (TODO)
- [ ] Message encryption (TODO)

## 📝 Common Commands

### Maven

```bash
# Build
./mvnw clean package

# Run
./mvnw spring-boot:run

# Test
./mvnw test
```

### Database

```bash
# MySQL Export
mysqldump -u root -p cococord_mysql > backup.sql

# MongoDB Export
mongoexport --db=cococord_mongo --collection=messages --out=messages.json
```

### Git

```bash
# Commit changes
git add .
git commit -m "Implement WebSocket chat"
git push
```

## 🎯 Next Features to Implement

### Priority 1

- [ ] File upload
- [ ] Image preview
- [ ] Emoji picker

### Priority 2

- [ ] Search messages
- [ ] Direct messages
- [ ] User profile page

### Priority 3

- [ ] Voice channels
- [ ] Server management UI
- [ ] Admin dashboard

## 📚 Resources

- **Documentation:** See CHAT_GUIDE.md, TEST_GUIDE.md
- **Code:** Fully commented
- **Test Client:** /websocket-test.html
- **Sample Data:** test-data.sql

## 🆘 Support

### Logs Location

```bash
# Application logs
Console output

# Spring Boot logs
./logs/spring.log (if configured)
```

### Debug Mode

```properties
# application.properties
logging.level.vn.cococord=DEBUG
logging.level.org.springframework.web.socket=DEBUG
```

### Check Health

```bash
# Application running
curl http://localhost:8080/actuator/health

# WebSocket endpoint
curl http://localhost:8080/ws
```

## ✅ Verification Checklist

After starting:

- [ ] Server starts without errors
- [ ] Can access /login
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Dashboard shows user info
- [ ] Chat page loads
- [ ] WebSocket connects
- [ ] Can send messages
- [ ] Messages appear real-time
- [ ] Can edit own messages
- [ ] Can delete own messages

## 🎉 Success!

If all checks pass, you have a **fully working real-time chat application**!

---

**Need help?** Check the detailed guides:

- IMPLEMENTATION_SUMMARY.md
- CHAT_GUIDE.md
- TEST_GUIDE.md
