// Biến lưu trữ instance của Chart để tránh lỗi vẽ đè (Canvas is already in use)
const chartInstances = {};

async function renderDashboardView() {
  const container = document.getElementById('mainContainer');
  if (!container) return;

  // 1. Loading State
  container.innerHTML = `
    <div class="text-center py-12 text-slate-500">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i>
      <p class="mt-3 font-medium">Đang tải và tổng hợp dữ liệu Dashboard...</p>
    </div>`;

  try {
    // 2. Lấy dữ liệu từ API (Tự động fallback nếu không có API getDashboard)
    let kpi = { totalEmployee: 0, totalAccident: 0, lostDays: 0, frequencyRate: 0, severityRate: 0 };
    let chartsData = {};

    // Gọi song song 2 API cơ bản để tự tính (Đảm bảo luôn có dữ liệu thực tế)
    const [accRes, empRes] = await Promise.all([
      API.get('getAccidents').catch(() => null),
      API.get('getEmployees').catch(() => null)
    ]);

    const accidents = (accRes && accRes.data) ? accRes.data : (Array.isArray(accRes) ? accRes : []);
    const employees = (empRes && empRes.data) ? empRes.data : (Array.isArray(empRes) ? empRes : []);

    // Tính toán KPI
    kpi.totalEmployee = employees.length;
    kpi.totalAccident = accidents.length;

    kpi.lostDays = accidents.reduce((sum, item) => {
      const days = parseInt(item.LostDays || item['Số Ngày Nghỉ'] || item.lostDays || 0);
      return sum + (isNaN(days) ? 0 : days);
    }, 0);

    const totalWorkingHours = kpi.totalEmployee > 0 ? (kpi.totalEmployee * 2000) : 1;
    kpi.frequencyRate = ((kpi.totalAccident * 1000000) / totalWorkingHours).toFixed(2);
    kpi.severityRate = ((kpi.lostDays * 1000000) / totalWorkingHours).toFixed(2);

    // Gom nhóm dữ liệu cho Charts
    const monthlyValues = Array(12).fill(0);
    const deptMap = {};
    const causeMap = {};
    const factorMap = {};
    const statusMap = {};

    accidents.forEach(item => {
      // a. Theo tháng
      const dateStr = item.IncidentDate || item.incidentDate || item['Thời Gian'] || item['Ngày xảy ra'];
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          monthlyValues[d.getMonth()] += 1;
        }
      }

      // b. Theo Bộ phận
      const dept = item.BoPhan || item.boPhan || item['Bộ Phận'] || 'Chưa phân loại';
      deptMap[dept] = (deptMap[dept] || 0) + 1;

      // c. Theo Nguyên nhân
      const cause = item.NguyenNhan || item.nguyenNhan || item['Nguyên Nhân'] || 'Chưa xác định';
      causeMap[cause] = (causeMap[cause] || 0) + 1;

      // d. Theo Yếu tố chấn thương
      const factor = item.YeuToChanThuong || item.yeuToChanThuong || item['Yếu Tố Chấn Thương'] || 'Khác';
      factorMap[factor] = (factorMap[factor] || 0) + 1;

      // e. Theo Trạng thái
      const status = item.TrangThai || item.status || item['Trạng Thái'] || 'Chưa điều tra';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    chartsData = {
      monthly: monthlyValues,
      department: { labels: Object.keys(deptMap), data: Object.values(deptMap) },
      cause: { labels: Object.keys(causeMap), data: Object.values(causeMap) },
      injuryFactor: { labels: Object.keys(factorMap), data: Object.values(factorMap) },
      status: { labels: Object.keys(statusMap), data: Object.values(statusMap) }
    };

    // 3. Render HTML UI
    container.innerHTML = `
      <!-- KPIs GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div class="text-slate-500 text-xs font-semibold uppercase">Tổng Lao Động</div>
          <div class="text-2xl font-bold text-slate-800 mt-1">${kpi.totalEmployee}</div>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div class="text-slate-500 text-xs font-semibold uppercase">Số vụ Tai Nạn</div>
          <div class="text-2xl font-bold text-red-600 mt-1">${kpi.totalAccident}</div>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div class="text-slate-500 text-xs font-semibold uppercase">Ngày nghỉ (Lost Days)</div>
          <div class="text-2xl font-bold text-amber-600 mt-1">${kpi.lostDays}</div>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div class="text-slate-500 text-xs font-semibold uppercase">Tần Suất (FR)</div>
          <div class="text-2xl font-bold text-blue-600 mt-1">${kpi.frequencyRate}</div>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div class="text-slate-500 text-xs font-semibold uppercase">Mức Độ (SR)</div>
          <div class="text-2xl font-bold text-purple-600 mt-1">${kpi.severityRate}</div>
        </div>
      </div>

      <!-- CHARTS GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-calendar-days text-blue-500 mr-2"></i>Tai nạn theo Tháng</h3>
          <div class="relative h-64"><canvas id="monthlyChart"></canvas></div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-sitemap text-indigo-500 mr-2"></i>Tai nạn theo Bộ Phận / Xưởng</h3>
          <div class="relative h-64"><canvas id="departmentChart"></canvas></div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-brain text-amber-500 mr-2"></i>Phân bố theo Nguyên Nhân</h3>
          <div class="relative h-64"><canvas id="causeChart"></canvas></div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-user-ninja text-red-500 mr-2"></i>Yếu Tố Chấn Thương</h3>
          <div class="relative h-64"><canvas id="injuryFactorChart"></canvas></div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-list-check text-emerald-500 mr-2"></i>Trạng Thái Tiến Độ Điều Tra</h3>
          <div class="relative h-48"><canvas id="statusChart"></canvas></div>
        </div>
      </div>
    `;

    // 4. Khởi tạo Biểu đồ
    initCharts(chartsData);

  } catch (error) {
    console.error('Lỗi khi tải Dashboard:', error);
    container.innerHTML = `<div class="p-4 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">Không thể tải dữ liệu Dashboard. Vui lòng thử lại sau!</div>`;
  }
}

