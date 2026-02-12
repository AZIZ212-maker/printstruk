// ============================================
// MAIN APP CONTROLLER
// ============================================

let currentReceiptType = null;

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    setupEventListeners();
    loadSettings();
    initAuthObserver();
});

function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (8 + Math.random() * 15) + 's';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.background = ['rgba(108,99,255,0.4)', 'rgba(0,212,255,0.4)', 'rgba(255,107,157,0.3)'][Math.floor(Math.random() * 3)];
        container.appendChild(p);
    }
}

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pw = document.getElementById('login-password').value;
        handleLogin(email, pw);
    });
    document.getElementById('reset-form').addEventListener('submit', e => {
        e.preventDefault();
        handleResetPassword(document.getElementById('reset-email').value);
    });
}

// ---- Navigation ----
function hideAll() {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
}

function hideLoading() {
    document.getElementById('loading-screen').style.display = 'none';
}

function showLoginPage() {
    hideAll();
    document.getElementById('login-page').style.display = 'flex';
}

function showDashboard() {
    hideAll();
    document.getElementById('dashboard-page').style.display = 'block';
    renderMenuGrid();
}

function showReceiptEditor(type) {
    currentReceiptType = type;
    const info = RECEIPT_TYPES.find(r => r.id === type);
    hideAll();
    document.getElementById('receipt-page').style.display = 'block';
    document.getElementById('receipt-page-title').textContent = info.title;
    document.getElementById('receipt-form').innerHTML = renderFormFields(type);
    updatePreview();
}

function goToDashboard() {
    currentReceiptType = null;
    showDashboard();
}

// ---- Menu Grid ----
function renderMenuGrid() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = RECEIPT_TYPES.map(r => `
        <div class="menu-card" style="--card-accent: ${r.color}" onclick="showReceiptEditor('${r.id}')">
            <div class="menu-card-icon" style="background: ${r.color}">
                <i class="fas ${r.icon}"></i>
            </div>
            <div class="menu-card-title">${r.title}</div>
            <div class="menu-card-desc">${r.desc}</div>
        </div>
    `).join('');
}

// ---- Settings ----
function showSettings() { document.getElementById('settings-modal').style.display = 'flex'; }
function hideSettings() { document.getElementById('settings-modal').style.display = 'none'; }

function loadSettings() {
    document.getElementById('setting-store-name').value = localStorage.getItem('store_name') || 'KIOS DIGITAL';
    document.getElementById('setting-store-address').value = localStorage.getItem('store_address') || 'Jl. Contoh No. 123, Kota';
    document.getElementById('setting-store-phone').value = localStorage.getItem('store_phone') || '081234567890';
    document.getElementById('setting-sheets-url').value = getSheetsUrl();
}

function saveSettings() {
    localStorage.setItem('store_name', document.getElementById('setting-store-name').value);
    localStorage.setItem('store_address', document.getElementById('setting-store-address').value);
    localStorage.setItem('store_phone', document.getElementById('setting-store-phone').value);
    localStorage.setItem(SHEETS_URL_KEY, document.getElementById('setting-sheets-url').value);
    showToast('Pengaturan berhasil disimpan!', 'success');
    hideSettings();
    if (currentReceiptType) updatePreview();
}

// ---- Save Receipt ----
async function saveReceipt() {
    const data = getFormData();
    data.type = currentReceiptType;

    // Save to Firebase
    if (isFirebaseConfigured()) {
        try {
            await database.ref('receipts/' + currentReceiptType).push(data);
        } catch (e) { console.error('Firebase save error:', e); }
    }

    // Save to Google Sheets
    await saveToGoogleSheets(currentReceiptType, data);

    showToast('Struk berhasil disimpan!', 'success');
}

// ---- Toast ----
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    t.innerHTML = `<i class="fas ${icons[type]}"></i> ${msg}`;
    t.className = 'toast ' + type;
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => t.classList.remove('show'), 3500);
}

// ---- Receipt Preview Rendering ----
function updatePreview() {
    if (!currentReceiptType) return;
    const data = getFormData();
    const store = getStoreInfo();
    const preview = document.getElementById('receipt-preview');
    preview.innerHTML = buildReceiptHTML(currentReceiptType, data, store);
}

