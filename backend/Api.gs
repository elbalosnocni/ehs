/**
 * API.GS - Hệ thống EHS TNLĐ (Bản chuẩn hóa Mapping & Merge Dữ liệu NV + Import Excel)
 */

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. TẢI DỮ LIỆU MASTER
    if (action === 'getMasterData') {
      return getSheetData(ss, CONFIG.SHEETS.MASTER || 'MASTER');
    }

    // 2. TẢI DANH SÁCH NHÂN VIÊN
    if (action === 'getEmployees') {
      return getSheetData(ss, CONFIG.SHEETS.EMPLOYEE || 'EMPLOYEE');
    }

    // 3. TẢI DANH SÁCH HỒ SƠ TAI NẠN (Đã ghép dữ liệu NV & Chuẩn hóa Key)
    if (action === 'getAccidents') {
      var accidents = getFullAccidentData(ss);
      return createJsonResponse({ status: 'success', data: accidents });
    }

    // 4. TẢI DỮ LIỆU DASHBOARD
    if (action === 'getDashboardData' || action === 'getDashboard') {
      var accidents = getFullAccidentData(ss);
      var employees = getRawSheetData(ss, CONFIG.SHEETS.EMPLOYEE || 'EMPLOYEE');
      var capa      = getRawSheetData(ss, CONFIG.SHEETS.CAPA || 'CAPA');

      var byDepartment = countByKey(accidents, ['boPhan', 'Bophan', 'BoPhan', 'Department']);
      var byType       = countByKey(accidents, ['loaiSuCo', 'LoaiSuCo-IncidentType', 'IncidentType', 'LoaiSuCo']);
      var bySeverity   = countByKey(accidents, ['mucDo', 'Mucdo-Severity', 'Severity', 'MucDo']);
      var byStatus     = countByKey(accidents, ['trangThai', 'Trangthai', 'Status', 'TrangThai']);

      return createJsonResponse({
        status: 'success',
        data: {
          totalAccidents: accidents.length,
          totalEmployees: employees.length,
          totalCAPA: capa.length,
          stats: {
            byDepartment: byDepartment,
            byType: byType,
            bySeverity: bySeverity,
            byStatus: byStatus
          },
          accidents: accidents
        }
      });
    }

    return createJsonResponse({ status: 'error', message: 'Lỗi GET: Action không hợp lệ! (' + action + ')' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: 'Lỗi Server GET: ' + err.toString() });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'Dữ liệu POST gửi lên rỗng!' });
    }

    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ĐĂNG NHẬP
    if (action === 'login') {
      var users = getRawSheetData(ss, CONFIG.SHEETS.USER || 'USER');
      var username = (contents.username || '').toString().trim().toLowerCase();
      var password = (contents.password || '').toString().trim();

      var foundUser = users.find(function(u) {
        var uName = (u.Username || u.username || u['Tên đăng nhập'] || '').toString().trim().toLowerCase();
        var uPass = (u.Password || u.password || u['Mật khẩu'] || '').toString().trim();
        var uStatus = (u.Status || u.status || 'Active').toString().trim();
        return uName === username && uPass === password && uStatus.toLowerCase() === 'active';
      });

      if (foundUser) {
        return createJsonResponse({
          status: 'success',
          user: {
            userId: foundUser.UserID || foundUser.userId || 'USR001',
            username: foundUser.Username || foundUser.username,
            role: foundUser.Role || foundUser.role || 'Administrator',
            email: foundUser.Email || foundUser.email || ''
          }
        });
      } else {
        return createJsonResponse({ status: 'error', message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
      }
    }

    // 2. LƯU HỒ SƠ TAI NẠN (Sinh mã XXX/MM/YYYY-TNLD)
    if (action === 'createAccident' || action === 'saveAccident') {
      var accidentData = contents.data || contents;

      if (!accidentData.AccidentID && !accidentData['Mã Hồ Sơ']) {
        var sheetAcc = ss.getSheetByName(CONFIG.SHEETS.ACCIDENT || 'ACCIDENT');
        
        var rawDate = accidentData.incidentDate || accidentData.IncidentDate || new Date();
        var incDate = new Date(rawDate);
        if (isNaN(incDate.getTime())) incDate = new Date();

        var monthStr = ("0" + (incDate.getMonth() + 1)).slice(-2);
        var yearStr = incDate.getFullYear();

        var seqNumber = 1;
        if (sheetAcc && sheetAcc.getLastRow() > 1) {
          var allAccidents = getRawSheetData(ss, CONFIG.SHEETS.ACCIDENT || 'ACCIDENT');
          var targetSuffix = "/" + monthStr + "/" + yearStr + "-TNLD";
          
          var sameMonthAccidents = allAccidents.filter(function(row) {
            var accId = row.AccidentID || row['Mã Hồ Sơ'] || '';
            return accId.indexOf(targetSuffix) !== -1;
          });
          
          seqNumber = sameMonthAccidents.length + 1;
        }

        var xxxStr = ("000" + seqNumber).slice(-3);
        accidentData.AccidentID = xxxStr + '/' + monthStr + '/' + yearStr + '-TNLD';
      }

      // Upload Drive
      if (contents.files && contents.files.length > 0) {
        var uploadedUrls = uploadFilesToDrive(contents.files, accidentData.AccidentID.replace(/\//g, '_'));
        if (uploadedUrls.length > 0) {
          accidentData.Attachments = uploadedUrls.join(',');
        }
      }

      normalizeAccidentData(accidentData);

      return appendOrUpdateSheet(ss, CONFIG.SHEETS.ACCIDENT || 'ACCIDENT', accidentData);
    }

    // 3. IMPORT DANH SÁCH NHÂN VIÊN TỪ EXCEL (Mới bổ sung)
    if (action === 'importEmployees') {
      var employees = contents.employees;
      if (!employees || !Array.isArray(employees) || employees.length === 0) {
        return createJsonResponse({ status: 'error', message: 'Danh sách nhân viên tải lên rỗng!' });
      }

      var sheetName = (typeof CONFIG !== 'undefined' && CONFIG.SHEETS && CONFIG.SHEETS.EMPLOYEE) ? CONFIG.SHEETS.EMPLOYEE : 'EMPLOYEE';
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }

      // Tiêu chuẩn hóa các cột cho tab EMPLOYEE
      var headers = ["Mã NV", "Họ Tên", "Nhà máy", "Bộ phận", "Chức vụ", "Năm sinh"];
      
      // Kiểm tra nếu chưa có Header thì ghi dòng Tiêu đề
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
      } else {
        // Đọc header thực tế từ dòng 1 của Sheet nếu có sẵn
        var existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
        if (existingHeaders && existingHeaders[0] !== "") {
          headers = existingHeaders;
        }
      }

      // Đẩy từng dòng dữ liệu từ Excel vào mảng
      var rowsToAppend = [];
      employees.forEach(function(emp) {
        var row = [];
        headers.forEach(function(h) {
          var val = "";
          // Tìm giá trị theo tên cột không phân biệt hoa/thường hoặc thuộc tính tiếng Anh tương đương
          for (var key in emp) {
            if (key.trim().toLowerCase() === h.trim().toLowerCase() ||
               (h.indexOf("Mã") !== -1 && (key === "EmpID" || key === "id")) ||
               (h.indexOf("Tên") !== -1 && (key === "FullName" || key === "name")) ||
               (h.indexOf("phận") !== -1 && key === "Department") ||
               (h.indexOf("máy") !== -1 && key === "Plant") ||
               (h.indexOf("vụ") !== -1 && key === "Position") ||
               (h.indexOf("sinh") !== -1 && key === "yob")) {
              val = emp[key];
              break;
            }
          }
          row.push(val !== undefined && val !== null ? val : "");
        });
        rowsToAppend.push(row);
      });

      // Xóa toàn bộ dữ liệu cũ (chỉ giữ dòng Header 1) và Ghi mới hàng loạt (Fast batch write)
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }
      
      if (rowsToAppend.length > 0) {
        sheet.getRange(2, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
      }

      return createJsonResponse({
        status: 'success',
        message: 'Đã cập nhật thành công ' + rowsToAppend.length + ' nhân viên vào Google Sheet!'
      });
    }

    return createJsonResponse({ status: 'error', message: 'Lỗi POST: Action không hợp lệ! (' + action + ')' });

  } catch (err) {
    return createJsonResponse({ status: 'error', message: 'Lỗi Server POST: ' + err.toString() });
  }
}

