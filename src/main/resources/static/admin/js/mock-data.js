/**
 * CoCoCord Admin - Mock Data
 * Static data for UI development (no backend connection)
 */

const MockData = {
  // ========================================
  // Dashboard KPIs
  // ========================================
  dashboard: {
    kpis: [
      {
        id: 'total_users',
        label: 'Total Users',
        value: 40689,
        trend: 8.5,
        trendDirection: 'up',
        period: 'vs last month'
      },
      {
        id: 'total_servers',
        label: 'Total Servers',
        value: 10293,
        trend: 1.3,
        trendDirection: 'up',
        period: 'vs last month'
      },
      {
        id: 'messages_today',
        label: 'Messages Today',
        value: 89000,
        trend: -4.3,
        trendDirection: 'down',
        period: 'vs yesterday'
      },
      {
        id: 'active_calls',
        label: 'Active Voice Calls',
        value: 2040,
        trend: 1.8,
        trendDirection: 'up',
        period: 'vs last hour'
      }
    ],

    // Chart data - User activity over time
    chartData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [
        {
          label: 'This Year',
          data: [5000, 10000, 7500, 15000, 20000, 17500, 25000],
          color: '#1C1C1C'
        },
        {
          label: 'Last Year',
          data: [3000, 7000, 5000, 10000, 12000, 11000, 15000],
          color: '#A0BCE8'
        }
      ]
    },

    // Recent activity
    recentActivity: [
      {
        id: 1,
        user: 'Phan Thị A',
        avatar: null,
        action: 'created a new server',
        target: 'Vietnam Gamers',
        time: '2 minutes ago'
      },
      {
        id: 2,
        user: 'Nguyễn Văn B',
        avatar: null,
        action: 'reported a user',
        target: 'spammer123',
        time: '15 minutes ago'
      },
      {
        id: 3,
        user: 'Trần Minh C',
        avatar: null,
        action: 'updated server settings',
        target: 'Tech Talk VN',
        time: '32 minutes ago'
      },
      {
        id: 4,
        user: 'Lê Hương D',
        avatar: null,
        action: 'joined the platform',
        target: null,
        time: '1 hour ago'
      },
      {
        id: 5,
        user: 'System',
        avatar: null,
        action: 'completed daily backup',
        target: null,
        time: '3 hours ago'
      }
    ],

    // Top servers
    topServers: [
      { name: 'Vietnam Gamers', members: 15420, growth: 12.5 },
      { name: 'Tech Talk VN', members: 8930, growth: 8.2 },
      { name: 'Music Lovers', members: 7210, growth: 5.1 },
      { name: 'Study Group', members: 5890, growth: 15.3 },
      { name: 'Anime Fans VN', members: 4520, growth: 3.7 }
    ]
  },

  // ========================================
  // Users Management
  // ========================================
  users: {
    total: 40689,
    active: 35420,
    inactive: 4123,
    banned: 1146,
    
    list: [
      {
        id: 1,
        username: 'nguyenvana',
        displayName: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        avatar: null,
        status: 'active',
        role: 'User',
        createdAt: '2024-01-15',
        lastActive: '2 hours ago',
        servers: 5,
        messages: 1240
      },
      {
        id: 2,
        username: 'tranthib',
        displayName: 'Trần Thị B',
        email: 'tranthib@email.com',
        avatar: null,
        status: 'active',
        role: 'Premium',
        createdAt: '2024-01-10',
        lastActive: '5 minutes ago',
        servers: 12,
        messages: 3420
      },
      {
        id: 3,
        username: 'leminhc',
        displayName: 'Lê Minh C',
        email: 'leminhc@email.com',
        avatar: null,
        status: 'inactive',
        role: 'User',
        createdAt: '2023-12-20',
        lastActive: '3 days ago',
        servers: 2,
        messages: 156
      },
      {
        id: 4,
        username: 'phamhuongd',
        displayName: 'Phạm Hương D',
        email: 'phamhuongd@email.com',
        avatar: null,
        status: 'banned',
        role: 'User',
        createdAt: '2023-11-05',
        lastActive: '1 week ago',
        servers: 0,
        messages: 0,
        banReason: 'Spam and harassment'
      },
      {
        id: 5,
        username: 'hoangmine',
        displayName: 'Hoàng Minh E',
        email: 'hoangmine@email.com',
        avatar: null,
        status: 'active',
        role: 'Moderator',
        createdAt: '2023-08-15',
        lastActive: 'Online now',
        servers: 8,
        messages: 5680
      },
      {
        id: 6,
        username: 'dangthif',
        displayName: 'Đặng Thị F',
        email: 'dangthif@email.com',
        avatar: null,
        status: 'active',
        role: 'User',
        createdAt: '2024-02-01',
        lastActive: '1 hour ago',
        servers: 3,
        messages: 890
      },
      {
        id: 7,
        username: 'vothanhg',
        displayName: 'Võ Thành G',
        email: 'vothanhg@email.com',
        avatar: null,
        status: 'active',
        role: 'Premium',
        createdAt: '2023-09-22',
        lastActive: '30 minutes ago',
        servers: 15,
        messages: 7820
      },
      {
        id: 8,
        username: 'buiquangh',
        displayName: 'Bùi Quang H',
        email: 'buiquangh@email.com',
        avatar: null,
        status: 'inactive',
        role: 'User',
        createdAt: '2023-10-18',
        lastActive: '2 weeks ago',
        servers: 1,
        messages: 45
      }
    ],

    pagination: {
      page: 1,
      perPage: 10,
      total: 40689,
      totalPages: 4069
    }
  },

  // ========================================
  // Servers Management
  // ========================================
  servers: {
    total: 10293,
    public: 6820,
    private: 3473,
    verified: 156,

    list: [
      {
        id: 1,
        name: 'Vietnam Gamers',
        icon: null,
        owner: 'nguyenvana',
        status: 'active',
        type: 'public',
        verified: true,
        members: 15420,
        channels: 25,
        createdAt: '2023-06-15',
        lastActivity: '1 minute ago'
      },
      {
        id: 2,
        name: 'Tech Talk VN',
        icon: null,
        owner: 'tranthib',
        status: 'active',
        type: 'public',
        verified: true,
        members: 8930,
        channels: 18,
        createdAt: '2023-07-20',
        lastActivity: '5 minutes ago'
      },
      {
        id: 3,
        name: 'Music Lovers',
        icon: null,
        owner: 'leminhc',
        status: 'active',
        type: 'public',
        verified: false,
        members: 7210,
        channels: 12,
        createdAt: '2023-08-10',
        lastActivity: '10 minutes ago'
      },
      {
        id: 4,
        name: 'Private Study Group',
        icon: null,
        owner: 'hoangmine',
        status: 'active',
        type: 'private',
        verified: false,
        members: 45,
        channels: 5,
        createdAt: '2024-01-05',
        lastActivity: '2 hours ago'
      },
      {
        id: 5,
        name: 'Spam Server',
        icon: null,
        owner: 'phamhuongd',
        status: 'suspended',
        type: 'public',
        verified: false,
        members: 120,
        channels: 3,
        createdAt: '2024-01-20',
        lastActivity: '1 week ago',
        suspendReason: 'Terms of Service violation'
      },
      {
        id: 6,
        name: 'Anime Fans VN',
        icon: null,
        owner: 'dangthif',
        status: 'active',
        type: 'public',
        verified: false,
        members: 4520,
        channels: 15,
        createdAt: '2023-09-12',
        lastActivity: '3 minutes ago'
      },
      {
        id: 7,
        name: 'Coding Bootcamp',
        icon: null,
        owner: 'vothanhg',
        status: 'active',
        type: 'private',
        verified: true,
        members: 890,
        channels: 10,
        createdAt: '2023-10-01',
        lastActivity: '15 minutes ago'
      },
      {
        id: 8,
        name: 'Photography Club',
        icon: null,
        owner: 'buiquangh',
        status: 'inactive',
        type: 'public',
        verified: false,
        members: 230,
        channels: 4,
        createdAt: '2023-11-15',
        lastActivity: '3 days ago'
      }
    ],

    pagination: {
      page: 1,
      perPage: 10,
      total: 10293,
      totalPages: 1030
    }
  },

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * Get user status badge class
   */
  getUserStatusBadge(status) {
    const badges = {
      active: 'badge-success',
      inactive: 'badge-warning',
      banned: 'badge-danger'
    };
    return badges[status] || 'badge-default';
  },

  /**
   * Get server status badge class
   */
  getServerStatusBadge(status) {
    const badges = {
      active: 'badge-success',
      inactive: 'badge-warning',
      suspended: 'badge-danger'
    };
    return badges[status] || 'badge-default';
  },

  /**
   * Generate initials from name
   */
  getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },

  /**
   * Format date to locale string
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // ========================================
  // Reports Management
  // ========================================
  reports: {
    stats: {
      pending: 23,
      approved: 156,
      rejected: 42,
      total: 221
    },
    list: [
      {
        id: 1,
        type: 'user',
        status: 'pending',
        reporter: 'Nguyễn Văn A',
        reporterAvatar: null,
        target: 'spammer123',
        targetType: 'User',
        reason: 'Spam',
        description: 'Gửi tin nhắn spam liên tục trong nhiều server',
        createdAt: '2024-02-15T10:30:00',
        evidence: ['screenshot1.png', 'screenshot2.png'],
        priority: 'high'
      },
      {
        id: 2,
        type: 'message',
        status: 'pending',
        reporter: 'Trần Thị B',
        reporterAvatar: null,
        target: 'Tin nhắn #12345',
        targetType: 'Message',
        reason: 'Harassment',
        description: 'Nội dung quấy rối và đe dọa người dùng khác',
        createdAt: '2024-02-15T09:15:00',
        evidence: [],
        priority: 'high'
      },
      {
        id: 3,
        type: 'server',
        status: 'pending',
        reporter: 'Lê Minh C',
        reporterAvatar: null,
        target: 'NSFW Server',
        targetType: 'Server',
        reason: 'Inappropriate Content',
        description: 'Server chứa nội dung không phù hợp, vi phạm TOS',
        createdAt: '2024-02-14T16:45:00',
        evidence: ['evidence.zip'],
        priority: 'medium'
      },
      {
        id: 4,
        type: 'user',
        status: 'approved',
        reporter: 'Phạm Hương D',
        reporterAvatar: null,
        target: 'scammer_vn',
        targetType: 'User',
        reason: 'Scam',
        description: 'Lừa đảo tiền của thành viên trong server',
        createdAt: '2024-02-13T14:20:00',
        evidence: ['chat_log.txt'],
        priority: 'high',
        resolvedAt: '2024-02-14T08:00:00',
        resolvedBy: 'Admin'
      },
      {
        id: 5,
        type: 'message',
        status: 'rejected',
        reporter: 'Hoàng Minh E',
        reporterAvatar: null,
        target: 'Tin nhắn #67890',
        targetType: 'Message',
        reason: 'Other',
        description: 'Không đồng ý với ý kiến',
        createdAt: '2024-02-12T11:30:00',
        evidence: [],
        priority: 'low',
        resolvedAt: '2024-02-12T15:00:00',
        resolvedBy: 'Moderator',
        rejectReason: 'Không vi phạm quy định'
      }
    ]
  },

  // ========================================
  // Messages Moderation
  // ========================================
  messages: {
    stats: {
      flagged: 45,
      reviewed: 1230,
      deleted: 89,
      total: 89000
    },
    flagged: [
      {
        id: 1,
        content: 'Mua bán acc game giá rẻ, liên hệ...',
        author: 'seller_acc',
        authorAvatar: null,
        server: 'Vietnam Gamers',
        channel: '#general',
        flagReason: 'Spam/Advertising',
        flaggedBy: 'AutoMod',
        flaggedAt: '2024-02-15T11:00:00',
        status: 'pending'
      },
      {
        id: 2,
        content: '[Nội dung không phù hợp đã bị ẩn]',
        author: 'toxic_user',
        authorAvatar: null,
        server: 'Tech Talk VN',
        channel: '#off-topic',
        flagReason: 'Harassment',
        flaggedBy: 'User Report',
        flaggedAt: '2024-02-15T10:45:00',
        status: 'pending'
      },
      {
        id: 3,
        content: 'Free nitro! Click link bio...',
        author: 'nitro_giveaway',
        authorAvatar: null,
        server: 'Music Lovers',
        channel: '#announcements',
        flagReason: 'Scam/Phishing',
        flaggedBy: 'AutoMod',
        flaggedAt: '2024-02-15T10:30:00',
        status: 'pending'
      },
      {
        id: 4,
        content: 'Đây là tin nhắn bình thường nhưng bị flag nhầm',
        author: 'normal_user',
        authorAvatar: null,
        server: 'Study Group',
        channel: '#help',
        flagReason: 'False Positive',
        flaggedBy: 'AutoMod',
        flaggedAt: '2024-02-15T09:00:00',
        status: 'reviewed'
      }
    ],
    autoModRules: [
      { id: 1, name: 'Spam Filter', enabled: true, triggers: 156 },
      { id: 2, name: 'Link Blocker', enabled: true, triggers: 89 },
      { id: 3, name: 'Profanity Filter', enabled: true, triggers: 234 },
      { id: 4, name: 'Caps Lock Detector', enabled: false, triggers: 45 }
    ]
  },

  // ========================================
  // Roles & Permissions
  // ========================================
  roles: {
    list: [
      {
        id: 1,
        name: 'Administrator',
        color: '#E74C3C',
        members: 3,
        permissions: ['all']
      },
      {
        id: 2,
        name: 'Moderator',
        color: '#3498DB',
        members: 12,
        permissions: ['manage_messages', 'kick_members', 'ban_members', 'view_audit_log']
      },
      {
        id: 3,
        name: 'Support',
        color: '#2ECC71',
        members: 25,
        permissions: ['manage_messages', 'view_reports']
      },
      {
        id: 4,
        name: 'Verified',
        color: '#9B59B6',
        members: 1520,
        permissions: ['send_messages', 'attach_files', 'embed_links']
      },
      {
        id: 5,
        name: 'Member',
        color: '#95A5A6',
        members: 38000,
        permissions: ['send_messages', 'view_channels']
      }
    ],
    permissionGroups: [
      {
        name: 'General',
        icon: 'settings',
        permissions: [
          { id: 'view_channels', label: 'View Channels', desc: 'Xem các kênh trong server' },
          { id: 'manage_channels', label: 'Manage Channels', desc: 'Tạo, xóa, chỉnh sửa kênh' },
          { id: 'manage_roles', label: 'Manage Roles', desc: 'Quản lý role và quyền hạn' },
          { id: 'view_audit_log', label: 'View Audit Log', desc: 'Xem nhật ký hoạt động' }
        ]
      },
      {
        name: 'Members',
        icon: 'users',
        permissions: [
          { id: 'kick_members', label: 'Kick Members', desc: 'Đuổi thành viên khỏi server' },
          { id: 'ban_members', label: 'Ban Members', desc: 'Cấm thành viên vĩnh viễn' },
          { id: 'manage_nicknames', label: 'Manage Nicknames', desc: 'Thay đổi nickname thành viên' }
        ]
      },
      {
        name: 'Messages',
        icon: 'message',
        permissions: [
          { id: 'send_messages', label: 'Send Messages', desc: 'Gửi tin nhắn trong kênh' },
          { id: 'manage_messages', label: 'Manage Messages', desc: 'Xóa tin nhắn của người khác' },
          { id: 'embed_links', label: 'Embed Links', desc: 'Nhúng link preview' },
          { id: 'attach_files', label: 'Attach Files', desc: 'Đính kèm file và hình ảnh' },
          { id: 'mention_everyone', label: 'Mention Everyone', desc: 'Sử dụng @everyone và @here' }
        ]
      },
      {
        name: 'Voice',
        icon: 'voice',
        permissions: [
          { id: 'connect', label: 'Connect', desc: 'Kết nối voice channel' },
          { id: 'speak', label: 'Speak', desc: 'Nói trong voice channel' },
          { id: 'mute_members', label: 'Mute Members', desc: 'Tắt mic thành viên khác' },
          { id: 'deafen_members', label: 'Deafen Members', desc: 'Tắt tai nghe thành viên khác' },
          { id: 'move_members', label: 'Move Members', desc: 'Di chuyển thành viên giữa các kênh' }
        ]
      },
      {
        name: 'Advanced',
        icon: 'shield',
        permissions: [
          { id: 'administrator', label: 'Administrator', desc: 'Toàn quyền quản trị (nguy hiểm!)' },
          { id: 'view_reports', label: 'View Reports', desc: 'Xem báo cáo vi phạm' },
          { id: 'manage_server', label: 'Manage Server', desc: 'Thay đổi cài đặt server' }
        ]
      }
    ]
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MockData;
}
