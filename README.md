<div align="center">

  <img src="src/main/resources/static/images/cococord-logo.png" alt="logo" width="120" height="120" />
  <h1>CoCoCord</h1>
  <p>
    <strong>Nền tảng giao tiếp thời gian thực</strong>
  </p>

  <p>
    <a href="https://spring.io/projects/spring-boot">
      <img src="https://img.shields.io/badge/Spring%20Boot-3.5.9-brightgreen?style=for-the-badge&logo=spring&logoColor=white" alt="Spring Boot" />
    </a>
    <a href="https://www.java.com/">
      <img src="https://img.shields.io/badge/Java-21-red?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java" />
    </a>
    <a href="https://www.mysql.com/">
      <img src="https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
    </a>
    <a href="https://www.mongodb.com/">
      <img src="https://img.shields.io/badge/MongoDB-6.0-green?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    </a>
    <a href="https://redis.io/">
      <img src="https://img.shields.io/badge/Redis-Latest-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
    </a>
  </p>
  

  <img src="src/main/resources/static/images/landing-page.gif" alt="CoCoCord Demo" width="100%" style="border-radius: 10px; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);" />

</div>

---

## 📖 Giới thiệu (Introduction)

**CoCoCord** không chỉ là một ứng dụng chat thông thường, mà là một **hệ sinh thái giao tiếp** được thiết kế để kết nối cộng đồng. Lấy cảm hứng từ Discord, CoCoCord mang đến trải nghiệm nhắn tin, gọi thoại và quản lý cộng đồng mượt mà, bảo mật và tốc độ cao.

Dự án là sự kết tinh của các công nghệ Java Web hiện đại nhất hiện nay, minh chứng cho khả năng xây dựng hệ thống **Real-time**, **High-concurrency** và **Scalable**.

---

## ✨ Tính năng Đột phá (Key Features)

<table>
  <tr>
    <td width="50%">
      <h3>⚡ Tốc độ & Real-time (Thời gian thực)</h3>
      <ul>
        <li>Hệ thống <strong>WebSocket (STOMP)</strong> tối ưu hóa, độ trễ tin nhắn dưới 50ms.</li>
        <li>Thông báo tức thì (Push Notifications) khi có tin nhắn mới, lời mời kết bạn.</li>
        <li>Trạng thái hoạt động (Presence) và Typing Indicator chính xác theo mili-giây.</li>
      </ul>
    </td>
    <td width="50%">
       <!-- [CHÈN GIF: Chat nhanh như chớp] -->
       <img src="src/main/resources/static/images/chat.gif" width="100%" /> 
    </td>
  </tr>
  <tr>
    <td width="50%">
       <img src="src/main/resources/static/images/video-call.gif" width="100%" />
    </td>
    <td width="50%">
      <h3>🎙️ Voice Chat & Media</h3>
      <ul>
        <li>Đàm thoại âm thanh chất lượng cao (WebRTC P2P).</li>
        <li>Khả năng lọc tiếng ồn, tùy chỉnh Input/Output.</li>
        <li>Gửi file đa phương tiện (Ảnh, Video, Tệp tin) lên tới 25MB với preview thông minh.</li>
      </ul>
    </td>
  </tr>
    <tr>
    <td width="50%">
      <h3>🛡️ Quản trị Cộng đồng (Community)</h3>
      <ul>
        <li>Phân quyền role chi tiết (Admin, Mod, Member, Guest).</li>
        <li>Tạo Invite Link có thời hạn/số lượt dùng.</li>
        <li>Audit Log ghi lại mọi hành động quan trọng trong Server.</li>
      </ul>
    </td>
    <td width="50%">
       <!-- [CHÈN GIF: Server Settings & Roles] -->
       <img src="src/main/resources/static/images/server.gif" width="100%" /> 
    </td>
  </tr>
</table>

### 🛠️ Các tính năng khác
- **Hybrid Database**: Kết hợp sức mạnh ràng buộc của SQL và tốc độ của NoSQL.
- **Message Actions**: Reply, Edit, Soft-Delete, Reactions (Emoji).
- **Security**: JWT Rotation, CSRF Protection, XSS Filtering.

---

## 🏗️ Kiến trúc Hệ thống (System Architecture)

Chúng tôi sử dụng mô hình Layered Architecture hiện đại, dễ dàng mở rộng sang Microservices.

```mermaid
graph TD
    User((User)) -->|Browser/Mobile| LB[Load Balancer / Nginx]
    LB -->|HTTPS/WSS| App[Spring Boot Application]
    
    subgraph "Backend Core"
        App -->|Auth| Security[Spring Security + JWT Filter]
        App -->|Logic| Service[Service Layer]
        App -->|Realtime| WS[WebSocket Controller]
    end
    
    subgraph "Data Persistence"
        Service -->|User/Guild Data| MySQL[(MySQL 8.0)]
        Service -->|Chat History| Mongo[(MongoDB)]
        Service -->|Cache/PubSub| Redis[(Redis)]
    end
    
    subgraph "External Services"
        Service -->|Storage| Cloud[File Storage]
    end
```

---

## ⚡ Cài đặt & Triển khai (Installation)

### Yêu cầu hệ thống
| Phần mềm | Phiên bản tối thiểu |
| :--- | :--- |
| Java JDK | 21 LTS |
| Maven | 3.8+ |
| MySQL | 8.0 |
| MongoDB | 5.0+ |

### Chạy Local (Development)

1. **Khởi tạo Database**:
   - Tạo schema MySQL: `CREATE DATABASE cococord_db;`
   - (MongoDB tự động tạo khi chạy).

2. **Cài đặt dependencies**:
   ```bash
   mvn clean install
   ```

3. **Chạy ứng dụng**:
   ```bash
   mvn spring-boot:run
   ```

4. **Truy cập**:
   - App: `http://localhost:8080`

---

## Thư viện ảnh (Gallery)

| **Login Screen** | **Register Screen** |
|:---:|:---:|
| <img src="https://via.placeholder.com/400x250?text=Login" width="100%"> | <img src="https://via.placeholder.com/400x250?text=Register" width="100%"> |

| **Direct Message** | **User Settings** |
|:---:|:---:|
| <img src="https://via.placeholder.com/400x250?text=Direct+Message" width="100%"> | <img src="https://via.placeholder.com/400x250?text=Settings" width="100%"> |

| **Create Server Modal** | **Channel Settings** |
|:---:|:---:|
| <img src="https://via.placeholder.com/400x250?text=Create+Server" width="100%"> | <img src="https://via.placeholder.com/400x250?text=Channel+Settings" width="100%"> |


---


<div align="center">
  <p>Thực hiện bởi <strong>Phùng Lê Thanh Quân</strong> <br/>
  <strong>Đặng Gia Nguyên</strong> <br/> 
  <strong>Nguyễn Đức Thịnh</strong> </p>
  <p>
    <a href="#">
      <img src="https://img.shields.io/badge/Facebook-Connect-blue?style=flat&logo=facebook" alt="Facebook" />
    </a>
    <a href="#">
      <img src="https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin" alt="LinkedIn" />
    </a>
    <a href="#">
      <img src="https://img.shields.io/badge/Email-Contact-red?style=flat&logo=gmail" alt="Email" />
    </a>
  </p>
</div>
