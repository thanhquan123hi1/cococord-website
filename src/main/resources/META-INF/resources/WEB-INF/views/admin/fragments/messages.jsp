<%-- Messages Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="messages">
    <!-- Page Header -->
    <div class="admin-page-header">
        <div class="admin-page-header-left">
            <h1 class="admin-page-title">Message Moderation</h1>
            <p class="admin-page-subtitle">Review flagged messages and automod settings</p>
        </div>
        <div class="admin-page-header-actions">
            <button class="admin-btn admin-btn-primary" data-action="configure-automod">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="8" cy="8" r="2"/>
                    <path d="M8 2v2m0 8v2M2 8h2m8 0h2m-2.5-4l-1.5 1.5m-4 4l-1.5 1.5m0-7L5 7m4 4l1.5 1.5"/>
                </svg>
                Configure AutoMod
            </button>
        </div>
    </div>

    <!-- Stats Overview -->
    <div class="admin-stats-row">
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Flagged Messages</div>
                <div class="stat-value text-warning" data-stat="flaggedMessages">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">AutoMod Blocked</div>
                <div class="stat-value" data-stat="automodBlocked">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Reviewed Today</div>
                <div class="stat-value text-success" data-stat="reviewedToday">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Active Rules</div>
                <div class="stat-value" data-stat="activeRules">--</div>
            </div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="page-tabs">
        <button class="page-tab active" data-tab="flagged">
            Flagged Messages
            <span class="tab-badge" data-stat="flaggedMessages">0</span>
        </button>
        <button class="page-tab" data-tab="automod">
            AutoMod Queue
        </button>
        <button class="page-tab" data-tab="rules">
            AutoMod Rules
        </button>
    </div>

    <!-- Flagged Messages Tab Content -->
    <div class="tab-content active" data-tab-content="flagged">
        <!-- Filters -->
        <div class="admin-card">
            <div class="admin-toolbar">
                <div class="admin-toolbar-left">
                    <div class="admin-filter-group">
                        <select class="admin-select" id="message-reason-filter">
                            <option value="">All Reasons</option>
                            <option value="spam">Spam</option>
                            <option value="toxicity">Toxicity</option>
                            <option value="nsfw">NSFW Content</option>
                            <option value="links">Suspicious Links</option>
                            <option value="custom">Custom Filter</option>
                        </select>
                    </div>
                </div>
                <div class="admin-toolbar-right">
                    <button class="admin-btn admin-btn-ghost" data-action="bulk-approve">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 8l3 3 7-7"/>
                        </svg>
                        Approve Selected
                    </button>
                    <button class="admin-btn admin-btn-danger-ghost" data-action="bulk-delete">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h10z"/>
                        </svg>
                        Delete Selected
                    </button>
                </div>
            </div>
        </div>

        <!-- Messages List -->
        <div class="admin-messages-list" id="flagged-messages-list">
            <!-- Populated by JS -->
        </div>
    </div>

    <!-- AutoMod Queue Tab Content -->
    <div class="tab-content hidden" data-tab-content="automod">
        <div class="admin-messages-list" id="automod-queue-list">
            <!-- Populated by JS -->
        </div>
    </div>

    <!-- AutoMod Rules Tab Content -->
    <div class="tab-content hidden" data-tab-content="rules">
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">AutoMod Rules</h3>
                <button class="admin-btn admin-btn-sm admin-btn-primary" data-action="add-rule">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3v10M3 8h10"/>
                    </svg>
                    Add Rule
                </button>
            </div>
            <div class="admin-card-body">
                <div class="admin-rules-list" id="automod-rules-list">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>
    </div>

    <!-- Empty State -->
    <div class="admin-empty-state hidden" id="messages-empty">
        <div class="empty-icon">✨</div>
        <h3>No flagged messages</h3>
        <p>All messages are clean. AutoMod is doing great!</p>
    </div>

    <!-- Pagination -->
    <div class="admin-pagination-container" id="messages-pagination">
        <div class="admin-pagination">
            <span class="pagination-info">Showing <strong>1-10</strong> of <strong data-stat="flaggedMessages">0</strong> messages</span>
            <div class="pagination-controls">
                <button class="admin-btn admin-btn-sm admin-btn-ghost" disabled>Previous</button>
                <button class="admin-btn admin-btn-sm admin-btn-primary">1</button>
                <button class="admin-btn admin-btn-sm admin-btn-ghost">Next</button>
            </div>
        </div>
    </div>
</div>

<!-- Message Detail Modal Template -->
<template id="message-detail-modal-template">
    <div class="admin-modal-backdrop" data-modal="message-detail">
        <div class="admin-modal">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">Message Details</h3>
                <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-modal">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4l8 8M12 4l-8 8"/>
                    </svg>
                </button>
            </div>
            <div class="admin-modal-body">
                <!-- Modal content filled by JS -->
            </div>
            <div class="admin-modal-footer">
                <button class="admin-btn admin-btn-danger" data-action="delete-message">Delete Message</button>
                <button class="admin-btn admin-btn-success" data-action="approve-message">Approve</button>
            </div>
        </div>
    </div>
</template>

<!-- Add Rule Modal Template -->
<template id="add-rule-modal-template">
    <div class="admin-modal-backdrop" data-modal="add-rule">
        <div class="admin-modal">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">Add AutoMod Rule</h3>
                <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-modal">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4l8 8M12 4l-8 8"/>
                    </svg>
                </button>
            </div>
            <div class="admin-modal-body">
                <form class="admin-form" id="add-rule-form">
                    <div class="admin-form-group">
                        <label class="admin-label">Rule Name</label>
                        <input type="text" class="admin-input" name="ruleName" placeholder="e.g., Block spam links">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">Rule Type</label>
                        <select class="admin-select" name="ruleType">
                            <option value="word">Block Words</option>
                            <option value="regex">Regex Pattern</option>
                            <option value="link">Block Links</option>
                            <option value="spam">Anti-Spam</option>
                        </select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">Pattern / Words</label>
                        <textarea class="admin-textarea" name="pattern" rows="3" placeholder="Enter words or pattern..."></textarea>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">Action</label>
                        <select class="admin-select" name="action">
                            <option value="flag">Flag for Review</option>
                            <option value="delete">Delete Message</option>
                            <option value="warn">Warn User</option>
                            <option value="timeout">Timeout User</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="admin-modal-footer">
                <button class="admin-btn admin-btn-ghost" data-action="close-modal">Cancel</button>
                <button class="admin-btn admin-btn-primary" data-action="save-rule">Save Rule</button>
            </div>
        </div>
    </div>
</template>
