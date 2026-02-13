// ============================================
// BLUETOOTH THERMAL PRINTER MODULE
// ESC/POS Commands for 58mm/80mm Thermal Printer
// ============================================

let bluetoothDevice = null;
let bluetoothCharacteristic = null;
let isBluetoothConnected = false;

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

const ESCPOS = {
    INIT: [ESC, 0x40],                    // Initialize printer
    ALIGN_CENTER: [ESC, 0x61, 0x01],      // Center align
    ALIGN_LEFT: [ESC, 0x61, 0x00],        // Left align
    ALIGN_RIGHT: [ESC, 0x61, 0x02],       // Right align
    BOLD_ON: [ESC, 0x45, 0x01],           // Bold on
    BOLD_OFF: [ESC, 0x45, 0x00],          // Bold off
    DOUBLE_SIZE: [GS, 0x21, 0x11],        // Double width+height
    NORMAL_SIZE: [GS, 0x21, 0x00],        // Normal size
    UNDERLINE_ON: [ESC, 0x2D, 0x01],      // Underline on
    UNDERLINE_OFF: [ESC, 0x2D, 0x00],     // Underline off
    CUT_PAPER: [GS, 0x56, 0x00],          // Full cut
    FEED_LINE: [LF],                       // Line feed
    FEED_3: [ESC, 0x64, 0x03],            // Feed 3 lines
    FEED_5: [ESC, 0x64, 0x05],            // Feed 5 lines
};

// ---- Bluetooth Connection ----
async function connectBluetoothPrinter() {
    try {
        showToast('Mencari printer Bluetooth...', 'info');

        // Request Bluetooth device - filter for common thermal printer services
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer
                '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Serial Port
                '0000ff00-0000-1000-8000-00805f9b34fb', // Another common one
                'e7810a71-73ae-499d-8c15-faa9aef0c3f2'  // Generic
            ]
        });

        showToast('Menghubungkan ke ' + bluetoothDevice.name + '...', 'info');

        const server = await bluetoothDevice.gatt.connect();
        const services = await server.getPrimaryServices();

        // Find writable characteristic
        for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                    bluetoothCharacteristic = char;
                    break;
                }
            }
            if (bluetoothCharacteristic) break;
        }

        if (!bluetoothCharacteristic) {
            throw new Error('Tidak ditemukan karakteristik printer yang bisa ditulis');
        }

        isBluetoothConnected = true;
        updateBluetoothUI();
        showToast('Terhubung ke printer: ' + bluetoothDevice.name, 'success');

        // Listen for disconnect
        bluetoothDevice.addEventListener('gattserverdisconnected', () => {
            isBluetoothConnected = false;
            bluetoothCharacteristic = null;
            updateBluetoothUI();
            showToast('Printer terputus', 'error');
        });

    } catch (error) {
        if (error.name === 'NotFoundError') {
            showToast('Tidak ada printer yang dipilih', 'info');
        } else {
            showToast('Gagal koneksi: ' + error.message, 'error');
            console.error('Bluetooth error:', error);
        }
    }
}

async function disconnectBluetoothPrinter() {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
    }
    isBluetoothConnected = false;
    bluetoothCharacteristic = null;
    updateBluetoothUI();
    showToast('Printer diputuskan', 'info');
}

// ---- Send Data to Printer ----
async function sendToPrinter(data) {
    if (!bluetoothCharacteristic) {
        throw new Error('Printer tidak terhubung');
    }

    // Split into chunks of 100 bytes (BLE has MTU limit)
    const CHUNK_SIZE = 100;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        if (bluetoothCharacteristic.properties.writeWithoutResponse) {
            await bluetoothCharacteristic.writeValueWithoutResponse(chunk);
        } else {
            await bluetoothCharacteristic.writeValue(chunk);
        }
        // Small delay between chunks
        await new Promise(r => setTimeout(r, 50));
    }
}

// ---- Text to Bytes Helper ----
function textToBytes(text) {
    const encoder = new TextEncoder();
    return encoder.encode(text);
}

function combineBytes(...arrays) {
    let totalLength = 0;
    arrays.forEach(arr => {
        totalLength += arr instanceof Uint8Array ? arr.length : arr.length;
    });
    const result = new Uint8Array(totalLength);
    let offset = 0;
    arrays.forEach(arr => {
        const uint8 = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
        result.set(uint8, offset);
        offset += uint8.length;
    });
    return result;
}

