/**
 * INVESTIGATION.GS - Quản lý Điều tra Sự cố (5-Why & Fishbone)
 * Hệ thống EHS Manager
 */
const Investigation = {

  /**
   * Lưu hoặc cập nhật kết quả điều tra sự cố
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
        payload.status || "Đang điều tra",
        new Date()
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
  }
};

/**
 * Global Wrapper cho Router API
 */
function saveInvestigation(payload) {
  return Investigation.saveInvestigation(payload);
}
