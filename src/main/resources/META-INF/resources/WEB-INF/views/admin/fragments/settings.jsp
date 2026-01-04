<%-- Settings Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="settings">
    <!-- Page Header -->
    <div class="admin-page-header">
        <div class="admin-page-header-left">
            <h1 class="admin-page-title">Settings</h1>
            <p class="admin-page-subtitle">Configure platform settings and preferences</p>
        </div>
    </div>

    <!-- Settings Navigation & Content -->
    <div class="admin-settings-layout">
        <!-- Settings Sidebar -->
        <nav class="settings-nav">
            <a href="#general" class="settings-nav-item active" data-section="general">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="8" cy="8" r="2"/>
                    <path d="M8 2v2m0 8v2M2 8h2m8 0h2"/>
                </svg>
                General
            </a>
            <a href="#security" class="settings-nav-item" data-section="security">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M8 1L2 4v4c0 4 6 7 6 7s6-3 6-7V4L8 1z"/>
                </svg>
                Security
            </a>
            <a href="#moderation" class="settings-nav-item" data-section="moderation">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="2" width="12" height="12" rx="2"/>
                    <path d="M5 8l2 2 4-4"/>
                </svg>
                Moderation
            </a>
            <a href="#notifications" class="settings-nav-item" data-section="notifications">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M8 1a5 5 0 015 5v3l2 2H1l2-2V6a5 5 0 015-5z"/>
                    <path d="M6 14a2 2 0 004 0"/>
                </svg>
                Notifications
            </a>
            <a href="#integrations" class="settings-nav-item" data-section="integrations">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="1" y="1" width="6" height="6" rx="1"/>
                    <rect x="9" y="1" width="6" height="6" rx="1"/>
                    <rect x="1" y="9" width="6" height="6" rx="1"/>
                    <rect x="9" y="9" width="6" height="6" rx="1"/>
                </svg>
                Integrations
            </a>
        </nav>

        <!-- Settings Content -->
        <div class="settings-content">
            <!-- General Settings -->
            <section class="settings-section active" id="general" data-section="general">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">General Settings</h3>
                    </div>
                    <div class="admin-card-body">
                        <div class="settings-form">
                            <div class="admin-form-group">
                                <label class="admin-label">Platform Name</label>
                                <input type="text" class="admin-input" value="CoCoCord">
                                <p class="admin-form-hint">This name appears in the browser title and notifications</p>
                            </div>

                            <div class="admin-form-group">
                                <label class="admin-label">Support Email</label>
                                <input type="email" class="admin-input" value="support@cococord.vn">
                            </div>

                            <div class="admin-form-group">
                                <label class="admin-label">Default Language</label>
                                <select class="admin-select">
                                    <option value="vi" selected>Tiếng Việt</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            <div class="admin-form-group">
                                <label class="admin-label">Maintenance Mode</label>
                                <div class="setting-toggle">
                                    <label class="toggle-switch">
                                        <input type="checkbox">
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="toggle-label">Enable maintenance mode</span>
                                </div>
                                <p class="admin-form-hint">When enabled, only admins can access the platform</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Security Settings -->
            <section class="settings-section" id="security" data-section="security">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">Security Settings</h3>
                    </div>
                    <div class="admin-card-body">
                        <div class="settings-form">
                            <div class="admin-form-group">
                                <label class="admin-label">Two-Factor Authentication</label>
                                <div class="setting-toggle">
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="toggle-label">Require 2FA for admin accounts</span>
                                </div>
                            </div>

                            <div class="admin-form-group">
                                <label class="admin-label">Session Timeout (minutes)</label>
                                <input type="number" class="admin-input" value="30" style="width: 100px;">
                            </div>

                            <div class="admin-form-group">
                                <label class="admin-label">Max Login Attempts</label>
                                <input type="number" class="admin-input" value="5" style="width: 100px;">
                                <p class="admin-form-hint">Account will be locked after this many failed attempts</p>
                            </div>

                            <div class="admin-form-group">
                                <label class="admin-label">IP Whitelist</label>
                                <textarea class="admin-textarea" rows="3" placeholder="Enter IP addresses (one per line)"></textarea>
                                <p class="admin-form-hint">Leave empty to allow all IPs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Moderation Settings -->
            <section class="settings-section" id="moderation" data-section="moderation">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">Moderation Settings</h3>
                    </div>
                    <div class="admin-card-body">
                        <div class="settings-form">
                            <div class="admin-form-group">
                                <label class="admin-label">AutoMod Sensitivity</label>
                                <select class="admin-select">
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                    <option value="strict">Strict</option>
                                </select>
                            </div>

                            <div class="admin-form-group">
                                <label class="admin-label">Spam Detection</label>
                                <div class="setting-toggle">
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="toggle-label">Auto-delete detected spam</span>
                                </div>
                            </div>

                            <div class="admin-form-group">
                                <label class="admin-label">Link Filtering</label>
                                <div class="setting-toggle">
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="toggle-label">Block suspicious links</span>
                                </div>
                            </div>

                            <div class="admin-form-group">
                                <label class="admin-label">New Account Restrictions</label>
                                <input type="number" class="admin-input" value="24" style="width: 100px;">
                                <span class="input-suffix">hours</span>
                                <p class="admin-form-hint">Restrict new accounts from posting links for this duration</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Action Buttons -->
            <div class="settings-actions">
                <button class="admin-btn admin-btn-ghost" data-action="reset-settings">Reset to Defaults</button>
                <button class="admin-btn admin-btn-primary" data-action="save-settings">Save Changes</button>
            </div>
        </div>
    </div>
</div>
