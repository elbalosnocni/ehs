/**
 * DASHBOARD.GS - Tính toán KPI và Thống kê dữ liệu Biểu đồ
 */
const Dashboard = {
  getStats: function() {
    // 1. Lấy dữ liệu từ các Sheets
    const accidents = Utils.getSheetData(CONFIG.SHEETS.ACCIDENT) || [];
    const employees = Utils.getSheetData(CONFIG.SHEETS.EMPLOYEE) || [];
    const bhxh = Utils.getSheetData(CONFIG.SHEETS.BHXH) || [];

    // --- A. TÍNH TOÁN KPIs ---
    const totalEmployee = employees.length || 3000; // Mặc định nếu chưa nạp đủ nhân sự
    const totalAccidents = accidents.length;
    
    // Tính tổng số ngày nghỉ (Lost Days) từ Sheet BHXH
    let totalLostDays = 0;
    bhxh.forEach(row => {
      totalLostDays += Number(row.TotalDaysOff || row.SoNgayNghi || 0);
    });

    // Giả định tổng giờ làm việc trong năm = Số NLĐ * 8 giờ * 22 ngày * 12 tháng
    const totalWorkingHours = totalEmployee * 8 * 22 * 12;

    // Tỷ lệ Tần suất (FR) & Mức độ nghiêm trọng (SR)
    const frequencyRate = totalWorkingHours > 0 ? ((totalAccidents * 1000000) / totalWorkingHours) : 0;
    const severityRate = totalWorkingHours > 0 ? ((totalLostDays * 1000000) / totalWorkingHours) : 0;


    // --- B. TÍNH TOÁN DỮ LIỆU CÁC BIỂU ĐỒ (CHARTS) ---
    
    // 1. Tai nạn theo Tháng (Mảng 12 phần tử từ T1 -> T12)
    const monthlyAccidents = new Array(12).fill(0);

    // Dùng object Map để đếm số lượng cho các nhóm
    const deptMap = {};     // Bộ phận (BoPhan)
    const causeMap = {};    // Nguyên nhân (NguyenNhan)
    const factorMap = {};   // Yếu tố chấn thương (YeuToChanThuong)
    const statusMap = {};   // Trạng thái (TrangThai)

    accidents.forEach(row => {
      // a. Thống kê theo Tháng (Dựa vào trường 'NgayXayRa' hoặc 'Ngay')
      const accidentDate = row.NgayXayRa || row.Ngay || row.CreatedDate;
      if (accidentDate) {
        const dateObj = new Date(accidentDate);
        if (!isNaN(dateObj.getTime())) {
          const monthIndex = dateObj.getMonth(); // 0 -> 11
          monthlyAccidents[monthIndex]++;
        }
      }

      // b. Thống kê theo Bộ phận (BoPhan)
      const dept = row.BoPhan || row.Xuong || 'Khác';
      deptMap[dept] = (deptMap[dept] || 0) + 1;

      // c. Thống kê theo Nguyên nhân (NguyenNhan)
      const cause = row.NguyenNhan || row.NguyenNhanXayRa || 'Khác';
      causeMap[cause] = (causeMap[cause] || 0) + 1;

      // d. Thống kê theo Yếu tố chấn thương (YeuToChanThuong)
      const factor = row.YeuToChanThuong || row.YeuTo || 'Khác';
      factorMap[factor] = (factorMap[factor] || 0) + 1;

      // e. Thống kê theo Trạng thái điều tra (TrangThai)
      const status = row.TrangThai || 'Chưa điều tra';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    // Helper hàm chuyển từ Object Map sang dạng { labels: [], data: [] }
    function formatChartData(mapObj) {
      return {
        labels: Object.keys(mapObj),
        data: Object.values(mapObj)
      };
    }

    // --- C. TRẢ VỀ KẾT QUẢ JSON ---
    return Utils.responseJSON({
      status: "success",
      kpi: {
        totalEmployee: totalEmployee,
        totalAccident: totalAccidents,
        lostDays: totalLostDays,
        frequencyRate: frequencyRate.toFixed(2),
        severityRate: severityRate.toFixed(2)
      },
      charts: {
        monthly: monthlyAccidents,
        department: formatChartData(deptMap),
        cause: formatChartData(causeMap),
        injuryFactor: formatChartData(factorMap),
        status: formatChartData(statusMap)
      }
    });
  }
};