// ---- Print Receipt via Bluetooth ----
async function printBluetoothReceipt() {
    if (!isBluetoothConnected) {
        showToast('Hubungkan printer Bluetooth terlebih dahulu!', 'error');
        return;
    }

    try {
        showToast('Mencetak struk...', 'info');
        const data = getFormData();
        const store = getStoreInfo();
        const receiptBytes = buildReceiptBytes(currentReceiptType, data, store);
        await sendToPrinter(receiptBytes);
        showToast('Struk berhasil dicetak!', 'success');
    } catch (error) {
        showToast('Gagal cetak: ' + error.message, 'error');
        console.error('Print error:', error);
    }
}

// ---- Build Receipt as ESC/POS Bytes ----
function buildReceiptBytes(type, d, store) {
    let bytes = combineBytes(
        new Uint8Array(ESCPOS.INIT),
        // Header - Store Name
        new Uint8Array(ESCPOS.ALIGN_CENTER),
        new Uint8Array(ESCPOS.BOLD_ON),
        new Uint8Array(ESCPOS.DOUBLE_SIZE),
        textToBytes(store.name),
        new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.NORMAL_SIZE),
        new Uint8Array(ESCPOS.BOLD_OFF),
        textToBytes(store.address),
        new Uint8Array(ESCPOS.FEED_LINE),
        textToBytes('Telp: ' + store.phone),
        new Uint8Array(ESCPOS.FEED_LINE),
        // Divider
        textToBytes('================================'),
        new Uint8Array(ESCPOS.FEED_LINE),
        // Receipt title
        new Uint8Array(ESCPOS.BOLD_ON),
        textToBytes(RECEIPT_TYPES.find(r => r.id === type)?.title || 'STRUK'),
        new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.BOLD_OFF),
        textToBytes('================================'),
        new Uint8Array(ESCPOS.FEED_LINE),
        // No Struk & Date
        new Uint8Array(ESCPOS.ALIGN_LEFT),
        textToBytes('No: ' + (d.no_struk || '-')),
        new Uint8Array(ESCPOS.FEED_LINE),
        textToBytes('Tgl: ' + (d.tanggal || '-')),
        new Uint8Array(ESCPOS.FEED_LINE),
        textToBytes('--------------------------------'),
        new Uint8Array(ESCPOS.FEED_LINE)
    );

    // Type-specific content
    bytes = combineBytes(bytes, buildTypeBytes(type, d));

    // Footer
    bytes = combineBytes(bytes,
        textToBytes('--------------------------------'),
        new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.ALIGN_CENTER),
        new Uint8Array(ESCPOS.BOLD_ON),
        textToBytes('Terima Kasih!'),
        new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.BOLD_OFF),
        textToBytes('Simpan struk sebagai bukti'),
        new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.FEED_5),
        new Uint8Array(ESCPOS.CUT_PAPER)
    );

    return bytes;
}

function printRow(label, value) {
    const maxWidth = 32;
    const gap = maxWidth - label.length - value.length;
    const spaces = gap > 0 ? ' '.repeat(gap) : ' ';
    return combineBytes(
        textToBytes(label + spaces + value),
        new Uint8Array(ESCPOS.FEED_LINE)
    );
}

function printDivider() {
    return combineBytes(
        textToBytes('--------------------------------'),
        new Uint8Array(ESCPOS.FEED_LINE)
    );
}

function printTotalRow(label, value) {
    return combineBytes(
        new Uint8Array(ESCPOS.BOLD_ON),
        printRow(label, value),
        new Uint8Array(ESCPOS.BOLD_OFF)
    );
}

