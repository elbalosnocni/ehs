/**
 * EMPLOYEE.GS - Quản lý dữ liệu nhân viên
 */
const Employee = {
  
  /**
/**
   * Lấy toàn bộ danh sách nhân viên từ tab EMPLOYEE (Đã chuẩn hóa Key)
   */
  getAll: function() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.EMPLOYEE);
      
      if (!sheet) {
        return Utils.responseJSON({ status: "error", message: "Không tìm thấy sheet EMPLOYEE!" });
      }

      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return Utils.responseJSON({ status: "success", data: [] });
      }

      const headers = data[0].map(h => String(h).trim());
      
      const rows = data.slice(1)
        .filter(row => row[0] !== "" && row[0] !== null) // Loại bỏ dòng rỗng không có Mã NV
        .map(row => {
          let obj = {};
          headers.forEach((header, index) => {
            if (header) { // Chỉ lấy cột có tiêu đề
              let val = row[index];
              if (typeof val === 'string') val = val.trim();
              obj[header] = val;
            }
          });

          // Chuẩn hóa mapping 2 chiều (Tiếng Việt <-> Tiếng Anh) 
          // Giúp Frontend gọi kiểu nào cũng ra dữ liệu:
          obj['EmpID'] = obj['EmpID'] || obj['Mã NV'] || "";
          obj['FullName'] = obj['FullName'] || obj['Họ tên'] || "";
          obj['Department'] = obj['Department'] || obj['Bộ phận'] || "";
          obj['Position'] = obj['Position'] || obj['Chức vụ'] || "";
          obj['Plant'] = obj['Plant'] || obj['Nhà máy'] || "";

          return obj;
        });

      return Utils.responseJSON({
        status: "success",
        total: rows.length,
        data: rows
      });

    } catch (error) {
      return Utils.responseJSON({ status: "error", message: "Lỗi đọc danh sách NV: " + error.toString() });
    }
  },

  /**
   * Ghi / Đè danh sách nhân viên (khi import từ Excel/Web)
   */
  importList: function(employeeList) {
    try {
      if (!Array.isArray(employeeList) || employeeList.length === 0) {
        return Utils.responseJSON({ status: "error", message: "Mảng danh sách nhân viên rỗng!" });
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(CONFIG.SHEETS.EMPLOYEE);
      
      if (!sheet) {
        sheet = ss.insertSheet(CONFIG.SHEETS.EMPLOYEE);
      } else {
        sheet.clear(); // Xóa sạch dữ liệu cũ để ghi đè danh sách mới
      }

      const headers = Object.keys(employeeList[0]);
      const tableData = [headers];

      employeeList.forEach(item => {
        const row = headers.map(key => item[key] !== undefined ? item[key] : "");
        tableData.push(row);
      });

      sheet.getRange(1, 1, tableData.length, headers.length).setValues(tableData);

      return Utils.responseJSON({
        status: "success",
        message: `Đã nhập thành công ${employeeList.length} nhân viên!`
      });

    } catch (error) {
      return Utils.responseJSON({ status: "error", message: "Lỗi lưu danh sách NV: " + error.toString() });
    }
  }
};
