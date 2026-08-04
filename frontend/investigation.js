/ investigation.js - Module điều tra
let capaData = [];

// Khởi tạo khi chuyển sang tab Điều tra & CAPA
async function initInvestigationModule() {
  const container = document.getElementById("mainContent") || document.body;
  renderInvestigationLayout(container);
  await loadCapaData();
}

// Render khung giao diện Tailwind CSS
function renderInvestigationLayout(container) {
  container.innerHTML = `
    <div class="p-6 space-y-6 bg-slate-50 min-h-screen">
      
      <!-- HEADER & BUTTONS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i class="fa-solid fa-magnifying-glass-chart text-blue-600"></i>
            Điều Tra Sự Cố & Quản Lý CAPA
          </h2>
          <p class="text-xs text-slate-500 mt-1">Theo dõi hành động khắc phục & phòng ngừa sau sự cố lao động</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="exportToExcel()" class="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-2 transition cursor-pointer">
            <i class="fa-solid fa-file-excel text-emerald-600"></i> Xuất Excel
          </button>
          <button onclick="openCapaModal()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-plus"></i> Tạo Phiếu CAPA Mới
          </button>
        </div>
      </div>

      <!-- BỘ LỌC -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <input type="text" id="filterSearch" placeholder="Tìm mã CAPA, sự cố, người phụ trách..." onkeyup="filterCapaTable()" class="px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
        
        <select id="filterStatus" onchange="filterCapaTable()" class="px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="">Tất cả trạng thái</option>
          <option value="Đang thực hiện">Đang thực hiện</option>
          <option value="Hoàn thành">Hoàn thành</option>
          <option value="Quá hạn">Quá hạn</option>
        </select>

        <input type="date" id="filterDate" onchange="filterCapaTable()" class="px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">

        <button onclick="resetFilters()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition">
          Làm Mới Bộ Lọc
        </button>
      </div>

      <!-- KPI CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div class="text-xs font-semibold text-slate-500 uppercase">Tổng Vụ Điều Tra</div>
          <div class="text-2xl font-bold text-slate-800 mt-1" id="kpiTotal">0</div>
        </div>
        <div class="p-4 bg-amber-50/50 border border-amber-200 rounded-xl shadow-sm">
          <div class="text-xs font-semibold text-amber-700 uppercase">CAPA Đang Thực Hiện</div>
          <div class="text-2xl font-bold text-amber-600 mt-1" id="kpiInProgress">0</div>
        </div>
        <div class="p-4 bg-red-50/50 border border-red-200 rounded-xl shadow-sm">
          <div class="text-xs font-semibold text-red-700 uppercase">CAPA Quá Hạn</div>
          <div class="text-2xl font-bold text-red-600 mt-1" id="kpiOverdue">0</div>
        </div>
        <div class="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-sm">
          <div class="text-xs font-semibold text-emerald-700 uppercase">Tỷ Lệ Hoàn Thành</div>
          <div class="text-2xl font-bold text-emerald-600 mt-1" id="kpiRate">0%</div>
        </div>
      </div>

      <!-- TABLE CAPA -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left text-slate-600">
            <thead class="uppercase bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th class="px-4 py-3">Mã CAPA</th>
                <th class="px-4 py-3">Sự Cố Liên Quan</th>
                <th class="px-4 py-3">Nguyên Nhân Gốc Rễ</th>
                <th class="px-4 py-3">Hành Động Khắc Phục</th>
                <th class="px-4 py-3">Người Phụ Trách</th>
                <th class="px-4 py-3">Hạn Chót</th>
                <th class="px-4 py-3">Tiến Độ</th>
                <th class="px-4 py-3">Trạng Thái</th>
                <th class="px-4 py-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody id="capaTableBody" class="divide-y divide-slate-200">
              <tr><td colspan="9" class="px-4 py-6 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- TAILWIND MODAL TẠO / SỬA CAPA -->
    <div id="capaModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div class="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 id="capaModalTitle" class="font-bold text-slate-800 text-sm">Tạo Phiếu CAPA Mới</h3>
          <button type="button" onclick="closeCapaModal()" class="text-slate-400 hover:text-slate-600 text-sm">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form id="capaForm" onsubmit="saveCapa(event)" class="p-5 space-y-4">
          <input type="hidden" id="capaId">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Mã sự cố liên quan</label>
              <input type="text" id="accidentId" placeholder="VD: ACC-2026-001" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Người phụ trách *</label>
              <input type="text" id="assignee" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Nguyên nhân gốc rễ (Root Cause)</label>
            <textarea id="rootCause" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Hành động khắc phục / Phòng ngừa (CAPA) *</label>
            <textarea id="action" rows="2" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Hạn chót *</label>
              <input type="date" id="deadline" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Tiến độ (%)</label>
              <input type="number" id="progress" min="0" max="100" value="0" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Trạng thái</label>
              <select id="status" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
            </div>
          </div>
          <div class="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onclick="closeCapaModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition">Hủy</button>
            <button type="submit" id="saveCapaBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition">Lưu phiếu</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Load dữ liệu sử dụng chuẩn wrapper API.get()
async function loadCapaData() {
  try {
    const res = await API.get("getInvestigationData");
    if (res && res.status === "success") {
      capaData = res.data || [];
      renderCapaTable(capaData);
      updateKPIs(capaData);
    } else {
      capaData = [];
      renderCapaTable([]);
    }
  } catch (err) {
    console.error("Lỗi tải dữ liệu CAPA:", err);
  }
}

// Render dữ liệu ra bảng
function renderCapaTable(data) {
  const tbody = document.getElementById("capaTableBody");
  if (!tbody) return;
  const today = new Date().toISOString().split("T")[0];

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="px-4 py-6 text-center text-slate-400">Không có dữ liệu CAPA nào</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => {
    const isOverdue = item.deadline && item.deadline < today && item.status !== "Hoàn thành";

    let statusBadge = `<span class="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-600">${item.status}</span>`;
    if (item.status === "Hoàn thành") {
      statusBadge = `<span class="px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">Hoàn thành</span>`;
    } else if (isOverdue) {
      statusBadge = `<span class="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">Quá hạn</span>`;
    } else if (item.status === "Đang thực hiện") {
      statusBadge = `<span class="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700">Đang thực hiện</span>`;
    }

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-bold text-slate-800">${item.id}</td>
        <td class="px-4 py-3 font-medium text-blue-600">${item.accidentId || '-'}</td>
        <td class="px-4 py-3 max-w-xs truncate" title="${item.rootCause || ''}">${item.rootCause || '-'}</td>
        <td class="px-4 py-3 max-w-xs truncate" title="${item.action || ''}">${item.action || '-'}</td>
        <td class="px-4 py-3 font-medium">${item.assignee || '-'}</td>
        <td class="px-4 py-3 ${isOverdue ? 'text-red-600 font-bold' : ''}">${item.deadline || '-'}</td>
        <td class="px-4 py-3 min-w-[120px]">
          <div class="flex items-center gap-2">
            <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div class="h-1.5 rounded-full ${item.progress == 100 ? 'bg-emerald-500' : 'bg-blue-600'}" style="width: ${item.progress || 0}%"></div>
            </div>
            <span class="text-slate-500 font-medium">${item.progress || 0}%</span>
          </div>
        </td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-center">
          <button onclick="editCapa('${item.id}')" class="p-1 text-blue-600 hover:text-blue-800 transition">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Cập nhật các chỉ số KPI
function updateKPIs(data) {
  const today = new Date().toISOString().split("T")[0];
  const total = data.length;
  const inProgress = data.filter(i => i.status === "Đang thực hiện").length;
  const overdue = data.filter(i => i.deadline && i.deadline < today && i.status !== "Hoàn thành").length;
  const completed = data.filter(i => i.status === "Hoàn thành").length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = total;
  if (document.getElementById("kpiInProgress")) document.getElementById("kpiInProgress").innerText = inProgress;
  if (document.getElementById("kpiOverdue")) document.getElementById("kpiOverdue").innerText = overdue;
  if (document.getElementById("kpiRate")) document.getElementById("kpiRate").innerText = rate + "%";
}

// Bộ lọc danh sách CAPA
function filterCapaTable() {
  const search = document.getElementById("filterSearch").value.toLowerCase();
  const status = document.getElementById("filterStatus").value;
  const date = document.getElementById("filterDate").value;
  const today = new Date().toISOString().split("T")[0];

  const filtered = capaData.filter(item => {
    const matchesSearch = (item.id && item.id.toLowerCase().includes(search)) || 
                          (item.accidentId && item.accidentId.toLowerCase().includes(search)) ||
                          (item.assignee && item.assignee.toLowerCase().includes(search));

    let isOverdue = item.deadline && item.deadline < today && item.status !== "Hoàn thành";
    let matchesStatus = true;
    if (status === "Quá hạn") matchesStatus = isOverdue;
    else if (status) matchesStatus = item.status === status;

    let matchesDate = !date || item.deadline === date;

    return matchesSearch && matchesStatus && matchesDate;
  });

  renderCapaTable(filtered);
}

function resetFilters() {
  document.getElementById("filterSearch").value = "";
  document.getElementById("filterStatus").value = "";
  document.getElementById("filterDate").value = "";
  renderCapaTable(capaData);
}

// Quản lý Modal
function openCapaModal() {
  document.getElementById("capaForm").reset();
  document.getElementById("capaId").value = "";
  document.getElementById("capaModalTitle").innerText = "Tạo Phiếu CAPA Mới";
  document.getElementById("capaModal").classList.remove("hidden");
}

function closeCapaModal() {
  document.getElementById("capaModal").classList.add("hidden");
}

function editCapa(id) {
  const item = capaData.find(i => i.id === id);
  if (!item) return;

  document.getElementById("capaId").value = item.id;
  document.getElementById("accidentId").value = item.accidentId || "";
  document.getElementById("assignee").value = item.assignee || "";
  document.getElementById("rootCause").value = item.rootCause || "";
  document.getElementById("action").value = item.action || "";
  document.getElementById("deadline").value = item.deadline || "";
  document.getElementById("progress").value = item.progress || 0;
  document.getElementById("status").value = item.status || "Đang thực hiện";

  document.getElementById("capaModalTitle").innerText = `Chỉnh Sửa Phiếu CAPA (${item.id})`;
  document.getElementById("capaModal").classList.remove("hidden");
}

// Lưu dữ liệu CAPA sử dụng chuẩn wrapper API.post()
async function saveCapa(e) {
  if (e) e.preventDefault();
  const btn = document.getElementById("saveCapaBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Đang lưu...";
  }

  const payload = {
    id: document.getElementById("capaId").value,
    accidentId: document.getElementById("accidentId").value,
    assignee: document.getElementById("assignee").value,
    rootCause: document.getElementById("rootCause").value,
    action: document.getElementById("action").value,
    deadline: document.getElementById("deadline").value,
    progress: Number(document.getElementById("progress").value),
    status: document.getElementById("status").value
  };

  try {
    const res = await API.post("saveCapaData", payload);
    if (res && res.status === "success") {
      closeCapaModal();
      await loadCapaData();
    } else {
      alert("Lỗi khi lưu dữ liệu: " + (res.message || "Chưa rõ lý do"));
    }
  } catch (err) {
    console.error("Lỗi gửi dữ liệu CAPA:", err);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Lưu phiếu";
    }
  }
}

// Xuất Excel bằng SheetJS
function exportToExcel() {
  if (typeof XLSX === 'undefined') {
    alert("Thư viện SheetJS (XLSX) chưa được nạp!");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(capaData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_CAPA");
  XLSX.writeFile(wb, "Danh_sach_CAPA_EHS.xlsx");
}
