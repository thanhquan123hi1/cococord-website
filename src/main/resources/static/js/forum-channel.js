/**
 * Forum Channel Manager
 * Handles forum channel display with tree structure,
 * post creation with title + required image
 */

(function (window) {
    'use strict';

    class ForumChannelManager {
        constructor(options = {}) {
            this.containerSelector = options.containerSelector || '#forumContainer';
            this.channelId = options.channelId || null;
            this.serverId = options.serverId || null;
            this.canPost = options.canPost || false;
            this.onPostClick = options.onPostClick || null;

            this.posts = [];
            this.isLoading = false;
            this.showCreateForm = false;
            this.uploadedImageUrl = null;

            if (this.channelId) {
                this._init();
            }
        }

        async _init() {
            await this.loadPosts();
            this.render();
        }

        async loadPosts() {
            if (!this.channelId) return;

            this.isLoading = true;
            this.render();

            try {
                const response = await fetch(`/api/channels/${this.channelId}/forum-posts`, {
                    headers: {
                        'Authorization': `Bearer ${this._getToken()}`
                    }
                });

                if (!response.ok) throw new Error('Failed to load posts');

                this.posts = await response.json();
            } catch (error) {
                console.error('[ForumChannel] Failed to load posts:', error);
                this.posts = [];
            }

            this.isLoading = false;
            this.render();
        }

        render() {
            const container = document.querySelector(this.containerSelector);
            if (!container) return;

            if (this.isLoading) {
                container.innerHTML = this._renderLoading();
                return;
            }

            container.innerHTML = `
                ${this.canPost ? this._renderCreateArea() : ''}
                ${this._renderTree()}
            `;

            this._bindEvents(container);
        }

        _renderLoading() {
            return `
                <div class="forum-empty">
                    <div class="empty-icon">
                        <i class="bi bi-hourglass-split"></i>
                    </div>
                    <div class="empty-title">Đang tải...</div>
                </div>
            `;
        }

        _renderCreateArea() {
            if (this.showCreateForm) {
                return this._renderCreateForm();
            }

            return `
                <button class="forum-create-post-btn" id="forumCreateBtn">
                    <i class="bi bi-plus-lg"></i>
                    Tạo bài viết mới
                </button>
            `;
        }

        _renderCreateForm() {
            const charCount = 25;
            const hasImage = !!this.uploadedImageUrl;

            return `
                <div class="forum-create-form" id="forumCreateForm">
                    <h4><i class="bi bi-pencil-square"></i> Tạo bài viết mới</h4>
                    
                    <div class="forum-form-group">
                        <label class="forum-form-label">
                            Tiêu đề
                            <span class="char-count" id="titleCharCount">0/${charCount}</span>
                        </label>
                        <input type="text" 
                               class="forum-form-input" 
                               id="forumPostTitle"
                               placeholder="Nhập tiêu đề (tối đa ${charCount} ký tự)"
                               maxlength="${charCount}">
                    </div>
                    
                    <div class="forum-form-group">
                        <label class="forum-form-label">
                            Hình ảnh <span style="color: var(--discord-red);">*</span>
                        </label>
                        <div class="forum-image-upload ${hasImage ? 'has-image' : ''}" id="forumImageUpload">
                            ${hasImage ? `
                                <img src="${this.uploadedImageUrl}" class="preview-image" alt="Preview">
                            ` : `
                                <div class="upload-icon"><i class="bi bi-image"></i></div>
                                <div class="upload-text">Bấm để tải ảnh lên</div>
                                <div class="upload-hint">Bắt buộc - Chỉ chấp nhận file ảnh</div>
                            `}
                        </div>
                        <input type="file" id="forumImageInput" accept="image/*" style="display: none;">
                    </div>
                    
                    <div class="forum-form-actions">
                        <button class="btn-cancel" id="forumCancelBtn">Hủy</button>
                        <button class="btn-post" id="forumSubmitBtn" disabled>
                            <i class="bi bi-send"></i> Đăng bài
                        </button>
                    </div>
                </div>
            `;
        }

        _renderTree() {
            if (this.posts.length === 0) {
                return `
                    <div class="forum-empty">
                        <div class="empty-icon"><i class="bi bi-chat-square-text"></i></div>
                        <div class="empty-title">Chưa có bài viết nào</div>
                        <div class="empty-text">
                            ${this.canPost
                        ? 'Hãy là người đầu tiên tạo bài viết!'
                        : 'Chờ admin hoặc moderator đăng bài.'}
                        </div>
                    </div>
                `;
            }

            return `
                <div class="forum-tree">
                    <div class="forum-tree-header">
                        <div class="forum-icon"><i class="bi bi-chat-square-text"></i></div>
                        <div class="forum-title">Bài viết</div>
                        <div class="post-count">${this.posts.length} bài</div>
                    </div>
                    <div class="forum-posts-tree">
                        ${this.posts.map(post => this._renderPostBranch(post)).join('')}
                    </div>
                </div>
            `;
        }

        _renderPostBranch(post) {
            const authorName = post.authorDisplayName || post.authorUsername || 'Unknown';
            const reactionCount = post.reactions?.reduce((sum, r) => sum + r.count, 0) || 0;
            const timeAgo = this._timeAgo(post.createdAt);

            return `
                <div class="forum-post-branch">
                    <div class="forum-post-item ${post.isPinned ? 'pinned' : ''}" 
                         data-post-id="${post.id}">
                        <img src="${post.imageUrl}" 
                             class="post-thumbnail" 
                             alt="${post.title}"
                             onerror="this.src='/images/placeholder.png'">
                        <div class="post-info">
                            <div class="post-title">${this._escapeHtml(post.title)}</div>
                            <div class="post-meta">
                                <span class="post-author">
                                    ${post.authorAvatarUrl
                    ? `<img src="${post.authorAvatarUrl}" alt="">`
                    : ''}
                                    ${this._escapeHtml(authorName)}
                                </span>
                                <span>•</span>
                                <span>${timeAgo}</span>
                                ${reactionCount > 0 ? `
                                    <span>•</span>
                                    <span class="post-reactions">
                                        <i class="bi bi-emoji-smile"></i>
                                        <span>${reactionCount}</span>
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        _bindEvents(container) {
            // Create button
            const createBtn = container.querySelector('#forumCreateBtn');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    this.showCreateForm = true;
                    this.uploadedImageUrl = null;
                    this.render();
                });
            }

            // Cancel button
            const cancelBtn = container.querySelector('#forumCancelBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.showCreateForm = false;
                    this.uploadedImageUrl = null;
                    this.render();
                });
            }

            // Title input
            const titleInput = container.querySelector('#forumPostTitle');
            const charCount = container.querySelector('#titleCharCount');
            if (titleInput && charCount) {
                titleInput.addEventListener('input', () => {
                    charCount.textContent = `${titleInput.value.length}/25`;
                    this._validateForm(container);
                });
            }

            // Image upload
            const uploadArea = container.querySelector('#forumImageUpload');
            const imageInput = container.querySelector('#forumImageInput');
            if (uploadArea && imageInput) {
                uploadArea.addEventListener('click', () => imageInput.click());
                imageInput.addEventListener('change', (e) => this._handleImageUpload(e, container));
            }

            // Submit button
            const submitBtn = container.querySelector('#forumSubmitBtn');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => this._submitPost(container));
            }

            // Post click
            container.querySelectorAll('.forum-post-item').forEach(item => {
                item.addEventListener('click', () => {
                    const postId = item.dataset.postId;
                    if (this.onPostClick) {
                        this.onPostClick(postId, this.posts.find(p => p.id === postId));
                    }
                });
            });
        }

        async _handleImageUpload(e, container) {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                this._showToast('Chỉ chấp nhận file ảnh', 'error');
                return;
            }

            try {
                // Upload to server
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this._getToken()}`
                    },
                    body: formData
                });

                if (!response.ok) throw new Error('Upload failed');

                const result = await response.json();
                this.uploadedImageUrl = result.url;
                this.render();
            } catch (error) {
                console.error('[ForumChannel] Image upload failed:', error);
                this._showToast('Không thể tải ảnh lên', 'error');
            }
        }

        _validateForm(container) {
            const titleInput = container.querySelector('#forumPostTitle');
            const submitBtn = container.querySelector('#forumSubmitBtn');

            if (!titleInput || !submitBtn) return;

            const hasTitle = titleInput.value.trim().length > 0;
            const hasImage = !!this.uploadedImageUrl;

            submitBtn.disabled = !(hasTitle && hasImage);
        }

        async _submitPost(container) {
            const titleInput = container.querySelector('#forumPostTitle');
            const submitBtn = container.querySelector('#forumSubmitBtn');

            if (!titleInput || !this.uploadedImageUrl) return;

            const title = titleInput.value.trim();
            if (!title || title.length > 25) {
                this._showToast('Tiêu đề không hợp lệ', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang đăng...';

            try {
                const response = await fetch(`/api/channels/${this.channelId}/forum-posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this._getToken()}`
                    },
                    body: JSON.stringify({
                        title: title,
                        imageUrl: this.uploadedImageUrl
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to create post');
                }

                const newPost = await response.json();
                this.posts.unshift(newPost);
                this.showCreateForm = false;
                this.uploadedImageUrl = null;
                this.render();

                this._showToast('Đã đăng bài thành công!', 'success');
            } catch (error) {
                console.error('[ForumChannel] Failed to create post:', error);
                this._showToast(error.message || 'Không thể đăng bài', 'error');

                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-send"></i> Đăng bài';
            }
        }

        _timeAgo(dateString) {
            if (!dateString) return '';

            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);

            if (seconds < 60) return 'vừa xong';
            if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
            if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;

            return date.toLocaleDateString('vi-VN');
        }

        _escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        _getToken() {
            return localStorage.getItem('accessToken') ||
                document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] ||
                '';
        }

        _showToast(message, type = 'info') {
            if (window.ToastManager) {
                window.ToastManager.show(message, type);
            } else {
                console.log(`[Toast] ${type}: ${message}`);
            }
        }

        // Public methods
        setChannel(channelId, serverId, canPost = false) {
            this.channelId = channelId;
            this.serverId = serverId;
            this.canPost = canPost;
            this.posts = [];
            this.showCreateForm = false;
            this.uploadedImageUrl = null;

            if (channelId) {
                this._init();
            }
        }

        refresh() {
            this.loadPosts();
        }

        destroy() {
            const container = document.querySelector(this.containerSelector);
            if (container) {
                container.innerHTML = '';
            }
        }
    }

    // Export globally
    window.ForumChannelManager = ForumChannelManager;

})(window);
