// ============================================
// BLUETOOTH THERMAL PRINTER MODULE
// ESC/POS Commands for 58mm/80mm Thermal Printer
// Supports: Cordova Plugin (APK) + Web Bluetooth (Browser)
// ============================================

let bluetoothDevice = null;
let bluetoothCharacteristic = null;
let isBluetoothConnected = false;
let connectedDeviceId = null;
let isCordovaApp = false;

// Detect if running in Cordova
document.addEventListener('deviceready', function () {
    isCordovaApp = true;
    console.log('Cordova detected - using Bluetooth Serial Plugin');
}, false);

// Also check after a short delay
setTimeout(() => {
    if (window.cordova || window.bluetoothSerial) {
        isCordovaApp = true;
    }
}, 1000);

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

const ESCPOS = {
    INIT: [ESC, 0x40],
    ALIGN_CENTER: [ESC, 0x61, 0x01],
    ALIGN_LEFT: [ESC, 0x61, 0x00],
    ALIGN_RIGHT: [ESC, 0x61, 0x02],
    BOLD_ON: [ESC, 0x45, 0x01],
    BOLD_OFF: [ESC, 0x45, 0x00],
    DOUBLE_SIZE: [GS, 0x21, 0x11],
    NORMAL_SIZE: [GS, 0x21, 0x00],
    UNDERLINE_ON: [ESC, 0x2D, 0x01],
    UNDERLINE_OFF: [ESC, 0x2D, 0x00],
    CUT_PAPER: [GS, 0x56, 0x00],
    FEED_LINE: [LF],
    FEED_3: [ESC, 0x64, 0x03],
    FEED_5: [ESC, 0x64, 0x05],
};

// ============================================
// CONNECTION - Auto-detect Cordova vs Web
// ============================================
async function connectBluetoothPrinter() {
    if (isCordovaApp || window.bluetoothSerial) {
        await connectCordovaBluetooth();
    } else if (navigator.bluetooth) {
        await connectWebBluetooth();
    } else {
        showToast('Bluetooth tidak didukung di perangkat ini', 'error');
    }
}

async function disconnectBluetoothPrinter() {
    if (isCordovaApp || window.bluetoothSerial) {
        disconnectCordovaBluetooth();
    } else {
        disconnectWebBluetooth();
    }
}

// ============================================
// CORDOVA BLUETOOTH (untuk APK)
// ============================================
async function connectCordovaBluetooth() {
    if (!window.bluetoothSerial) {
        showToast('Plugin Bluetooth belum tersedia. Pastikan menggunakan APK terbaru.', 'error');
        return;
    }

    showToast('Mencari printer Bluetooth...', 'info');

    // Check if Bluetooth is enabled
    bluetoothSerial.isEnabled(
        function () {
            // Bluetooth is enabled, list paired devices
            bluetoothSerial.list(
                function (devices) {
                    if (devices.length === 0) {
                        showToast('Tidak ada perangkat Bluetooth yang dipasangkan. Pair printer di Pengaturan HP dulu.', 'error');
                        return;
                    }
                    // Show device picker
                    showDevicePicker(devices);
                },
                function (error) {
                    showToast('Gagal mendapatkan daftar perangkat: ' + error, 'error');
                }
            );
        },
        function () {
            showToast('Bluetooth belum aktif. Aktifkan Bluetooth terlebih dahulu.', 'error');
            // Try to enable Bluetooth
            if (bluetoothSerial.enable) {
                bluetoothSerial.enable(
                    function () {
                        showToast('Bluetooth diaktifkan. Coba hubungkan lagi.', 'info');
                    },
                    function () {
                        showToast('Gagal mengaktifkan Bluetooth', 'error');
                    }
                );
            }
        }
    );
}

function showDevicePicker(devices) {
    // Create a simple device picker modal
    let html = '<div class="bt-device-list">';
    html += '<h4 style="margin-bottom:12px;color:var(--text-secondary)">Pilih Printer:</h4>';
    devices.forEach((dev, i) => {
        const name = dev.name || 'Unknown Device';
        const icon = name.toLowerCase().includes('print') ? 'fa-print' : 'fa-bluetooth-b';
        html += `<div class="bt-device-item" onclick="connectToDevice('${dev.address}', '${name}')">
            <i class="fas ${icon}"></i>
            <div>
                <div class="bt-device-name">${name}</div>
                <div class="bt-device-addr">${dev.address}</div>
            </div>
        </div>`;
    });
    html += '</div>';

    // Show in a modal
    const modal = document.getElementById('settings-modal');
    const content = modal.querySelector('.modal-content');
    const originalHTML = content.innerHTML;

    content.innerHTML = `
        <div class="modal-header">
            <h3><i class="fab fa-bluetooth-b"></i> Perangkat Bluetooth</h3>
            <button class="modal-close" onclick="closeDevicePicker()">&times;</button>
        </div>
        <div class="modal-body">${html}</div>
    `;
    content._originalHTML = originalHTML;
    modal.style.display = 'flex';
}