function buildReceiptHTML(type, d, store) {
    let h = receiptHeader(store, d);

    switch (type) {
        case 'kios': h += receiptKios(d); break;
        case 'aplikasi': h += receiptAplikasi(d); break;
        case 'laptop': h += receiptLaptop(d); break;
        case 'listrik_pra': h += receiptListrikPra(d); break;
        case 'listrik_pasca': h += receiptListrikPasca(d); break;
        case 'transfer': h += receiptTransfer(d); break;
        case 'pulsa': h += receiptPulsa(d); break;
        case 'internet': h += receiptInternet(d); break;
        case 'pdam': h += receiptPdam(d); break;
        case 'bpjs': h += receiptBpjs(d); break;
    }

    h += receiptFooter();
    return h;
}

function receiptHeader(store, d) {
    const info = RECEIPT_TYPES.find(r => r.id === currentReceiptType);
    return `<div class="receipt-header">
        <div class="store-name">${store.name}</div>
        <div class="store-address">${store.address}</div>
        <div class="store-phone">Telp: ${store.phone}</div>
    </div>
    <div class="receipt-title">${info.title}</div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">No. Struk</span><span class="value">${d.no_struk || ''}</span></div>
    <div class="receipt-row"><span class="label">Tanggal</span><span class="value">${d.tanggal || ''}</span></div>
    <hr class="receipt-divider">`;
}

function receiptFooter() {
    return `<div class="receipt-footer">
        <div class="thank-you">Terima Kasih!</div>
        <div>Simpan struk sebagai bukti pembayaran</div>
        <div class="receipt-barcode">||||||||||||||||</div>
    </div>`;
}

// ---- Individual receipt renderers ----
function receiptKios(d) {
    let total = 0;
    let rows = '';
    (d.items || []).forEach(item => {
        const sub = item.qty * item.harga;
        total += sub;
        rows += `<tr><td>${item.nama || '-'}</td><td class="text-right">${item.qty}</td><td class="text-right">${formatRupiah(item.harga)}</td><td class="text-right">${formatRupiah(sub)}</td></tr>`;
    });
    const diskon = parseInt(d.diskon) || 0;
    const grandTotal = total - diskon;
    const bayar = parseInt(d.bayar) || 0;
    const kembali = bayar - grandTotal;

    return `${d.nama_pelanggan ? `<div class="receipt-row"><span class="label">Pelanggan</span><span class="value">${d.nama_pelanggan}</span></div><hr class="receipt-divider">` : ''}
    <table class="receipt-items-table"><tr><th>Item</th><th class="text-right">Qty</th><th class="text-right">Harga</th><th class="text-right">Sub</th></tr>${rows}</table>
    <div class="receipt-total-section">
        <div class="receipt-row"><span class="label">Subtotal</span><span class="value">${formatRupiah(total)}</span></div>
        ${diskon > 0 ? `<div class="receipt-row"><span class="label">Diskon</span><span class="value">-${formatRupiah(diskon)}</span></div>` : ''}
        <div class="receipt-total-row"><span>TOTAL</span><span>${formatRupiah(grandTotal)}</span></div>
        <hr class="receipt-divider">
        <div class="receipt-row"><span class="label">Bayar (${d.metode_bayar || 'Tunai'})</span><span class="value">${formatRupiah(bayar)}</span></div>
        <div class="receipt-row"><span class="label">Kembali</span><span class="value">${formatRupiah(Math.max(0, kembali))}</span></div>
    </div>`;
}

function receiptAplikasi(d) {
    return `<div class="receipt-row"><span class="label">Pelanggan</span><span class="value">${d.nama_pelanggan || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Aplikasi</span><span class="value">${d.nama_aplikasi || '-'}</span></div>
    <div class="receipt-row"><span class="label">Versi</span><span class="value">${d.versi || '-'}</span></div>
    <div class="receipt-row"><span class="label">Lisensi</span><span class="value">${d.lisensi || '-'}</span></div>
    <div class="receipt-row"><span class="label">Kode Lisensi</span><span class="value" style="font-size:9px">${d.kode_lisensi || '-'}</span></div>
    <div class="receipt-total-section">
        <div class="receipt-total-row"><span>TOTAL</span><span>${formatRupiah(d.harga)}</span></div>
        <div class="receipt-row"><span class="label">Pembayaran</span><span class="value">${d.metode_bayar || 'Tunai'}</span></div>
    </div>`;
}

