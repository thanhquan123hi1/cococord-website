<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Debug Call Overlay</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            padding: 20px;
            background: #2c2f33;
            color: #fff;
        }
        .test-section {
            background: #36393f;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
        }
        button {
            background: #5865f2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        }
        button:hover {
            background: #4752c4;
        }
        .log-output {
            background: #1e2124;
            padding: 15px;
            margin-top: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 400px;
            overflow-y: auto;
        }
        .log-line {
            margin: 4px 0;
            padding: 4px;
        }
        .log-error {
            color: #f04747;
        }
        .log-success {
            color: #43b581;
        }
        .log-info {
            color: #7289da;
        }
    </style>
</head>
<body>
    <h1>🔧 Debug Call Overlay</h1>
    <p>Trang này giúp debug overlay cuộc gọi</p>

    <!-- Test 1: Check Old Overlay -->
    <div class="test-section">
        <h3>1. Kiểm tra Bảng Cũ (dmCallOverlay)</h3>
        <button onclick="testOldOverlay()">🔍 Check Old Overlay</button>
        <div class="log-output" id="oldOverlayLog"></div>
    </div>

    <!-- Test 2: Check New Overlay -->
    <div class="test-section">
        <h3>2. Kiểm tra Bảng Mới (globalCallOverlay)</h3>
        <button onclick="testNewOverlay()">🔍 Check New Overlay</button>
        <button onclick="createOverlay()">➕ Force Create Overlay</button>
        <div class="log-output" id="newOverlayLog"></div>
    </div>

    <!-- Test 3: Show Overlay -->
    <div class="test-section">
        <h3>3. Test Hiển Thị Overlay</h3>
        <button onclick="showIncomingTest()">📞 Show Incoming Call</button>
        <button onclick="showOutgoingTest()">📞 Show Outgoing Call</button>
        <button onclick="showActiveTest()">📞 Show Active Call</button>
        <button onclick="hideOverlayTest()">❌ Hide Overlay</button>
        <div class="log-output" id="showOverlayLog"></div>
    </div>

    <!-- Test 4: Check CallManager -->
    <div class="test-section">
        <h3>4. Kiểm tra CallManager</h3>
        <button onclick="testCallManager()">🔍 Check CallManager</button>
        <div class="log-output" id="callManagerLog"></div>
    </div>

    <script>
        // Utility functions
        function log(containerId, message, type = 'info') {
            const container = document.getElementById(containerId);
            const line = document.createElement('div');
            line.className = 'log-line log-' + type;
            line.textContent = message;
            container.appendChild(line);
            container.scrollTop = container.scrollHeight;
        }

        function clear(containerId) {
            document.getElementById(containerId).innerHTML = '';
        }

        // Test 1: Old Overlay
        function testOldOverlay() {
            clear('oldOverlayLog');
            log('oldOverlayLog', '=== Checking Old Overlay ===');
            
            const oldOverlay = document.getElementById('dmCallOverlay');
            if (!oldOverlay) {
                log('oldOverlayLog', '❌ dmCallOverlay not found in DOM', 'success');
                return;
            }
            
            log('oldOverlayLog', '✅ dmCallOverlay exists', 'info');
            const computed = getComputedStyle(oldOverlay);
            
            log('oldOverlayLog', 'display: ' + computed.display, computed.display === 'none' ? 'success' : 'error');
            log('oldOverlayLog', 'visibility: ' + computed.visibility, computed.visibility === 'hidden' ? 'success' : 'error');
            log('oldOverlayLog', 'opacity: ' + computed.opacity, computed.opacity === '0' ? 'success' : 'error');
            log('oldOverlayLog', 'z-index: ' + computed.zIndex, 'info');
            log('oldOverlayLog', 'Inline style: ' + (oldOverlay.style.cssText || '(none)'), 'info');
            
            if (computed.display !== 'none') {
                log('oldOverlayLog', '⚠️ WARNING: Old overlay can still be visible!', 'error');
            } else {
                log('oldOverlayLog', '✅ Old overlay is completely hidden', 'success');
            }
        }

        // Test 2: New Overlay
        function testNewOverlay() {
            clear('newOverlayLog');
            log('newOverlayLog', '=== Checking New Overlay ===');
            
            const newOverlay = document.getElementById('globalCallOverlay');
            if (!newOverlay) {
                log('newOverlayLog', '❌ globalCallOverlay not found in DOM', 'error');
                log('newOverlayLog', 'Click "Force Create Overlay" to create it', 'info');
                return;
            }
            
            log('newOverlayLog', '✅ globalCallOverlay exists', 'success');
            const computed = getComputedStyle(newOverlay);
            
            log('newOverlayLog', 'display: ' + computed.display, 'info');
            log('newOverlayLog', 'z-index: ' + computed.zIndex, computed.zIndex === '10000' ? 'success' : 'error');
            
            // Check views
            const views = ['callIncomingView', 'callOutgoingView', 'callActiveView'];
            views.forEach(viewId => {
                const view = document.getElementById(viewId);
                if (view) {
                    log('newOverlayLog', '✅ ' + viewId + ' exists', 'success');
                } else {
                    log('newOverlayLog', '❌ ' + viewId + ' NOT FOUND', 'error');
                }
            });
        }

        function createOverlay() {
            clear('newOverlayLog');
            log('newOverlayLog', '=== Force Creating Overlay ===');
            
            if (window.CoCoCordCallManager) {
                // Access the createOverlayIfNeeded function (it's private, but we can test it)
                log('newOverlayLog', 'CallManager exists, triggering overlay creation...', 'info');
                
                // Manually create the overlay structure
                let overlay = document.getElementById('globalCallOverlay');
                if (overlay) {
                    log('newOverlayLog', '⚠️ Overlay already exists', 'info');
                } else {
                    // This will be created by CallManager on first call
                    log('newOverlayLog', '❌ Cannot manually create - wait for first call', 'error');
                }
            } else {
                log('newOverlayLog', '❌ CallManager not loaded!', 'error');
            }
        }

        // Test 3: Show/Hide
        function showIncomingTest() {
            clear('showOverlayLog');
            log('showOverlayLog', '=== Testing Incoming Call View ===');
            
            const overlay = document.getElementById('globalCallOverlay');
            const view = document.getElementById('callIncomingView');
            
            if (!overlay) {
                log('showOverlayLog', '❌ Overlay not found', 'error');
                return;
            }
            if (!view) {
                log('showOverlayLog', '❌ View not found', 'error');
                return;
            }
            
            view.style.display = 'flex';
            overlay.style.display = 'flex';
            document.getElementById('callOutgoingView').style.display = 'none';
            document.getElementById('callActiveView').style.display = 'none';
            
            log('showOverlayLog', '✅ Showing incoming call view', 'success');
            log('showOverlayLog', 'overlay.style.display = ' + overlay.style.display, 'info');
            log('showOverlayLog', 'Computed display = ' + getComputedStyle(overlay).display, 'info');
        }

        function showOutgoingTest() {
            clear('showOverlayLog');
            log('showOverlayLog', '=== Testing Outgoing Call View ===');
            
            const overlay = document.getElementById('globalCallOverlay');
            const view = document.getElementById('callOutgoingView');
            
            if (!overlay) {
                log('showOverlayLog', '❌ Overlay not found', 'error');
                return;
            }
            if (!view) {
                log('showOverlayLog', '❌ View not found', 'error');
                return;
            }
            
            view.style.display = 'flex';
            overlay.style.display = 'flex';
            document.getElementById('callIncomingView').style.display = 'none';
            document.getElementById('callActiveView').style.display = 'none';
            
            log('showOverlayLog', '✅ Showing outgoing call view', 'success');
            log('showOverlayLog', 'overlay.style.display = ' + overlay.style.display, 'info');
            log('showOverlayLog', 'Computed display = ' + getComputedStyle(overlay).display, 'info');
        }

        function showActiveTest() {
            clear('showOverlayLog');
            log('showOverlayLog', '=== Testing Active Call View ===');
            
            const overlay = document.getElementById('globalCallOverlay');
            const view = document.getElementById('callActiveView');
            
            if (!overlay) {
                log('showOverlayLog', '❌ Overlay not found', 'error');
                return;
            }
            if (!view) {
                log('showOverlayLog', '❌ View not found', 'error');
                return;
            }
            
            view.style.display = 'flex';
            overlay.style.display = 'flex';
            document.getElementById('callIncomingView').style.display = 'none';
            document.getElementById('callOutgoingView').style.display = 'none';
            
            log('showOverlayLog', '✅ Showing active call view', 'success');
            log('showOverlayLog', 'overlay.style.display = ' + overlay.style.display, 'info');
            log('showOverlayLog', 'Computed display = ' + getComputedStyle(overlay).display, 'info');
        }

        function hideOverlayTest() {
            clear('showOverlayLog');
            log('showOverlayLog', '=== Hiding Overlay ===');
            
            const overlay = document.getElementById('globalCallOverlay');
            if (!overlay) {
                log('showOverlayLog', '❌ Overlay not found', 'error');
                return;
            }
            
            overlay.style.display = 'none';
            ['callIncomingView', 'callOutgoingView', 'callActiveView'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            
            log('showOverlayLog', '✅ Overlay hidden', 'success');
        }

        // Test 4: CallManager
        function testCallManager() {
            clear('callManagerLog');
            log('callManagerLog', '=== Checking CallManager ===');
            
            if (!window.CoCoCordCallManager) {
                log('callManagerLog', '❌ CallManager not loaded!', 'error');
                return;
            }
            
            log('callManagerLog', '✅ CallManager loaded', 'success');
            
            const state = window.CoCoCordCallManager.getState();
            log('callManagerLog', 'State:', 'info');
            log('callManagerLog', '  active: ' + state.active, 'info');
            log('callManagerLog', '  incoming: ' + state.incoming, 'info');
            log('callManagerLog', '  outgoing: ' + state.outgoing, 'info');
            log('callManagerLog', '  currentUser: ' + (state.currentUser?.username || 'null'), 'info');
            log('callManagerLog', '  roomId: ' + (state.roomId || 'null'), 'info');
            log('callManagerLog', '  callId: ' + (state.callId || 'null'), 'info');
        }
    </script>
</body>
</html>