function closeDevicePicker() {
    const modal = document.getElementById('settings-modal');
    const content = modal.querySelector('.modal-content');
    if (content._originalHTML) {
        content.innerHTML = content._originalHTML;
        delete content._originalHTML;
    }
    modal.style.display = 'none';
}

function connectToDevice(address, name) {
    closeDevicePicker();
    showToast('Menghubungkan ke ' + name + '...', 'info');

    bluetoothSerial.connect(
        address,
        function () {
            isBluetoothConnected = true;
            connectedDeviceId = address;
            bluetoothDevice = { name: name };
            updateBluetoothUI();
            showToast('Terhubung ke printer: ' + name, 'success');
        },
        function (error) {
            showToast('Gagal koneksi: ' + error, 'error');
        }
    );
}

function disconnectCordovaBluetooth() {
    if (window.bluetoothSerial) {
        bluetoothSerial.disconnect(
            function () {
                isBluetoothConnected = false;
                connectedDeviceId = null;
                updateBluetoothUI();
                showToast('Printer diputuskan', 'info');
            },
            function (error) {
                showToast('Gagal memutuskan: ' + error, 'error');
            }
        );
    }
}

// Send data via Cordova Bluetooth Serial
async function sendViaCordova(data) {
    return new Promise((resolve, reject) => {
        // Convert Uint8Array to ArrayBuffer
        const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        bluetoothSerial.write(
            buffer,
            function () { resolve(); },
            function (error) { reject(new Error(error)); }
        );
    });
}

// ============================================
// WEB BLUETOOTH (untuk Browser/Chrome)
// ============================================
async function connectWebBluetooth() {
    try {
        showToast('Mencari printer Bluetooth...', 'info');

        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                '000018f0-0000-1000-8000-00805f9b34fb',
                '49535343-fe7d-4ae5-8fa9-9fafd205e455',
                '0000ff00-0000-1000-8000-00805f9b34fb',
                'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
            ]
        });

        showToast('Menghubungkan ke ' + bluetoothDevice.name + '...', 'info');

        const server = await bluetoothDevice.gatt.connect();
        const services = await server.getPrimaryServices();

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
            throw new Error('Tidak ditemukan karakteristik printer');
        }

        isBluetoothConnected = true;
        updateBluetoothUI();
        showToast('Terhubung ke printer: ' + bluetoothDevice.name, 'success');

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
        }
    }
}

function disconnectWebBluetooth() {
    if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
    }
    isBluetoothConnected = false;
    bluetoothCharacteristic = null;
    updateBluetoothUI();
    showToast('Printer diputuskan', 'info');
}

// Send data via Web Bluetooth (chunked)
async function sendViaWebBluetooth(data) {
    const CHUNK_SIZE = 100;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        if (bluetoothCharacteristic.properties.writeWithoutResponse) {
            await bluetoothCharacteristic.writeValueWithoutResponse(chunk);
        } else {
            await bluetoothCharacteristic.writeValue(chunk);
        }
        await new Promise(r => setTimeout(r, 50));
    }
}

// ============================================
// SEND TO PRINTER (auto-detect method)
// ============================================
async function sendToPrinter(data) {
    if (isCordovaApp || window.bluetoothSerial) {
        await sendViaCordova(data);
    } else if (bluetoothCharacteristic) {
        await sendViaWebBluetooth(data);
    } else {
        throw new Error('Printer tidak terhubung');
    }
}

// ============================================
// PRINT RECEIPT
// ============================================
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
    }
}

// ============================================
// ESC/POS RECEIPT BUILDER
// ============================================
function textToBytes(text) {
    const encoder = new TextEncoder();
    return encoder.encode(text);
}

function combineBytes(...arrays) {
    let totalLength = 0;
    arrays.forEach(arr => totalLength += arr instanceof Uint8Array ? arr.length : arr.length);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    arrays.forEach(arr => {
        const uint8 = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
        result.set(uint8, offset);
        offset += uint8.length;
    });
    return result;
}

