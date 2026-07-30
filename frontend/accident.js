async function renderAccidentView() {
  const container = document.getElementById('mainContainer');
  container.innerHTML = `<div class="text-center py-10 text-slate-500"><i class="fa-solid fa-spinner fa-spin text-2xl"></i><p class="mt-2">Đang tải danh sách hồ sơ...</p></div>`;

  // Gọi API lấy danh sách tai nạn
  const res = await API.get('getAccidents');
  const accidents = res.data || [];

  let tableRows = accidents.map(item => {
    const id = item.AccidentID || item.accidentId || item['Mã Hồ Sơ'] || '';
    const empId = item.EmpID || item.empId || item['Mã NV'] || '';
    const dept = item.BoPhan || item.boPhan || item['Bộ Phận'] || '';
    const rawDate = item.IncidentDate || item.incidentDate || item['Thời Gian'] || '';
    const location = item.Location || item.location || item['Địa Điểm'] || '';
    const type = item.IncidentType || item.incidentType || item['Loại Sự Cố'] || '';
    const severity = item.Severity || item.severity || item['Mức Độ'] || 'Nhẹ';
    const status = item.TrangThai || item.status || item['Trạng Thái'] || 'Chưa điều tra';

    let formattedDate = rawDate;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleString('vi-VN');
      }
    }

    return `
      <tr class="border-b hover:bg-slate-50 transition">
        <td class="p-3 font-semibold text-blue-600 whitespace-nowrap">${id}</td>
        <td class="p-3 font-medium whitespace-nowrap">${empId}</td>
        <td class="p-3 whitespace-nowrap">${dept}</td>
        <td class="p-3 whitespace-nowrap">${formattedDate}</td>
        <td class="p-3 whitespace-nowrap">${location}</td>
        <td class="p-3 whitespace-nowrap">${type}</td>
        <td class="p-3 whitespace-nowrap">
          <span class="px-2 py-1 text-xs rounded-full font-semibold ${getSeverityBadge(severity)}">
            ${severity}
          </span>
        </td>
        <td class="p-3 whitespace-nowrap">
          <span class="px-2 py-1 text-xs rounded-full ${getStatusBadge(status)} font-medium">
            ${status}
          </span>
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          <button onclick="viewAccidentDetail('${id}')" class="text-blue-600 hover:text-blue-800 p-1" title="Chi tiết">
            <i class="fa-solid fa-eye text-base"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (accidents.length === 0) {
    tableRows = `<tr><td colspan="9" class="text-center p-8 text-slate-400">Chưa có hồ sơ tai nạn nào được ghi nhận.</td></tr>`;
  }

  container.innerHTML = `
    <!-- TOP BAR -->
    <div class="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mb-6">
      <div class="relative flex-1 min-w-0 max-w-md">
        <input type="text" placeholder="Tìm kiếm theo Mã/NV..." class="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400"></i>
      </div>
      <button onclick="openAccidentModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 shadow-sm transition whitespace-nowrap">
        <i class="fa-solid fa-plus"></i>
        <span>Khai báo Tai nạn mới</span>
      </button>
    </div>

    <!-- TABLE -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto w-full">
        <table class="w-full text-left text-sm min-w-[800px]">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
            <tr>
              <th class="p-3">Mã Hồ Sơ</th>
              <th class="p-3">Mã NV</th>
              <th class="p-3">Bộ Phận / Xưởng</th>
              <th class="p-3">Thời Gian</th>
              <th class="p-3">Địa Điểm</th>
              <th class="p-3">Loại Sự Cố</th>
              <th class="p-3">Mức Độ</th>
              <th class="p-3">Trạng Thái</th>
              <th class="p-3 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL KHAI BÁO -->
    <div id="accidentModal" class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <h3 class="font-bold text-slate-800">Khai Báo Tai Nạn / Sự Cố Mới</h3>
          <button onclick="closeAccidentModal()" class="text-slate-400 hover:text-slate-600 p-1"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form id="accidentForm" class="p-4 sm:p-6 space-y-4">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Mã Nhân Viên *</label>
              <input type="text" id="accEmpId" required onblur="checkEmployeeName(this.value)" placeholder="Ví dụ: PR5511" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase">
              <span id="empNamePreview" class="text-xs font-semibold mt-1 block"></span>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Bộ Phận / Xưởng *</label>
              <input type="text" id="accDepartment" required placeholder="Nhập hoặc tự động điền từ NV" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Thời Gian Xảy Ra *</label>
              <input type="datetime-local" id="accDate" required class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Địa Điểm Xảy Ra *</label>
              <input type="text" id="accLocation" required class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Loại Sự Cố *</label>
              <select id="accType" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Tai nạn lao động nghỉ việc">Tai nạn lao động nghỉ việc</option>
                <option value="Tai nạn sơ cứu">Tai nạn sơ cứu</option>
                <option value="Sự cố suýt giật (Near Miss)">Sự cố suýt giật (Near Miss)</option>
                <option value="Sự cố hỏng hóc tài sản">Sự cố hỏng hóc tài sản</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Mức Độ Nghiêm Trọng</label>
              <select id="accSeverity" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Nhẹ">Nhẹ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Nghiêm trọng">Nghiêm trọng</option>
                <option value="Rất nghiêm trọng">Rất nghiêm trọng</option>
              </select>
            </div>
          </div>

          <!-- BỔ SUNG CÁC TRƯỜNG DỮ LIỆU BÁO CÁO MỚI -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Nguyên Nhân Sự Cố *</label>
              <select id="accCause" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Do NLĐ">Do Người lao động (Thao tác sai, vi phạm QT...)</option>
                <option value="Do người SDLĐ">Do Người sử dụng lao động (Thiết bị lỗi, BOHL thiếu...)</option>
                <option value="Khách quan khó tránh">Khách quan khó tránh (Thiên tai, môi trường...)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Yếu Tố Chấn Thương *</label>
              <select id="accInjuryFactor" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Vật rơi, đổ, sập">Vật rơi, đổ, sập</option>
                <option value="Thiết bị nâng">Thiết bị nâng / cẩu</option>
                <option value="Thiết bị áp lực">Thiết bị áp lực / Điện</option>
                <option value="Hóa chất / Môi trường">Hóa chất / Môi trường</option>
                <option value="Khác">Yếu tố khác</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Trạng Thái Điều Tra</label>
              <select id="accStatus" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Chưa điều tra">Chưa điều tra</option>
                <option value="Đang điều tra">Đang điều tra</option>
                <option value="Chờ BHXH">Chờ BHXH</option>
                <option value="Hoàn tất">Hoàn tất</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Người Chứng Kiến</label>
              <input type="text" id="accWitness" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Mô Tả Diễn Biến Sự Cố *</label>
            <textarea id="accDesc" rows="3" required class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Đính Kèm Ảnh / File (PDF, Video)</label>
            <input type="file" id="accFiles" multiple class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onclick="closeAccidentModal()" class="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-100">Hủy</button>
            <button type="submit" id="saveAccidentBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm">Lưu Hồ Sơ</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('accidentForm').addEventListener('submit', handleSaveAccident);
}

