/**
 * UTILS.GS - Các hàm phụ trợ chung
 */
const Utils = {
  // Trả về response dạng JSON
  responseJSON: function(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  },

  // Lấy dữ liệu của 1 Sheet thành mảng Object
  getSheetData: function(sheetName) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    
    const headers = values[0];
    return values.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  },

  // Thêm dòng mới vào Sheet
  appendRow: function(sheetName, rowDataArray) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (sheet) {
      sheet.appendRow(rowDataArray);
    }
  },

  // Mã tự sinh (Ví dụ: TNLĐ-2026-0001)
  generateID: function(prefix, sheetName, idColumnName) {
    const data = this.getSheetData(sheetName);
    const count = data.length + 1;
    const year = new Date().getFullYear();
    const padCount = String(count).padStart(4, '0');
    return `${prefix}-${year}-${padCount}`;
  },

  // Hàm Ghi Log thao tác
  writeLog: function(userId, action, details) {
    const logId = "LOG-" + new Date().getTime();
    const timestamp = new Date().toISOString();
    this.appendRow(CONFIG.SHEETS.LOG, [logId, userId, action, timestamp, JSON.stringify(details)]);
  }
};
function testDrivePermission() {
  DriveApp.getRootFolder();
}
