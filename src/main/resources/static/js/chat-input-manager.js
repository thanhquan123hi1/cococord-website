/**
 * ChatInputManager - Enhanced Chat Input with File Attachments, Emoji/GIF/Sticker Picker
 * 
 * Features:
 * - File attachment with preview (images, videos)
 * - Emoji picker with categories
 * - GIF search (Tenor API integration)
 * - Sticker picker
 * - Drag & drop file upload
 * 
 * @requires Bootstrap Icons for icons
 */

(function(window) {
    'use strict';

    // ==================== CONSTANTS ====================
    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
    const MAX_FILES = 10;
    const ALLOWED_FILE_TYPES = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/quicktime'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        document: ['application/pdf', 'text/plain', 'application/msword']
    };

    // Emoji categories with Unicode emojis
    const EMOJI_CATEGORIES = {
        'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
        'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿'],
        'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '😻', '😿'],
        'Objects': ['🎮', '🎲', '🎯', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🎷', '🎺', '🎸', '🪕', '🥁', '🎻', '🎰', '🎳', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥅', '⛳', '🏒', '🏑', '🥍', '🏏', '🪃', '🥊', '🥋'],
        'Nature': ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🐚', '🪨', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀️', '🌝', '🌞', '⭐', '🌟', '🌠', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌈', '☔'],
        'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝'],
        'Symbols': ['❤️', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🔔', '🔕', '🎵', '🎶', '✅', '❌', '❓', '❗', '⭕', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲']
    };

    // Sample stickers (replace with actual sticker URLs)
    const STICKERS = [
        { id: 1, name: 'Thumbs Up', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">👍</text></svg>' },
        { id: 2, name: 'Heart', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">❤️</text></svg>' },
        { id: 3, name: 'Fire', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">🔥</text></svg>' },
        { id: 4, name: 'Laugh', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">😂</text></svg>' },
        { id: 5, name: 'Cool', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">😎</text></svg>' },
        { id: 6, name: 'Thinking', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">🤔</text></svg>' },
        { id: 7, name: 'Party', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">🥳</text></svg>' },
        { id: 8, name: 'Cry', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">😢</text></svg>' },
        { id: 9, name: 'Love', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">🥰</text></svg>' },
        { id: 10, name: 'Rocket', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">🚀</text></svg>' },
        { id: 11, name: 'Star', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">⭐</text></svg>' },
        { id: 12, name: 'Clap', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="48" font-size="48">👏</text></svg>' }
    ];

    // Tenor API Key (free tier)
    const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';

    // ==================== ChatInputManager CLASS ====================
    class ChatInputManager {
        constructor(options = {}) {
            // Support both element references and selectors
            this.composerEl = options.composer || 
                (options.composerSelector ? document.querySelector(options.composerSelector) : null) ||
                document.getElementById('chatComposer');
            this.inputEl = options.input || 
                (options.inputSelector ? document.querySelector(options.inputSelector) : null) ||
                document.getElementById('chatInput');
            this.attachBtn = options.attachBtn || 
                (options.attachBtnSelector ? document.querySelector(options.attachBtnSelector) : null) ||
                document.getElementById('attachBtn');
            this.emojiBtn = options.emojiBtn || 
                (options.emojiBtnSelector ? document.querySelector(options.emojiBtnSelector) : null) ||
                document.getElementById('emojiBtn');
            this.gifBtn = options.gifBtn || 
                (options.gifBtnSelector ? document.querySelector(options.gifBtnSelector) : null) ||
                document.getElementById('gifBtn');
            this.stickerBtn = options.stickerBtn || 
                (options.stickerBtnSelector ? document.querySelector(options.stickerBtnSelector) : null) ||
                document.getElementById('stickerBtn');
            
            // Callbacks
            this.onSendMessage = options.onSendMessage || null;
            this.onSendFile = options.onSendFile || null;
            this.onSendGif = options.onSendGif || null;
            this.onSendSticker = options.onSendSticker || null;
            
            // State
            this.attachedFiles = [];
            this.activePopover = null;
            this.gifSearchTimeout = null;
            
            // Initialize
            this._init();
        }

        _init() {
            this._createFileInput();
            this._createPreviewContainer();
            this._createPopover();
            this._bindEvents();
            this._setupDragAndDrop();
        }

        // ==================== FILE ATTACHMENT ====================
        
        _createFileInput() {
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.multiple = true;
            this.fileInput.accept = 'image/*,video/*,audio/*,.pdf,.txt,.doc,.docx';
            this.fileInput.style.display = 'none';
            this.fileInput.id = 'chatFileInput';
            document.body.appendChild(this.fileInput);
        }

        _createPreviewContainer() {
            this.previewContainer = document.createElement('div');
            this.previewContainer.className = 'attachment-preview-container';
            this.previewContainer.style.display = 'none';
            
            const composerBox = this.composerEl.querySelector('.composer-box');
            if (composerBox) {
                this.composerEl.insertBefore(this.previewContainer, composerBox);
            }
        }

        _handleFileSelect(files) {
            const fileArray = Array.from(files);
            
            for (const file of fileArray) {
                if (this.attachedFiles.length >= MAX_FILES) {
                    this._showToast(`Tối đa ${MAX_FILES} file`, 'warning');
                    break;
                }
                
                if (file.size > MAX_FILE_SIZE) {
                    this._showToast(`File "${file.name}" vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB`, 'error');
                    continue;
                }
                
                const isAllowed = Object.values(ALLOWED_FILE_TYPES).flat().includes(file.type);
                if (!isAllowed) {
                    this._showToast(`Loại file "${file.type}" không được hỗ trợ`, 'error');
                    continue;
                }
                
                this.attachedFiles.push(file);
                this._renderFilePreview(file);
            }
            
            if (this.attachedFiles.length > 0) {
                this.previewContainer.style.display = 'flex';
            }
            
            this.fileInput.value = '';
        }

        _renderFilePreview(file) {
            const previewItem = document.createElement('div');
            previewItem.className = 'attachment-preview-item';
            previewItem.dataset.fileName = file.name;
            
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            if (isImage || isVideo) {
                const media = document.createElement(isImage ? 'img' : 'video');
                media.className = 'preview-media';
                media.src = URL.createObjectURL(file);
                if (isVideo) {
                    media.muted = true;
                    media.loop = true;
                    media.addEventListener('mouseenter', () => media.play());
                    media.addEventListener('mouseleave', () => media.pause());
                }
                previewItem.appendChild(media);
            } else {
                const icon = document.createElement('div');
                icon.className = 'preview-file-icon';
                icon.innerHTML = this._getFileIcon(file.type);
                previewItem.appendChild(icon);
                
                const name = document.createElement('div');
                name.className = 'preview-file-name';
                name.textContent = file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name;
                previewItem.appendChild(name);
            }
            
            const size = document.createElement('div');
            size.className = 'preview-file-size';
            size.textContent = this._formatFileSize(file.size);
            previewItem.appendChild(size);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'preview-remove-btn';
            removeBtn.innerHTML = '<i class="bi bi-x"></i>';
            removeBtn.title = 'Xóa file';
            removeBtn.addEventListener('click', () => this._removeFile(file.name));
            previewItem.appendChild(removeBtn);
            
            this.previewContainer.appendChild(previewItem);
        }

        _removeFile(fileName) {
            this.attachedFiles = this.attachedFiles.filter(f => f.name !== fileName);
            
            const previewItem = this.previewContainer.querySelector(`[data-file-name="${fileName}"]`);
            if (previewItem) {
                const media = previewItem.querySelector('img, video');
                if (media) URL.revokeObjectURL(media.src);
                previewItem.remove();
            }
            
            if (this.attachedFiles.length === 0) {
                this.previewContainer.style.display = 'none';
            }
        }

        _getFileIcon(mimeType) {
            if (mimeType.includes('pdf')) return '<i class="bi bi-file-pdf"></i>';
            if (mimeType.includes('word') || mimeType.includes('document')) return '<i class="bi bi-file-word"></i>';
            if (mimeType.includes('audio')) return '<i class="bi bi-file-music"></i>';
            return '<i class="bi bi-file-earmark"></i>';
        }

        _formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        // ==================== EMOJI/GIF/STICKER POPOVER ====================
        
        _createPopover() {
            this.popover = document.createElement('div');
            this.popover.className = 'chat-input-popover';
            this.popover.style.display = 'none';
            
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'popover-tabs';
            
            const tabs = [
                { id: 'emoji', icon: 'bi-emoji-smile', label: 'Emoji' },
                { id: 'gif', icon: 'bi-filetype-gif', label: 'GIF' },
                { id: 'sticker', icon: 'bi-stickies', label: 'Sticker' }
            ];
            
            tabs.forEach(tab => {
                const tabBtn = document.createElement('button');
                tabBtn.className = 'popover-tab';
                tabBtn.dataset.tab = tab.id;
                tabBtn.innerHTML = `<i class="bi ${tab.icon}"></i> ${tab.label}`;
                tabBtn.addEventListener('click', () => this._switchTab(tab.id));
                tabsContainer.appendChild(tabBtn);
            });
            
            this.popover.appendChild(tabsContainer);
            
            const contentContainer = document.createElement('div');
            contentContainer.className = 'popover-content';
            
            const emojiContent = document.createElement('div');
            emojiContent.className = 'popover-tab-content';
            emojiContent.id = 'emojiTabContent';
            emojiContent.appendChild(this._createEmojiPicker());
            contentContainer.appendChild(emojiContent);
            
            const gifContent = document.createElement('div');
            gifContent.className = 'popover-tab-content';
            gifContent.id = 'gifTabContent';
            gifContent.style.display = 'none';
            gifContent.appendChild(this._createGifPicker());
            contentContainer.appendChild(gifContent);
            
            const stickerContent = document.createElement('div');
            stickerContent.className = 'popover-tab-content';
            stickerContent.id = 'stickerTabContent';
            stickerContent.style.display = 'none';
            stickerContent.appendChild(this._createStickerPicker());
            contentContainer.appendChild(stickerContent);
            
            this.popover.appendChild(contentContainer);
            document.body.appendChild(this.popover);
        }

        _createEmojiPicker() {
            const container = document.createElement('div');
            container.className = 'emoji-picker';
            
            const searchBox = document.createElement('div');
            searchBox.className = 'emoji-search-box';
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Tìm emoji...';
            searchInput.className = 'emoji-search-input';
            searchInput.addEventListener('input', (e) => this._filterEmojis(e.target.value));
            searchBox.appendChild(searchInput);
            container.appendChild(searchBox);
            
            const categoriesNav = document.createElement('div');
            categoriesNav.className = 'emoji-categories-nav';
            Object.keys(EMOJI_CATEGORIES).forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'emoji-category-btn';
                btn.textContent = EMOJI_CATEGORIES[cat][0];
                btn.title = cat;
                btn.addEventListener('click', () => this._scrollToEmojiCategory(cat));
                categoriesNav.appendChild(btn);
            });
            container.appendChild(categoriesNav);
            
            const emojiGrid = document.createElement('div');
            emojiGrid.className = 'emoji-grid-container';
            emojiGrid.id = 'emojiGridContainer';
            
            Object.entries(EMOJI_CATEGORIES).forEach(([category, emojis]) => {
                const categorySection = document.createElement('div');
                categorySection.className = 'emoji-category-section';
                categorySection.id = `emoji-category-${category}`;
                
                const categoryTitle = document.createElement('div');
                categoryTitle.className = 'emoji-category-title';
                categoryTitle.textContent = category;
                categorySection.appendChild(categoryTitle);
                
                const grid = document.createElement('div');
                grid.className = 'emoji-grid';
                
                emojis.forEach(emoji => {
                    const emojiBtn = document.createElement('button');
                    emojiBtn.className = 'emoji-item';
                    emojiBtn.textContent = emoji;
                    emojiBtn.title = emoji;
                    emojiBtn.addEventListener('click', () => this._insertEmoji(emoji));
                    grid.appendChild(emojiBtn);
                });
                
                categorySection.appendChild(grid);
                emojiGrid.appendChild(categorySection);
            });
            
            container.appendChild(emojiGrid);
            return container;
        }

        _createGifPicker() {
            const container = document.createElement('div');
            container.className = 'gif-picker';
            
            const searchBox = document.createElement('div');
            searchBox.className = 'gif-search-box';
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Tìm GIF từ Tenor...';
            searchInput.className = 'gif-search-input';
            searchInput.id = 'gifSearchInput';
            searchInput.addEventListener('input', (e) => this._searchGifs(e.target.value));
            searchBox.appendChild(searchInput);
            container.appendChild(searchBox);
            
            const gifGrid = document.createElement('div');
            gifGrid.className = 'gif-grid';
            gifGrid.id = 'gifGrid';
            
            this._loadTrendingGifs(gifGrid);
            
            container.appendChild(gifGrid);
            return container;
        }

        _createStickerPicker() {
            const container = document.createElement('div');
            container.className = 'sticker-picker';
            
            const stickerGrid = document.createElement('div');
            stickerGrid.className = 'sticker-grid';
            
            STICKERS.forEach(sticker => {
                const stickerItem = document.createElement('div');
                stickerItem.className = 'sticker-item';
                stickerItem.title = sticker.name;
                
                const img = document.createElement('img');
                img.src = sticker.url;
                img.alt = sticker.name;
                img.loading = 'lazy';
                
                stickerItem.appendChild(img);
                stickerItem.addEventListener('click', () => this._sendSticker(sticker));
                stickerGrid.appendChild(stickerItem);
            });
            
            container.appendChild(stickerGrid);
            return container;
        }

        _switchTab(tabId) {
            this.popover.querySelectorAll('.popover-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === tabId);
            });
            
            document.getElementById('emojiTabContent').style.display = tabId === 'emoji' ? 'block' : 'none';
            document.getElementById('gifTabContent').style.display = tabId === 'gif' ? 'block' : 'none';
            document.getElementById('stickerTabContent').style.display = tabId === 'sticker' ? 'block' : 'none';
            
            if (tabId === 'gif') {
                const gifSearch = document.getElementById('gifSearchInput');
                if (gifSearch) setTimeout(() => gifSearch.focus(), 100);
            }
        }

        _showPopover(anchorEl, tab = 'emoji') {
            if (this.activePopover) {
                this._hidePopover();
                return;
            }
            
            const rect = anchorEl.getBoundingClientRect();
            const popoverHeight = 400;
            const popoverWidth = 400;
            
            let left = rect.left - popoverWidth + rect.width;
            let top = rect.top - popoverHeight - 10;
            
            if (left < 10) left = 10;
            if (top < 10) top = rect.bottom + 10;
            
            this.popover.style.left = `${left}px`;
            this.popover.style.top = `${top}px`;
            this.popover.style.display = 'block';
            
            this._switchTab(tab);
            this.activePopover = this.popover;
            
            setTimeout(() => {
                document.addEventListener('click', this._handleOutsideClick);
            }, 0);
        }

        _hidePopover() {
            if (this.popover) {
                this.popover.style.display = 'none';
            }
            this.activePopover = null;
            document.removeEventListener('click', this._handleOutsideClick);
        }

        _handleOutsideClick = (e) => {
            if (this.activePopover && 
                !this.activePopover.contains(e.target) && 
                !e.target.closest('.composer-btn')) {
                this._hidePopover();
            }
        }

        // ==================== EMOJI ACTIONS ====================
        
        _insertEmoji(emoji) {
            if (!this.inputEl) return;
            
            const start = this.inputEl.selectionStart;
            const end = this.inputEl.selectionEnd;
            const value = this.inputEl.value;
            
            this.inputEl.value = value.substring(0, start) + emoji + value.substring(end);
            this.inputEl.focus();
            this.inputEl.setSelectionRange(start + emoji.length, start + emoji.length);
            
            this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        _filterEmojis(query) {
            const container = document.getElementById('emojiGridContainer');
            if (!container) return;
            
            const normalizedQuery = query.toLowerCase().trim();
            
            container.querySelectorAll('.emoji-category-section').forEach(section => {
                let hasVisible = false;
                
                section.querySelectorAll('.emoji-item').forEach(item => {
                    const emoji = item.textContent;
                    const visible = !normalizedQuery || emoji.includes(normalizedQuery);
                    item.style.display = visible ? '' : 'none';
                    if (visible) hasVisible = true;
                });
                
                section.style.display = hasVisible || !normalizedQuery ? '' : 'none';
            });
        }

        _scrollToEmojiCategory(category) {
            const section = document.getElementById(`emoji-category-${category}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // ==================== GIF ACTIONS ====================
        
        async _loadTrendingGifs(container) {
            container.innerHTML = '<div class="gif-loading">Đang tải GIF...</div>';
            
            try {
                const response = await fetch(
                    `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&client_key=cococord&limit=20`
                );
                
                if (!response.ok) throw new Error('Failed to load GIFs');
                
                const data = await response.json();
                this._renderGifs(container, data.results || []);
            } catch (error) {
                console.error('[ChatInputManager] Failed to load trending GIFs:', error);
                container.innerHTML = '<div class="gif-error">Không thể tải GIF. Vui lòng thử lại.</div>';
            }
        }

        async _searchGifs(query) {
            clearTimeout(this.gifSearchTimeout);
            
            if (!query.trim()) {
                const container = document.getElementById('gifGrid');
                this._loadTrendingGifs(container);
                return;
            }
            
            this.gifSearchTimeout = setTimeout(async () => {
                const container = document.getElementById('gifGrid');
                container.innerHTML = '<div class="gif-loading">Đang tìm...</div>';
                
                try {
                    const response = await fetch(
                        `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&client_key=cococord&q=${encodeURIComponent(query)}&limit=20`
                    );
                    
                    if (!response.ok) throw new Error('Search failed');
                    
                    const data = await response.json();
                    this._renderGifs(container, data.results || []);
                } catch (error) {
                    console.error('[ChatInputManager] GIF search failed:', error);
                    container.innerHTML = '<div class="gif-error">Tìm kiếm thất bại</div>';
                }
            }, 500);
        }

        _renderGifs(container, gifs) {
            container.innerHTML = '';
            
            if (gifs.length === 0) {
                container.innerHTML = '<div class="gif-empty">Không tìm thấy GIF nào</div>';
                return;
            }
            
            gifs.forEach(gif => {
                const gifItem = document.createElement('div');
                gifItem.className = 'gif-item';
                
                const previewUrl = gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url;
                const fullUrl = gif.media_formats?.gif?.url;
                
                if (previewUrl) {
                    const img = document.createElement('img');
                    img.src = previewUrl;
                    img.alt = gif.content_description || 'GIF';
                    img.loading = 'lazy';
                    
                    gifItem.appendChild(img);
                    gifItem.addEventListener('click', () => this._sendGif(fullUrl || previewUrl, gif));
                    container.appendChild(gifItem);
                }
            });
        }

        _sendGif(url, gifData) {
            if (this.onSendGif) {
                this.onSendGif(url, gifData);
            }
            this._hidePopover();
        }

        // ==================== STICKER ACTIONS ====================
        
        _sendSticker(sticker) {
            if (this.onSendSticker) {
                this.onSendSticker(sticker);
            }
            this._hidePopover();
        }

        // ==================== DRAG & DROP ====================
        
        _setupDragAndDrop() {
            const chatArea = this.composerEl.closest('.main-content') || this.composerEl.parentElement;
            if (!chatArea) return;
            
            let dragCounter = 0;
            
            chatArea.addEventListener('dragenter', (e) => {
                e.preventDefault();
                dragCounter++;
                chatArea.classList.add('drag-over');
            });
            
            chatArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dragCounter--;
                if (dragCounter === 0) {
                    chatArea.classList.remove('drag-over');
                }
            });
            
            chatArea.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            chatArea.addEventListener('drop', (e) => {
                e.preventDefault();
                dragCounter = 0;
                chatArea.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length > 0) {
                    this._handleFileSelect(e.dataTransfer.files);
                }
            });
        }

        // ==================== EVENT BINDING ====================
        
        _bindEvents() {
            if (this.attachBtn) {
                this.attachBtn.addEventListener('click', () => {
                    this.fileInput.click();
                });
            }
            
            this.fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this._handleFileSelect(e.target.files);
                }
            });
            
            if (this.emojiBtn) {
                this.emojiBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._showPopover(this.emojiBtn, 'emoji');
                });
            }
            
            if (this.gifBtn) {
                this.gifBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._showPopover(this.gifBtn, 'gif');
                });
            }
            
            if (this.stickerBtn) {
                this.stickerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._showPopover(this.stickerBtn, 'sticker');
                });
            }
            
            if (this.inputEl) {
                this.inputEl.addEventListener('paste', (e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    
                    for (const item of items) {
                        if (item.type.startsWith('image/')) {
                            e.preventDefault();
                            const file = item.getAsFile();
                            if (file) this._handleFileSelect([file]);
                            break;
                        }
                    }
                });
            }
        }

        // ==================== PUBLIC METHODS ====================
        
        /**
         * Get attached files
         * @returns {File[]}
         */
        getAttachedFiles() {
            return this.attachedFiles;
        }

        /**
         * Clear all attachments
         */
        clearAttachments() {
            this.attachedFiles.forEach(file => {
                this._removeFile(file.name);
            });
        }

        /**
         * Check if there are attachments
         * @returns {boolean}
         */
        hasAttachments() {
            return this.attachedFiles.length > 0;
        }

        /**
         * Destroy manager and cleanup
         */
        destroy() {
            this._hidePopover();
            if (this.fileInput) this.fileInput.remove();
            if (this.popover) this.popover.remove();
            if (this.previewContainer) this.previewContainer.remove();
            document.removeEventListener('click', this._handleOutsideClick);
        }

        // ==================== UTILITY ====================
        
        _showToast(message, type = 'info') {
            // Use global ToastManager if available
            if (window.ToastManager) {
                window.ToastManager.show(message, type);
                return;
            }
            
            // Fallback to simple toast
            const toast = document.createElement('div');
            toast.className = `chat-toast chat-toast-${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // Export to global
    window.ChatInputManager = ChatInputManager;

})(window);