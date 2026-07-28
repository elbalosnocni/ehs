// employee.js - Quản lý hiển thị danh sách nhân viên
const EmployeeModule = {
  async loadEmployees() {
    const container = document.getElementById('employee-list');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="5">Đang tải dữ liệu nhân viên...</td></tr>';

    try {
      // Gọi qua api.js của bạn
      const res = await API.get('getEmployees');
      if (res.status === 'success' && res.data) {
        this.renderTable(res.data);
      } else {
        container.innerHTML = `<tr><td colspan="5">Lỗi: ${res.message || 'Không lấy được dữ liệu'}</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = '<tr><td colspan="5">Có lỗi kết nối API!</td></tr>';
    }
  },

  renderTable(data) {
    const container = document.getElementById('employee-list');
    if (!data || data.length === 0) {
      container.innerHTML = '<tr><td colspan="5">Chưa có dữ liệu nhân viên</td></tr>';
      return;
    }

    let html = '';
    data.forEach((emp, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${emp['Mã NV'] || emp.id || ''}</td>
          <td>${emp['Họ tên'] || emp.name || ''}</td>
          <td>${emp['Bộ phận'] || emp.department || ''}</td>
          <td>${emp['Chức vụ'] || emp.position || ''}</td>
        </tr>
      `;
    });
    container.innerHTML = html;
  }
};