// --- HELPER FUNCTIONS ---

// Lấy danh sách tai nạn và tự ghép thông tin Bộ phận/Nghề nghiệp từ tab EMPLOYEE
function getFullAccidentData(ss) {
  var accidents = getRawSheetData(ss, CONFIG.SHEETS.ACCIDENT || 'ACCIDENT');
  var employees = getRawSheetData(ss, CONFIG.SHEETS.EMPLOYEE || 'EMPLOYEE');

  // Map danh sách NV theo EmpID
  var empMap = {};
  employees.forEach(function(emp) {
    var id = emp.EmpID || emp.empId || emp['Mã NV'] || '';
    if (id) empMap[id.toString().trim().toLowerCase()] = emp;
  });

  return accidents.map(function(acc) {
    var empId = (acc.EmpID || acc.empId || acc['Mã NV'] || '').toString().trim().toLowerCase();
    var empInfo = empMap[empId] || {};

    // Chuẩn hóa 2 chiều: cả camelCase cho Frontend và Header gốc cho Sheet
    var dept = acc.Bophan || acc.boPhan || acc.BoPhan || empInfo.Bophan || empInfo.BoPhan || empInfo.Department || 'Khác';
    var job  = acc.Nghenghiep || acc.ngheNghiep || empInfo.Chucvu || empInfo.JobTitle || empInfo.Nghenghiep || 'Chưa cập nhật';
    var type = acc['LoaiSuCo-IncidentType'] || acc.loaiSuCo || acc.IncidentType || acc.LoaiSuCo || 'Khác';
    var sev  = acc['Mucdo-Severity'] || acc.mucDo || acc.Severity || acc.MucDo || 'Nhẹ';
    var classify = acc.Phanloai || acc.phanLoai || acc.Classification || 'Chưa phân loại';
    var cause = acc.Nguyennhan || acc.nguyenNhan || acc.NguyenNhan || 'Chưa cập nhật';
    var factor = acc.Yeutochanthuong || acc.yeuToChanThuong || acc.YeuToChanThuong || 'Chưa cập nhật';

    // Tạo object đa năng khớp mọi biến thể thuộc tính
    return Object.assign({}, acc, {
      empId: acc.EmpID || empId,
      empName: acc.FullName || empInfo.FullName || empInfo['Họ và Tên'] || 'Chưa xác định',
      boPhan: dept,
      Bophan: dept,
      ngheNghiep: job,
      Nghenghiep: job,
      loaiSuCo: type,
      'LoaiSuCo-IncidentType': type,
      mucDo: sev,
      'Mucdo-Severity': sev,
      phanLoai: classify,
      Phanloai: classify,
      nguyenNhan: cause,
      Nguyennhan: cause,
      yeuToChanThuong: factor,
      Yeutochanthuong: factor,
      trangThai: acc.Trangthai || acc.Status || acc.trangThai || 'Chưa điều tra',
      Trangthai: acc.Trangthai || acc.Status || acc.trangThai || 'Chưa điều tra'
    });
  });
}

