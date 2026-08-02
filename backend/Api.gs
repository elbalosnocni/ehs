/**
 * API.GS - Cổng giao tiếp chính (REST API Router)
 * Hệ thống EHS Manager 2026
 */

/**
 * Xử lý các yêu cầu HTTP GET
 */
function doGet(e) {
  try {
    const action = e ? e.parameter.action : "";

    switch (action) {
      case 'getAccidents':
        return Accident.getAll();
      case 'getDashboard':
        return Dashboard.getStats();
      case 'getInvestigationData':
      case 'getCAPA':
        return typeof Investigation !== 'undefined' ? Investigation.getAll() : getInvestigationData();
      default:
        return Utils.responseJSON({ 
          status: "online", 
          message: "EHS TNLĐ API Service 2026 is Running!" 
        });
    }
  } catch (error) {
    return Utils.responseJSON({ status: "error", message: "Lỗi GET API: " + error.toString() });
  }
}

/**
 * Xử lý các yêu cầu HTTP POST
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return Utils.responseJSON({ status: "error", message: "Dữ liệu gửi lên rỗng hoặc không hợp lệ!" });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    switch (action) {
      // 1. Xác thực & Tài khoản
      case 'login':
        return Auth.login(payload);

      // 2. Quản lý Hồ sơ Tai nạn
      case 'getAccidents':
        return Accident.getAll();
      case 'createAccident':
      case 'saveAccident':
        return Accident.create(payload);

      // 3. Quản lý Điều tra & Hành động CAPA
      case 'getInvestigationData':
        return typeof Investigation !== 'undefined' ? Investigation.getAll() : getInvestigationData();
      case 'saveInvestigation':
        return typeof Investigation !== 'undefined' ? Investigation.saveInvestigation(payload) : saveInvestigation(payload);
      case 'saveCapaData':
      case 'saveCapaRecord':
      case 'addCapa':
        return typeof Investigation !== 'undefined' ? Investigation.saveCapaRecord(payload) : saveCapaRecord(payload);

      // 4. Thống kê & Dashboard
      case 'getDashboard':
        return Dashboard.getStats();

      // Mặc định khi Action không khớp
      default:
        return Utils.responseJSON({ status: "error", message: `Action '${action}' không hợp lệ!` });
    }

  } catch (error) {
    return Utils.responseJSON({ status: "error", message: "Lỗi Server API: " + error.toString() });
  }
}
