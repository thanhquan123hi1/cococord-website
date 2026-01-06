/**
 * Quick Test Script - Copy/Paste vào Console
 * Chạy script này để kiểm tra bảng cũ đã bị ẩn hoàn toàn chưa
 */

console.log('=== CALL OVERLAY TEST ===');

// 1. Kiểm tra bảng cũ
const oldOverlay = document.getElementById('dmCallOverlay');
if (oldOverlay) {
    const computed = getComputedStyle(oldOverlay);
    console.log('Bảng cũ (dmCallOverlay):');
    console.log('  - display:', computed.display); // Phải là "none"
    console.log('  - visibility:', computed.visibility); // Phải là "hidden"
    console.log('  - opacity:', computed.opacity); // Phải là "0"
    console.log('  - pointer-events:', computed.pointerEvents); // Phải là "none"
    console.log('  - Inline style:', oldOverlay.style.cssText);
    
    if (computed.display === 'none' && computed.visibility === 'hidden') {
        console.log('  ✅ Bảng cũ đã bị ẩn HOÀN TOÀN');
    } else {
        console.error('  ❌ Bảng cũ VẪN CÓ THỂ HIỂN THỊ!');
        console.log('  🔧 Đang force ẩn...');
        oldOverlay.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
    }
} else {
    console.log('Bảng cũ: Không tìm thấy element');
}

// 2. Kiểm tra bảng mới
const newOverlay = document.getElementById('globalCallOverlay');
if (newOverlay) {
    const computed = getComputedStyle(newOverlay);
    console.log('\nBảng mới (globalCallOverlay):');
    console.log('  - Tồn tại:', true);
    console.log('  - display:', computed.display);
    console.log('  - z-index:', computed.zIndex); // Phải là "10000"
    
    // Kiểm tra các views con
    const views = {
        incoming: document.getElementById('callIncomingView'),
        outgoing: document.getElementById('callOutgoingView'),
        active: document.getElementById('callActiveView')
    };
    console.log('  - Views:', {
        incoming: !!views.incoming,
        outgoing: !!views.outgoing,
        active: !!views.active
    });
    
    if (views.incoming && views.outgoing && views.active) {
        console.log('  ✅ Bảng mới đã sẵn sàng với đầy đủ views');
    } else {
        console.error('  ❌ Thiếu một số views!');
    }
} else {
    console.error('❌ Bảng mới CHƯA được tạo!');
    console.log('Đang thử tạo...');
    if (window.CoCoCordCallManager) {
        // Trigger creation
        const testOverlay = document.createElement('div');
        testOverlay.id = 'globalCallOverlay-test';
        console.log('Có thể overlay chưa được init. Đợi 1s...');
    }
}

// 3. Kiểm tra CallManager
if (window.CoCoCordCallManager) {
    console.log('\n✅ CallManager đã load');
    const state = window.CoCoCordCallManager.getState();
    console.log('State:', {
        active: state.active,
        incoming: state.incoming,
        outgoing: state.outgoing,
        currentUser: state.currentUser?.username
    });
} else {
    console.error('❌ CallManager CHƯA load!');
}

// 4. Test thủ công
console.log('\n--- Test Thủ Công ---');
console.log('Chạy lệnh này để test hiển thị overlay:');
console.log('```javascript');
console.log('// Test incoming call view');
console.log('const overlay = document.getElementById(\"globalCallOverlay\");');
console.log('const view = document.getElementById(\"callIncomingView\");');
console.log('if (overlay && view) {');
console.log('  view.style.display = \"flex\";');
console.log('  overlay.style.display = \"flex\";');
console.log('  console.log(\"Overlay hiển thị:\", getComputedStyle(overlay).display);');
console.log('}');
console.log('```');

// 5. Test startCall
console.log('\n--- Hướng dẫn test cuộc gọi ---');
console.log('1. Nhấn nút gọi (voice/video)');
console.log('2. Xem Console logs từ [CallManager]');
console.log('3. Tìm dòng: "=== showOutgoingCallView() called ==="');
console.log('4. Kiểm tra overlay có hiện không');
console.log('5. Nếu không hiện → Copy logs và báo lỗi');

console.log('\n=== KẾT THÚC TEST ===');
