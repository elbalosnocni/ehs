// common.js - Cấu hình API kết nối Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec";

const API = {
  // Hàm GET dữ liệu
  async get(action, params = {}) {
    try {
      let url = new URL(API_URL);
      url.searchParams.append('action', action);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });
      return await response.json();
    } catch (error) {
      console.error(`[API GET Error - ${action}]:`, error);
      return { status: 'error', message: error.toString() };
    }
  },

  // Hàm POST dữ liệu
  async post(payload) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Tránh CORS preflight với GAS
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      return await response.json();
    } catch (error) {
      console.error(`[API POST Error]:`, error);
      return { status: 'error', message: error.toString() };
    }
  }
};
// Kiểm tra trạng thái Đăng nhập
const currentUser = JSON.parse(localStorage.getItem('user'));
if (!currentUser) {
  window.location.href = 'login.html';
}

// Bảng cấu hình Menu và Quyền truy cập
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard KPI', icon: 'fa-chart-pie', roles: ['Administrator', 'HR', 'HSE', 'Manager', 'Viewer'] },
  { id: 'accident', label: 'Hồ sơ Tai nạn', icon: 'fa-triangle-exclamation', roles: ['Administrator', 'HR', 'HSE', 'Manager', 'Viewer'] },
  { id: 'investigation', label: 'Điều tra & CAPA', icon: 'fa-magnifying-glass', roles: ['Administrator', 'HSE', 'Manager', 'Viewer'] },
  { id: 'employee', label: 'Người lao động', icon: 'fa-users', roles: ['Administrator', 'HR', 'HSE', 'Manager'] },
  { id: 'cost_bhxh', label: 'Chi phí & BHXH', icon: 'fa-file-invoice-dollar', roles: ['Administrator', 'HR', 'HSE'] },
  { id: 'report', label: 'Báo cáo', icon: 'fa-file-lines', roles: ['Administrator', 'HR', 'HSE', 'Manager', 'Viewer'] },
  { id: 'setting', label: 'Cấu hình hệ thống', icon: 'fa-gear', roles: ['Administrator'] }
];

document.addEventListener('DOMContentLoaded', () => {
  // Hiển thị thông tin User
  const nameEl = document.getElementById('userDisplayName');
  const roleEl = document.getElementById('userDisplayRole');
  if (nameEl) nameEl.innerText = currentUser.username;
  if (roleEl) roleEl.innerText = currentUser.role;

  // Render Sidebar Menu theo Role
  renderSidebar();

  // Mặc định nạp Dashboard
  loadModule('dashboard');
});

function renderSidebar() {
  const menuContainer = document.getElementById('sidebarMenu');
  if (!menuContainer) return;
  
  menuContainer.innerHTML = '';

  MENU_ITEMS.forEach(item => {
    // Chỉ hiển thị menu nếu Role người dùng có trong danh sách cho phép
    if (item.roles.includes(currentUser.role)) {
      const btn = document.createElement('button');
      btn.className = `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-left mb-1 menu-btn`;
      btn.id = `nav-${item.id}`;
      btn.onclick = () => loadModule(item.id);
      btn.innerHTML = `<i class="fa-solid ${item.icon} w-5"></i><span>${item.label}</span>`;
      menuContainer.appendChild(btn);
    }
  });
}

function loadModule(moduleId) {
  // 1. Tự động đóng Sidebar & Overlay khi chọn menu trên Mobile
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  
  if (sidebar) {
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');
  }
  if (overlay) {
    overlay.classList.add('hidden');
  }

  // 2. Highlight active menu
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
  const activeBtn = document.getElementById(`nav-${moduleId}`);
  if (activeBtn) activeBtn.classList.add('bg-blue-600', 'text-white');

  // 3. Đổi Title trang
  const activeMenu = MENU_ITEMS.find(m => m.id === moduleId);
  if (activeMenu) {
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.innerText = activeMenu.label;
  }

  // 4. Render màn hình tương ứng
  const container = document.getElementById('mainContainer');

  if (moduleId === 'dashboard') {
    if (typeof renderDashboardView === 'function') {
      renderDashboardView();
    } else if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
      DashboardModule.render(container);
    }
  } else if (moduleId === 'accident') {
    if (typeof renderAccidentView === 'function') {
      renderAccidentView();
    } else if (typeof AccidentModule !== 'undefined' && AccidentModule.render) {
      AccidentModule.render(container);
    }
  } else if (moduleId === 'employee') {
    // ➕ NẠP MÀN HÌNH NGƯỜI LAO ĐỘNG
    if (typeof EmployeeModule !== 'undefined' && EmployeeModule.render) {
      EmployeeModule.render(container);
    } else if (container) {
      container.innerHTML = `<div class="p-8 text-center text-red-500">Chưa nạp file employee.js hoặc EmployeeModule không tồn tại!</div>`;
    }
  } else {
    if (container) {
      container.innerHTML = `<div class="p-8 text-center text-slate-500">Màn hình <b>${activeMenu ? activeMenu.label : ''}</b> đang được phát triển...</div>`;
    }
  }
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
