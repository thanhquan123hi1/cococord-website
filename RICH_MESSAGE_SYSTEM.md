# Rich Message System - Implementation Guide

## Overview
This document describes the complete implementation of the Rich Message System with Attachments, Reactions, and Advanced Features for the Discord Clone.

## 🚀 Features Implemented

### Backend (Java/Spring Boot)

#### 1. **File Upload System**
- **FileStorageService** (`IFileStorageService`, `FileStorageServiceImpl`)
  - Upload files with validation (type, size)
  - Generate thumbnails for images (256x256px)
  - Store files in organized directory structure (YYYY/MM/DD)
  - Support for images, videos, and documents
  - Max file size: 8MB (configurable)

#### 2. **Message Reactions**
- Add/remove emoji reactions to messages
- Track users who reacted
- Limit of 20 unique reactions per message
- Real-time updates via WebSocket

#### 3. **Message Management**
- Edit messages with history tracking
- Delete messages with confirmation
- Pin/unpin important messages
- Reply to messages (threading support)

#### 4. **REST API Endpoints**

```java
POST   /api/upload                              // Upload file
POST   /api/messages                            // Send message
PUT    /api/messages/{messageId}                // Edit message
DELETE /api/messages/{messageId}                // Delete message
POST   /api/messages/{messageId}/reactions      // Add reaction
DELETE /api/messages/{messageId}/reactions/{emoji} // Remove reaction
POST   /api/messages/{messageId}/pin            // Pin message
DELETE /api/messages/{messageId}/pin            // Unpin message
GET    /api/messages/{channelId}                // Get messages with pagination
```

#### 5. **WebSocket Events**

```javascript
message.created    // New message broadcasted
message.updated    // Message edited
message.deleted    // Message removed
reaction.added     // Reaction added
reaction.removed   // Reaction removed
```

#### 6. **Data Model** (MongoDB Embedded)

The Message entity already includes:
- Attachments (filename, URL, size, dimensions, thumbnail)
- Reactions (emoji, user IDs, count)
- Edit history
- Pin status
- Timestamps

### Frontend (JavaScript/CSS)

#### 1. **Enhanced Message Component** (`enhanced-message.js`)

**Features:**
- User avatar (40x40px) with role color
- Relative timestamps ("Today at 3:45 PM", "Yesterday")
- Markdown support (bold, italic, code blocks, links)
- Hover actions (Reply, React, More Options)
- Right-click context menu
- Edit inline editor (ESC to cancel, Enter to save)
- Delete confirmation modal

**Markdown Support:**
```javascript
**bold** or __bold__
*italic* or _italic_
~~strikethrough~~
`inline code`
```code blocks```
[link text](url)
```

**Context Menu Actions:**
- Reply
- Edit (own messages only)
- Delete (own messages only)
- Copy Message
- Pin Message

#### 2. **File Upload Component** (`file-upload.js`)

**Features:**
- Drag & drop support
- File type validation
- Size validation (8MB default)
- Upload progress bar
- Image preview before sending
- Thumbnail generation
- Multiple file uploads

**Supported File Types:**
- Images: jpg, png, gif, webp
- Videos: mp4, webm, ogg
- Documents: pdf, doc, docx, xls, xlsx, txt

**Usage:**
```javascript
const uploader = new FileUploader({
    maxFileSize: 8 * 1024 * 1024,
    onFileSelect: (files) => { /* handle files */ },
    onUploadProgress: (file, percent) => { /* update UI */ },
    onUploadComplete: (file, response) => { /* add to message */ },
    onUploadError: (file, error) => { /* show error */ }
});

// Add upload button
const button = uploader.createUploadButton(container);

// Setup drag & drop
uploader.setupDragAndDrop(dropZone);
```

#### 3. **Reaction System**

**Features:**
- Quick emoji picker on hover
- Visual feedback on reaction add/remove
- Reaction count display
- User list tooltip on hover
- Animated reaction appearance

**Quick Emojis:**
👍 ❤️ 😂 😮 😢 😡 👏 🎉

#### 4. **Image Lightbox**

Click any image to view in fullscreen with:
- Dark backdrop
- Close button (X)
- Click outside to close
- Smooth animations

#### 5. **Integration** (`rich-message-integration.js`)

Complete integration example showing:
- File upload initialization
- Message sending with attachments
- WebSocket connection
- Real-time message updates
- Optimistic UI updates
- Reply functionality

## 📦 Dependencies Added

### pom.xml
```xml
<!-- Image Processing -->
<dependency>
    <groupId>net.coobird</groupId>
    <artifactId>thumbnailator</artifactId>
    <version>0.4.20</version>
</dependency>
```

### application.properties
```properties
# File Upload Configuration
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=8MB
spring.servlet.multipart.max-request-size=10MB
app.upload.dir=uploads
app.upload.max-file-size=8388608
app.base-url=http://localhost:8080
```

## 🎨 CSS Styling