function fmtRp(n) {
    return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

// ---- Type-specific byte builders ----
function buildTypeBytes(type, d) {
    switch (type) {
        case 'kios': return buildKiosBytes(d);
        case 'aplikasi': return buildAplikasiBytes(d);
        case 'laptop': return buildLaptopBytes(d);
        case 'listrik_pra': return buildListrikPraBytes(d);
        case 'listrik_pasca': return buildListrikPascaBytes(d);
        case 'transfer': return buildTransferBytes(d);
        case 'pulsa': return buildPulsaBytes(d);
        case 'internet': return buildInternetBytes(d);
        case 'pdam': return buildPdamBytes(d);
        case 'bpjs': return buildBpjsBytes(d);
        default: return new Uint8Array([]);
    }
}

function buildKiosBytes(d) {
    let b = new Uint8Array([]);
    if (d.nama_pelanggan) b = combineBytes(b, printRow('Pelanggan', d.nama_pelanggan), printDivider());
    let total = 0;
    (d.items || []).forEach(item => {
        const sub = item.qty * item.harga;
        total += sub;
        b = combineBytes(b,
            textToBytes(item.nama || '-'), new Uint8Array(ESCPOS.FEED_LINE),
            printRow('  ' + item.qty + ' x ' + fmtRp(item.harga), fmtRp(sub))
        );
    });
    const diskon = parseInt(d.diskon) || 0;
    const grand = total - diskon;
    const bayar = parseInt(d.bayar) || 0;
    b = combineBytes(b, printDivider(), printRow('Subtotal', fmtRp(total)));
    if (diskon > 0) b = combineBytes(b, printRow('Diskon', '-' + fmtRp(diskon)));
    b = combineBytes(b, printTotalRow('TOTAL', fmtRp(grand)), printDivider(),
        printRow('Bayar (' + (d.metode_bayar || 'Tunai') + ')', fmtRp(bayar)),
        printRow('Kembali', fmtRp(Math.max(0, bayar - grand)))
    );
    return b;
}

function buildAplikasiBytes(d) {
    return combineBytes(
        printRow('Pelanggan', d.nama_pelanggan || '-'), printDivider(),
        printRow('Aplikasi', d.nama_aplikasi || '-'),
        printRow('Versi', d.versi || '-'),
        printRow('Lisensi', d.lisensi || '-'),
        printRow('Kode', d.kode_lisensi || '-'), printDivider(),
        printTotalRow('TOTAL', fmtRp(d.harga)),
        printRow('Bayar', d.metode_bayar || 'Tunai')
    );
}

function buildLaptopBytes(d) {
    const jasa = parseInt(d.biaya_jasa) || 0;
    const sp = parseInt(d.biaya_sparepart) || 0;
    return combineBytes(
        printRow('Pelanggan', d.nama_pelanggan || '-'),
        printRow('No. HP', d.no_hp || '-'),
        printRow('Laptop', d.merk_laptop || '-'), printDivider(),
        printRow('Jasa', d.jenis_jasa || '-'),
        printRow('Deskripsi', d.deskripsi || '-'),
        printRow('Sparepart', d.sparepart || '-'), printDivider(),
        printRow('Biaya Jasa', fmtRp(jasa)),
        printRow('Biaya Part', fmtRp(sp)),
        printTotalRow('TOTAL', fmtRp(jasa + sp)), printDivider(),
        printRow('Garansi', d.garansi || '-')
    );
}

function buildListrikPraBytes(d) {
    const nom = parseInt(d.nominal) || 0;
    const adm = parseInt(d.admin_fee) || 0;
    return combineBytes(
        printRow('ID Pel', d.id_pelanggan || '-'),
        printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Tarif/Daya', d.tarif_daya || '-'), printDivider(),
        new Uint8Array(ESCPOS.ALIGN_CENTER), new Uint8Array(ESCPOS.BOLD_ON),
        textToBytes(d.token || '--------------------'), new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.BOLD_OFF), new Uint8Array(ESCPOS.ALIGN_LEFT),
        printRow('kWh', d.kwh || '-'), printDivider(),
        printRow('Nominal', fmtRp(nom)),
        printRow('Admin', fmtRp(adm)),
        printTotalRow('TOTAL', fmtRp(nom + adm))
    );
}

function buildListrikPascaBytes(d) {
    const tag = parseInt(d.tagihan) || 0, adm = parseInt(d.admin_fee) || 0, den = parseInt(d.denda) || 0;
    let b = combineBytes(
        printRow('ID Pel', d.id_pelanggan || '-'), printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Tarif/Daya', d.tarif_daya || '-'), printRow('Periode', d.periode || '-'),
        printRow('Stand Meter', d.stand_meter || '-'), printDivider(),
        printRow('Tagihan', fmtRp(tag)), printRow('Admin', fmtRp(adm))
    );
    if (den > 0) b = combineBytes(b, printRow('Denda', fmtRp(den)));
    return combineBytes(b, printTotalRow('TOTAL', fmtRp(tag + adm + den)));
}

