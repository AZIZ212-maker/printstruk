# Print Struk - Aplikasi Cetak Struk Digital

Aplikasi web untuk mencetak berbagai macam struk/nota pembayaran digital.

## Fitur
- 🔐 Login admin dengan Firebase Authentication
- 🔑 Reset password via email
- 🧾 9 jenis struk yang bisa diedit dan dicetak
- 💾 Simpan data ke Firebase & Google Sheets
- 🖨️ Cetak struk format thermal 58mm/80mm
- 📱 Responsive - bisa diakses di HP & desktop
- 🎨 Tampilan modern dark gradient + glassmorphism

## Jenis Struk
1. Struk Kios (penjualan umum)
2. Struk Pembelian Aplikasi
3. Struk Jasa Perbaikan Laptop, Instal Windows & Sparepart
4. Struk Listrik Prabayar
5. Struk Listrik Pascabayar
6. Struk Transfer Dana
7. Struk Pembelian Pulsa
8. Struk Pembayaran Internet
9. Struk Pembayaran PDAM

## Setup Firebase
1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Buat project baru
3. Aktifkan **Authentication** → Sign-in method → Email/Password
4. Buat user admin di Authentication → Users → Add User
5. Aktifkan **Realtime Database** → Create Database → Start in test mode
6. Copy konfigurasi Firebase dan paste ke `js/firebase-config.js`

## Setup Google Sheets
1. Buka [script.google.com](https://script.google.com)
2. Buat project baru
3. Buat Google Spreadsheet baru, buka Apps Script dari menu Extensions
4. Paste kode template dari `js/sheets.js` (variabel `APPS_SCRIPT_TEMPLATE`)
5. Deploy → New Deployment → Web App → Anyone can access
6. Copy URL dan paste di Pengaturan aplikasi

## Deploy ke GitHub Pages
1. Buat repository baru di GitHub
2. Push semua file ke repository
3. Settings → Pages → Source: Deploy from branch → main → / (root)
4. Akses di `https://username.github.io/nama-repo/`

## Mode Demo
Jika Firebase belum dikonfigurasi, aplikasi otomatis berjalan dalam mode demo.
Login dengan email & password apapun untuk masuk.
