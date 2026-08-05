let capaData = [];

// Khởi tạo khi chuyển sang tab Điều tra & CAPA
async function initInvestigationModule() {
  renderInvestigationLayout();
  await loadCapaData();
}

// Render khung giao diện
function renderInvestigationLayout() {
  const mainContent = document.getElementById("main-content") || document.body;
  mainContent.innerHTML = `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="fw-bold mb-0">Điều tra sự cố & Quản lý CAPA</h4>
        <div>
          <button class="btn btn-outline-success me-2" onclick="exportToExcel()">Xuất Excel</button>
          <button class="btn btn-primary" onclick="openCapaModal()">+ Tạo phiếu CAPA mới</button>
        </div>
      </div>
      <!-- Bộ lọc -->
      <div class="row g-2 mb-4">
        <div class="col-md-4">
          <input type="text" id="filterSearch" class="form-control" placeholder="Tìm mã CAPA, sự cố, người phụ trách..." onkeyup="filterCapaTable()">
        </div>
        <div class="col-md-3">
          <select id="filterStatus" class="form-select" onchange="filterCapaTable()">
            <option value="">Tất cả trạng thái</option>
            <option value="Đang thực hiện">Đang thực hiện</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Quá hạn">Quá hạn</option>
          </select>
        </div>
        <div class="col-md-3">
          <input type="date" id="filterDate" class="form-control" onchange="filterCapaTable()">
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-secondary w-100" onclick="resetFilters()">Làm mới</button>
        </div>
      </div>
      <!-- KPI Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3">
            <div class="text-muted small">Tổng vụ điều tra</div>
            <div class="fs-4 fw-bold text-dark" id="kpiTotal">0</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 border-start border-warning border-4">
            <div class="text-muted small">CAPA Đang thực hiện</div>
            <div class="fs-4 fw-bold text-warning" id="kpiInProgress">0</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 border-start border-danger border-4">
            <div class="text-muted small">CAPA Quá hạn</div>
            <div class="fs-4 fw-bold text-danger" id="kpiOverdue">0</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm p-3 border-start border-success border-4">
            <div class="text-muted small">Tỷ lệ hoàn thành</div>
            <div class="fs-4 fw-bold text-success" id="kpiRate">0%</div>
          </div>
        </div>
      </div>
      <!-- Table CAPA -->
      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Mã CAPA</th>
                  <th>Sự cố liên quan</th>
                  <th>Nguyên nhân gốc rễ</th>
                  <th>Hành động khắc phục</th>
                  <th>Người phụ trách</th>
                  <th>Hạn chót</th>
                  <th>Tiến độ</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody id="capaTableBody">
                <tr><td colspan="9" class="text-center py-4">Đang tải dữ liệu...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal Tạo / Chỉnh sửa CAPA -->
    <div class="modal fade" id="capaModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="capaModalTitle">Tạo phiếu CAPA mới</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="capaForm">
              <input type="hidden" id="capaId">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Mã sự cố liên quan</label>
                  <input type="text" class="form-control" id="accidentId" placeholder="VD: ACC-2026-001">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Người phụ trách</label>
                  <input type="text" class="form-control" id="assignee" required>
                </div>
                <div class="col-12">
                  <label class="form-label">Nguyên nhân gốc rễ (Root Cause)</label>
                  <textarea class="form-control" id="rootCause" rows="2"></textarea>
                </div>
                <div class="col-12">
                  <label class="form-label">Hành động khắc phục / Phòng ngừa (CAPA)</label>
                  <textarea class="form-control" id="action" rows="2" required></textarea>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Hạn chót (Deadline)</label>
                  <input type="date" class="form-control" id="deadline" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Tiến độ (%)</label>
                  <input type="number" class="form-control" id="progress" min="0" max="100" value="0">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Trạng thái</label>
                  <select class="form-select" id="status">
                    <option value="Đang thực hiện">Đang thực hiện</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
            <button type="button" class="btn btn-primary" onclick="saveCapa()">Lưu phiếu</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Load dữ liệu từ Apps Script
async function loadCapaData() {
  try {
    const res = await fetchApi({ action: "getInvestigationData" });
    if (res && res.status === "success") {
      capaData = res.data || [];
      renderCapaTable(capaData);
      updateKPIs(capaData);
    }
  } catch (err) {
    console.error("Lỗi tải dữ liệu CAPA:", err);
  }
}

// Render dữ liệu ra bảng
function renderCapaTable(data) {
  const tbody = document.getElementById("capaTableBody");
  const today = new Date().toISOString().split("T")[0];

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Không có dữ liệu CAPA nào</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => {
    const isOverdue = item.deadline && item.deadline < today && item.status !== "Hoàn thành";

    let statusBadge = `<span class="badge bg-secondary">${item.status}</span>`;
    if (item.status === "Hoàn thành") statusBadge = `<span class="badge bg-success">Hoàn thành</span>`;
    else if (isOverdue) statusBadge = `<span class="badge bg-danger">Quá hạn</span>`;
    else if (item.status === "Đang thực hiện") statusBadge = `<span class="badge bg-warning text-dark">Đang thực hiện</span>`;

    return `
      <tr>
        <td><strong>${item.id}</strong></td>
        <td>${item.accidentId || '-'}</td>
        <td><small>${item.rootCause || '-'}</small></td>
        <td><small>${item.action || '-'}</small></td>
        <td>${item.assignee || '-'}</td>
        <td><span class="${isOverdue ? 'text-danger fw-bold' : ''}">${item.deadline || '-'}</span></td>
        <td style="min-width: 100px;">
          <div class="d-flex align-items-center gap-2">
            <div class="progress flex-grow-1" style="height:6px;">
              <div class="progress-bar ${item.progress == 100 ? 'bg-success' : 'bg-primary'}" style="width: ${item.progress}%"></div>
            </div>
            <small class="text-muted">${item.progress || 0}%</small>
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editCapa('${item.id}')">Sửa</button>
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

  document.getElementById("kpiTotal").innerText = total;
  document.getElementById("kpiInProgress").innerText = inProgress;
  document.getElementById("kpiOverdue").innerText = overdue;
  document.getElementById("kpiRate").innerText = rate + "%";
}