function buildTransferBytes(d) {
    const nom = parseInt(d.nominal) || 0, adm = parseInt(d.admin_fee) || 0;
    let b = combineBytes(
        printRow('Pengirim', d.pengirim || '-'), printRow('Rek Asal', d.rek_pengirim || '-'),
        printRow('Bank', d.bank_pengirim || '-'), printDivider(),
        printRow('Penerima', d.penerima || '-'), printRow('Rek Tujuan', d.rek_penerima || '-'),
        printRow('Bank Tujuan', d.bank_penerima || '-')
    );
    if (d.berita) b = combineBytes(b, printRow('Berita', d.berita));
    return combineBytes(b, printDivider(), printRow('Nominal', fmtRp(nom)), printRow('Admin', fmtRp(adm)),
        printTotalRow('TOTAL', fmtRp(nom + adm)));
}

function buildPulsaBytes(d) {
    const nom = parseInt(d.nominal) || 0, hrg = parseInt(d.harga) || 0;
    return combineBytes(
        printRow('No. HP', d.no_hp || '-'), printRow('Operator', d.operator || '-'),
        printRow('Jenis', d.jenis || '-'), printDivider(),
        printRow('Nominal', fmtRp(nom)), printRow('SN', d.sn || '-'),
        printTotalRow('HARGA', fmtRp(hrg))
    );
}

function buildInternetBytes(d) {
    const tag = parseInt(d.tagihan) || 0, adm = parseInt(d.admin_fee) || 0;
    return combineBytes(
        printRow('ID Pel', d.id_pelanggan || '-'), printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Provider', d.provider || '-'), printRow('Paket', d.paket || '-'),
        printRow('Periode', d.periode || '-'), printDivider(),
        printRow('Tagihan', fmtRp(tag)), printRow('Admin', fmtRp(adm)),
        printTotalRow('TOTAL', fmtRp(tag + adm))
    );
}

function buildPdamBytes(d) {
    const tag = parseInt(d.tagihan) || 0, adm = parseInt(d.admin_fee) || 0, den = parseInt(d.denda) || 0;
    let b = combineBytes(
        printRow('ID Pel', d.id_pelanggan || '-'), printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Alamat', d.alamat || '-'), printRow('Periode', d.periode || '-'), printDivider(),
        printRow('Stand Meter', (d.stand_meter || '-') + ' m3'),
        printRow('Pemakaian', (d.pemakaian || '-') + ' m3'),
        printRow('Tagihan', fmtRp(tag)), printRow('Admin', fmtRp(adm))
    );
    if (den > 0) b = combineBytes(b, printRow('Denda', fmtRp(den)));
    return combineBytes(b, printTotalRow('TOTAL', fmtRp(tag + adm + den)));
}

function buildBpjsBytes(d) {
    const premi = parseInt(d.premi) || 0, adm = parseInt(d.admin_fee) || 0, den = parseInt(d.denda) || 0;
    let b = combineBytes(
        printRow('No. Peserta', d.no_peserta || '-'), printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Segmen', d.segmen || '-'), printRow('Jml Peserta', d.jumlah_peserta || '1'),
        printRow('Periode', d.periode || '-'), printDivider(),
        printRow('Premi/Iuran', fmtRp(premi)), printRow('Admin', fmtRp(adm))
    );
    if (den > 0) b = combineBytes(b, printRow('Denda', fmtRp(den)));
    return combineBytes(b, printTotalRow('TOTAL', fmtRp(premi + adm + den)));
}

// ---- UI Update ----
function updateBluetoothUI() {
    const statusEl = document.getElementById('bt-status');
    const connectBtn = document.getElementById('bt-connect-btn');
    const printBtBtn = document.getElementById('bt-print-btn');

    if (statusEl) {
        if (isBluetoothConnected) {
            statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:var(--accent-4)"></i> ' + (bluetoothDevice?.name || 'Printer');
            statusEl.className = 'bt-status connected';
        } else {
            statusEl.innerHTML = '<i class="fas fa-times-circle" style="color:var(--accent-3)"></i> Tidak terhubung';
            statusEl.className = 'bt-status disconnected';
        }
    }
    if (connectBtn) {
        connectBtn.innerHTML = isBluetoothConnected
            ? '<i class="fas fa-unlink"></i> Putuskan'
            : '<i class="fab fa-bluetooth-b"></i> Hubungkan Printer';
        connectBtn.onclick = isBluetoothConnected ? disconnectBluetoothPrinter : connectBluetoothPrinter;
    }
    if (printBtBtn) {
        printBtBtn.disabled = !isBluetoothConnected;
        printBtBtn.style.opacity = isBluetoothConnected ? '1' : '0.4';
    }
}
