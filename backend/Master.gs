/**
 * Lấy các danh mục Dropdown từ tab MASTER
 */
function getMasterDropdowns() {
  const masterSheet = Utils.getSheetData(CONFIG.SHEETS.MASTER); // Hoặc "MASTER"
  
  // Khởi tạo các mảng danh mục
  const departments = [];
  const causes = [];
  const injuryFactors = [];
  const statuses = [];

  masterSheet.forEach(row => {
    if (row.BoPhan || row.Department) departments.push(row.BoPhan || row.Department);
    if (row.NguyenNhan || row.Cause) causes.push(row.NguyenNhan || row.Cause);
    if (row.YeuToChanThuong || row.InjuryFactor) injuryFactors.push(row.YeuToChanThuong || row.InjuryFactor);
    if (row.TrangThai || row.Status) statuses.push(row.TrangThai || row.Status);
  });

  return Utils.responseJSON({
    status: "success",
    data: {
      departments: [...new Set(departments)], // Lọc trùng
      causes: [...new Set(causes)],
      injuryFactors: [...new Set(injuryFactors)],
      statuses: [...new Set(statuses)]
    }
  });
}
