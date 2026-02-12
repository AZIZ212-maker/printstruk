// ============================================
// AUTHENTICATION MODULE
// ============================================

// Login handler
async function handleLogin(email, password) {
    try {
        if (!isFirebaseConfigured()) {
            // Demo mode - allow login without Firebase
            showToast('Mode demo aktif (Firebase belum dikonfigurasi)', 'info');
            localStorage.setItem('demo_logged_in', 'true');
            localStorage.setItem('demo_email', email);
            showDashboard();
            return;
        }

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        showToast('Login berhasil! Selamat datang.', 'success');
        showDashboard();
    } catch (error) {
        let message = 'Login gagal.';
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'Email tidak ditemukan.';
                break;
            case 'auth/wrong-password':
                message = 'Password salah.';
                break;
            case 'auth/invalid-email':
                message = 'Format email tidak valid.';
                break;
            case 'auth/too-many-requests':
                message = 'Terlalu banyak percobaan. Coba lagi nanti.';
                break;
            default:
                message = error.message;
        }
        showToast(message, 'error');
    }
}

// Reset password handler
async function handleResetPassword(email) {
    try {
        if (!isFirebaseConfigured()) {
            showToast('Mode demo: Reset password tidak tersedia. Konfigurasi Firebase terlebih dahulu.', 'info');
            return;
        }

        await auth.sendPasswordResetEmail(email);
        showToast('Link reset password telah dikirim ke email Anda!', 'success');
        hideResetPassword();
    } catch (error) {
        let message = 'Gagal mengirim email reset.';
        if (error.code === 'auth/user-not-found') {
            message = 'Email tidak ditemukan.';
        }
        showToast(message, 'error');
    }
}

// Logout handler
async function handleLogout() {
    try {
        if (!isFirebaseConfigured()) {
            localStorage.removeItem('demo_logged_in');
            localStorage.removeItem('demo_email');
            showLoginPage();
            showToast('Berhasil keluar.', 'success');
            return;
        }

        await auth.signOut();
        showLoginPage();
        showToast('Berhasil keluar.', 'success');
    } catch (error) {
        showToast('Gagal keluar: ' + error.message, 'error');
    }
}

// Auth state observer
function initAuthObserver() {
    if (!isFirebaseConfigured()) {
        // Demo mode
        const isLoggedIn = localStorage.getItem('demo_logged_in');
        hideLoading();
        if (isLoggedIn) {
            showDashboard();
        } else {
            showLoginPage();
        }
        return;
    }

    auth.onAuthStateChanged(user => {
        hideLoading();
        if (user) {
            document.getElementById('nav-user-email').innerHTML =
                `<i class="fas fa-user-shield"></i> ${user.email}`;
            showDashboard();
        } else {
            showLoginPage();
        }
    });
}

// UI helpers for login
function showResetPassword() {
    document.getElementById('reset-password-section').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('forgot-password-link').style.display = 'none';
}

function hideResetPassword() {
    document.getElementById('reset-password-section').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('forgot-password-link').style.display = 'inline';
}

function togglePassword() {
    const input = document.getElementById('login-password');
    const icon = document.querySelector('.toggle-password i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