// Kiểm tra tên NV khi nhập Mã NV trong Form & tự chọn Bộ phận
async function checkEmployeeName(empId) {
  const previewEl = document.getElementById('empNamePreview');
  const deptInput = document.getElementById('accDepartment');
  if (!previewEl) return;

  const cleanEmpId = empId.toString().trim().toUpperCase();
  if (!cleanEmpId) {
    previewEl.innerText = '';
    return;
  }
  
  previewEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tra cứu...';
  previewEl.className = "text-xs font-semibold text-blue-600 mt-1 block";

  try {
    const res = await API.get('getEmployees'); 

    if (!res || res.status !== 'success' || !Array.isArray(res.data)) {
      previewEl.innerText = '⚠️ Không thể tải danh sách NV';
      previewEl.className = "text-xs font-semibold text-red-600 mt-1 block";
      return;
    }

    const employees = res.data;
    const emp = employees.find(e => {
      const val = (e.EmpID || e.empId || e['Mã NV'] || e['Mã nhân viên'] || '').toString().trim().toUpperCase();
      return val === cleanEmpId;
    });

    if (emp) {
      const fullName = emp.FullName || emp.fullName || emp['Họ và Tên'] || emp['Họ Tên'] || '';
      const dept = emp.Department || emp.department || emp['Bộ phận'] || emp['Bộ Phận'] || '';
      
      previewEl.innerText = `✓ Họ Tên: ${fullName} ${dept ? '(' + dept + ')' : ''}`;
      previewEl.className = "text-xs font-semibold text-emerald-600 mt-1 block";
      
      // Tự động điền bộ phận nếu có
      if (deptInput && dept) {
        deptInput.value = dept;
      }
    } else {
      previewEl.innerText = '⚠️ Không tìm thấy Mã NV trong hệ thống!';
      previewEl.className = "text-xs font-semibold text-amber-600 mt-1 block";
    }
  } catch (err) {
    console.error("Lỗi gọi API getEmployees:", err);
    previewEl.innerText = '⚠️ Lỗi kết nối máy chủ!';
    previewEl.className = "text-xs font-semibold text-red-600 mt-1 block";
  }
}

