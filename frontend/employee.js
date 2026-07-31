// employee.js - Module Quản lý Người Lao Động & Upload Excel
const EmployeeModule = {
  // 1. Render giao diện chính vào mainContainer
  render(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-users text-blue-600"></i>
              Danh Sách Người Lao Động
            </h2>
            <p class="text-xs text-slate-500 mt-1">Đồng bộ dữ liệu trực tiếp với Google Sheet tab EMPLOYEE</p>
          </div>
          
          <!-- Nút Tải File Excel Mẫu -->
          <button onclick="EmployeeModule.downloadTemplate()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center gap-2 transition w-fit cursor-pointer">
            <i class="fa-solid fa-download text-slate-500"></i>
            Tải File Excel Mẫu
          </button>
        </div>

        <!-- KHU VỰC UPLOAD EXCEL -->
        <div class="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-3 w-full sm:w-auto">
            <i class="fa-solid fa-file-excel text-emerald-600 text-3xl"></i>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Chọn File Excel Danh Sách Nhân Viên</label>
              <input type="file" id="excelFileInput" accept=".xlsx, .xls" class="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
            </div>
          </div>

          <div class="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button id="btnUploadExcel" onclick="EmployeeModule.uploadExcel()" class="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition duration-200 shadow-sm flex items-center justify-center gap-2">
              <i class="fa-solid fa-cloud-arrow-up text-sm"></i>
              Tải Lên Google Sheet
            </button>
          </div>
        </div>

        <!-- THÔNG BÁO TRẠNG THÁI UPLOAD -->
        <div id="uploadStatus" class="hidden p-3 rounded-lg text-xs font-medium"></div>

        <!-- BẢNG DANH SÁCH -->
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-xs text-left text-slate-600">
            <thead class="text-xs uppercase bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th class="px-4 py-3 text-center w-12">STT</th>
                <th class="px-4 py-3">Mã NV</th>
                <th class="px-4 py-3">Họ và Tên</th>
                <th class="px-4 py-3">Nhà máy</th>
                <th class="px-4 py-3">Bộ phận</th>
                <th class="px-4 py-3">Chức vụ</th>
                <th class="px-4 py-3 text-center">Năm sinh</th>
              </tr>
            </thead>
            <tbody id="employeeTableBody" class="divide-y divide-slate-200">
              <tr>
                <td colspan="7" class="px-4 py-6 text-center text-slate-400">Đang tải dữ liệu nhân viên...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Nạp dữ liệu từ Google Sheet ngay khi vào màn hình
    this.loadEmployees();
  },

  // 2. Tải danh sách nhân viên từ Google Sheet
  async loadEmployees() {
    const tbody = document.getElementById('employeeTableBody');
    if (!tbody) return;

    try {
      const res = await API.get('getEmployees');
      if (res && res.status === 'success' && Array.isArray(res.data)) {
        this.renderTable(res.data);
      } else {
        tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-4 text-center text-amber-600 font-medium">Chưa có dữ liệu trong tab EMPLOYEE hoặc lỗi lấy dữ liệu.</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-4 text-center text-red-500 font-medium">Lỗi kết nối API Google Apps Script!</td></tr>`;
    }
  },

  // 3. Render các dòng dữ liệu ra bảng
  renderTable(data) {
    const tbody = document.getElementById('employeeTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-6 text-center text-slate-400">Chưa có dữ liệu nhân viên. Hãy chọn file Excel để upload.</td></tr>`;
      return;
    }

    let html = '';
    data.forEach((emp, index) => {
      html += `
        <tr class="hover:bg-slate-50 transition">
          <td class="px-4 py-2.5 text-center font-medium text-slate-500">${index + 1}</td>
          <td class="px-4 py-2.5 font-bold text-slate-800">${emp['Mã NV'] || emp.EmpID || emp.id || '--'}</td>
          <td class="px-4 py-2.5 font-medium text-blue-700">${emp['Họ Tên'] || emp['Họ và Tên'] || emp['Họ tên'] || emp.FullName || emp.name || '--'}</td>
          <td class="px-4 py-2.5">${emp['Nhà máy'] || emp.Plant || emp.factory || '--'}</td>
          <td class="px-4 py-2.5">${emp['Bộ phận'] || emp.Department || emp.department || '--'}</td>
          <td class="px-4 py-2.5">${emp['Chức vụ'] || emp.Position || emp.position || '--'}</td>
          <td class="px-4 py-2.5 text-center">${emp['Năm sinh'] || emp.yob || '--'}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  },

  // 4. Xử lý Đọc file Excel & Gửi API đẩy lên Google Sheet
  async uploadExcel() {
    const fileInput = document.getElementById('excelFileInput');
    const statusBox = document.getElementById('uploadStatus');
    const btn = document.getElementById('btnUploadExcel');

    if (!fileInput || !fileInput.files.length) {
      alert('Vui lòng chọn 1 file Excel danh sách nhân viên!');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    statusBox.className = "p-3 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 block";
    statusBox.innerText = "⏳ Đang đọc file Excel...";
    btn.disabled = true;

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Chuyển Excel sang JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!jsonData || jsonData.length === 0) {
          statusBox.className = "p-3 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 block";
          statusBox.innerText = "❌ File Excel rỗng hoặc không đúng định dạng!";
          btn.disabled = false;
          return;
        }

        statusBox.innerText = `⏳ Đang cập nhật ${jsonData.length} nhân viên lên tab EMPLOYEE (Google Sheet)...`;

        // Gọi API doPost sang Google Apps Script
        const res = await API.post({
          action: 'importEmployees',
          sheet: 'EMPLOYEE',
          employees: jsonData
        });

        if (res && res.status === 'success') {
          statusBox.className = "p-3 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 block";
          statusBox.innerText = `✅ ${res.message || 'Cập nhật danh sách thành công!'}`;
          fileInput.value = '';
          
          // Tải lại bảng ngay lập tức
          this.loadEmployees();
        } else {
          statusBox.className = "p-3 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 block";
          statusBox.innerText = `❌ Lỗi: ${res ? res.message : 'Không nhận được phản hồi từ Server'}`;
        }
      } catch (err) {
        console.error(err);
        statusBox.className = "p-3 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 block";
        statusBox.innerText = "❌ Lỗi trong quá trình đọc hoặc gửi file Excel!";
      } finally {
        btn.disabled = false;
      }
    };

    reader.readAsArrayBuffer(file);
  },

  // 5. Tạo và Tải file Excel mẫu chuẩn trực tiếp
  downloadTemplate() {
    try {
      const templateData = [
        {
          "Mã NV": "NV001",
          "Họ và Tên": "Nguyễn Văn A",
          "Nhà máy": "Nhà máy 1",
          "Bộ phận": "Sản xuất",
          "Chức vụ": "Công nhân",
          "Năm sinh": 1995
        },
        {
          "Mã NV": "NV002",
          "Họ và Tên": "Trần Thị B",
          "Nhà máy": "Nhà máy 2",
          "Bộ phận": "Hành chính",
          "Chức vụ": "Nhân viên",
          "Năm sinh": 1998
        }
      ];

      // Tạo Workbook và Sheet Excel từ thư viện XLSX
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "EMPLOYEE");

      // Xuất file .xlsx về máy
      XLSX.writeFile(workbook, "mau_danh_sach_nhan_vien_ehs.xlsx");
    } catch (err) {
      console.error(err);
      alert('Không thể tạo file Excel mẫu! Vui lòng kiểm tra xem thư viện SheetJS (XLSX) đã được nạp trong index.html chưa.');
    }
  }
};