function uploadFilesToDrive(files, prefixId) {
  var fileUrls = [];
  try {
    var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    files.forEach(function(f) {
      if (f.base64) {
        var bytes = Utilities.base64Decode(f.base64);
        var blob = Utilities.newBlob(bytes, f.mimeType || 'image/jpeg', prefixId + '_' + (f.fileName || 'file.jpg'));
        var driveFile = folder.createFile(blob);
        driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrls.push(driveFile.getUrl());
      }
    });
  } catch (e) {
    Logger.log("Lỗi upload Drive: " + e.toString());
  }
  return fileUrls;
}

function normalizeAccidentData(data) {
  if (!data) return;
  var empId = data.empId || data.EmpID || '';
  var date = data.incidentDate || data.IncidentDate || '';
  var loc = data.location || data.Location || '';
  var sev = data.mucDo || data.severity || data['Mucdo-Severity'] || data.Severity || '';
  var desc = data.description || data.Description || '';
  var wit = data.witness || data.Witness || '';
  var att = data.Attachments || data.attachments || '';
  var type = data.loaiSuCo || data.incidentType || data['LoaiSuCo-IncidentType'] || data.IncidentType || '';
  var dept = data.boPhan || data.Bophan || data.BoPhan || '';
  var job = data.ngheNghiep || data.Nghenghiep || '';
  var classify = data.phanLoai || data.Phanloai || '';
  var cause = data.nguyenNhan || data.Nguyennhan || data.NguyenNhan || '';
  var factor = data.yeuToChanThuong || data.Yeutochanthuong || data.YeuToChanThuong || '';
  var st = data.trangThai || data.Trangthai || data.Status || data.TrangThai || 'Chưa điều tra';

  // Lưu lại vừa đúng tên cột Sheet vừa hỗ trợ camelCase
  data['AccidentID'] = data.AccidentID || '';
  data['EmpID'] = empId;
  data['IncidentDate'] = date;
  data['Location'] = loc;
  data['Mucdo-Severity'] = sev;
  data['Description'] = desc;
  data['Witness'] = wit;
  data['Status'] = st;
  data['Attachments'] = att;
  data['LoaiSuCo-IncidentType'] = type;
  data['Bophan'] = dept;
  data['Nghenghiep'] = job;
  data['Phanloai'] = classify;
  data['Nguyennhan'] = cause;
  data['Yeutochanthuong'] = factor;
  data['Trangthai'] = st;
}