function buildReceiptBytes(type, d, store) {
    let bytes = combineBytes(
        new Uint8Array(ESCPOS.INIT),
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
        textToBytes('================================'),
        new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.BOLD_ON),
        textToBytes(RECEIPT_TYPES.find(r => r.id === type)?.title || 'STRUK'),
        new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.BOLD_OFF),
        textToBytes('================================'),
        new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.ALIGN_LEFT),
        textToBytes('No: ' + (d.no_struk || '-')),
        new Uint8Array(ESCPOS.FEED_LINE),
        textToBytes('Tgl: ' + (d.tanggal || '-')),
        new Uint8Array(ESCPOS.FEED_LINE),
        textToBytes('--------------------------------'),
        new Uint8Array(ESCPOS.FEED_LINE)
    );

    bytes = combineBytes(bytes, buildTypeBytes(type, d));

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
    return combineBytes(textToBytes(label + spaces + value), new Uint8Array(ESCPOS.FEED_LINE));
}

function printDivider() {
    return combineBytes(textToBytes('--------------------------------'), new Uint8Array(ESCPOS.FEED_LINE));
}

function printTotalRow(label, value) {
    return combineBytes(new Uint8Array(ESCPOS.BOLD_ON), printRow(label, value), new Uint8Array(ESCPOS.BOLD_OFF));
}

function fmtRp(n) {
    return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

// ============================================
// TYPE-SPECIFIC BUILDERS
// ============================================
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
        b = combineBytes(b, textToBytes(item.nama || '-'), new Uint8Array(ESCPOS.FEED_LINE),
            printRow('  ' + item.qty + ' x ' + fmtRp(item.harga), fmtRp(sub)));
    });
    const diskon = parseInt(d.diskon) || 0, grand = total - diskon, bayar = parseInt(d.bayar) || 0;
    b = combineBytes(b, printDivider(), printRow('Subtotal', fmtRp(total)));
    if (diskon > 0) b = combineBytes(b, printRow('Diskon', '-' + fmtRp(diskon)));
    return combineBytes(b, printTotalRow('TOTAL', fmtRp(grand)), printDivider(),
        printRow('Bayar (' + (d.metode_bayar || 'Tunai') + ')', fmtRp(bayar)),
        printRow('Kembali', fmtRp(Math.max(0, bayar - grand))));
}

function buildAplikasiBytes(d) {
    return combineBytes(printRow('Pelanggan', d.nama_pelanggan || '-'), printDivider(),
        printRow('Aplikasi', d.nama_aplikasi || '-'), printRow('Versi', d.versi || '-'),
        printRow('Lisensi', d.lisensi || '-'), printRow('Kode', d.kode_lisensi || '-'), printDivider(),
        printTotalRow('TOTAL', fmtRp(d.harga)), printRow('Bayar', d.metode_bayar || 'Tunai'));
}

function buildLaptopBytes(d) {
    const jasa = parseInt(d.biaya_jasa) || 0, sp = parseInt(d.biaya_sparepart) || 0;
    return combineBytes(printRow('Pelanggan', d.nama_pelanggan || '-'), printRow('No. HP', d.no_hp || '-'),
        printRow('Laptop', d.merk_laptop || '-'), printDivider(), printRow('Jasa', d.jenis_jasa || '-'),
        printRow('Deskripsi', d.deskripsi || '-'), printRow('Sparepart', d.sparepart || '-'), printDivider(),
        printRow('Biaya Jasa', fmtRp(jasa)), printRow('Biaya Part', fmtRp(sp)),
        printTotalRow('TOTAL', fmtRp(jasa + sp)), printDivider(), printRow('Garansi', d.garansi || '-'));
}

function buildListrikPraBytes(d) {
    const nom = parseInt(d.nominal) || 0, adm = parseInt(d.admin_fee) || 0;
    return combineBytes(printRow('ID Pel', d.id_pelanggan || '-'), printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Tarif/Daya', d.tarif_daya || '-'), printDivider(),
        new Uint8Array(ESCPOS.ALIGN_CENTER), new Uint8Array(ESCPOS.BOLD_ON),
        textToBytes(d.token || '--------------------'), new Uint8Array(ESCPOS.FEED_LINE),
        new Uint8Array(ESCPOS.BOLD_OFF), new Uint8Array(ESCPOS.ALIGN_LEFT),
        printRow('kWh', d.kwh || '-'), printDivider(),
        printRow('Nominal', fmtRp(nom)), printRow('Admin', fmtRp(adm)),
        printTotalRow('TOTAL', fmtRp(nom + adm)));
}

