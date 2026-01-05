/* ==================== PICTURE-IN-PICTURE VOICE MANAGER ==================== */

(function() {
    'use strict';
    
    const PIPVoiceManager = {
        pipWindow: null,
        pipContent: null,
        pipHeader: null,
        isMinimized: false,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        windowStartX: 0,
        windowStartY: 0,
        
        init() {
            this.pipWindow = document.getElementById('voicePipWindow');
            this.pipContent = document.getElementById('voicePipContent');
            this.pipHeader = document.getElementById('voicePipHeader');
            
            if (!this.pipWindow) return;
            
            this.setupEventListeners();
            this.loadPosition();
        },
        
        setupEventListeners() {
            // Minimize button
            const btnMinimize = document.getElementById('voiceBtnMinimize');
            if (btnMinimize) {
                btnMinimize.addEventListener('click', () => this.minimizeToOIP());
            }
            
            // Expand button
            const btnExpand = document.getElementById('voicePipExpand');
            if (btnExpand) {
                btnExpand.addEventListener('click', () => this.expandFromPIP());
            }
            
            // Close button (disconnect)
            const btnClose = document.getElementById('voicePipClose');
            if (btnClose) {
                btnClose.addEventListener('click', () => this.closePIP());
            }
            
            // PIP Controls
            const pipMute = document.getElementById('voicePipMute');
            if (pipMute) {
                pipMute.addEventListener('click', () => this.toggleMute());
            }
            
            const pipDeafen = document.getElementById('voicePipDeafen');
            if (pipDeafen) {
                pipDeafen.addEventListener('click', () => this.toggleDeafen());
            }
            
            const pipDisconnect = document.getElementById('voicePipDisconnect');
            if (pipDisconnect) {
                pipDisconnect.addEventListener('click', () => this.closePIP());
            }
            
            // Dragging
            this.pipHeader.addEventListener('mousedown', (e) => this.startDrag(e));
            document.addEventListener('mousemove', (e) => this.onDrag(e));
            document.addEventListener('mouseup', () => this.endDrag());
            
            // Touch support
            this.pipHeader.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
            document.addEventListener('touchmove', (e) => this.onDrag(e.touches[0]));
            document.addEventListener('touchend', () => this.endDrag());
        },
        
        minimizeToOIP() {
            const voiceView = document.getElementById('voiceChannelView');
            if (!voiceView) return;
            
            // Hide full voice view
            voiceView.classList.remove('active');
            
            // Show PIP
            this.pipWindow.classList.add('show');
            this.isMinimized = true;
            
            // Render participants in PIP
            this.renderPIPParticipants();
            
            // Show text channel
            const textChannelView = document.querySelector('.text-channel-view');
            if (textChannelView) {
                textChannelView.style.display = '';
            }
        },
        
        expandFromPIP() {
            const voiceView = document.getElementById('voiceChannelView');
            if (!voiceView) return;
            
            // Hide PIP
            this.pipWindow.classList.remove('show');
            this.isMinimized = false;
            
            // Show full voice view
            voiceView.classList.add('active');
            
            // Hide text channel
            const textChannelView = document.querySelector('.text-channel-view');
            if (textChannelView) {
                textChannelView.style.display = 'none';
            }
        },
        
        closePIP() {
            // Disconnect from voice
            if (typeof leaveVoiceChannel === 'function') {
                leaveVoiceChannel();
            }
            
            // Hide PIP
            this.pipWindow.classList.remove('show');
            this.isMinimized = false;
        },
        
        renderPIPParticipants() {
            if (!this.pipContent) return;
            
            // Get participants from voice manager
            let participants = [];
            
            if (typeof voiceManager !== 'undefined' && voiceManager) {
                participants = voiceManager.getUsers();
            } else if (typeof voiceParticipantsMap !== 'undefined') {
                participants = Array.from(voiceParticipantsMap.values());
            }
            
            // Update channel name
            const channelNameEl = document.getElementById('voicePipChannelName');
            const activeChannel = document.querySelector('.channel-item.voice-active .channel-name');
            if (channelNameEl && activeChannel) {
                channelNameEl.textContent = activeChannel.textContent.trim();
            }
            
            // Render participants
            this.pipContent.innerHTML = participants.map(p => {
                const name = p.displayName || p.username || 'User';
                const isMuted = p.isMuted || !p.micOn;
                const isSpeaking = p.isSpeaking || p.speaking;
                const hasVideo = p.isCameraOn || p.camOn || p.isScreenSharing || p.screenOn;
                
                const avatarHtml = p.avatarUrl
                    ? `<img class="voice-pip-participant-avatar" src="${escapeHtml(p.avatarUrl)}" alt="${escapeHtml(name)}">`
                    : `<div class="voice-pip-participant-avatar-placeholder">${name.charAt(0).toUpperCase()}</div>`;
                
                return `
                    <div class="voice-pip-participant ${isSpeaking ? 'speaking' : ''} ${hasVideo ? 'has-video' : ''}" data-user-id="${p.userId || p.peerId}">
                        ${avatarHtml}
                        <div class="voice-pip-participant-info">
                            <div class="voice-pip-participant-name">${escapeHtml(name)}</div>
                            <div class="voice-pip-participant-status">
                                ${isSpeaking ? '<span style="color: #23a559;">● Đang nói</span>' : ''}
                            </div>
                        </div>
                        <div class="voice-pip-participant-icons">
                            ${isMuted ? `
                                <div class="voice-pip-participant-icon muted">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.3.43-2.05V9.5c0-.28.22-.5.5-.5s.5.22.5.5V11zm-5.5 4.28l-1.23-1.23V15c0 .55-.45 1-1 1H9.27l-2 2h4c1.66 0 3-1.34 3-3v-.72zm3.13 3.13L4.41 6.41 3 7.82l3.03 3.03C6.01 11.23 6 11.61 6 12v3c0 1.66 1.34 3 3 3h2v2h2v-2h.17l3.31 3.31 1.15-1.15z"/>
                                    </svg>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        },
        
        toggleMute() {
            const btn = document.getElementById('voicePipMute');
            if (typeof toggleMic === 'function') {
                toggleMic();
            } else if (typeof voiceManager !== 'undefined' && voiceManager) {
                voiceManager.toggleMic();
            }
            
            // Update button state
            setTimeout(() => {
                const isMuted = (typeof isMuted !== 'undefined' && isMuted) || 
                                (voiceManager && !voiceManager.micOn);
                if (btn) {
                    btn.classList.toggle('active', isMuted);
                }
                this.renderPIPParticipants();
            }, 100);
        },
        
        toggleDeafen() {
            const btn = document.getElementById('voicePipDeafen');
            if (typeof toggleDeafen === 'function') {
                toggleDeafen();
            } else if (typeof voiceManager !== 'undefined' && voiceManager) {
                voiceManager.setDeafen(!isDeafened);
            }
            
            // Update button state
            setTimeout(() => {
                const isDeaf = (typeof isDeafened !== 'undefined' && isDeafened);
                if (btn) {
                    btn.classList.toggle('active', isDeaf);
                }
            }, 100);
        },
        
        startDrag(e) {
            if (e.target.closest('.voice-pip-btn')) return; // Don't drag when clicking buttons
            
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            
            const rect = this.pipWindow.getBoundingClientRect();
            this.windowStartX = rect.left;
            this.windowStartY = rect.top;
            
            this.pipWindow.classList.add('dragging');
        },
        
        onDrag(e) {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;
            
            const newX = this.windowStartX + deltaX;
            const newY = this.windowStartY + deltaY;
            
            // Constrain to viewport
            const rect = this.pipWindow.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            
            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));
            
            this.pipWindow.style.left = constrainedX + 'px';
            this.pipWindow.style.top = constrainedY + 'px';
            this.pipWindow.style.right = 'auto';
            this.pipWindow.style.bottom = 'auto';
        },
        
        endDrag() {
            if (this.isDragging) {
                this.isDragging = false;
                this.pipWindow.classList.remove('dragging');
                this.savePosition();
            }
        },
        
        savePosition() {
            const rect = this.pipWindow.getBoundingClientRect();
            localStorage.setItem('voicePipPosition', JSON.stringify({
                left: rect.left,
                top: rect.top
            }));
        },
        
        loadPosition() {
            const saved = localStorage.getItem('voicePipPosition');
            if (saved) {
                try {
                    const pos = JSON.parse(saved);
                    this.pipWindow.style.left = pos.left + 'px';
                    this.pipWindow.style.top = pos.top + 'px';
                    this.pipWindow.style.right = 'auto';
                    this.pipWindow.style.bottom = 'auto';
                } catch (e) {
                    console.error('Failed to load PIP position:', e);
                }
            }
        },
        
        // Update PIP when participants change
        updateParticipants() {
            if (this.isMinimized && this.pipWindow.classList.contains('show')) {
                this.renderPIPParticipants();
            }
        }
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PIPVoiceManager.init());
    } else {
        PIPVoiceManager.init();
    }
    
    // Export to global scope
    window.PIPVoiceManager = PIPVoiceManager;
    
    // Helper function
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
})();
