/* global marked, hljs */

/**
 * CocoCord Markdown Renderer Module
 * Xử lý Markdown rendering với Syntax Highlighting và bảo mật XSS
 * Sử dụng marked.js và highlight.js
 */

(function (window) {
    'use strict';

    /**
     * Khởi tạo cấu hình cho marked.js
     * - Sanitize HTML để tránh XSS
     * - Highlight code blocks tự động
     */
    function initializeMarked() {
        if (typeof marked === 'undefined') {
            console.error('marked.js chưa được load. Vui lòng thêm script CDN vào trang.');
            return false;
        }

        // Cấu hình marked với options an toàn
        marked.setOptions({
            // Không cho phép HTML raw để tránh XSS
            mangle: false,
            headerIds: false,
            breaks: true, // Hỗ trợ line breaks như Discord
            gfm: true,    // GitHub Flavored Markdown
            
            // Highlight code blocks với highlight.js
            highlight: function(code, lang) {
                if (typeof hljs === 'undefined') {
                    return escapeHtml(code);
                }
                
                // Nếu có language được chỉ định
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { 
                            language: lang,
                            ignoreIllegals: true 
                        }).value;
                    } catch (e) {
                        console.warn('Highlight error:', e);
                    }
                }
                
                // Auto-detect language nếu không chỉ định
                try {
                    return hljs.highlightAuto(code).value;
                } catch (e) {
                    return escapeHtml(code);
                }
            }
        });

        return true;
    }

    /**
     * Escape HTML để tránh XSS injection
     * @param {string} str - Chuỗi cần escape
     * @returns {string} - Chuỗi đã được escape
     */
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Sanitize HTML output từ marked
     * Loại bỏ các thẻ nguy hiểm và attributes
     * @param {string} html - HTML cần sanitize
     * @returns {string} - HTML đã được làm sạch
     */
    function sanitizeHtml(html) {
        // Whitelist các thẻ an toàn
        const allowedTags = [
            'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
            'blockquote', 'ul', 'ol', 'li', 'a', 'span', 'div',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'table',
            'thead', 'tbody', 'tr', 'th', 'td'
        ];

        // Whitelist các attributes an toàn
        const allowedAttrs = ['class', 'href', 'title', 'data-language'];

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const allElements = doc.body.querySelectorAll('*');

        allElements.forEach(el => {
            // Xóa thẻ không được phép
            if (!allowedTags.includes(el.tagName.toLowerCase())) {
                el.remove();
                return;
            }

            // Xóa attributes không được phép
            Array.from(el.attributes).forEach(attr => {
                if (!allowedAttrs.includes(attr.name.toLowerCase())) {
                    el.removeAttribute(attr.name);
                }
            });

            // Xử lý đặc biệt cho thẻ <a>
            if (el.tagName === 'A') {
                // Chỉ cho phép http/https links
                const href = el.getAttribute('href');
                if (href && !href.match(/^https?:\/\//i)) {
                    el.removeAttribute('href');
                }
                // Thêm target="_blank" và rel="noopener noreferrer" cho links
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            }
        });

        return doc.body.innerHTML;
    }

    /**
     * Render nội dung tin nhắn từ raw Markdown sang HTML
     * @param {string} rawContent - Nội dung raw markdown
     * @returns {string} - HTML đã được render và sanitize
     */
    function renderMessageContent(rawContent) {
        if (!rawContent || typeof rawContent !== 'string') {
            return '';
        }

        // Nếu marked chưa được khởi tạo, thử khởi tạo
        if (typeof marked === 'undefined') {
            console.warn('marked.js chưa sẵn sàng, fallback về escapeHtml');
            return escapeHtml(rawContent);
        }

        try {
            // Parse markdown sang HTML
            let html = marked.parse(rawContent);

            // Sanitize HTML để đảm bảo an toàn
            html = sanitizeHtml(html);

            // Xử lý mentions (@username) - highlight
            html = html.replace(/@(\w+)/g, '<span class="mention">@$1</span>');

            // Xử lý emoji shortcodes (:smile:) - có thể thêm emoji library sau
            // html = processEmojis(html);

            return html;

        } catch (error) {
            console.error('Markdown rendering error:', error);
            // Fallback về plain text nếu có lỗi
            return escapeHtml(rawContent);
        }
    }

    /**
     * Render markdown inline (không có paragraph wrapper)
     * Dùng cho preview, titles, etc.
     * @param {string} rawContent - Nội dung raw markdown
     * @returns {string} - HTML inline đã được render
     */
    function renderInline(rawContent) {
        if (!rawContent || typeof rawContent !== 'string') {
            return '';
        }

        if (typeof marked === 'undefined') {
            return escapeHtml(rawContent);
        }

        try {
            let html = marked.parseInline(rawContent);
            html = sanitizeHtml(html);
            return html;
        } catch (error) {
            console.error('Inline markdown rendering error:', error);
            return escapeHtml(rawContent);
        }
    }

    /**
     * Kiểm tra xem một chuỗi có chứa code block không
     * @param {string} content - Nội dung cần kiểm tra
     * @returns {boolean}
     */
    function hasCodeBlock(content) {
        return /```[\s\S]*?```/.test(content);
    }

    /**
     * Kiểm tra xem một chuỗi có chứa markdown syntax không
     * @param {string} content - Nội dung cần kiểm tra
     * @returns {boolean}
     */
    function hasMarkdown(content) {
        // Kiểm tra các patterns markdown phổ biến
        const patterns = [
            /\*\*.*?\*\*/,      // bold
            /\*.*?\*/,          // italic
            /__.*?__/,          // bold alt
            /_.*?_/,            // italic alt
            /`.*?`/,            // inline code
            /```[\s\S]*?```/,   // code block
            /^>\s/m,            // blockquote
            /^\s*[-*+]\s/m,     // list
            /^\s*\d+\.\s/m,     // ordered list
            /\[.*?\]\(.*?\)/    // link
        ];
        
        return patterns.some(pattern => pattern.test(content));
    }

    // Export các functions
    window.CocoCordMarkdown = {
        init: initializeMarked,
        render: renderMessageContent,
        renderInline: renderInline,
        hasCodeBlock: hasCodeBlock,
        hasMarkdown: hasMarkdown,
        escapeHtml: escapeHtml
    };

    // Auto-init khi DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMarked);
    } else {
        initializeMarked();
    }

})(window);
