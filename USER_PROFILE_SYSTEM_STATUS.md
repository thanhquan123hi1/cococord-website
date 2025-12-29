# User Profile & Presence System Implementation

## ✅ COMPLETED FEATURES

### Backend (100% Complete)
1. **Entities & Database:**
   - ✅ Updated User entity with: bannerUrl, pronouns, customStatusEmoji, customStatusExpiresAt, theme, messageDisplay, allowFriendRequests, allowDirectMessages
   - ✅ Created UserNote entity for private notes about users
   - ✅ Updated UserProfileResponse with all new fields

2. **DTOs:**
   - ✅ UpdateStatusRequest - For status and custom status updates
   - ✅ UpdateUserSettingsRequest - For profile settings
   - ✅ SetUserNoteRequest - For user notes

3. **Services:**
   - ✅ PresenceServiceImpl - Complete presence tracking with:
     - In-memory active connections tracking
     - Auto-idle detection (10 minutes)
     - Expired custom status cleanup (5 minutes)
     - WebSocket broadcasting to friends and servers
     - Presence heartbeat tracking
   - ✅ UserServiceImpl - Enhanced with:
     - getUserProfileById with viewer context (includes notes)
     - updateUserSettings
     - uploadAvatar/uploadBanner
     - setUserNote
     - getMutualServers

4. **API Endpoints (ProfileController):**
   - ✅ GET /api/users/me/profile
   - ✅ GET /api/users/{userId}/profile
   - ✅ PUT /api/users/me/settings
   - ✅ PUT /api/users/me/status
   - ✅ DELETE /api/users/me/custom-status
   - ✅ POST /api/users/me/avatar
   - ✅ POST /api/users/me/banner
   - ✅ POST /api/users/{userId}/note
   - ✅ GET /api/users/{userId}/mutual-servers
   - ✅ GET /api/users/presence
   - ✅ POST /api/users/me/activity

### Frontend (50% Complete)
1. **Components Created:**
   - ✅ user-panel.js - Bottom-left user panel with avatar, status indicator, custom status
   - ✅ status-picker.js - Dropdown for status selection and custom status
   - ✅ user-panel.css - Complete styling

2. **Components Pending:**
   - ⏳ user-profile-modal.js - Full profile modal (banner, bio, roles, mutual servers)
   - ⏳ user-settings-modal.js - Settings modal (My Account, Profile, Privacy, Appearance tabs)
   - ⏳ profile-modal.css
   - ⏳ settings-modal.css

## 📋 REMAINING TASKS

### Frontend Components to Create:
1. **User Profile Modal** (`user-profile-modal.js`):
   - Large banner display (600x240px)
   - Avatar overlapping banner (120x120px)
   - Username, discriminator, badges
   - About Me section
   - Member Since dates
   - Roles display
   - Private note textarea
   - Mutual servers list
   - Action buttons (Send Message, Add Friend, Block)

2. **User Settings Modal** (`user-settings-modal.js`):
   - Navigation tabs:
     * My Account (username, email, password, 2FA)
     * Profile (avatar, banner, bio, pronouns)
     * Privacy (friend requests, DM permissions)
     * Appearance (theme, message display)
   - File upload for avatar/banner
   - Form validation and submission

3. **Styling Files:**
   - `profile-modal.css` - Profile modal styles
   - `settings-modal.css` - Settings modal styles

## 🔧 INTEGRATION NEEDED

1. **WebSocket Configuration:**
   - Enable scheduled tasks in main application class:
   ```java
   @EnableScheduling
   public class CococordApplication { }
   ```

2. **Add to JSP/HTML pages:**
   ```html
   <!-- In <head> -->
   <link rel="stylesheet" href="${pageContext.request.contextPath}/css/user-panel.css">
   
   <!-- Before </body> -->
   <script src="${pageContext.request.contextPath}/js/user-panel.js"></script>
   <script src="${pageContext.request.contextPath}/js/status-picker.js"></script>
   
   <!-- Add user panel container -->
   <div id="userPanel" class="user-panel"></div>
   ```

3. **WebSocket Event Listeners:**
   - Subscribe to `/queue/presence` for personal status updates
   - Subscribe to `/topic/server.{serverId}.presence` for server member status
   - Handle `user.status.changed` events to update UI

## 📊 TESTING CHECKLIST

### Backend:
- [ ] Update user status via API
- [ ] Upload avatar and banner
- [ ] Set custom status with expiry
- [ ] Auto-idle detection after 10 minutes
- [ ] Custom status clears after expiry time
- [ ] Set private notes about users
- [ ] Get mutual servers
- [ ] Presence broadcasts to friends
- [ ] Presence broadcasts to server members

### Frontend:
- [ ] User panel displays correctly
- [ ] Status indicator shows correct color
- [ ] Custom status displays with emoji
- [ ] Status picker opens/closes
- [ ] Status can be changed
- [ ] Custom status can be set
- [ ] Status duration selector works
- [ ] Avatar upload works
- [ ] Banner upload works

## 🚀 QUICK START

1. **Enable Scheduling:**
```java
@SpringBootApplication
@EnableScheduling
public class CococordApplication {
    public static void main(String[] args) {
        SpringApplication.run(CococordApplication.class, args);
    }
}
```

2. **Build and Run:**
```bash
.\mvnw clean compile
.\mvnw spring-boot:run
```

3. **Test Status Update:**
```bash
curl -X PUT http://localhost:8080/api/users/me/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DO_NOT_DISTURB",
    "customStatus": "Working on a project",
    "customStatusEmoji": "💻",
    "customStatusDuration": 240
  }'
```

## 📝 NOTES

- User status changes broadcast via WebSocket to all friends and server members
- Auto-idle detection runs every minute
- Custom status cleanup runs every 5 minutes
- Presence heartbeat recommended every 5 minutes from client
- File uploads use existing FileStorageService (8MB max)
- All new User fields are optional (nullable)
