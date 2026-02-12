// ============================================
// RECEIPT TEMPLATES MODULE
// ============================================

const RECEIPT_TYPES = [
    { id: 'kios', title: 'Struk Kios', icon: 'fa-store', color: 'var(--accent-1)', desc: 'Struk penjualan kios umum' },
    { id: 'aplikasi', title: 'Struk Pembelian Aplikasi', icon: 'fa-mobile-alt', color: 'var(--accent-2)', desc: 'Struk pembelian software/aplikasi' },
    { id: 'laptop', title: 'Struk Jasa Laptop', icon: 'fa-laptop-medical', color: 'var(--accent-3)', desc: 'Perbaikan, instal Windows, sparepart' },
    { id: 'listrik_pra', title: 'Struk Listrik Prabayar', icon: 'fa-bolt', color: 'var(--accent-5)', desc: 'Token listrik prabayar' },
    { id: 'listrik_pasca', title: 'Struk Listrik Pascabayar', icon: 'fa-plug', color: 'var(--accent-6)', desc: 'Tagihan listrik pascabayar' },
    { id: 'transfer', title: 'Struk Transfer Dana', icon: 'fa-exchange-alt', color: 'var(--accent-7)', desc: 'Transfer antar rekening/bank' },
    { id: 'pulsa', title: 'Struk Pembelian Pulsa', icon: 'fa-signal', color: 'var(--accent-4)', desc: 'Pembelian pulsa & paket data' },
    { id: 'internet', title: 'Struk Pembayaran Internet', icon: 'fa-wifi', color: 'var(--accent-8)', desc: 'Tagihan internet/WiFi' },
    { id: 'pdam', title: 'Struk Pembayaran PDAM', icon: 'fa-tint', color: 'var(--accent-9)', desc: 'Tagihan air PDAM' },
    { id: 'bpjs', title: 'Struk Pembayaran BPJS', icon: 'fa-heartbeat', color: '#e91e63', desc: 'BPJS Kesehatan & Ketenagakerjaan' }
];

