# CoCoCord - Hướng dẫn chạy và test Chat

## 🚀 Khởi động ứng dụng

### Bước 1: Chuẩn bị database

#### MySQL

```bash
# Tạo database
mysql -u root -p
CREATE DATABASE cococord_mysql;
EXIT;
```

#### MongoDB

```bash
# Khởi động MongoDB service
mongod

# Hoặc với Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Bước 2: Chạy ứng dụng

```bash
# Từ thư mục gốc của project
./mvnw spring-boot:run

# Hoặc trên Windows
mvnw.cmd spring-boot:run
```

Ứng dụng sẽ chạy tại: `http://localhost:8080`

## 📝 Test chức năng Chat

### Phương pháp 1: Sử dụng giao diện Web

1. **Đăng ký tài khoản**

   - Truy cập: `http://localhost:8080/register`
   - Đăng ký ít nhất 2 tài khoản để test chat giữa users

2. **Đăng nhập**

   - Truy cập: `http://localhost:8080/login`
   - Đăng nhập với tài khoản vừa tạo

3. **Vào Chat**

   - Từ Dashboard, click "Go to Chat"
   - Hoặc truy cập trực tiếp: `http://localhost:8080/chat`

4. **Test Real-time Chat**
   - Mở 2 cửa sổ/tab trình duyệt
   - Đăng nhập 2 tài khoản khác nhau
   - Gửi tin nhắn từ cửa sổ 1
   - Kiểm tra tin nhắn xuất hiện ngay lập tức ở cửa sổ 2

### Phương pháp 2: Sử dụng Test Client

1. **Truy cập Test Client**

   ```
   http://localhost:8080/websocket-test.html
   ```

2. **Lấy JWT Token**

   - Đăng nhập vào ứng dụng
   - Mở Browser Console (F12)
   - Chạy lệnh: `localStorage.getItem('accessToken')`
   - Copy token

3. **Test WebSocket**
   - Paste token vào Test Client
   - Click "Connect"
   - Test send, edit, delete messages

## ✅ Checklist Test

### Test 1: Kết nối WebSocket ✓

- [ ] Kết nối thành công với JWT token
- [ ] Nhận được confirmation message
- [ ] Status hiển thị "Connected"

### Test 2: Gửi tin nhắn ✓

- [ ] Gửi tin nhắn đơn giản
- [ ] Tin nhắn xuất hiện ở tất cả clients
- [ ] Avatar và username hiển thị đúng
- [ ] Timestamp chính xác

### Test 3: Edit tin nhắn ✓

- [ ] Hover vào tin nhắn của mình → hiện nút Edit
- [ ] Click Edit → sửa nội dung
- [ ] Tin nhắn cập nhật real-time
- [ ] Badge "(edited)" xuất hiện

### Test 4: Xóa tin nhắn ✓

- [ ] Hover vào tin nhắn → hiện nút Delete
- [ ] Xác nhận xóa
- [ ] Tin nhắn biến mất khỏi tất cả clients
- [ ] Animation fade out

### Test 5: Typing Indicator ✓

- [ ] Gõ tin nhắn ở window 1
- [ ] Typing indicator xuất hiện ở window 2
- [ ] Indicator tự động ẩn sau 3-5 giây

### Test 6: Switch Channels ✓

- [ ] Click vào channel khác
- [ ] Messages load đúng channel
- [ ] Subscription cập nhật
- [ ] Không có memory leak

### Test 7: Message Formatting ✓

- [ ] **Bold** với `**text**`
- [ ] _Italic_ với `*text*`
- [ ] `Code` với backticks
- [ ] Links tự động clickable
- [ ] Line breaks với Shift+Enter

### Test 8: Error Handling ✓

- [ ] Mất kết nối → auto reconnect
- [ ] Gửi tin nhắn khi offline → error message
- [ ] Edit tin nhắn của người khác → từ chối
- [ ] Delete tin nhắn của người khác → từ chối

## 🔍 Debug Tips

### Check WebSocket Connection

```javascript
// Trong Browser Console
// Kiểm tra WebSocket status
console.log(ChatApp.stompClient.connected);

// Kiểm tra current channel
console.log(ChatApp.currentChannelId);

// Kiểm tra messages cache
console.log(ChatApp.messagesCache);
```

### Check Server Logs

```bash
# Terminal chạy Spring Boot
# Tìm các log:
[INFO] Connected to WebSocket: ...
[INFO] Received message from user: ...
[INFO] Message broadcast to channel: ...
```

### Check Database

#### MongoDB Messages

```javascript
// Mongo shell
use cococord_mongo
db.messages.find().pretty()
db.messages.countDocuments()
```

#### MySQL Channels

```sql
-- MySQL
USE cococord_mysql;
SELECT * FROM channels;
SELECT * FROM users;
```

## 🐛 Troubleshooting

### Lỗi: WebSocket không kết nối

**Nguyên nhân:** Token không hợp lệ hoặc hết hạn
**Giải pháp:**

- Đăng nhập lại
- Lấy token mới
- Refresh trang

### Lỗi: Tin nhắn không gửi được

**Nguyên nhân:** Không có quyền truy cập channel
**Giải pháp:**

- Kiểm tra user có trong server không
- Kiểm tra channel permissions
- Xem server logs

### Lỗi: Messages không load

**Nguyên nhân:** MongoDB chưa chạy hoặc kết nối lỗi
**Giải pháp:**

```bash
# Start MongoDB
mongod

# Hoặc
docker start mongodb
```

### Lỗi: Typing indicator không hoạt động

**Nguyên nhân:** Subscription chưa đúng
**Giải pháp:**

- Check console log
- Verify channel subscription
- Restart WebSocket connection

## 📊 Performance Test

### Load Test với nhiều users

```javascript
// Script để tạo nhiều connections
// (Chạy trong console)

const connections = [];
for (let i = 0; i < 10; i++) {
  // Create multiple WebSocket connections
  // Test server performance
}
```

### Message Throughput Test

- Gửi 100 tin nhắn liên tục
- Đo thời gian nhận được tại client khác
- Kiểm tra không có message loss

## 🎯 Kết quả mong đợi

Sau khi test xong, bạn sẽ có:

✅ **Real-time Chat hoàn chỉnh**

- Gửi/nhận tin nhắn instant
- Edit/delete messages
- Typing indicators
- User presence

✅ **Giao diện giống Discord**

- 3-column layout
- Server list + Channel list + Chat
- Modern UI với dark theme
- Responsive design

✅ **WebSocket ổn định**

- Auto-reconnect
- Error handling
- JWT authentication
- STOMP protocol

## 📸 Screenshots Expected

1. Login page với form đẹp
2. Dashboard với button "Go to Chat"
3. Chat interface với 3 columns
4. Messages hiển thị real-time
5. Typing indicator hoạt động
6. Edit/delete message actions

## 🎊 Chúc mừng!

Nếu tất cả tests pass, bạn đã có một ứng dụng chat real-time hoàn chỉnh!

## 📞 Next Steps

Sau khi test xong, bạn có thể:

1. Thêm file upload
2. Implement voice channels
3. Add reactions/emojis
4. Create server management
5. Add direct messages
6. Implement roles & permissions

---

**Happy Testing! 🚀**
