/**
 * CONFIG.GS - Quản lý cấu hình toàn hệ thống EHS TNLĐ
 */
const CONFIG = {
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
  DRIVE_FOLDER_ID: "1reoBkxi7rlUoQvfP6erEMBzc6wNDU_1d", // Thay ID thư mục lưu ảnh/video/pdf trên Google Drive
  
  // Tên các Sheet Database
  SHEETS: {
    USER: "USER",
    EMPLOYEE: "EMPLOYEE",
    ACCIDENT: "ACCIDENT",
    INVESTIGATION: "INVESTIGATION",
    CAPA: "CAPA",
    COST: "COST",
    BHXH: "BHXH",
    ATTACHMENT: "ATTACHMENT",
    MASTER: "MASTER",
    SETTING: "SETTING",
    LOG: "LOG"
  },

  // Danh sách Quyền hạn (Roles)
  ROLES: {
    ADMIN: "Administrator",
    HR: "HR",
    HSE: "HSE",
    MANAGER: "Manager",
    VIEWER: "Viewer"
  }
};
