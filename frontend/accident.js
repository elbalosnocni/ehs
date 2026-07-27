async function renderAccidentView() {
  const container = document.getElementById('mainContainer');
  container.innerHTML = `<div class="text-center py-10 text-slate-500"><i class="fa-solid fa-spinner fa-spin text-2xl"></i><p class="mt-2">Đang tải danh sách hồ sơ...</p></div>`;

  // Gọi API lấy danh sách tai nạn
  const res = await API.get('getAccidents');
  const accidents = res.data || [];

  let tableRows = accidents.map(item => `
    <tr class="border-b hover:bg-slate-50 transition">
      <td class="p-3 font-semibold text-blue-600">${item.AccidentID || ''}</td>
      <td class="p-3">${item.EmpID || ''}</td>
      <td class="p-3">${item.IncidentDate ? new Date(item.IncidentDate).toLocaleString('vi-VN') : ''}</td>
      <td class="p-3">${item.Location || ''}</td>
      <td class="p-3">${item.IncidentType || ''}</td>
      <td class="p-3">
        <span class="px-2 py-1 text-xs rounded-full font-semibold ${getSeverityBadge(item.Severity)}">
          ${item.Severity || 'Nhe'}
        </span>
      </td>
      <td class="p-3">
        <span class="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">
          ${item.Status || 'Moi ghi nhan'}
        </span>
      </td>
      <td class="p-3 text-center">
        <button onclick="viewAccidentDetail('${item.AccidentID}')" class="text-blue-600 hover:text-blue-800 mr-2" title="Chi tiết">
          <i class="fa-solid fa-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');

  if (accidents.length === 0) {
    tableRows = `<tr><td colspan="8" class="text-center p-8 text-slate-400">Chưa có hồ sơ tai nạn nào được ghi nhận.</td></tr>`;
  }

  container.innerHTML = `
    <!-- TOP BAR -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex space-x-2">
        <input type="text" placeholder="Tìm kiếm theo Mã/NV..." class="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-64">
      </div>
      <button onclick="openAccidentModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center space-x-2 shadow-sm transition">
        <i class="fa-solid fa-plus"></i>
        <span>Khai báo Tai nạn mới</span>
      </button>
    </div>

    <!-- TABLE -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
          <tr>
            <th class="p-3">Mã Hồ Sơ</th>
            <th class="p-3">Mã NV</th>
            <th class="p-3">Thời Gian</th>
            <th class="p-3">Địa Điểm</th>
            <th class="p-3">Loại Sự Cố</th>
            <th class="p-3">Mức Độ</th>
            <th class="p-3">Trạng Thái</th>
            <th class="p-3 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>

    <!-- MODAL KHAI BÁO -->
    <div id="accidentModal" class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800">Khai Báo Tai Nạn / Sự Cố Mới</h3>
          <button onclick="closeAccidentModal()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form id="accidentForm" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Mã Nhân Viên *</label>
              <input type="text" id="accEmpId" required class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Thời Gian Xảy Ra *</label>
              <input type="datetime-local" id="accDate" required class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Địa Điểm Xảy Ra *</label>
              <input type="text" id="accLocation" required class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Loại Sự Cố *</label>
              <select id="accType" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="TNLĐ Nghỉ Việc">Tai nạn lao động nghỉ việc</option>
                <option value="TNLĐ Sơ Cứu">Tai nạn sơ cứu</option>
                <option value="Near Miss">Sự cố suýt giật (Near Miss)</option>
                <option value="Sự cố tài sản">Sự cố hỏng hóc tài sản</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Mức Độ Nghiêm Trọng</label>
              <select id="accSeverity" class="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Nhẹ">Nhẹ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Nghiêm trọng">Nghiêm trọng</option>
                <option value="Rất nghiêm trọng">Rất nghiêm trọng</option>
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
            <button type="submit" id="saveAccidentBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg">Lưu Hồ Sơ</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Bắt sự kiện Submit Form
  document.getElementById('accidentForm').addEventListener('submit', handleSaveAccident);
}

function getSeverityBadge(severity) {
  switch(severity) {
    case 'Nghiêm trọng': return 'bg-orange-100 text-orange-800';
    case 'Rất nghiêm trọng': return 'bg-red-100 text-red-800';
    case 'Trung bình': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-green-100 text-green-800';
  }
}

function openAccidentModal() {
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

  // Đọc file nếu có đính kèm
  const fileInput = document.getElementById('accFiles');
  const filesData = [];

  if (fileInput.files.length > 0) {
    for (let file of fileInput.files) {
      const base64 = await convertBase64(file);
      filesData.push({
        fileName: file.name,
        mimeType: file.type,
        base64: base64.split(',')[1] // Lấy chuỗi mã hóa
      });
    }
  }

  const payload = {
    empId: document.getElementById('accEmpId').value,
    incidentDate: document.getElementById('accDate').value,
    location: document.getElementById('accLocation').value,
    incidentType: document.getElementById('accType').value,
    severity: document.getElementById('accSeverity').value,
    witness: document.getElementById('accWitness').value,
    description: document.getElementById('accDesc').value,
    files: filesData,
    userId: currentUser.userId
  };

  const res = await API.post('createAccident', payload);

  if (res.status === 'success') {
    alert('Tạo hồ sơ thành công! Mã hồ sơ: ' + res.accidentId);
    closeAccidentModal();
    renderAccidentView(); // Refresh danh sách
  } else {
    alert('Lỗi: ' + res.message);
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
