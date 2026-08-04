/**
 * CAPA.GS - Quản lý Hành động Khắc phục & Phòng ngừa
 * Hệ thống EHS Manager
 */
const CAPA = {

  /**
   * Lấy toàn bộ danh sách CAPA
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

      data.shift(); // Loại bỏ tiêu đề
      
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
          id: String(row[0] || ""),             // CapaID
          accidentId: String(row[1] || ""),     // InvestID / AccidentID
          rootCause: String(row[2] || ""),      
          action: String(row[3] || ""),         
          assignee: String(row[4] || ""),       // PIC
          deadline: deadlineFormatted,          
          status: row[6] || "Đang thực hiện",  
          priority: row[7] || "Trung bình",    
          progress: row[8] !== "" && row[8] !== undefined ? Number(row[8]) : 0,
          completedDate: row[9] ? Utilities.formatDate(new Date(row[9]), timeZone, "yyyy-MM-dd HH:mm:ss") : "",
          createdDate: row[10] ? Utilities.formatDate(new Date(row[10]), timeZone, "yyyy-MM-dd HH:mm:ss") : ""
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
   * Thêm mới hoặc Cập nhật bản ghi CAPA
   */
  saveRecord: function(payload) {
    try {
      const sheetName = (typeof CONFIG !== 'undefined' && CONFIG.SHEETS && CONFIG.SHEETS.CAPA) ? CONFIG.SHEETS.CAPA : "CAPA";
      let sheet = (typeof Utils !== 'undefined' && Utils.getSheet) 
        ? Utils.getSheet(sheetName) 
        : SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // Tạo Sheet & Header nếu chưa có
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow([
          "CapaID", "InvestID", "RootCause", "Action", 
          "Assignee", "Deadline", "Status", "Priority", 
          "Progress", "CompletedDate", "CreatedDate"
        ]);
      }

      const dataObj = payload.data || payload;

      // Tính phần trăm tiến độ theo Trạng thái
      if (dataObj.status === "Hoàn thành") {
        dataObj.progress = 100;
      } else if (dataObj.status === "Đang thực hiện" && (dataObj.progress === undefined || dataObj.progress === null)) {
        dataObj.progress = 50;
      } else if (dataObj.status === "Chưa thực hiện") {
        dataObj.progress = 0;
      }

      // 1. TRƯỜNG HỢP CẬP NHẬT
      if (dataObj.id || dataObj.capaId) {
        const targetId = dataObj.id || dataObj.capaId;
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(targetId)) {
            
            let updatedCompletedDate = data[i][9];
            if (dataObj.status === "Hoàn thành") {
              updatedCompletedDate = dataObj.completedDate || data[i][9] || new Date();
            } else if (dataObj.status && dataObj.status !== "Hoàn thành") {
              updatedCompletedDate = "";
            }

            const existingCreatedDate = data[i][10] || new Date();

            const updateRow = [
              targetId,
              dataObj.accidentId !== undefined ? dataObj.accidentId : (dataObj.investId !== undefined ? dataObj.investId : data[i][1]),
              dataObj.rootCause !== undefined ? dataObj.rootCause : data[i][2],
              dataObj.action !== undefined ? dataObj.action : (dataObj.actionDesc !== undefined ? dataObj.actionDesc : data[i][3]),
              dataObj.assignee !== undefined ? dataObj.assignee : (dataObj.pic !== undefined ? dataObj.pic : data[i][4]),
              dataObj.deadline !== undefined ? dataObj.deadline : data[i][5],
              dataObj.status !== undefined ? dataObj.status : data[i][6],
              dataObj.priority !== undefined ? dataObj.priority : data[i][7],
              dataObj.progress !== undefined ? dataObj.progress : data[i][8],
              updatedCompletedDate,
              existingCreatedDate
            ];
            
            sheet.getRange(i + 1, 1, 1, updateRow.length).setValues([updateRow]);
            
            const resData = { status: "success", message: "Cập nhật CAPA thành công!", id: targetId };
            return (typeof Utils !== 'undefined' && Utils.responseJSON) ? Utils.responseJSON(resData) : resData;
          }
        }
      }

      // 2. TRƯỜNG HỢP THÊM MỚI
      let newId = "";
      if (typeof Utils !== 'undefined' && Utils.generateID) {
        newId = Utils.generateID("CAPA", sheetName, "CapaID");
      } else {
        const totalRows = sheet.getLastRow();
        newId = "CAPA-" + String(totalRows).padStart(3, "0");
      }

      const completedDate = (dataObj.status === "Hoàn thành") ? new Date() : "";
      const createdDate = new Date();

      const newRow = [
        newId,
        dataObj.accidentId || dataObj.investId || "",
        dataObj.rootCause || "",
        dataObj.action || dataObj.actionDesc || "",
        dataObj.assignee || dataObj.pic || "",
        dataObj.deadline || "",
        dataObj.status || "Đang thực hiện",
        dataObj.priority || "Trung bình",
        dataObj.progress !== undefined ? dataObj.progress : 0,
        completedDate,
        createdDate
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
 * Global Wrapper tương thích ngược cho Router Api.gs
 */
function getInvestigationData() {
  return CAPA.getAll();
}

function saveCapaRecord(payload) {
  return CAPA.saveRecord(payload);
}

function saveCapaData(payload) {
  return CAPA.saveRecord(payload);
}

function addCapa(payload) {
  return CAPA.saveRecord(payload);
}
