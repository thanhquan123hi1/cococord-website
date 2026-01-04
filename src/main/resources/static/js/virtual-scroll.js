/* global escapeHtml, CocoCordMarkdown */

/**
 * VirtualScroller - Vanilla JS Virtual Scrolling for Chat Messages
 * 
 * Optimizes rendering of large lists (1000+ messages) by only rendering
 * DOM nodes for visible items + buffer zone.
 * 
 * Features:
 * - Reuses DOM nodes to minimize DOM operations
 * - Maintains scroll position during updates
 * - Supports dynamic item heights
 * - Bidirectional scrolling (load older/newer messages)
 * - Memory efficient (constant DOM size regardless of data size)
 */

(function (window) {
    'use strict';

    class VirtualScroller {
        constructor(options) {
            // Required options
            this.container = options.container;              // Container element (scrollable)
            this.renderItem = options.renderItem;            // Function to render item HTML: (item, index) => string
            this.estimatedItemHeight = options.estimatedItemHeight || 80; // Average item height in px
            
            // Optional options
            this.bufferSize = options.bufferSize || 5;      // Number of items to render outside viewport
            this.onScrollTop = options.onScrollTop || null;  // Callback when scrolled to top
            this.onScrollBottom = options.onScrollBottom || null; // Callback when scrolled to bottom
            this.scrollThreshold = options.scrollThreshold || 100; // px from edge to trigger callbacks
            
            // Internal state
            this.items = [];                                 // Data items
            this.itemHeights = new Map();                    // Actual measured heights: index -> height
            this.totalHeight = 0;                           // Total scrollable height
            this.visibleRange = { start: 0, end: 0 };      // Currently visible item indices
            this.lastScrollTop = 0;
            this.isScrolling = false;
            this.scrollTimeout = null;
            
            // DOM elements
            this.viewport = null;                           // Inner container for items
            this.spacerTop = null;                          // Spacer before visible items
            this.spacerBottom = null;                       // Spacer after visible items
            
            // Initialize
            this._init();
        }

        /**
         * Initialize virtual scroller structure
         */
        _init() {
            // Clear container
            this.container.innerHTML = '';
            this.container.style.overflowY = 'auto';
            this.container.style.position = 'relative';
            
            // Create viewport structure
            this.viewport = document.createElement('div');
            this.viewport.className = 'virtual-scroll-viewport';
            this.viewport.style.position = 'relative';
            this.viewport.style.width = '100%';
            
            this.spacerTop = document.createElement('div');
            this.spacerTop.className = 'virtual-scroll-spacer-top';
            this.spacerTop.style.height = '0px';
            
            this.spacerBottom = document.createElement('div');
            this.spacerBottom.className = 'virtual-scroll-spacer-bottom';
            this.spacerBottom.style.height = '0px';
            
            this.viewport.appendChild(this.spacerTop);
            this.viewport.appendChild(this.spacerBottom);
            this.container.appendChild(this.viewport);
            
            // Bind scroll event
            this.container.addEventListener('scroll', this._onScroll.bind(this));
            
            console.log('[VirtualScroller] Initialized');
        }

        /**
         * Set data items and render
         * @param {Array} newItems - Array of data items
         * @param {Object} options - { preserveScroll: boolean, scrollTo: 'top'|'bottom' }
         */
        setItems(newItems, options = {}) {
            this.items = newItems || [];
            
            // Reset height cache if items changed significantly
            if (this.items.length === 0) {
                this.itemHeights.clear();
            }
            
            // Calculate total height (estimate for unmeasured items)
            this._updateTotalHeight();
            
            // Render visible range
            if (options.scrollTo === 'bottom') {
                this.scrollToBottom();
            } else if (options.scrollTo === 'top') {
                this.scrollToTop();
            } else if (!options.preserveScroll) {
                this._render();
            }
        }

        /**
         * Append new items to the end (e.g., new incoming messages)
         * @param {Array} newItems - Items to append
         * @param {boolean} autoScroll - Whether to scroll to bottom if near bottom
         */
        appendItems(newItems, autoScroll = true) {
            if (!newItems || newItems.length === 0) return;
            
            const wasNearBottom = this._isNearBottom();
            this.items.push(...newItems);
            this._updateTotalHeight();
            this._render();
            
            if (autoScroll && wasNearBottom) {
                this.scrollToBottom();
            }
        }

        /**
         * Prepend items to the beginning (e.g., loading older messages)
         * @param {Array} newItems - Items to prepend
         */
        prependItems(newItems) {
            if (!newItems || newItems.length === 0) return;
            
            // Save current scroll position
            const scrollTop = this.container.scrollTop;
            const scrollHeight = this.container.scrollHeight;
            
            // Prepend items
            this.items.unshift(...newItems);
            
            // Update height cache indices (shift all indices by newItems.length)
            const newHeightMap = new Map();
            for (const [idx, height] of this.itemHeights.entries()) {
                newHeightMap.set(idx + newItems.length, height);
            }
            this.itemHeights = newHeightMap;
            
            this._updateTotalHeight();
            this._render();
            
            // Restore scroll position (keep user at same visual position)
            requestAnimationFrame(() => {
                const newScrollHeight = this.container.scrollHeight;
                this.container.scrollTop = scrollTop + (newScrollHeight - scrollHeight);
            });
        }

        /**
         * Update total scrollable height
         */
        _updateTotalHeight() {
            let height = 0;
            for (let i = 0; i < this.items.length; i++) {
                height += this.itemHeights.get(i) || this.estimatedItemHeight;
            }
            this.totalHeight = height;
        }

        /**
         * Calculate visible range based on scroll position
         */
        _calculateVisibleRange() {
            const scrollTop = this.container.scrollTop;
            const viewportHeight = this.container.clientHeight;
            
            let offsetTop = 0;
            let startIndex = 0;
            let endIndex = this.items.length;
            
            // Find start index
            for (let i = 0; i < this.items.length; i++) {
                const itemHeight = this.itemHeights.get(i) || this.estimatedItemHeight;
                if (offsetTop + itemHeight >= scrollTop - this.bufferSize * this.estimatedItemHeight) {
                    startIndex = Math.max(0, i - this.bufferSize);
                    break;
                }
                offsetTop += itemHeight;
            }
            
            // Find end index
            offsetTop = 0;
            for (let i = 0; i < this.items.length; i++) {
                const itemHeight = this.itemHeights.get(i) || this.estimatedItemHeight;
                offsetTop += itemHeight;
                if (offsetTop >= scrollTop + viewportHeight + this.bufferSize * this.estimatedItemHeight) {
                    endIndex = Math.min(this.items.length, i + this.bufferSize + 1);
                    break;
                }
            }
            
            return { start: startIndex, end: endIndex };
        }

        /**
         * Render visible items
         */
        _render() {
            const range = this._calculateVisibleRange();
            
            // Skip if range hasn't changed
            if (range.start === this.visibleRange.start && range.end === this.visibleRange.end) {
                return;
            }
            
            this.visibleRange = range;
            
            // Calculate spacer heights
            let topHeight = 0;
            for (let i = 0; i < range.start; i++) {
                topHeight += this.itemHeights.get(i) || this.estimatedItemHeight;
            }
            
            let bottomHeight = 0;
            for (let i = range.end; i < this.items.length; i++) {
                bottomHeight += this.itemHeights.get(i) || this.estimatedItemHeight;
            }
            
            // Update spacers
            this.spacerTop.style.height = `${topHeight}px`;
            this.spacerBottom.style.height = `${bottomHeight}px`;
            
            // Remove old items (keep only spacers)
            while (this.viewport.children.length > 2) {
                const child = this.viewport.children[1]; // Always remove middle child (between spacers)
                this.viewport.removeChild(child);
            }
            
            // Render visible items
            const fragment = document.createDocumentFragment();
            for (let i = range.start; i < range.end; i++) {
                const item = this.items[i];
                const node = this._createItemNode(item, i);
                fragment.appendChild(node);
            }
            
            // Insert between spacers
            this.viewport.insertBefore(fragment, this.spacerBottom);
            
            // Measure actual heights
            requestAnimationFrame(() => {
                this._measureItemHeights();
            });
        }

        /**
         * Create DOM node for an item
         */
        _createItemNode(item, index) {
            const wrapper = document.createElement('div');
            wrapper.className = 'virtual-scroll-item';
            wrapper.dataset.index = index;
            
            // Call user-provided render function
            const html = this.renderItem(item, index);
            wrapper.innerHTML = html;
            
            return wrapper;
        }

        /**
         * Measure actual heights of rendered items
         */
        _measureItemHeights() {
            const items = this.viewport.querySelectorAll('.virtual-scroll-item');
            let needsUpdate = false;
            
            items.forEach(node => {
                const index = parseInt(node.dataset.index, 10);
                const height = node.offsetHeight;
                const cachedHeight = this.itemHeights.get(index);
                
                if (!cachedHeight || Math.abs(cachedHeight - height) > 1) {
                    this.itemHeights.set(index, height);
                    needsUpdate = true;
                }
            });
            
            if (needsUpdate) {
                this._updateTotalHeight();
                // Update spacer heights with measured values
                let topHeight = 0;
                for (let i = 0; i < this.visibleRange.start; i++) {
                    topHeight += this.itemHeights.get(i) || this.estimatedItemHeight;
                }
                this.spacerTop.style.height = `${topHeight}px`;
                
                let bottomHeight = 0;
                for (let i = this.visibleRange.end; i < this.items.length; i++) {
                    bottomHeight += this.itemHeights.get(i) || this.estimatedItemHeight;
                }
                this.spacerBottom.style.height = `${bottomHeight}px`;
            }
        }

        /**
         * Handle scroll event
         */
        _onScroll() {
            const scrollTop = this.container.scrollTop;
            const scrollHeight = this.container.scrollHeight;
            const clientHeight = this.container.clientHeight;
            
            // Render visible items
            this._render();
            
            // Debounced scroll end detection
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
                this._onScrollEnd();
            }, 150);
            
            this.isScrolling = true;
            
            // Check if scrolled to top
            if (scrollTop <= this.scrollThreshold) {
                if (this.onScrollTop) {
                    this.onScrollTop();
                }
            }
            
            // Check if scrolled to bottom
            if (scrollHeight - scrollTop - clientHeight <= this.scrollThreshold) {
                if (this.onScrollBottom) {
                    this.onScrollBottom();
                }
            }
            
            this.lastScrollTop = scrollTop;
        }

        /**
         * Handle scroll end (debounced)
         */
        _onScrollEnd() {
            // Re-measure heights after scroll stops (more accurate)
            this._measureItemHeights();
        }

        /**
         * Check if scrolled near bottom
         */
        _isNearBottom() {
            const threshold = 150; // px
            const scrollTop = this.container.scrollTop;
            const scrollHeight = this.container.scrollHeight;
            const clientHeight = this.container.clientHeight;
            return scrollHeight - scrollTop - clientHeight < threshold;
        }

        /**
         * Scroll to bottom
         */
        scrollToBottom() {
            requestAnimationFrame(() => {
                this.container.scrollTop = this.container.scrollHeight;
            });
        }

        /**
         * Scroll to top
         */
        scrollToTop() {
            requestAnimationFrame(() => {
                this.container.scrollTop = 0;
            });
        }

        /**
         * Scroll to specific item index
         */
        scrollToIndex(index) {
            if (index < 0 || index >= this.items.length) return;
            
            let offsetTop = 0;
            for (let i = 0; i < index; i++) {
                offsetTop += this.itemHeights.get(i) || this.estimatedItemHeight;
            }
            
            requestAnimationFrame(() => {
                this.container.scrollTop = offsetTop;
            });
        }

        /**
         * Get current scroll position info
         */
        getScrollInfo() {
            return {
                scrollTop: this.container.scrollTop,
                scrollHeight: this.container.scrollHeight,
                clientHeight: this.container.clientHeight,
                visibleRange: { ...this.visibleRange },
                isNearBottom: this._isNearBottom(),
                isAtTop: this.container.scrollTop <= this.scrollThreshold
            };
        }

        /**
         * Destroy scroller and cleanup
         */
        destroy() {
            this.container.removeEventListener('scroll', this._onScroll);
            clearTimeout(this.scrollTimeout);
            this.container.innerHTML = '';
            this.items = [];
            this.itemHeights.clear();
        }
    }

    // Export to global
    window.VirtualScroller = VirtualScroller;

})(window);