### Files Created:
1. `enhanced-message.css` - Message component styles
2. `file-upload.css` - File upload and preview styles

### Key Styles:
- Dark Discord-like theme
- Hover animations
- Smooth transitions
- Responsive design
- Mobile-friendly

## 🔧 Setup Instructions

### 1. Backend Setup

**Create uploads directory:**
```bash
mkdir uploads
```

**Run the application:**
```bash
./mvnw spring-boot:run
```

### 2. Frontend Integration

**Add scripts to your HTML:**
```html
<!-- CSS -->
<link rel="stylesheet" href="/css/enhanced-message.css">
<link rel="stylesheet" href="/css/file-upload.css">

<!-- JavaScript -->
<script src="/js/enhanced-message.js"></script>
<script src="/js/file-upload.js"></script>
<script src="/js/rich-message-integration.js"></script>
```

**Initialize in your page:**
```javascript
// Set the current channel
RichMessageSystem.setChannel({
    id: channelId,
    name: 'general'
});

// Messages will be rendered automatically
```

### 3. WebSocket Connection

Ensure SockJS and STOMP are loaded:
```html
<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
```

## 📝 Usage Examples

### Sending a Message with Attachment

```javascript
// Upload file
const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
});
const fileData = await response.json();

// Send message
await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        channelId: 1,
        content: 'Check out this image!',
        attachments: [{
            fileName: fileData.fileName,
            fileUrl: fileData.fileUrl,
            fileType: fileData.mimeType,
            fileSize: fileData.fileSize,
            thumbnailUrl: fileData.thumbnailUrl
        }]
    })
});
```

### Adding a Reaction

```javascript
await fetch(`/api/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji: '👍' })
});
```

### Editing a Message

```javascript
await fetch(`/api/messages/${messageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        messageId: messageId,
        content: 'Updated message content'
    })
});
```

## 🔒 Security Considerations

### Backend Validation:
- ✅ File type whitelist
- ✅ File size limits
- ✅ User authentication required
- ✅ Permission checks
- ✅ XSS prevention (HTML escaping)
- ✅ SQL injection prevention (parameterized queries)

### Rate Limiting:
Consider implementing rate limiting:
```java
@RateLimit(requests = 5, per = "5s")
public ChatMessageResponse sendMessage(...)
```

### CORS Configuration:
Update WebSocket config for production:
```java
registry.addEndpoint("/ws")
    .setAllowedOrigins("https://yourdomain.com")
    .withSockJS();
```

## 🚀 Performance Optimizations

1. **Image Thumbnails**: Generated on upload, reduces bandwidth
2. **Lazy Loading**: Images load only when visible
3. **Optimistic UI**: Messages appear instantly, update on confirmation
4. **Pagination**: Load messages in batches (50 per page)
5. **WebSocket**: Real-time updates without polling

## 🐛 Troubleshooting

### File Upload Issues:
```bash
# Check uploads directory exists and is writable
mkdir -p uploads
chmod 755 uploads
```

### WebSocket Connection Fails:
```javascript
// Check STOMP client logs
stompClient.debug = (msg) => console.log(msg);
```

### Images Not Displaying:
```java
// Verify FileUploadConfig is serving files
GET http://localhost:8080/uploads/2024/12/18/filename.jpg
```

## 📊 Testing

### Manual Testing Checklist:

- [ ] Upload image (jpg, png, gif)
- [ ] Upload video (mp4)
- [ ] Upload document (pdf, docx)
- [ ] Try uploading file > 8MB (should fail)
- [ ] Try uploading .exe file (should fail)
- [ ] Drag & drop multiple files
- [ ] Add reaction to message
- [ ] Remove own reaction
- [ ] Edit own message
- [ ] Delete own message (with confirmation)
- [ ] Reply to message
- [ ] Pin message
- [ ] Click image to view in lightbox
- [ ] Test on mobile device

## 📚 Additional Features to Consider

### Future Enhancements:
1. **GIF Integration**: Giphy/Tenor API for GIF picker
2. **Voice Messages**: Record and send audio
3. **Message Search**: Full-text search in messages
4. **Advanced Permissions**: Role-based message management
5. **Message Reports**: Flag inappropriate content
6. **Emoji Packs**: Custom server emojis
7. **Message Threads**: Nested conversations
8. **Read Receipts**: See who read messages
9. **Typing Indicators**: "User is typing..."
10. **@Mentions**: Autocomplete user mentions

## 📞 Support

For issues or questions:
- Check console logs in browser DevTools
- Check Spring Boot logs
- Verify WebSocket connection
- Test API endpoints with Postman/curl

## 🎉 Conclusion

The Rich Message System is now fully implemented with:
- ✅ File uploads with drag & drop
- ✅ Emoji reactions
- ✅ Message editing/deletion
- ✅ Markdown rendering
- ✅ Real-time WebSocket updates
- ✅ Image lightbox
- ✅ Context menus
- ✅ Responsive design

Enjoy your Discord-like chat experience! 🚀