function getReceiptFields(type) {
    const common = [
        { id: 'no_struk', label: 'No. Struk', type: 'text', value: generateReceiptNo(), readonly: true },
        { id: 'tanggal', label: 'Tanggal', type: 'text', value: getCurrentDateTime(), readonly: true }
    ];
    const fields = {
        kios: [...common,
        { id: 'nama_pelanggan', label: 'Nama Pelanggan', type: 'text', value: '' },
        { id: 'items', label: 'Daftar Item', type: 'items', columns: ['Nama Item', 'Qty', 'Harga'], value: [{ nama: '', qty: 1, harga: 0 }] },
        { id: 'diskon', label: 'Diskon (Rp)', type: 'number', value: 0 },
        { id: 'metode_bayar', label: 'Metode Pembayaran', type: 'select', options: ['Tunai', 'Transfer', 'QRIS', 'E-Wallet'], value: 'Tunai' },
        { id: 'bayar', label: 'Jumlah Bayar', type: 'number', value: 0 }
        ],
        aplikasi: [...common,
        { id: 'nama_pelanggan', label: 'Nama Pelanggan', type: 'text', value: '' },
        { id: 'nama_aplikasi', label: 'Nama Aplikasi', type: 'text', value: '' },
        { id: 'versi', label: 'Versi', type: 'text', value: '' },
        { id: 'lisensi', label: 'Tipe Lisensi', type: 'select', options: ['Personal', 'Business', 'Enterprise', 'Lifetime'], value: 'Personal' },
        { id: 'kode_lisensi', label: 'Kode Lisensi', type: 'text', value: '' },
        { id: 'harga', label: 'Harga', type: 'number', value: 0 },
        { id: 'metode_bayar', label: 'Metode Pembayaran', type: 'select', options: ['Tunai', 'Transfer', 'QRIS'], value: 'Tunai' }
        ],
        laptop: [...common,
        { id: 'nama_pelanggan', label: 'Nama Pelanggan', type: 'text', value: '' },
        { id: 'no_hp', label: 'No. HP Pelanggan', type: 'text', value: '' },
        { id: 'merk_laptop', label: 'Merk/Tipe Laptop', type: 'text', value: '' },
        { id: 'jenis_jasa', label: 'Jenis Jasa', type: 'select', options: ['Perbaikan Hardware', 'Instal Windows', 'Instal Software', 'Pemasangan Sparepart', 'Service Ringan', 'Service Berat'], value: 'Perbaikan Hardware' },
        { id: 'deskripsi', label: 'Deskripsi Pekerjaan', type: 'textarea', value: '' },
        { id: 'sparepart', label: 'Sparepart (jika ada)', type: 'text', value: '-' },
        { id: 'biaya_jasa', label: 'Biaya Jasa', type: 'number', value: 0 },
        { id: 'biaya_sparepart', label: 'Biaya Sparepart', type: 'number', value: 0 },
        { id: 'garansi', label: 'Garansi', type: 'text', value: '7 Hari' }
        ],
        listrik_pra: [...common,
        { id: 'id_pelanggan', label: 'ID Pelanggan / No. Meter', type: 'text', value: '' },
        { id: 'nama_pelanggan', label: 'Nama Pelanggan', type: 'text', value: '' },
        { id: 'tarif_daya', label: 'Tarif/Daya', type: 'text', value: 'R1/900VA' },
        { id: 'nominal', label: 'Nominal Token', type: 'number', value: 0 },
        { id: 'admin_fee', label: 'Biaya Admin', type: 'number', value: 2500 },
        { id: 'token', label: 'Token (20 Digit)', type: 'text', value: '' },
        { id: 'kwh', label: 'Jumlah kWh', type: 'text', value: '' }
        ],
        listrik_pasca: [...common,
        { id: 'id_pelanggan', label: 'ID Pelanggan', type: 'text', value: '' },
        { id: 'nama_pelanggan', label: 'Nama Pelanggan', type: 'text', value: '' },
        { id: 'tarif_daya', label: 'Tarif/Daya', type: 'text', value: 'R1/900VA' },
        { id: 'periode', label: 'Periode', type: 'text', value: '' },
        { id: 'stand_meter', label: 'Stand Meter', type: 'text', value: '' },
        { id: 'tagihan', label: 'Tagihan', type: 'number', value: 0 },
        { id: 'admin_fee', label: 'Biaya Admin', type: 'number', value: 2500 },
        { id: 'denda', label: 'Denda', type: 'number', value: 0 }
        ],
        transfer: [...common,
        { id: 'pengirim', label: 'Nama Pengirim', type: 'text', value: '' },
        { id: 'rek_pengirim', label: 'No. Rek Pengirim', type: 'text', value: '' },
        { id: 'bank_pengirim', label: 'Bank Pengirim', type: 'select', options: ['BRI', 'BNI', 'BCA', 'Mandiri', 'BSI', 'DANA', 'OVO', 'GoPay', 'ShopeePay', 'Lainnya'], value: 'BRI' },
        { id: 'penerima', label: 'Nama Penerima', type: 'text', value: '' },
        { id: 'rek_penerima', label: 'No. Rek Penerima', type: 'text', value: '' },
        { id: 'bank_penerima', label: 'Bank Tujuan', type: 'select', options: ['BRI', 'BNI', 'BCA', 'Mandiri', 'BSI', 'DANA', 'OVO', 'GoPay', 'ShopeePay', 'Lainnya'], value: 'BCA' },
        { id: 'nominal', label: 'Nominal Transfer', type: 'number', value: 0 },
        { id: 'admin_fee', label: 'Biaya Admin', type: 'number', value: 2500 },
        { id: 'berita', label: 'Berita Acara', type: 'text', value: '' }
        ],
        pulsa: [...common,
        { id: 'no_hp', label: 'Nomor HP', type: 'text', value: '' },
        { id: 'operator', label: 'Operator', type: 'select', options: ['Telkomsel', 'Indosat', 'XL', 'Tri', 'Smartfren', 'Axis'], value: 'Telkomsel' },
        { id: 'jenis', label: 'Jenis', type: 'select', options: ['Pulsa Reguler', 'Paket Data', 'Paket Nelpon', 'Paket SMS'], value: 'Pulsa Reguler' },
        { id: 'nominal', label: 'Nominal', type: 'number', value: 0 },
        { id: 'harga', label: 'Harga Jual', type: 'number', value: 0 },
        { id: 'sn', label: 'Serial Number (SN)', type: 'text', value: '' }
        ],
        internet: [...common,
        { id: 'id_pelanggan', label: 'ID Pelanggan', type: 'text', value: '' },
        { id: 'nama_pelanggan', label: 'Nama Pelanggan', type: 'text', value: '' },
        { id: 'provider', label: 'Provider', type: 'select', options: ['IndiHome', 'Biznet', 'MyRepublic', 'First Media', 'MNC Play', 'CBN', 'Lainnya'], value: 'IndiHome' },
        { id: 'paket', label: 'Paket', type: 'text', value: '' },
        { id: 'periode', label: 'Periode', type: 'text', value: '' },
        { id: 'tagihan', label: 'Tagihan', type: 'number', value: 0 },
        { id: 'admin_fee', label: 'Biaya Admin', type: 'number', value: 2500 }
        ],
        pdam: [...common,
        { id: 'id_pelanggan', label: 'ID Pelanggan', type: 'text', value: '' },
        { id: 'nama_pelanggan', label: 'Nama Pelanggan', type: 'text', value: '' },
        { id: 'alamat', label: 'Alamat', type: 'text', value: '' },
        { id: 'periode', label: 'Periode', type: 'text', value: '' },
        { id: 'stand_meter', label: 'Stand Meter (m³)', type: 'text', value: '' },
        { id: 'pemakaian', label: 'Pemakaian (m³)', type: 'text', value: '' },
        { id: 'tagihan', label: 'Tagihan', type: 'number', value: 0 },
        { id: 'admin_fee', label: 'Biaya Admin', type: 'number', value: 2500 },
        { id: 'denda', label: 'Denda', type: 'number', value: 0 }
        ],
        bpjs: [...common,
        { id: 'no_peserta', label: 'No. Peserta / VA', type: 'text', value: '' },
        { id: 'nama_pelanggan', label: 'Nama Peserta', type: 'text', value: '' },
        { id: 'segmen', label: 'Segmen', type: 'select', options: ['BPJS Kesehatan', 'BPJS Ketenagakerjaan'], value: 'BPJS Kesehatan' },
        { id: 'jumlah_peserta', label: 'Jumlah Peserta', type: 'number', value: 1 },
        { id: 'periode', label: 'Periode', type: 'text', value: '' },
        { id: 'premi', label: 'Premi/Iuran', type: 'number', value: 0 },
        { id: 'admin_fee', label: 'Biaya Admin', type: 'number', value: 2500 },
        { id: 'denda', label: 'Denda', type: 'number', value: 0 }
        ]
    };
    return fields[type] || [];
}