function countByKey(arr, keys) {
  var counts = {};
  if (!Array.isArray(arr)) return counts;
  
  arr.forEach(function(item) {
    if (!item) return;
    var val = '';
    for (var i = 0; i < keys.length; i++) {
      if (item[keys[i]]) {
        val = item[keys[i]];
        break;
      }
    }
    if (!val) val = 'Khác';
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

function getSheetData(ss, sheetName) {
  var data = getRawSheetData(ss, sheetName);
  return createJsonResponse({ status: 'success', data: data });
}

function getRawSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var item = {};
    var hasData = false;
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      }
      item[headers[j]] = val;
      if (val !== "") hasData = true;
    }
    if (hasData) result.push(item);
  }
  return result;
}

function appendOrUpdateSheet(ss, sheetName, rowData) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return createJsonResponse({ status: 'error', message: 'Cấu trúc Bảng tính trống!' });

  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var newRow = [];
  
  for (var i = 0; i < currentHeaders.length; i++) {
    var header = currentHeaders[i];
    var value = rowData[header];
    
    if (value === undefined || value === null) {
      for (var key in rowData) {
        if (key && key.toLowerCase() === header.toLowerCase()) {
          value = rowData[key];
          break;
        }
      }
    }
    newRow.push(value !== undefined && value !== null ? value : "");
  }
  
  sheet.appendRow(newRow);
  return createJsonResponse({ 
    status: 'success', 
    message: 'Đã lưu thành công vào tab ' + sheetName,
    accidentId: rowData.AccidentID 
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
