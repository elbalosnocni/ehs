/**
 * INVESTIGATION.GS - Quản lý Điều tra & Hành động CAPA
 * Hệ thống EHS Manager
 */
const Investigation = {

  /**
   * 1. Lấy toàn bộ danh sách CAPA & Điều tra
   */
  getAll: function() {
    try {
      const sheetName = CONFIG.SHEETS.CAPA || "CAPA";
      const sheet = Utils.getSheet(sheetName);
      if (!sheet) {
        return Utils.responseJSON({ status: "error", message: `Không tìm thấy sheet ${sheetName}` });
      }

      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return Utils.responseJSON({ status: "success", data: [] });
      }

      const headers = data.shift(); // Loại bỏ dòng tiêu đề
      
      const result = data.map(row => {
        let deadlineFormatted = "";
        if (row[5]) {
          try {
            deadlineFormatted = Utilities.formatDate(new Date(row[5]), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
          } catch (err) {
            deadlineFormatted = String(row[5]);
          }
        }

        return {
          id: row[0],           // Mã CAPA (CapaID)
          accidentId: row[1],   // Mã vụ việc / InvestID
          rootCause: row[2],    // Nguyên nhân gốc rễ
          action: row[3],       // Hành động khắc phục / phòng ngừa
          assignee: row[4],     // Người phụ trách (PIC)
          deadline: deadlineFormatted, // Hạn chót
          status: row[6] || "Chưa thực hiện", // Trạng thái
          priority: row[7] || "Trung bình",   // Mức độ ưu tiên
          progress: row[8] !== "" ? Number(row[8]) : 0 // Tiến độ %
        };
      });

      return Utils.responseJSON({ status: "success", data: result });
    } catch (e) {
      return Utils.responseJSON({ status: "error", message: e.toString() });
    }
  },

  /**
   * 2. Lưu kết quả điều tra sự cố (5 Why & Fishbone Diagram)
   */
  saveInvestigation: function(payload) {
    try {
      const sheetName = CONFIG.SHEETS.INVESTIGATION || "Investigation";
      const investId = payload.investId || Utils.generateID("INV", sheetName, "InvestID");

      const newRow = [
        investId,
        payload.accidentId || "",
        payload.directCause || "",
        payload.rootCause || "",
        JSON.stringify(payload.fiveWhyData || []),
        JSON.stringify(payload.fishboneData || {}),
        payload.status || "Đang điều tra"
      ];

      Utils.appendRow(sheetName, newRow);
      return Utils.responseJSON({ 
        status: "success", 
        message: "Đã lưu thông tin điều tra!", 
        investId: investId 
      });
    } catch (e) {
      return Utils.responseJSON({ status: "error", message: e.toString() });
    }
  },

  /**
   * 3. Thêm mới hoặc Cập nhật bản ghi CAPA
   */
  saveCapaRecord: function(payload) {
    try {
      const sheetName = CONFIG.SHEETS.CAPA || "CAPA";
      let sheet = Utils.getSheet(sheetName);

      // Tự tạo Sheet và Header nếu chưa tồn tại
      if (!sheet) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow([
          "CapaID", "InvestID", "RootCause", "Action", 
          "Assignee", "Deadline", "Status", "Priority", "Progress"
        ]);
      }

      // Trường hợp CẬP NHẬT (đã có ID)
      if (payload.id) {
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(payload.id)) {
            const updateRow = [
              payload.id,
              payload.accidentId || data[i][1],
              payload.rootCause || data[i][2],
              payload.action || data[i][3],
              payload.assignee || data[i][4],
              payload.deadline || data[i][5],
              payload.status || data[i][6],
              payload.priority || data[i][7],
              payload.progress !== undefined ? payload.progress : data[i][8]
            ];
            
            sheet.getRange(i + 1, 1, 1, updateRow.length).setValues([updateRow]);
            return Utils.responseJSON({ status: "success", message: "Cập nhật CAPA thành công!", id: payload.id });
          }
        }
      }

      // Trường hợp THÊM MỚI (chưa có ID)
      const newId = Utils.generateID("CAPA", sheetName, "CapaID");
      const newRow = [
        newId,
        payload.accidentId || payload.investId || "",
        payload.rootCause || "",
        payload.action || payload.actionDesc || "",
        payload.assignee || payload.pic || "",
        payload.deadline || "",
        payload.status || "Đang thực hiện",
        payload.priority || "Trung bình",
        payload.progress || 0
      ];

      Utils.appendRow(sheetName, newRow);
      return Utils.responseJSON({ status: "success", message: "Tạo mới CAPA thành công!", id: newId });

    } catch (e) {
      return Utils.responseJSON({ status: "error", message: e.toString() });
    }
  }
};

/**
 * Global Wrapper Functions (Để Router Api.gs gọi đến)
 */
function getInvestigationData() {
  return Investigation.getAll();
}

function saveCapaRecord(payload) {
  return Investigation.saveCapaRecord(payload);
}

function saveInvestigation(payload) {
  return Investigation.saveInvestigation(payload);
}