function createOrUpdateChart(canvasId, config) {
  // Hủy instance cũ nếu đã tồn tại để tránh lỗi Canvas
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (ctx) {
    chartInstances[canvasId] = new Chart(ctx, config);
  }
}

function initCharts(chartsData = {}) {
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

  // 1. Chart Tháng
  createOrUpdateChart('monthlyChart', {
    type: 'bar',
    data: {
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      datasets: [{ label: 'Số vụ', data: chartsData.monthly || Array(12).fill(0), backgroundColor: '#3b82f6' }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // 2. Chart Bộ phận
  const deptLabels = chartsData.department?.labels?.length ? chartsData.department.labels : ['Chưa có dữ liệu'];
  const deptData = chartsData.department?.data?.length ? chartsData.department.data : [0];
  createOrUpdateChart('departmentChart', {
    type: 'bar',
    data: {
      labels: deptLabels,
      datasets: [{ label: 'Số vụ', data: deptData, backgroundColor: '#6366f1' }]
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
  });

  // 3. Chart Nguyên nhân
  const causeLabels = chartsData.cause?.labels?.length ? chartsData.cause.labels : ['Chưa có dữ liệu'];
  const causeData = chartsData.cause?.data?.length ? chartsData.cause.data : [0];
  createOrUpdateChart('causeChart', {
    type: 'doughnut',
    data: {
      labels: causeLabels,
      datasets: [{ data: causeData, backgroundColor: colors }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // 4. Chart Yếu tố chấn thương
  const factorLabels = chartsData.injuryFactor?.labels?.length ? chartsData.injuryFactor.labels : ['Chưa có dữ liệu'];
  const factorData = chartsData.injuryFactor?.data?.length ? chartsData.injuryFactor.data : [0];
  createOrUpdateChart('injuryFactorChart', {
    type: 'pie',
    data: {
      labels: factorLabels,
      datasets: [{ data: factorData, backgroundColor: colors }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // 5. Chart Trạng thái
  const statusLabels = chartsData.status?.labels?.length ? chartsData.status.labels : ['Chưa có dữ liệu'];
  const statusData = chartsData.status?.data?.length ? chartsData.status.data : [0];
  createOrUpdateChart('statusChart', {
    type: 'bar',
    data: {
      labels: statusLabels,
      datasets: [{ label: 'Số lượng hồ sơ', data: statusData, backgroundColor: '#34d399' }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}
