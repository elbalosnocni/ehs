/**
 * ACCIDENT.GS - Quản lý Hồ sơ Tai nạn
 */
const Accident = {
  // Lấy danh sách tai nạn
  getAll: function() {
    const accidents = Utils.getSheetData(CONFIG.SHEETS.ACCIDENT);
    return Utils.responseJSON({ status: "success", data: accidents });
  },

  // Tạo báo cáo tai nạn mới
  create: function(payload) {
    try {
      const accidentId = Utils.generateID("TNLĐ", CONFIG.SHEETS.ACCIDENT, "AccidentID");
      const timestamp = new Date().toISOString();

      const newRow = [
        accidentId,
        payload.empId || "",
        payload.incidentDate || timestamp,
        payload.location || "",
        payload.incidentType || "",
        payload.severity || "",
        payload.description || "",
        payload.witness || "",
        "Mới ghi nhận" // Trạng thái ban đầu
      ];

      Utils.appendRow(CONFIG.SHEETS.ACCIDENT, newRow);

      // Nếu có đính kèm file (Base64)
      if (payload.files && payload.files.length > 0) {
        this.saveAttachments(accidentId, payload.files);
      }

      Utils.writeLog(payload.userId || "SYSTEM", "CREATE_ACCIDENT", { accidentId: accidentId });

      return Utils.responseJSON({
        status: "success",
        message: "Tạo hồ sơ tai nạn thành công!",
        accidentId: accidentId
      });
    } catch (error) {
      return Utils.responseJSON({ status: "error", message: error.toString() });
    }
  },

  // Lưu file đính kèm lên Google Drive
  saveAttachments: function(targetId, files) {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    files.forEach(fileData => {
      const blob = Utilities.newBlob(
        Utilities.base64Decode(fileData.base64), 
        fileData.mimeType, 
        fileData.fileName
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      const fileId = "FILE-" + new Date().getTime();
      Utils.appendRow(CONFIG.SHEETS.ATTACHMENT, [
        fileId,
        targetId,
        "ACCIDENT",
        file.getUrl(),
        fileData.mimeType,
        file.getId()
      ]);
    });
  }
};