function buildListrikPascaBytes(d) {
    const tag = parseInt(d.tagihan) || 0, adm = parseInt(d.admin_fee) || 0, den = parseInt(d.denda) || 0;
    let b = combineBytes(printRow('ID Pel', d.id_pelanggan || '-'), printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Tarif/Daya', d.tarif_daya || '-'), printRow('Periode', d.periode || '-'),
        printRow('Stand Meter', d.stand_meter || '-'), printDivider(),
        printRow('Tagihan', fmtRp(tag)), printRow('Admin', fmtRp(adm)));
    if (den > 0) b = combineBytes(b, printRow('Denda', fmtRp(den)));
    return combineBytes(b, printTotalRow('TOTAL', fmtRp(tag + adm + den)));
}

function buildTransferBytes(d) {
    const nom = parseInt(d.nominal) || 0, adm = parseInt(d.admin_fee) || 0;
    let b = combineBytes(printRow('Pengirim', d.pengirim || '-'), printRow('Rek Asal', d.rek_pengirim || '-'),
        printRow('Bank', d.bank_pengirim || '-'), printDivider(),
        printRow('Penerima', d.penerima || '-'), printRow('Rek Tujuan', d.rek_penerima || '-'),
        printRow('Bank Tujuan', d.bank_penerima || '-'));
    if (d.berita) b = combineBytes(b, printRow('Berita', d.berita));
    return combineBytes(b, printDivider(), printRow('Nominal', fmtRp(nom)), printRow('Admin', fmtRp(adm)),
        printTotalRow('TOTAL', fmtRp(nom + adm)));
}

function buildPulsaBytes(d) {
    const nom = parseInt(d.nominal) || 0, hrg = parseInt(d.harga) || 0;
    return combineBytes(printRow('No. HP', d.no_hp || '-'), printRow('Operator', d.operator || '-'),
        printRow('Jenis', d.jenis || '-'), printDivider(),
        printRow('Nominal', fmtRp(nom)), printRow('SN', d.sn || '-'),
        printTotalRow('HARGA', fmtRp(hrg)));
}

function buildInternetBytes(d) {
    const tag = parseInt(d.tagihan) || 0, adm = parseInt(d.admin_fee) || 0;
    return combineBytes(printRow('ID Pel', d.id_pelanggan || '-'), printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Provider', d.provider || '-'), printRow('Paket', d.paket || '-'),
        printRow('Periode', d.periode || '-'), printDivider(),
        printRow('Tagihan', fmtRp(tag)), printRow('Admin', fmtRp(adm)),
        printTotalRow('TOTAL', fmtRp(tag + adm)));
}

function buildPdamBytes(d) {
    const tag = parseInt(d.tagihan) || 0, adm = parseInt(d.admin_fee) || 0, den = parseInt(d.denda) || 0;
    let b = combineBytes(printRow('ID Pel', d.id_pelanggan || '-'), printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Alamat', d.alamat || '-'), printRow('Periode', d.periode || '-'), printDivider(),
        printRow('Stand Meter', (d.stand_meter || '-') + ' m3'), printRow('Pemakaian', (d.pemakaian || '-') + ' m3'),
        printRow('Tagihan', fmtRp(tag)), printRow('Admin', fmtRp(adm)));
    if (den > 0) b = combineBytes(b, printRow('Denda', fmtRp(den)));
    return combineBytes(b, printTotalRow('TOTAL', fmtRp(tag + adm + den)));
}

function buildBpjsBytes(d) {
    const premi = parseInt(d.premi) || 0, adm = parseInt(d.admin_fee) || 0, den = parseInt(d.denda) || 0;
    let b = combineBytes(printRow('No. Peserta', d.no_peserta || '-'), printRow('Nama', d.nama_pelanggan || '-'),
        printRow('Segmen', d.segmen || '-'), printRow('Jml Peserta', d.jumlah_peserta || '1'),
        printRow('Periode', d.periode || '-'), printDivider(),
        printRow('Premi/Iuran', fmtRp(premi)), printRow('Admin', fmtRp(adm)));
    if (den > 0) b = combineBytes(b, printRow('Denda', fmtRp(den)));
    return combineBytes(b, printTotalRow('TOTAL', fmtRp(premi + adm + den)));
}

// ============================================
// UI UPDATE
// ============================================
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
