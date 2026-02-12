// ============================================
// PRINT MODULE
// ============================================

function printReceipt() {
    updatePreview();
    setTimeout(() => { window.print(); }, 300);
}
