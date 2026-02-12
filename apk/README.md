# Membuat APK dari GitHub (Otomatis)

## Cara Build APK via GitHub Actions

File `.github/workflows/build-apk.yml` sudah disiapkan. APK akan otomatis di-build setiap kali Anda push ke branch `main`.

### Langkah-langkah:

1. **Buat repository baru** di [github.com](https://github.com/new)
   - Nama: `print-struk-app`
   - Public

2. **Push semua file** ke repository:
   ```bash
   cd print-struk-app
   git init
   git add .
   git commit -m "Initial commit - Print Struk App"
   git branch -M main
   git remote add origin https://github.com/USERNAME/print-struk-app.git
   git push -u origin main
   ```

3. **Tunggu build selesai** (± 3-5 menit):
   - Buka repo di GitHub → klik tab **Actions**
   - Klik workflow **"Build APK"** yang sedang berjalan
   - Tunggu sampai ✅ hijau (selesai)

4. **Download APK**:
   - Klik workflow yang sudah selesai
   - Scroll ke bawah ke bagian **Artifacts**
   - Klik **print-struk-apk** untuk download file ZIP
   - Extract ZIP → dapatkan file `app-debug.apk`
   - Transfer ke HP → Install

### Build Ulang (Manual)
Kalau mau build ulang tanpa push kode baru:
- GitHub → Actions → Build APK → **Run workflow** → Run

### Aktifkan GitHub Pages (untuk web)
- GitHub → Settings → Pages → Source: **Deploy from branch** → **main** → **/ (root)** → Save
- Akses di: `https://USERNAME.github.io/print-struk-app/`

---

## Cara Alternatif (Online, Tanpa Coding)

### WebIntoApp.com
1. Buka [webintoapp.com](https://webintoapp.com)
2. Masukkan URL GitHub Pages Anda
3. Atur nama app & icon
4. Download APK
