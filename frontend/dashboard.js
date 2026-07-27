async function renderDashboardView() {
  const container = document.getElementById('mainContainer');
  
  // Loading state
  container.innerHTML = `<div class="text-center py-10 text-slate-500"><i class="fa-solid fa-spinner fa-spin text-2xl"></i><p class="mt-2">Đang tải dữ liệu Dashboard...</p></div>`;

  // Gọi API Dashboard
  const res = await API.get('getDashboard');
  const data = res.kpi || { totalEmployee: 0, totalAccident: 0, lostDays: 0, frequencyRate: 0, severityRate: 0 };

  container.innerHTML = `
    <!-- KPIs GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div class="text-slate-500 text-xs font-semibold uppercase">Tổng Lao Động</div>
        <div class="text-2xl font-bold text-slate-800 mt-1">${data.totalEmployee}</div>
      </div>
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div class="text-slate-500 text-xs font-semibold uppercase">Số vụ Tai Nạn</div>
        <div class="text-2xl font-bold text-red-600 mt-1">${data.totalAccident}</div>
      </div>
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div class="text-slate-500 text-xs font-semibold uppercase">Ngày nghỉ (Lost Days)</div>
        <div class="text-2xl font-bold text-amber-600 mt-1">${data.lostDays}</div>
      </div>
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div class="text-slate-500 text-xs font-semibold uppercase">Tần Suất (FR)</div>
        <div class="text-2xl font-bold text-blue-600 mt-1">${data.frequencyRate}</div>
      </div>
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div class="text-slate-500 text-xs font-semibold uppercase">Mức Độ (SR)</div>
        <div class="text-2xl font-bold text-purple-600 mt-1">${data.severityRate}</div>
      </div>
    </div>

    <!-- CHARTS GRID -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 class="font-bold text-slate-700 mb-4">Tai nạn theo Tháng</h3>
        <canvas id="monthlyChart" class="max-h-64"></canvas>
      </div>
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 class="font-bold text-slate-700 mb-4">Phân bố theo Nguyên nhân</h3>
        <canvas id="causeChart" class="max-h-64"></canvas>
      </div>
    </div>
  `;

  // Khởi tạo Chart.js mẫu
  initCharts();
}

function initCharts() {
  const ctx1 = document.getElementById('monthlyChart')?.getContext('2d');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        datasets: [{ label: 'Số vụ', data: [0, 1, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0], backgroundColor: '#3b82f6' }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const ctx2 = document.getElementById('causeChart')?.getContext('2d');
  if (ctx2) {
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Thao tác sai', 'Thiếu BOHL', 'Thiết bị lỗi', 'Môi trường'],
        datasets: [{ data: [40, 25, 20, 15], backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}
