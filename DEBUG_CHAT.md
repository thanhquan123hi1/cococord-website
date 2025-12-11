# Debug Chat - Hướng dẫn Kiểm tra

## Vấn đề đã sửa

### 1. Lỗi STOMP Connection

**Vấn đề:** Trong `chat.js`, đang sử dụng `window.Stomp.Stomp.over(socket)` (double Stomp)
**Đã sửa:** Thay bằng `Stomp.over(socket)`

File: `src/main/resources/static/js/chat.js` - Line 53

## Các bước kiểm tra tin nhắn

### Bước 1: Kiểm tra Browser Console

1. Mở chat page: http://localhost:8080/chat
2. Nhấn F12 để mở Developer Tools
3. Chuyển sang tab **Console**
4. Kiểm tra các log sau:

**Logs khi kết nối thành công:**

```
Initializing CoCoCord Chat...
STOMP: Connecting to websocket...
Connected to WebSocket: ...
Subscribed to channel 1
Loaded X messages for channel 1
Connected to chat server
```

**Logs khi gửi tin nhắn:**

```
Message sent: {channelId: 1, content: "...", ...}
STOMP: >>> SEND
Message received: {...}
```

### Bước 2: Kiểm tra WebSocket Connection

Trong Console, chạy lệnh sau:

```javascript
// Kiểm tra WebSocket state
console.log("STOMP Connected:", ChatApp.stompClient?.connected);
console.log("Current User:", ChatApp.currentUsername);
console.log("Current Channel:", ChatApp.currentChannelId);
console.log(
  "Access Token:",
  localStorage.getItem("accessToken") ? "Có" : "Không có"
);
```

### Bước 3: Kiểm tra Network Tab

1. Mở tab **Network** trong Developer Tools
2. Filter: `ws` (WebSocket)
3. Tìm connection tới `/ws`
4. Click vào connection đó
5. Tab **Messages** sẽ hiển thị các message STOMP đi và đến

**Frames khi gửi tin nhắn:**

- `SEND` - Gửi message lên server
- `MESSAGE` - Nhận message broadcast từ server

### Bước 4: Kiểm tra MongoDB

```powershell
# Kiểm tra messages trong MongoDB
mongosh cococord_mongo --eval "db.messages.find().pretty()"

# Đếm số messages
mongosh cococord_mongo --eval "db.messages.countDocuments({})"
```

### Bước 5: Kiểm tra Server Logs

Trong terminal đang chạy Spring Boot, tìm các log:

**Khi gửi message:**

```
Received message from user: [username] to channel: [channelId]
Message broadcast to channel: [channelId]
```

**Khi có lỗi:**

```
Error sending message: [error message]
```

## Các lỗi thường gặp

### Lỗi 1: "Not connected to server"

**Nguyên nhân:** WebSocket chưa connect hoặc bị disconnect
**Giải pháp:**

1. Kiểm tra JWT token trong localStorage
2. Refresh page
3. Kiểm tra server có đang chạy không

### Lỗi 2: Tin nhắn không hiển thị

**Nguyên nhân:** Không subscribe đến đúng channel
**Giải pháp:**

1. Kiểm tra Console log: "Subscribed to channel X"
2. Đảm bảo currentChannelId đúng
3. Refresh page

### Lỗi 3: "Cannot read property 'send' of null"

**Nguyên nhân:** stompClient chưa được khởi tạo
**Giải pháp:**

1. Đợi WebSocket connect xong
2. Kiểm tra có token trong localStorage không
3. Kiểm tra WebSocketConfig

### Lỗi 4: 401 Unauthorized

**Nguyên nhân:** JWT token không hợp lệ hoặc hết hạn
**Giải pháp:**

1. Logout và login lại
2. Kiểm tra token expiration
3. Xóa localStorage và login lại:
   ```javascript
   localStorage.clear();
   window.location.href = "/login";
   ```

## Test thủ công

### Test 1: Gửi tin nhắn đơn giản

1. Login vào hệ thống
2. Vào page Chat
3. Đợi "Connected to chat server" xuất hiện
4. Nhập "Hello World" và Enter
5. Tin nhắn phải xuất hiện trong chat area

### Test 2: Gửi nhiều tin nhắn

1. Gửi liên tiếp 5 tin nhắn
2. Tất cả phải hiển thị theo thứ tự
3. Avatar và username phải đúng

### Test 3: Kiểm tra realtime

1. Mở 2 tab browser
2. Login 2 user khác nhau
3. Gửi tin từ tab 1
4. Tin nhắn phải xuất hiện ở tab 2 ngay lập tức

## Restart Application

Sau khi sửa code, cần restart server:

```powershell
# Dừng server (Ctrl+C trong terminal đang chạy)

# Rebuild và chạy lại
./mvnw clean spring-boot:run
```

## Thông tin MongoDB

**Connection String:** mongodb://localhost:27017/cococord_mongo
**Database:** cococord_mongo
**Collection:** messages

**Kiểm tra cấu hình:**

```properties
# File: src/main/resources/application.properties
spring.data.mongodb.uri=mongodb://localhost:27017/cococord_mongo
```

## Kiểm tra WebSocket Endpoint

**Endpoint:** ws://localhost:8080/ws
**Protocol:** STOMP over SockJS
**Authentication:** JWT Bearer token in STOMP headers

## Support Commands

```javascript
// In Browser Console

// 1. Test gửi tin nhắn trực tiếp
ChatApp.sendMessage("Test message");

// 2. Reconnect WebSocket
ChatApp.connectWebSocket();

// 3. Xem messages cache
console.table(Array.from(ChatApp.messagesCache.values()));

// 4. Xem user info
console.log({
  userId: ChatApp.currentUserId,
  username: ChatApp.currentUsername,
  displayName: ChatApp.currentDisplayName,
});
```

## Checklist Trước khi Test

- [ ] MongoDB đang chạy (Check: `Get-Service MongoDB`)
- [ ] Spring Boot app đang chạy (Port 8080)
- [ ] Đã login và có JWT token trong localStorage
- [ ] Browser console không có lỗi đỏ
- [ ] Network tab thấy WebSocket connection `/ws` (Status: 101)
- [ ] Console log hiển thị "Connected to chat server"

## Nếu vẫn không gửi được tin nhắn

1. **Clear cache và restart:**

   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Restart MongoDB:**

   ```powershell
   Restart-Service MongoDB
   ```

3. **Rebuild application:**

   ```powershell
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

4. **Kiểm tra port conflicts:**
   ```powershell
   netstat -ano | findstr :8080
   netstat -ano | findstr :27017
   ```

## Contact Info

Nếu vẫn gặp vấn đề, cung cấp thông tin sau:

1. Screenshot Browser Console
2. Screenshot Network tab (WebSocket frames)
3. Server logs (copy từ terminal)
4. MongoDB collection data: `mongosh cococord_mongo --eval "db.messages.find().pretty()"`
