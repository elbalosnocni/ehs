/**
 * INVESTIGATION.GS - Quản lý Điều tra & Hành động CAPA
 */
const Investigation = {
  // Lưu kết quả điều tra (5 WHY & Fishbone)
  saveInvestigation: function(payload) {
    try {
      const investId = payload.investId || Utils.generateID("INV", CONFIG.SHEETS.INVESTIGATION, "InvestID");
      
      const newRow = [
        investId,
        payload.accidentId,
        payload.directCause || "",
        payload.rootCause || "",
        JSON.stringify(payload.fiveWhyData || []),
        JSON.stringify(payload.fishboneData || {}),
        payload.status || "Đang điều tra"
      ];

      Utils.appendRow(CONFIG.SHEETS.INVESTIGATION, newRow);
      return Utils.responseJSON({ status: "success", message: "Đã lưu thông tin điều tra!", investId: investId });
    } catch (e) {
      return Utils.responseJSON({ status: "error", message: e.toString() });
    }
  },

  // Thêm hành động CAPA
  addCapa: function(payload) {
    try {
      const capaId = Utils.generateID("CAPA", CONFIG.SHEETS.CAPA, "CapaID");
      
      Utils.appendRow(CONFIG.SHEETS.CAPA, [
        capaId,
        payload.investId,
        payload.actionType, // Corrective hay Preventive
        payload.actionDesc,
        payload.pic,        // Người chịu trách nhiệm
        payload.deadline,
        "Chưa hoàn thành"
      ]);

      return Utils.responseJSON({ status: "success", message: "Đã giao việc CAPA thành công!" });
    } catch (e) {
      return Utils.responseJSON({ status: "error", message: e.toString() });
    }
  }
};
