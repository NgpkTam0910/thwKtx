/**
 * DORMEX MAIN SCRIPT
 * Tiện ích giao diện: Toast, Modal, Format, Authentication guard
 */

// HIỂN THỊ TOAST THÔNG BÁO
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'danger') iconClass = 'fa-circle-exclamation';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}" style="font-size: 1.25rem;"></i>
        <div style="flex: 1; font-weight: 500; font-size: 0.92rem;">${message}</div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: #94a3b8;">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(30px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ĐỊNH DẠNG TIỀN TỆ VNĐ
function formatMoney(amount) {
    if (!amount) return '0 ₫';
    return Number(amount).toLocaleString('vi-VN') + ' ₫';
}

// QUẢN LÝ MODAL POPUP
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// KIỂM TRA ĐĂNG NHẬP & PHÂN QUYỀN
function checkAuth(requiredRole = null) {
    const user = DormexDB.getCurrentUser();
    const currentPath = window.location.pathname;

    if (!user) {
        if (currentPath.includes('/admin/') || currentPath.includes('/pages/')) {
            window.location.href = '../login.html';
        }
        return null;
    }

    if (requiredRole && user.role !== requiredRole) {
        if (user.role === 'admin') {
            window.location.href = '../admin/index.html';
        } else {
            window.location.href = '../pages/home.html';
        }
        return null;
    }

    // Hiển thị tên người dùng nếu có phần tử hiển thị
    const nameEls = document.querySelectorAll('.user-display-name');
    nameEls.forEach(el => el.textContent = user.full_name);

    const roleEls = document.querySelectorAll('.user-display-role');
    roleEls.forEach(el => el.textContent = user.role === 'admin' ? 'Quản Trị Viên' : 'Sinh Viên KTX');

    return user;
}

// TOGGLE MOBILE MENU
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    // Đóng modal khi click ra ngoài overlay
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});