function getSeverityBadge(severity) {
  switch(severity) {
    case 'Nghiêm trọng': return 'bg-orange-100 text-orange-800';
    case 'Rất nghiêm trọng': return 'bg-red-100 text-red-800';
    case 'Trung bình': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-green-100 text-green-800';
  }
}

function getStatusBadge(status) {
  switch(status) {
    case 'Hoàn tất': return 'bg-emerald-100 text-emerald-800';
    case 'Chờ BHXH': return 'bg-amber-100 text-amber-800';
    case 'Đang điều tra': return 'bg-blue-100 text-blue-800';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function openAccidentModal() {
  const preview = document.getElementById('empNamePreview');
  if (preview) preview.innerText = '';
  document.getElementById('accidentModal').classList.remove('hidden');
}

function closeAccidentModal() {
  document.getElementById('accidentModal').classList.add('hidden');
}

async function handleSaveAccident(e) {
  e.preventDefault();
  const btn = document.getElementById('saveAccidentBtn');
  btn.innerText = "Đang lưu & Upload...";
  btn.disabled = true;

  const fileInput = document.getElementById('accFiles');
  const filesData = [];

  if (fileInput.files.length > 0) {
    for (let file of fileInput.files) {
      const base64 = await convertBase64(file);
      filesData.push({
        fileName: file.name,
        mimeType: file.type,
        base64: base64.split(',')[1]
      });
    }
  }

  // Payload mở rộng bổ sung các trường báo cáo mới
  const payload = {
    empId: document.getElementById('accEmpId').value,
    boPhan: document.getElementById('accDepartment').value,
    incidentDate: document.getElementById('accDate').value,
    location: document.getElementById('accLocation').value,
    incidentType: document.getElementById('accType').value,
    severity: document.getElementById('accSeverity').value,
    nguyenNhan: document.getElementById('accCause').value,
    yeuToChanThuong: document.getElementById('accInjuryFactor').value,
    trangThai: document.getElementById('accStatus').value,
    witness: document.getElementById('accWitness').value,
    description: document.getElementById('accDesc').value,
    files: filesData,
    userId: typeof currentUser !== 'undefined' && currentUser ? currentUser.userId : ''
  };

  const res = await API.post('createAccident', payload);

  if (res.status === 'success') {
    alert('Tạo hồ sơ thành công! Mã hồ sơ: ' + (res.accidentId || res.id));
    document.getElementById('accidentForm').reset();
    btn.innerText = "Lưu Hồ Sơ";
    btn.disabled = false;
    
    closeAccidentModal();
    renderAccidentView();
  } else {
    alert('Lỗi: ' + (res.message || 'Không thể lưu dữ liệu'));
    btn.innerText = "Lưu Hồ Sơ";
    btn.disabled = false;
  }
}

function convertBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// XEM CHI TIẾT HỒ SƠ
async function viewAccidentDetail(accidentId) {
  let detailModal = document.getElementById('accidentDetailModal');
  if (!detailModal) {
    detailModal = document.createElement('div');
    detailModal.id = 'accidentDetailModal';
    detailModal.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4';
    document.body.appendChild(detailModal);
  }

  detailModal.innerHTML = `
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-center text-slate-500">
      <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
      <p class="mt-2 text-sm">Đang tải thông tin chi tiết...</p>
    </div>
  `;
  detailModal.classList.remove('hidden');

  const res = await API.get('getAccidents');
  const list = res.data || [];
  const item = list.find(x => (x.AccidentID || x.accidentId || x['Mã Hồ Sơ']) === accidentId);

  if (!item) {
    alert('Không tìm thấy thông tin hồ sơ!');
    detailModal.classList.add('hidden');
    return;
  }

  const id = item.AccidentID || item.accidentId || item['Mã Hồ Sơ'] || '';
  const empId = item.EmpID || item.empId || item['Mã NV'] || '';
  const dept = item.BoPhan || item.boPhan || item['Bộ Phận'] || 'Khác';
  const rawDate = item.IncidentDate || item.incidentDate || item['Thời Gian'] || '';
  const location = item.Location || item.location || item['Địa Điểm'] || '';
  const type = item.IncidentType || item.incidentType || item['Loại Sự Cố'] || '';
  const severity = item.Severity || item.severity || item['Mức Độ'] || 'Nhẹ';
  const cause = item.NguyenNhan || item.nguyenNhan || item['Nguyên Nhân'] || 'Chưa cập nhật';
  const factor = item.YeuToChanThuong || item.yeuToChanThuong || item['Yếu Tố Chấn Thương'] || 'Chưa cập nhật';
  const witness = item.Witness || item.witness || item['Người Chứng Kiến'] || 'Không có';
  const desc = item.Description || item.description || item['Mô Tả'] || 'Không có mô tả';
  const status = item.TrangThai || item.status || item['Trạng Thái'] || 'Chưa điều tra';
  const attachments = item.Attachments || item.attachments || item.FileDriveUrl || item.files || item['File Đính Kèm'] || '';

  // Tra cứu Họ Tên Nhân Viên
  let empFullName = empId; 
  const empRes = await API.get('getEmployees');
  if (empRes && empRes.data) {
    const foundEmp = empRes.data.find(e => (e.EmpID || e.empId || e['Mã NV']) === empId);
    if (foundEmp) {
      const fullName = foundEmp.FullName || foundEmp.fullName || foundEmp['Họ và Tên'] || foundEmp['Họ Tên'] || '';
      empFullName = `${empId} - ${fullName}`;
    }
  }

  // File đính kèm
  let fileListHTML = '<span class="text-slate-400 text-xs italic">Không có file đính kèm</span>';
  if (attachments && attachments.toString().trim() !== '') {
    const urls = attachments.toString().split(',');
    fileListHTML = urls.map((url, idx) => {
      const cleanUrl = url.trim();
      if (!cleanUrl) return '';
      return `
        <a href="${cleanUrl}" target="_blank" class="inline-flex items-center space-x-2 text-xs bg-blue-50 text-blue-700 font-medium px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 mr-2 mb-2 transition shadow-sm">
          <i class="fa-solid fa-paperclip text-blue-500"></i>
          <span>Xem File/Hình Ảnh Đính Kèm ${urls.length > 1 ? idx + 1 : ''}</span>
          <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-blue-400"></i>
        </a>
      `;
    }).join('');
  }

  // Popup chi tiết
  detailModal.innerHTML = `
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-4 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
        <h3 class="font-bold text-slate-800 text-base sm:text-lg">Chi Tiết Hồ Sơ: <span class="text-blue-600">${id}</span></h3>
        <button onclick="document.getElementById('accidentDetailModal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 p-1">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-4 sm:p-6 space-y-4 text-sm">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div><span class="text-xs text-slate-500 font-semibold block">NGƯỜI BỊ TAI NẠN</span><span class="font-bold text-slate-800">${empFullName}</span></div>
          <div><span class="text-xs text-slate-500 font-semibold block">BỘ PHẬN / XƯỞNG</span><span class="font-semibold text-slate-800">${dept}</span></div>
          <div><span class="text-xs text-slate-500 font-semibold block">TRẠNG THÁI</span><span class="font-semibold text-blue-600">${status}</span></div>
          <div><span class="text-xs text-slate-500 font-semibold block">THỜI GIAN XẢY RA</span><span>${rawDate ? (isNaN(new Date(rawDate).getTime()) ? rawDate : new Date(rawDate).toLocaleString('vi-VN')) : '--'}</span></div>
          <div><span class="text-xs text-slate-500 font-semibold block">ĐỊA ĐIỂM</span><span>${location}</span></div>
          <div><span class="text-xs text-slate-500 font-semibold block">LOẠI SỰ CỐ</span><span>${type}</span></div>
          <div><span class="text-xs text-slate-500 font-semibold block">NGUYÊN NHÂN</span><span>${cause}</span></div>
          <div><span class="text-xs text-slate-500 font-semibold block">YẾU TỐ CHẤN THƯƠNG</span><span>${factor}</span></div>
          <div><span class="text-xs text-slate-500 font-semibold block">MỨC ĐỘ</span><span class="font-semibold text-amber-600">${severity}</span></div>
        </div>

        <div>
          <span class="text-xs text-slate-500 font-semibold block mb-1">NGƯỜI CHỨNG KIẾN</span>
          <div class="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">${witness}</div>
        </div>

        <div>
          <span class="text-xs text-slate-500 font-semibold block mb-1">MÔ TẢ DIỄN BIẾN SỰ CỐ</span>
          <div class="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line">${desc}</div>
        </div>

        <div>
          <span class="text-xs text-slate-500 font-semibold block mb-2">TÀI LIỆU / HÌNH ẢNH ĐÍNH KÈM</span>
          <div class="flex flex-wrap">${fileListHTML}</div>
        </div>
      </div>

      <div class="p-4 border-t bg-slate-50 flex justify-end sticky bottom-0 z-10">
        <button onclick="document.getElementById('accidentDetailModal').classList.add('hidden')" class="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm rounded-lg transition">Đóng</button>
      </div>
    </div>
  `;
}
