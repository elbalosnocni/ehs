// employee.js - Xử lý hiển thị & Upload Excel danh sách nhân viên
const EmployeeModule = {
  
  // 1. Tải danh sách nhân viên từ Google Sheet về Web
  async loadEmployees() {
    const container = document.getElementById('employee-list');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải dữ liệu...</td></tr>';

    try {
      // API.get sử dụng URL Web App Apps Script
      const res = await API.get('getEmployees');
      if (res.status === 'success' && res.data) {
        this.renderTable(res.data);
      } else {
        container.innerHTML = `<tr><td colspan="5" style="text-align:center;">Lỗi: ${res.message || 'Không có dữ liệu'}</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Lỗi kết nối API!</td></tr>';
    }
  },

  // 2. Render dữ liệu ra bảng HTML
  renderTable(data) {
    const container = document.getElementById('employee-list');
    if (!data || data.length === 0) {
      container.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu nhân viên</td></tr>';
      return;
    }

    let html = '';
    data.forEach((emp, index) => {
      html += `
        <tr>
          <td style="text-align:center;">${index + 1}</td>
          <td>${emp['Mã NV'] || emp.id || ''}</td>
          <td>${emp['Họ tên'] || emp.name || ''}</td>
          <td>${emp['Bộ phận'] || emp.department || ''}</td>
          <td>${emp['Chức vụ'] || emp.position || ''}</td>
        </tr>
      `;
    });
    container.innerHTML = html;
  },

  // 3. Đọc file Excel trên máy & Upload trực tiếp lên Google Sheet
  async uploadExcel() {
    const fileInput = document.getElementById('excelFile');
    const statusText = document.getElementById('uploadStatus');
    const btn = document.getElementById('btnUploadExcel');

    if (!fileInput.files.length) {
      alert('Vui lòng chọn 1 file Excel trước!');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    statusText.innerText = '⌛ Đang đọc file Excel...';
    statusText.style.color = '#007bff';
    btn.disabled = true;

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Lấy dữ liệu tab đầu tiên trong file Excel
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Chuyển dữ liệu Excel thành mảng JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          statusText.innerText = '❌ File Excel không có dữ liệu!';
          statusText.style.color = 'red';
          btn.disabled = false;
          return;
        }

        statusText.innerText = `⏳ Đang gửi ${jsonData.length} nhân viên lên Google Sheet...`;

        // Gọi API doPost lên Apps Script (Action: importEmployees)
        const response = await API.post({
          action: 'importEmployees',
          sheet: 'EMPLOYEE',
          employees: jsonData
        });

        if (response.status === 'success') {
          statusText.innerText = '✅ Upload thành công!';
          statusText.style.color = 'green';
          fileInput.value = ''; // Reset input
          
          // Tải lại danh sách mới lên bảng
          this.loadEmployees();
        } else {
          statusText.innerText = '❌ Lỗi: ' + response.message;
          statusText.style.color = 'red';
        }
      } catch (err) {
        console.error(err);
        statusText.innerText = '❌ Lỗi xử lý file Excel!';
        statusText.style.color = 'red';
      } finally {
        btn.disabled = false;
      }
    };

    reader.readAsArrayBuffer(file);
  }
};
