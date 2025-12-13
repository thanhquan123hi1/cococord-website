# CoCoCord – Java Spring Boot + JSP + MySQL/MongoDB + WebSocket + JWT 

> Dự án xây dựng website chat realtime giống Discord 95% tính năng (MVP + mở rộng)  
> Tech stack: Spring Boot 3.x + JSP + Spring Security + JWT + JPA/Hibernate + MySQL + MongoDB + WebSocket (STOMP) + Sitemesh3 + Tailwind CSS (hoặc Bootstrap/Antd) + Maven

## Mục tiêu dự án
Xây dựng một ứng dụng chat realtime đầy đủ tính năng giống Discord:
- Server → Channel → Chat realtime
- Friend system & Direct Message
- Voice channel (có thể mở rộng sau)
- Phân quyền chi tiết (Role & Permission)
- Admin dashboard
- Responsive 100% 

## Tính năng đã hoàn thành / sẽ làm (Full Feature List)

### I. Authentication & Security
- [ ] Đăng ký / Đăng nhập (JWT Access + Refresh Token)
- [ ] Quên mật khẩu (gửi mail reset)
- [ ] Đổi mật khẩu, cập nhật avatar, thông tin cá nhân
- [ ] Spring Security + BCrypt + CSRF Protection
- [ ] Rate limiting đăng nhập
- [ ] 2FA (tùy chọn)

### II. Server (Guild) Management
- [ ] Tạo / Sửa / Xóa server (chỉ Owner)
- [ ] Mời thành viên bằng link mời (có thời hạn/tắt được)
- [ ] Rời server
- [ ] Phân quyền Role: Owner → Admin → Moderator → Member → Guest
- [ ] Kick / Ban member
- [ ] Quản lý role & permission chi tiết

### III. Channel & Category
- [ ] Text Channel / Voice Channel (placeholder) / Category
- [ ] Tạo / Sửa / Xóa channel
- [ ] Private channel (chỉ thành viên được mời mới vào
- [ ] Thread (tùy chọn giai đoạn 2)

### IV. Realtime Chat (WebSocket + MongoDB)
- [ ] Gửi/nhận tin nhắn realtime qua STOMP WebSocket
- [ ] Gửi emoji, hình ảnh, file (tối đa 25MB
- [ ] @mention, #channel tag
- [ ] Reply, Edit, Delete tin nhắn
- [ ] Reaction (❤️ 😂 👍 …)
- [ ] Lưu toàn bộ tin nhắn vào MongoDB (NoSQL)
- [ ] Load more tin nhắn khi scroll lên (pagination 50 tin/lần)

### V. Friend System & Direct Message
- [ ] Gửi / Chấp nhận / Từ chối / Hủy kết bạn
- [ ] Block user
- [ ] Chat 1-1 realtime
- [ ] Group DM (nhóm chat riêng tưtối đa 10 người)

### VI. Realtime Notification
- [ ] Thông báo khi có tin nhắn mới (đánh dấu đỏ)
- [ ] Thông báo lời mời kết bạn, mời server, bị kick/ban
- [ ] Dùng WebSocket push tức thì

### VII. Admin Dashboard
- [ ] Đường dẫn riêng `/admin`
- [ ] Quản lý người dùng, server
- [ ] Ban user toàn hệ thống
- [ ] Thống kê online, audit log

### VIII. User & Server Settings
- [ ] Dark/Light mode
- [ ] Quản lý session đăng nhập
- [ ] Server settings: role, member list, invite link, audit log

### IX. File Storage
- [ ] Upload ảnh/file 
- [ ] Preview ảnh, video, PDF trong chat

### X. Giao diện (UI/UX)
- [ ] Layout giống Discord 60%:
  - Left: Danh sách server
  - Sidebar 2: Danh sách channel + danh mục
  - Main: Khu vực chat
  - Right: Danh sách thành viên online + trạng thái
- [ ] Responsive hoàn toàn
- [ ] Dùng Tailwind CSS và Bootstrap 5 / Ant Design
- [ ] Sitemesh3 làm decorator layout chung

### XI. Bảo mật
- JWT + Spring Security 6

### XII. Cấu trúc của dự án
