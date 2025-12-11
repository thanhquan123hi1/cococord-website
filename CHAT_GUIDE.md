# CoCoCord - Real-time Chat Application

## WebSocket Chat Feature - User Guide

### 🚀 Quick Start

1. **Login to your account**

   - Navigate to http://localhost:8080/login
   - Enter your credentials
   - You'll be redirected to the dashboard

2. **Access Chat**
   - Click "Go to Chat" button on dashboard
   - Or navigate directly to http://localhost:8080/chat

### 💬 Chat Features

#### Sending Messages

- Type your message in the input box at the bottom
- Press **Enter** to send (Shift+Enter for new line)
- Messages are delivered in real-time to all users in the channel

#### Editing Messages

- Hover over your own message
- Click the **Edit** button (pencil icon)
- Edit the message content and confirm
- Edited messages show "(edited)" badge

#### Deleting Messages

- Hover over your own message
- Click the **Delete** button (trash icon)
- Confirm deletion
- Message will be removed for all users

#### Typing Indicators

- When you type, other users see "You are typing..." indicator
- Shows real-time typing status

#### Message Formatting

- **Bold**: `**text**` → **text**
- _Italic_: `*text*` → _text_
- `Code`: `` `code` `` → `code`
- Links are automatically clickable

### 🎨 Discord-like Interface

#### Server List (Left Sidebar)

- Home button: Main server
- Add button: Create new server (coming soon)

#### Channel List (Middle Sidebar)

- Text channels: #general, #random
- Voice channels: General Voice (coming soon)
- Click to switch channels

#### Chat Area (Main)

- Message history scrollable
- Rich message display with avatars
- Timestamps for each message

#### User Panel (Bottom Left)

- Your avatar and username
- Online status indicator
- Voice controls (coming soon)

### 🔧 Technical Details

#### WebSocket Connection

- Uses STOMP protocol over WebSocket
- Automatic reconnection on disconnect
- JWT authentication for security

#### Message Storage

- Messages stored in MongoDB
- Channel information in MySQL
- Pagination support for message history

#### Real-time Features

- Instant message delivery
- Live typing indicators
- User presence updates
- Message edit/delete notifications

### 📝 Testing Guide

#### Test 1: Send Messages

1. Open chat in two browser windows/tabs
2. Login as different users in each
3. Send messages from one window
4. Verify they appear instantly in the other

#### Test 2: Edit Messages

1. Send a message
2. Click edit button
3. Change the content
4. Verify edit appears in all windows

#### Test 3: Delete Messages

1. Send a message
2. Click delete button
3. Confirm deletion
4. Verify message disappears everywhere

#### Test 4: Typing Indicator

1. Open two windows
2. Start typing in one
3. Check typing indicator in the other

#### Test 5: Channel Switching

1. Click different channels
2. Verify messages load correctly
3. Check subscriptions update properly

### 🛠️ Troubleshooting

#### WebSocket not connecting?

- Check if server is running
- Verify JWT token is valid
- Check browser console for errors
- Try refreshing the page

#### Messages not appearing?

- Check network tab for WebSocket connection
- Verify you're subscribed to correct channel
- Check server logs for errors

#### Can't edit/delete messages?

- Only your own messages can be edited/deleted
- Check you're logged in
- Verify message ownership

### 📊 API Endpoints

#### REST APIs

- `GET /api/messages/channel/{channelId}` - Get message history
- `GET /api/messages/{messageId}` - Get specific message
- `GET /api/messages/{messageId}/replies` - Get message replies

#### WebSocket Endpoints

- `/ws` - WebSocket connection endpoint
- `/app/chat.sendMessage` - Send new message
- `/app/chat.editMessage` - Edit message
- `/app/chat.deleteMessage` - Delete message
- `/app/chat.typing` - Send typing notification
- `/app/presence.update` - Update presence status

#### Subscriptions

- `/topic/channel/{channelId}` - Channel messages
- `/topic/channel/{channelId}/delete` - Message deletions
- `/topic/channel/{channelId}/typing` - Typing indicators
- `/topic/presence` - User presence updates
- `/user/queue/errors` - Personal error messages

### 🎯 Next Steps

Current features working:

- ✅ Real-time messaging
- ✅ Message CRUD operations
- ✅ Typing indicators
- ✅ User presence
- ✅ Discord-like UI

Coming soon:

- 🔜 Server management
- 🔜 Channel creation/deletion
- 🔜 File attachments
- 🔜 Reactions & Emojis
- 🔜 Voice channels
- 🔜 Direct messages
- 🔜 User roles & permissions

### 💡 Tips

- Keep messages under 2000 characters
- Use markdown for formatting
- Check typing indicator before sending
- Edit messages within reasonable time
- Be respectful in chat!

### 🐛 Known Issues

- Scroll position may jump when new messages arrive (will fix)
- No infinite scroll yet (loads 50 messages)
- Avatar images need to be set up
- Mobile responsive needs improvement

### 📞 Support

For issues or questions:

- Check server logs in terminal
- Check browser console for errors
- Review this guide
- Contact development team

---

**Happy Chatting! 🎉**