function receiptLaptop(d) {
    const jasa = parseInt(d.biaya_jasa) || 0;
    const sp = parseInt(d.biaya_sparepart) || 0;
    return `<div class="receipt-row"><span class="label">Pelanggan</span><span class="value">${d.nama_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">No. HP</span><span class="value">${d.no_hp || '-'}</span></div>
    <div class="receipt-row"><span class="label">Laptop</span><span class="value">${d.merk_laptop || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Jenis Jasa</span><span class="value">${d.jenis_jasa || '-'}</span></div>
    <div class="receipt-row"><span class="label">Deskripsi</span><span class="value" style="font-size:9px;max-width:150px">${d.deskripsi || '-'}</span></div>
    <div class="receipt-row"><span class="label">Sparepart</span><span class="value">${d.sparepart || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Biaya Jasa</span><span class="value">${formatRupiah(jasa)}</span></div>
    <div class="receipt-row"><span class="label">Biaya Part</span><span class="value">${formatRupiah(sp)}</span></div>
    <div class="receipt-total-section">
        <div class="receipt-total-row"><span>TOTAL</span><span>${formatRupiah(jasa + sp)}</span></div>
    </div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Garansi</span><span class="value">${d.garansi || '-'}</span></div>`;
}

function receiptListrikPra(d) {
    const nom = parseInt(d.nominal) || 0;
    const adm = parseInt(d.admin_fee) || 0;
    return `<div class="receipt-row"><span class="label">ID Pel</span><span class="value">${d.id_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">Nama</span><span class="value">${d.nama_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">Tarif/Daya</span><span class="value">${d.tarif_daya || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Token</span><span class="value" style="font-size:10px;letter-spacing:1px;font-weight:700">${d.token || '--------------------'}</span></div>
    <div class="receipt-row"><span class="label">kWh</span><span class="value">${d.kwh || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Nominal</span><span class="value">${formatRupiah(nom)}</span></div>
    <div class="receipt-row"><span class="label">Admin</span><span class="value">${formatRupiah(adm)}</span></div>
    <div class="receipt-total-section">
        <div class="receipt-total-row"><span>TOTAL</span><span>${formatRupiah(nom + adm)}</span></div>
    </div>`;
}

function receiptListrikPasca(d) {
    const tag = parseInt(d.tagihan) || 0;
    const adm = parseInt(d.admin_fee) || 0;
    const den = parseInt(d.denda) || 0;
    return `<div class="receipt-row"><span class="label">ID Pel</span><span class="value">${d.id_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">Nama</span><span class="value">${d.nama_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">Tarif/Daya</span><span class="value">${d.tarif_daya || '-'}</span></div>
    <div class="receipt-row"><span class="label">Periode</span><span class="value">${d.periode || '-'}</span></div>
    <div class="receipt-row"><span class="label">Stand Meter</span><span class="value">${d.stand_meter || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Tagihan</span><span class="value">${formatRupiah(tag)}</span></div>
    <div class="receipt-row"><span class="label">Admin</span><span class="value">${formatRupiah(adm)}</span></div>
    ${den > 0 ? `<div class="receipt-row"><span class="label">Denda</span><span class="value">${formatRupiah(den)}</span></div>` : ''}
    <div class="receipt-total-section">
        <div class="receipt-total-row"><span>TOTAL</span><span>${formatRupiah(tag + adm + den)}</span></div>
    </div>`;
}

function receiptTransfer(d) {
    const nom = parseInt(d.nominal) || 0;
    const adm = parseInt(d.admin_fee) || 0;
    return `<div class="receipt-row"><span class="label">Pengirim</span><span class="value">${d.pengirim || '-'}</span></div>
    <div class="receipt-row"><span class="label">Rek. Asal</span><span class="value">${d.rek_pengirim || '-'}</span></div>
    <div class="receipt-row"><span class="label">Bank</span><span class="value">${d.bank_pengirim || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Penerima</span><span class="value">${d.penerima || '-'}</span></div>
    <div class="receipt-row"><span class="label">Rek. Tujuan</span><span class="value">${d.rek_penerima || '-'}</span></div>
    <div class="receipt-row"><span class="label">Bank Tujuan</span><span class="value">${d.bank_penerima || '-'}</span></div>
    ${d.berita ? `<div class="receipt-row"><span class="label">Berita</span><span class="value" style="font-size:9px">${d.berita}</span></div>` : ''}
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Nominal</span><span class="value">${formatRupiah(nom)}</span></div>
    <div class="receipt-row"><span class="label">Admin</span><span class="value">${formatRupiah(adm)}</span></div>
    <div class="receipt-total-section">
        <div class="receipt-total-row"><span>TOTAL</span><span>${formatRupiah(nom + adm)}</span></div>
    </div>`;
}