// Helper functions
function generateReceiptNo() {
    const d = new Date();
    return 'STR' + d.getFullYear().toString().slice(2) +
        pad(d.getMonth() + 1) + pad(d.getDate()) +
        pad(d.getHours()) + pad(d.getMinutes()) +
        pad(d.getSeconds());
}

function getCurrentDateTime() {
    const d = new Date();
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
        ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function pad(n) { return n.toString().padStart(2, '0'); }

function formatRupiah(n) {
    return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

// Render form fields
function renderFormFields(type) {
    const fields = getReceiptFields(type);
    let html = '';
    fields.forEach(f => {
        if (f.type === 'items') {
            html += renderItemsField(f);
            return;
        }
        html += `<div class="form-group">`;
        html += `<label for="field-${f.id}">${f.label}</label>`;
        if (f.type === 'select') {
            html += `<select id="field-${f.id}" onchange="updatePreview()">`;
            f.options.forEach(o => {
                html += `<option value="${o}" ${o === f.value ? 'selected' : ''}>${o}</option>`;
            });
            html += `</select>`;
        } else if (f.type === 'textarea') {
            html += `<textarea id="field-${f.id}" rows="3" oninput="updatePreview()" ${f.readonly ? 'readonly' : ''}>${f.value}</textarea>`;
        } else {
            html += `<input type="${f.type === 'number' ? 'number' : 'text'}" id="field-${f.id}" value="${f.value}" oninput="updatePreview()" ${f.readonly ? 'readonly' : ''}>`;
        }
        html += `</div>`;
    });
    return html;
}

function renderItemsField(f) {
    let html = `<div class="items-container">
        <div class="items-header">
            <h4><i class="fas fa-list"></i> ${f.label}</h4>
            <button type="button" class="btn-add-item" onclick="addItem()"><i class="fas fa-plus"></i> Tambah</button>
        </div>
        <div id="items-list">`;
    f.value.forEach((item, i) => {
        html += renderItemRow(i);
    });
    html += `</div></div>`;
    return html;
}

function renderItemRow(index) {
    return `<div class="item-row" data-index="${index}">
        <input type="text" placeholder="Nama item" oninput="updatePreview()" class="item-nama">
        <input type="number" placeholder="Qty" value="1" min="1" oninput="updatePreview()" class="item-qty">
        <input type="number" placeholder="Harga" value="0" oninput="updatePreview()" class="item-harga">
        <input type="number" placeholder="Subtotal" readonly class="item-subtotal" style="background:rgba(255,255,255,0.03);">
        <button type="button" class="btn-remove-item" onclick="removeItem(this)"><i class="fas fa-times"></i></button>
    </div>`;
}

function addItem() {
    const list = document.getElementById('items-list');
    const idx = list.children.length;
    list.insertAdjacentHTML('beforeend', renderItemRow(idx));
    updatePreview();
}

function removeItem(btn) {
    const list = document.getElementById('items-list');
    if (list.children.length > 1) {
        btn.closest('.item-row').remove();
        updatePreview();
    }
}

// Get form data
function getFormData() {
    const data = {};
    const fields = getReceiptFields(currentReceiptType);
    fields.forEach(f => {
        if (f.type === 'items') {
            data.items = [];
            document.querySelectorAll('.item-row').forEach(row => {
                const nama = row.querySelector('.item-nama')?.value || '';
                const qty = parseInt(row.querySelector('.item-qty')?.value) || 0;
                const harga = parseInt(row.querySelector('.item-harga')?.value) || 0;
                data.items.push({ nama, qty, harga, subtotal: qty * harga });
                const sub = row.querySelector('.item-subtotal');
                if (sub) sub.value = qty * harga;
            });
        } else {
            const el = document.getElementById('field-' + f.id);
            data[f.id] = el ? el.value : '';
        }
    });
    return data;
}

// Get store settings
function getStoreInfo() {
    return {
        name: localStorage.getItem('store_name') || 'KIOS DIGITAL',
        address: localStorage.getItem('store_address') || 'Jl. Contoh No. 123, Kota',
        phone: localStorage.getItem('store_phone') || '081234567890'
    };
}