// Bộ lọc nâng cao
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

    let matchesDate = true;
    if (date) matchesDate = item.deadline === date;

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

// Modal Mở/Sửa
function openCapaModal() {
  document.getElementById("capaForm").reset();
  document.getElementById("capaId").value = "";
  document.getElementById("capaModalTitle").innerText = "Tạo phiếu CAPA mới";
  new bootstrap.Modal(document.getElementById("capaModal")).show();
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

  document.getElementById("capaModalTitle").innerText = "Chỉnh sửa phiếu CAPA";
  new bootstrap.Modal(document.getElementById("capaModal")).show();
}

// Lưu dữ liệu CAPA (Thêm mới hoặc Cập nhật)
async function saveCapa() {
  const payload = {
    action: "saveCapaData",
    data: {
      id: document.getElementById("capaId").value,
      accidentId: document.getElementById("accidentId").value,
      assignee: document.getElementById("assignee").value,
      rootCause: document.getElementById("rootCause").value,
      action: document.getElementById("action").value,
      deadline: document.getElementById("deadline").value,
      progress: Number(document.getElementById("progress").value),
      status: document.getElementById("status").value
    }
  };

  try {
    const res = await fetchApi(payload);
    if (res.status === "success") {
      bootstrap.Modal.getInstance(document.getElementById("capaModal")).hide();
      await loadCapaData();
    } else {
      alert("Lỗi khi lưu dữ liệu: " + (res.message || "Chưa rõ lý do"));
    }
  } catch (err) {
    console.error("Lỗi gửi dữ liệu:", err);
  }
}
