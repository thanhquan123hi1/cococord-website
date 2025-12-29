/**
 * File Upload Component with Drag & Drop, Preview, and Progress
 * Discord Clone - Rich Message System
 */

(() => {
    'use strict';

    class FileUploader {
        constructor(options = {}) {
            this.maxFileSize = options.maxFileSize || 8 * 1024 * 1024; // 8MB default
            this.allowedTypes = options.allowedTypes || [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                'video/mp4', 'video/webm', 'video/ogg',
                'application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain'
            ];
            this.onFileSelect = options.onFileSelect || (() => {});
            this.onUploadProgress = options.onUploadProgress || (() => {});
            this.onUploadComplete = options.onUploadComplete || (() => {});
            this.onUploadError = options.onUploadError || (() => {});
        }

        createUploadButton(container) {
            const button = document.createElement('button');
            button.className = 'file-upload-btn';
            button.type = 'button';
            button.title = 'Upload File';
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                </svg>
            `;

            const input = document.createElement('input');
            input.type = 'file';
            input.className = 'file-upload-input';
            input.style.display = 'none';
            input.multiple = true;

            button.appendChild(input);

            button.addEventListener('click', (e) => {
                if (e.target === button) {
                    input.click();
                }
            });

            input.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
                input.value = ''; // Reset input
            });

            if (container) {
                container.appendChild(button);
            }

            return button;
        }

        setupDragAndDrop(dropZone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.add('drag-over');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.remove('drag-over');
                });
            });

            dropZone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                this.handleFiles(files);
            });
        }

        handleFiles(files) {
            const filesArray = Array.from(files);
            const validFiles = [];
            const errors = [];

            filesArray.forEach(file => {
                const validation = this.validateFile(file);
                if (validation.valid) {
                    validFiles.push(file);
                } else {
                    errors.push(`${file.name}: ${validation.error}`);
                }
            });

            if (errors.length > 0) {
                alert('Some files could not be uploaded:\n' + errors.join('\n'));
            }

            if (validFiles.length > 0) {
                this.onFileSelect(validFiles);
                validFiles.forEach(file => this.uploadFile(file));
            }
        }

        validateFile(file) {
            if (file.size > this.maxFileSize) {
                return {
                    valid: false,
                    error: `File size exceeds ${this.formatFileSize(this.maxFileSize)}`
                };
            }

            if (!this.allowedTypes.includes(file.type)) {
                return {
                    valid: false,
                    error: 'File type not allowed'
                };
            }

            return { valid: true };
        }

        async uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        this.onUploadProgress(file, percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        const response = JSON.parse(xhr.responseText);
                        this.onUploadComplete(file, response);
                    } else {
                        this.onUploadError(file, 'Upload failed');
                    }
                });

                xhr.addEventListener('error', () => {
                    this.onUploadError(file, 'Network error');
                });

                xhr.open('POST', '/api/upload');
                xhr.send(formData);
            } catch (error) {
                this.onUploadError(file, error.message);
            }
        }

        createPreview(file, uploadResponse) {
            const preview = document.createElement('div');
            preview.className = 'file-preview';
            preview.dataset.fileId = uploadResponse?.fileId || file.name;

            const isImage = file.type.startsWith('image/');

            if (isImage) {
                const img = document.createElement('img');
                img.className = 'preview-image';
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);

                preview.innerHTML = `
                    <div class="preview-image-container">
                        ${img.outerHTML}
                        <button class="preview-remove" type="button" title="Remove">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="preview-info">
                        <div class="preview-filename">${this.escapeHtml(file.name)}</div>
                        <div class="preview-filesize">${this.formatFileSize(file.size)}</div>
                    </div>
                    <div class="preview-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                `;
            } else {
                const icon = this.getFileIcon(file.type);
                preview.innerHTML = `
                    <div class="preview-file-container">
                        <div class="preview-file-icon">${icon}</div>
                        <div class="preview-file-info">
                            <div class="preview-filename">${this.escapeHtml(file.name)}</div>
                            <div class="preview-filesize">${this.formatFileSize(file.size)}</div>
                        </div>
                        <button class="preview-remove" type="button" title="Remove">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="preview-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                `;
            }

            preview.querySelector('.preview-remove').addEventListener('click', () => {
                preview.remove();
                const event = new CustomEvent('file:removed', {
                    detail: { file, uploadResponse }
                });
                document.dispatchEvent(event);
            });

            return preview;
        }

        updateProgress(preview, percent) {
            const progressFill = preview.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = percent + '%';
            }

            if (percent === 100) {
                const progressContainer = preview.querySelector('.preview-progress');
                if (progressContainer) {
                    setTimeout(() => {
                        progressContainer.style.display = 'none';
                    }, 500);
                }
            }
        }

        formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
        }

        getFileIcon(mimeType) {
            if (!mimeType) return '📄';
            if (mimeType.includes('pdf')) return '📕';
            if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
            if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📗';
            if (mimeType.includes('text')) return '📝';
            if (mimeType.includes('video')) return '🎥';
            if (mimeType.includes('audio')) return '🎵';
            if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
            return '📄';
        }

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str || '';
            return div.innerHTML;
        }
    }

    // ==================== EXPORT ====================
    window.FileUploader = FileUploader;

})();
