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
      const sheetName = (typeof CONFIG !== 'undefined' && CONFIG.SHEETS && CONFIG.SHEETS.CAPA) ? CONFIG.SHEETS.CAPA : "CAPA";
      let sheet = null;

      if (typeof Utils !== 'undefined' && Utils.getSheet) {
        sheet = Utils.getSheet(sheetName);
      } else {
        sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      }

      if (!sheet) {
        return (typeof Utils !== 'undefined' && Utils.responseJSON) 
          ? Utils.responseJSON({ status: "success", data: [] }) 
          : { status: "success", data: [] };
      }

      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return (typeof Utils !== 'undefined' && Utils.responseJSON) 
          ? Utils.responseJSON({ status: "success", data: [] }) 
          : { status: "success", data: [] };
      }

      data.shift(); // Loại bỏ dòng tiêu đề
      
      const timeZone = Session.getScriptTimeZone() || "GMT+7";
      const result = data.map(row => {
        let deadlineFormatted = "";
        if (row[5]) {
          try {
            deadlineFormatted = Utilities.formatDate(new Date(row[5]), timeZone, "yyyy-MM-dd");
          } catch (err) {
            deadlineFormatted = String(row[5]);
          }
        }

        return {
          id: String(row[0] || ""),            // Mã CAPA (CapaID)
          accidentId: String(row[1] || ""),    // Mã vụ việc / InvestID
          rootCause: String(row[2] || ""),     // Nguyên nhân gốc rễ
          action: String(row[3] || ""),        // Hành động khắc phục / phòng ngừa
          assignee: String(row[4] || ""),      // Người phụ trách (PIC)
          deadline: deadlineFormatted,          // Hạn chót
          status: row[6] || "Đang thực hiện",  // Trạng thái
          priority: row[7] || "Trung bình",    // Mức độ ưu tiên
          progress: row[8] !== "" && row[8] !== undefined ? Number(row[8]) : 0 // Tiến độ %
        };
      });

      return (typeof Utils !== 'undefined' && Utils.responseJSON)
        ? Utils.responseJSON({ status: "success", data: result })
        : { status: "success", data: result };

    } catch (e) {
      return (typeof Utils !== 'undefined' && Utils.responseJSON)
        ? Utils.responseJSON({ status: "error", message: e.toString() })
        : { status: "error", message: e.toString() };
    }
  },

  /**
   * 2. Lưu kết quả điều tra sự cố (5 Why & Fishbone Diagram)
   */
  saveInvestigation: function(payload) {
    try {
      const sheetName = (typeof CONFIG !== 'undefined' && CONFIG.SHEETS && CONFIG.SHEETS.INVESTIGATION) ? CONFIG.SHEETS.INVESTIGATION : "Investigation";
      
      let investId = payload.investId;
      if (!investId) {
        investId = (typeof Utils !== 'undefined' && Utils.generateID)
          ? Utils.generateID("INV", sheetName, "InvestID")
          : "INV-" + Date.now();
      }

      const newRow = [
        investId,
        payload.accidentId || "",
        payload.directCause || "",
        payload.rootCause || "",
        JSON.stringify(payload.fiveWhyData || []),
        JSON.stringify(payload.fishboneData || {}),
        payload.status || "Đang điều tra"
      ];

      if (typeof Utils !== 'undefined' && Utils.appendRow) {
        Utils.appendRow(sheetName, newRow);
      } else {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
        if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
        sheet.appendRow(newRow);
      }

      const responseData = { 
        status: "success", 
        message: "Đã lưu thông tin điều tra!", 
        investId: investId 
      };

      return (typeof Utils !== 'undefined' && Utils.responseJSON)
        ? Utils.responseJSON(responseData)
        : responseData;

    } catch (e) {
      return (typeof Utils !== 'undefined' && Utils.responseJSON)
        ? Utils.responseJSON({ status: "error", message: e.toString() })
        : { status: "error", message: e.toString() };
    }
  },

  /**
   * 3. Thêm mới hoặc Cập nhật bản ghi CAPA
   */
  saveCapaRecord: function(payload) {
    try {
      const sheetName = (typeof CONFIG !== 'undefined' && CONFIG.SHEETS && CONFIG.SHEETS.CAPA) ? CONFIG.SHEETS.CAPA : "CAPA";
      let sheet = (typeof Utils !== 'undefined' && Utils.getSheet) 
        ? Utils.getSheet(sheetName) 
        : SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

      const ss = SpreadsheetApp.getActiveSpreadsheet();

      // Tự tạo Sheet và Header nếu chưa tồn tại
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow([
          "CapaID", "InvestID", "RootCause", "Action", 
          "Assignee", "Deadline", "Status", "Priority", "Progress"
        ]);
      }

      // Đảm bảo bóc tách dữ liệu linh hoạt (kể cả truyền dưới dạng payload.data hoặc payload trực tiếp)
      const dataObj = payload.data || payload;

      // Trường hợp CẬP NHẬT (đã có ID)
      if (dataObj.id) {
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(dataObj.id)) {
            const updateRow = [
              dataObj.id,
              dataObj.accidentId !== undefined ? dataObj.accidentId : data[i][1],
              dataObj.rootCause !== undefined ? dataObj.rootCause : data[i][2],
              dataObj.action !== undefined ? dataObj.action : data[i][3],
              dataObj.assignee !== undefined ? dataObj.assignee : data[i][4],
              dataObj.deadline !== undefined ? dataObj.deadline : data[i][5],
              dataObj.status !== undefined ? dataObj.status : data[i][6],
              dataObj.priority !== undefined ? dataObj.priority : data[i][7],
              dataObj.progress !== undefined ? dataObj.progress : data[i][8]
            ];
            
            sheet.getRange(i + 1, 1, 1, updateRow.length).setValues([updateRow]);
            
            const resData = { status: "success", message: "Cập nhật CAPA thành công!", id: dataObj.id };
            return (typeof Utils !== 'undefined' && Utils.responseJSON) ? Utils.responseJSON(resData) : resData;
          }
        }
      }

      // Trường hợp THÊM MỚI (chưa có ID)
      let newId = "";
      if (typeof Utils !== 'undefined' && Utils.generateID) {
        newId = Utils.generateID("CAPA", sheetName, "CapaID");
      } else {
        const totalRows = sheet.getLastRow();
        newId = "CAPA-" + String(totalRows).padStart(3, "0");
      }

      const newRow = [
        newId,
        dataObj.accidentId || dataObj.investId || "",
        dataObj.rootCause || "",
        dataObj.action || dataObj.actionDesc || "",
        dataObj.assignee || dataObj.pic || "",
        dataObj.deadline || "",
        dataObj.status || "Đang thực hiện",
        dataObj.priority || "Trung bình",
        dataObj.progress !== undefined ? dataObj.progress : 0
      ];

      if (typeof Utils !== 'undefined' && Utils.appendRow) {
        Utils.appendRow(sheetName, newRow);
      } else {
        sheet.appendRow(newRow);
      }

      const resData = { status: "success", message: "Tạo mới CAPA thành công!", id: newId };
      return (typeof Utils !== 'undefined' && Utils.responseJSON) ? Utils.responseJSON(resData) : resData;

    } catch (e) {
      return (typeof Utils !== 'undefined' && Utils.responseJSON)
        ? Utils.responseJSON({ status: "error", message: e.toString() })
        : { status: "error", message: e.toString() };
    }
  }
};

/**
 * ===================================================
 * Global Wrapper Functions (Để Router Api.gs gọi đến)
 * ===================================================
 */

function getInvestigationData() {
  return Investigation.getAll();
}

function saveCapaRecord(payload) {
  return Investigation.saveCapaRecord(payload);
}

function saveCapaData(payload) {
  return Investigation.saveCapaRecord(payload);
}

function saveInvestigation(payload) {
  return Investigation.saveInvestigation(payload);
}
