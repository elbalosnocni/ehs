async function renderDashboardView() {
  const container = document.getElementById('mainContainer');
  
  // Loading state
  container.innerHTML = `
    <div class="text-center py-10 text-slate-500">
      <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
      <p class="mt-2">Đang tải dữ liệu Dashboard...</p>
    </div>`;

  try {
    // Gọi API Dashboard
    const res = await API.get('getDashboard');
    
    // Đảm bảo dữ liệu mặc định nếu API chưa trả đủ thông tin
    const data = res || {};
    const kpi = data.kpi || { totalEmployee: 0, totalAccident: 0, lostDays: 0, frequencyRate: 0, severityRate: 0 };
    const chartsData = data.charts || {};

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
        
        <!-- 1. Tai nạn theo Tháng -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-calendar-days text-blue-500 mr-2"></i>Tai nạn theo Tháng</h3>
          <canvas id="monthlyChart" class="max-h-64"></canvas>
        </div>

        <!-- 2. Thống kê theo Bộ phận / Xưởng (BoPhan) -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-sitemap text-indigo-500 mr-2"></i>Tai nạn theo Bộ Phận / Xưởng</h3>
          <canvas id="departmentChart" class="max-h-64"></canvas>
        </div>

        <!-- 3. Phân bố theo Nguyên nhân (NguyenNhan) -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-brain text-amber-500 mr-2"></i>Phân bố theo Nguyên Nhân</h3>
          <canvas id="causeChart" class="max-h-64"></canvas>
        </div>

        <!-- 4. Yếu tố chấn thương (YeuToChanThuong) -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-user-ninja text-red-500 mr-2"></i>Yếu Tố Chấn Thương</h3>
          <canvas id="injuryFactorChart" class="max-h-64"></canvas>
        </div>

        <!-- 5. Trạng thái tiến độ (TrangThai) -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-list-check text-emerald-500 mr-2"></i>Trạng Thái Tiến Độ Điều Tra</h3>
          <canvas id="statusChart" class="max-h-48"></canvas>
        </div>

      </div>
    `;

    // Khởi tạo các biểu đồ với dữ liệu thực/mặc định
    initCharts(chartsData);

  } catch (error) {
    console.error('Lỗi khi tải Dashboard:', error);
    container.innerHTML = `<div class="p-4 text-center text-red-500 bg-red-50 rounded-lg">Không thể tải dữ liệu Dashboard. Vui lòng thử lại sau!</div>`;
  }
}

function initCharts(chartsData = {}) {
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

  // 1. Chart Tháng (Mặc định 12 tháng)
  const ctx1 = document.getElementById('monthlyChart')?.getContext('2d');
  if (ctx1) {
    const monthlyLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const monthlyValues = chartsData.monthly || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: monthlyLabels,
        datasets: [{ label: 'Số vụ', data: monthlyValues, backgroundColor: '#3b82f6' }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 2. Chart Bộ phận
  const ctxDept = document.getElementById('departmentChart')?.getContext('2d');
  if (ctxDept) {
    const deptLabels = chartsData.department?.labels || ['Xưởng Cơ Khí', 'Xưởng 1', 'Xưởng 2', 'Kho NVL'];
    const deptValues = chartsData.department?.data || [0, 0, 0, 0];

    new Chart(ctxDept, {
      type: 'bar',
      data: {
        labels: deptLabels,
        datasets: [{ label: 'Số vụ', data: deptValues, backgroundColor: '#6366f1' }]
      },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
    });
  }

  // 3. Chart Nguyên nhân
  const ctx2 = document.getElementById('causeChart')?.getContext('2d');
  if (ctx2) {
    const causeLabels = chartsData.cause?.labels || ['Do người SDLĐ', 'Do NLĐ', 'Khách quan khó tránh'];
    const causeValues = chartsData.cause?.data || [0, 0, 0];

    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: causeLabels,
        datasets: [{ data: causeValues, backgroundColor: ['#ef4444', '#f59e0b', '#10b981'] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 4. Chart Yếu tố chấn thương
  const ctxFactor = document.getElementById('injuryFactorChart')?.getContext('2d');
  if (ctxFactor) {
    const factorLabels = chartsData.injuryFactor?.labels || ['Thiết bị áp lực', 'Thiết bị nâng', 'Vật rơi, đổ, sập'];
    const factorValues = chartsData.injuryFactor?.data || [0, 0, 0];

    new Chart(ctxFactor, {
      type: 'pie',
      data: {
        labels: factorLabels,
        datasets: [{ data: factorValues, backgroundColor: colors }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 5. Chart Trạng thái điều tra
  const ctxStatus = document.getElementById('statusChart')?.getContext('2d');
  if (ctxStatus) {
    const statusLabels = chartsData.status?.labels || ['Chưa điều tra', 'Chờ BHXH', 'Hoàn tất'];
    const statusValues = chartsData.status?.data || [0, 0, 0];

    new Chart(ctxStatus, {
      type: 'bar',
      data: {
        labels: statusLabels,
        datasets: [{ label: 'Số lượng hồ sơ', data: statusValues, backgroundColor: ['#f87171', '#fbbf24', '#34d399'] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}
