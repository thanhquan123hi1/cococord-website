/**
 * Toast Notification Manager
 * Discord-style toast notifications for CoCoCord
 * 
 * Usage:
 *   ToastManager.show('Message here', 'success');
 *   ToastManager.success('Success message');
 *   ToastManager.error('Error message');
 *   ToastManager.warning('Warning message');
 *   ToastManager.info('Info message');
 */

(function(window) {
    'use strict';

    // ==================== CONFIGURATION ====================
    const DEFAULT_OPTIONS = {
        duration: 3000,           // Default duration in ms
        position: 'bottom-right', // Position: top-right, top-center, top-left, bottom-right, bottom-center, bottom-left
        maxToasts: 5,             // Maximum toasts visible at once
        showProgress: false,      // Show progress bar
        showClose: true,          // Show close button
        pauseOnHover: true,       // Pause timer on hover
        animate: true             // Enable animations
    };

    // Toast type configurations
    const TOAST_TYPES = {
        success: {
            icon: 'bi-check-circle-fill',
            title: 'Thành công'
        },
        error: {
            icon: 'bi-x-circle-fill',
            title: 'Lỗi'
        },
        warning: {
            icon: 'bi-exclamation-triangle-fill',
            title: 'Cảnh báo'
        },
        info: {
            icon: 'bi-info-circle-fill',
            title: 'Thông báo'
        }
    };

    // ==================== TOAST MANAGER CLASS ====================
    class ToastManagerClass {
        constructor(options = {}) {
            this.options = { ...DEFAULT_OPTIONS, ...options };
            this.toasts = new Map();
            this.toastId = 0;
            this.container = null;
            
            this._init();
        }

        /**
         * Initialize the toast container
         */
        _init() {
            // Wait for DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._createContainer());
            } else {
                this._createContainer();
            }
        }

        _createContainer() {
            // Create container if not exists
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = `toast-container ${this.options.position}`;
                this.container.setAttribute('role', 'alert');
                this.container.setAttribute('aria-live', 'polite');
                document.body.appendChild(this.container);
            }
        }

        /**
         * Set default options
         * @param {Object} options 
         */
        configure(options) {
            this.options = { ...this.options, ...options };
            
            // Update container position if changed
            if (options.position && this.container) {
                this.container.className = `toast-container ${this.options.position}`;
            }
        }

        /**
         * Show a toast notification
         * @param {string} message - The message to display
         * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
         * @param {number|Object} options - Duration in ms or options object
         * @returns {number} Toast ID for manual dismissal
         */
        show(message, type = 'info', options = {}) {
            // Ensure container exists
            if (!this.container) {
                this._createContainer();
            }

            // Handle legacy signature: show(message, type, duration)
            if (typeof options === 'number') {
                options = { duration: options };
            }

            const config = { ...this.options, ...options };
            const typeConfig = TOAST_TYPES[type] || TOAST_TYPES.info;
            const id = ++this.toastId;

            // Enforce max toasts limit
            this._enforceMaxToasts();

            // Create toast element
            const toast = this._createToastElement(id, message, type, typeConfig, config);
            
            // Add to container (prepend for top positions, append for bottom)
            if (this.options.position.startsWith('top')) {
                this.container.appendChild(toast);
            } else {
                this.container.insertBefore(toast, this.container.firstChild);
            }

            // Store toast data
            const toastData = {
                id,
                element: toast,
                timer: null,
                remaining: config.duration,
                startTime: null,
                paused: false
            };
            this.toasts.set(id, toastData);

            // Trigger show animation
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            // Start auto-dismiss timer
            if (config.duration > 0) {
                this._startTimer(toastData, config);
            }

            return id;
        }

        /**
         * Create toast DOM element
         */
        _createToastElement(id, message, type, typeConfig, config) {
            const toast = document.createElement('div');
            toast.className = `toast-notification toast-${type}`;
            toast.dataset.toastId = id;

            // Build HTML
            let html = '';

            // Icon
            html += `<div class="toast-icon"><i class="bi ${typeConfig.icon}"></i></div>`;

            // Content
            html += `<div class="toast-content">`;
            if (config.title !== false) {
                const title = config.title || typeConfig.title;
                html += `<div class="toast-title">${this._escapeHtml(title)}</div>`;
            }
            html += `<div class="toast-message">${this._escapeHtml(message)}</div>`;
            html += `</div>`;

            // Close button
            if (config.showClose) {
                html += `<button class="toast-close" aria-label="Đóng"><i class="bi bi-x"></i></button>`;
            }

            // Progress bar
            if (config.showProgress && config.duration > 0) {
                html += `<div class="toast-progress" style="width: 100%; transition-duration: ${config.duration}ms;"></div>`;
            }

            toast.innerHTML = html;

            // Bind events
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.dismiss(id));
            }

            // Pause on hover
            if (config.pauseOnHover && config.duration > 0) {
                toast.addEventListener('mouseenter', () => this._pauseTimer(id));
                toast.addEventListener('mouseleave', () => this._resumeTimer(id, config));
            }

            return toast;
        }

        /**
         * Start auto-dismiss timer
         */
        _startTimer(toastData, config) {
            toastData.startTime = Date.now();
            toastData.timer = setTimeout(() => {
                this.dismiss(toastData.id);
            }, toastData.remaining);

            // Start progress animation
            const progress = toastData.element.querySelector('.toast-progress');
            if (progress) {
                requestAnimationFrame(() => {
                    progress.style.width = '0%';
                });
            }
        }

        /**
         * Pause timer on hover
         */
        _pauseTimer(id) {
            const toastData = this.toasts.get(id);
            if (!toastData || toastData.paused) return;

            toastData.paused = true;
            clearTimeout(toastData.timer);
            toastData.remaining -= Date.now() - toastData.startTime;

            // Pause progress animation
            const progress = toastData.element.querySelector('.toast-progress');
            if (progress) {
                const computed = window.getComputedStyle(progress);
                progress.style.width = computed.width;
                progress.style.transitionDuration = '0ms';
            }
        }

        /**
         * Resume timer after hover
         */
        _resumeTimer(id, config) {
            const toastData = this.toasts.get(id);
            if (!toastData || !toastData.paused) return;

            toastData.paused = false;
            toastData.startTime = Date.now();
            toastData.timer = setTimeout(() => {
                this.dismiss(id);
            }, toastData.remaining);

            // Resume progress animation
            const progress = toastData.element.querySelector('.toast-progress');
            if (progress) {
                progress.style.transitionDuration = `${toastData.remaining}ms`;
                requestAnimationFrame(() => {
                    progress.style.width = '0%';
                });
            }
        }

        /**
         * Enforce maximum visible toasts
         */
        _enforceMaxToasts() {
            while (this.toasts.size >= this.options.maxToasts) {
                const oldestId = this.toasts.keys().next().value;
                this.dismiss(oldestId, true); // Force immediate removal
            }
        }

        /**
         * Dismiss a toast by ID
         * @param {number} id - Toast ID
         * @param {boolean} immediate - Skip animation
         */
        dismiss(id, immediate = false) {
            const toastData = this.toasts.get(id);
            if (!toastData) return;

            // Clear timer
            if (toastData.timer) {
                clearTimeout(toastData.timer);
            }

            const toast = toastData.element;

            if (immediate) {
                toast.remove();
                this.toasts.delete(id);
            } else {
                // Animate out
                toast.classList.remove('show');
                toast.classList.add('hide');

                setTimeout(() => {
                    toast.remove();
                    this.toasts.delete(id);
                }, 300);
            }
        }

        /**
         * Dismiss all toasts
         */
        dismissAll() {
            this.toasts.forEach((_, id) => this.dismiss(id));
        }

        /**
         * Convenience methods
         */
        success(message, options = {}) {
            return this.show(message, 'success', options);
        }

        error(message, options = {}) {
            return this.show(message, 'error', options);
        }

        warning(message, options = {}) {
            return this.show(message, 'warning', options);
        }

        info(message, options = {}) {
            return this.show(message, 'info', options);
        }

        /**
         * Escape HTML to prevent XSS
         */
        _escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // ==================== SINGLETON INSTANCE ====================
    const instance = new ToastManagerClass();

    // ==================== GLOBAL API ====================
    window.ToastManager = {
        /**
         * Show a toast notification
         * @param {string} message - Message to display
         * @param {string} type - Type: 'success', 'error', 'warning', 'info'
         * @param {number|Object} options - Duration or options object
         */
        show: (message, type, options) => instance.show(message, type, options),
        
        /**
         * Convenience methods
         */
        success: (message, options) => instance.success(message, options),
        error: (message, options) => instance.error(message, options),
        warning: (message, options) => instance.warning(message, options),
        info: (message, options) => instance.info(message, options),
        
        /**
         * Dismiss a specific toast
         * @param {number} id - Toast ID
         */
        dismiss: (id) => instance.dismiss(id),
        
        /**
         * Dismiss all toasts
         */
        dismissAll: () => instance.dismissAll(),
        
        /**
         * Configure default options
         * @param {Object} options 
         */
        configure: (options) => instance.configure(options),

        /**
         * Create a new ToastManager instance with custom options
         * @param {Object} options 
         * @returns {ToastManagerClass}
         */
        createInstance: (options) => new ToastManagerClass(options)
    };

    // ==================== LEGACY COMPATIBILITY ====================
    // Replace existing showToast functions with ToastManager
    window.showToast = function(message, type = 'info', duration = 3000) {
        return ToastManager.show(message, type, { duration });
    };

})(window);