function receiptPulsa(d) {
    const nom = parseInt(d.nominal) || 0;
    const hrg = parseInt(d.harga) || 0;
    return `<div class="receipt-row"><span class="label">No. HP</span><span class="value">${d.no_hp || '-'}</span></div>
    <div class="receipt-row"><span class="label">Operator</span><span class="value">${d.operator || '-'}</span></div>
    <div class="receipt-row"><span class="label">Jenis</span><span class="value">${d.jenis || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Nominal</span><span class="value">${formatRupiah(nom)}</span></div>
    <div class="receipt-row"><span class="label">SN</span><span class="value" style="font-size:9px">${d.sn || '-'}</span></div>
    <div class="receipt-total-section">
        <div class="receipt-total-row"><span>HARGA</span><span>${formatRupiah(hrg)}</span></div>
    </div>`;
}

function receiptInternet(d) {
    const tag = parseInt(d.tagihan) || 0;
    const adm = parseInt(d.admin_fee) || 0;
    return `<div class="receipt-row"><span class="label">ID Pel</span><span class="value">${d.id_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">Nama</span><span class="value">${d.nama_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">Provider</span><span class="value">${d.provider || '-'}</span></div>
    <div class="receipt-row"><span class="label">Paket</span><span class="value">${d.paket || '-'}</span></div>
    <div class="receipt-row"><span class="label">Periode</span><span class="value">${d.periode || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Tagihan</span><span class="value">${formatRupiah(tag)}</span></div>
    <div class="receipt-row"><span class="label">Admin</span><span class="value">${formatRupiah(adm)}</span></div>
    <div class="receipt-total-section">
        <div class="receipt-total-row"><span>TOTAL</span><span>${formatRupiah(tag + adm)}</span></div>
    </div>`;
}

function receiptPdam(d) {
    const tag = parseInt(d.tagihan) || 0;
    const adm = parseInt(d.admin_fee) || 0;
    const den = parseInt(d.denda) || 0;
    return `<div class="receipt-row"><span class="label">ID Pel</span><span class="value">${d.id_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">Nama</span><span class="value">${d.nama_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">Alamat</span><span class="value" style="font-size:9px">${d.alamat || '-'}</span></div>
    <div class="receipt-row"><span class="label">Periode</span><span class="value">${d.periode || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Stand Meter</span><span class="value">${d.stand_meter || '-'} m³</span></div>
    <div class="receipt-row"><span class="label">Pemakaian</span><span class="value">${d.pemakaian || '-'} m³</span></div>
    <div class="receipt-row"><span class="label">Tagihan</span><span class="value">${formatRupiah(tag)}</span></div>
    <div class="receipt-row"><span class="label">Admin</span><span class="value">${formatRupiah(adm)}</span></div>
    ${den > 0 ? `<div class="receipt-row"><span class="label">Denda</span><span class="value">${formatRupiah(den)}</span></div>` : ''}
    <div class="receipt-total-section">
        <div class="receipt-total-row"><span>TOTAL</span><span>${formatRupiah(tag + adm + den)}</span></div>
    </div>`;
}

function receiptBpjs(d) {
    const premi = parseInt(d.premi) || 0;
    const adm = parseInt(d.admin_fee) || 0;
    const den = parseInt(d.denda) || 0;
    return `<div class="receipt-row"><span class="label">No. Peserta</span><span class="value">${d.no_peserta || '-'}</span></div>
    <div class="receipt-row"><span class="label">Nama</span><span class="value">${d.nama_pelanggan || '-'}</span></div>
    <div class="receipt-row"><span class="label">Segmen</span><span class="value">${d.segmen || '-'}</span></div>
    <div class="receipt-row"><span class="label">Jml Peserta</span><span class="value">${d.jumlah_peserta || '1'}</span></div>
    <div class="receipt-row"><span class="label">Periode</span><span class="value">${d.periode || '-'}</span></div>
    <hr class="receipt-divider">
    <div class="receipt-row"><span class="label">Premi/Iuran</span><span class="value">${formatRupiah(premi)}</span></div>
    <div class="receipt-row"><span class="label">Admin</span><span class="value">${formatRupiah(adm)}</span></div>
    ${den > 0 ? `<div class="receipt-row"><span class="label">Denda</span><span class="value">${formatRupiah(den)}</span></div>` : ''}
    <div class="receipt-total-section">
        <div class="receipt-total-row"><span>TOTAL</span><span>${formatRupiah(premi + adm + den)}</span></div>
    </div>`;
}
