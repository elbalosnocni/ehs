/**
 * DASHBOARD.GS - Tính toán KPI, FR, SR, Lost Days
 */
const Dashboard = {
  getStats: function() {
    const accidents = Utils.getSheetData(CONFIG.SHEETS.ACCIDENT);
    const employees = Utils.getSheetData(CONFIG.SHEETS.EMPLOYEE);
    const bhxh = Utils.getSheetData(CONFIG.SHEETS.BHXH);

    const totalEmployee = employees.length || 3000; // Giả định nếu chưa import đủ
    const totalAccidents = accidents.length;
    
    // Tính tổng số ngày nghỉ (Lost Days)
    let totalLostDays = 0;
    bhxh.forEach(row => {
      totalLostDays += Number(row.TotalDaysOff || 0);
    });

    // Giả định tổng giờ làm việc = Số NLĐ * 8 giờ * 22 ngày * 12 tháng
    const totalWorkingHours = totalEmployee * 8 * 22 * 12;

    // Tỷ lệ Tần suất (Frequency Rate) & Tỷ lệ Mức độ nghiêm trọng (Severity Rate)
    const frequencyRate = (totalAccidents * 1000000) / totalWorkingHours;
    const severityRate = (totalLostDays * 1000000) / totalWorkingHours;

    return Utils.responseJSON({
      status: "success",
      kpi: {
        totalEmployee: totalEmployee,
        totalAccident: totalAccidents,
        lostDays: totalLostDays,
        frequencyRate: frequencyRate.toFixed(2),
        severityRate: severityRate.toFixed(2)
      }
    });
  }
};
