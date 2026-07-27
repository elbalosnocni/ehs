/**
 * API.GS - Cổng giao tiếp chính (REST API Router)
 */
function doGet(e) {
  const action = e.parameter.action;

  switch(action) {
    case 'getAccidents':
      return Accident.getAll();
    case 'getDashboard':
      return Dashboard.getStats();
    default:
      return Utils.responseJSON({ status: "online", message: "EHS TNLĐ API Service 2026 is Running!" });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    switch(action) {
      case 'login':
        return Auth.login(payload);
      case 'createAccident':
        return Accident.create(payload);
      case 'saveInvestigation':
        return Investigation.saveInvestigation(payload);
      case 'addCapa':
        return Investigation.addCapa(payload);
      default:
        return Utils.responseJSON({ status: "error", message: "Action không hợp lệ!" });
    }
  } catch (error) {
    return Utils.responseJSON({ status: "error", message: "Lỗi Server: " + error.toString() });
  }
}
