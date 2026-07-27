/**
 * AUTH.GS - Quản lý Đăng nhập & Quyền truy cập
 */
const Auth = {
  login: function(payload) {
    const username = payload.username ? payload.username.trim() : "";
    const password = payload.password ? payload.password.trim() : "";

    const users = Utils.getSheetData(CONFIG.SHEETS.USER);
    const user = users.find(u => u.Username === username && u.Password === password && u.Status === "Active");

    if (user) {
      Utils.writeLog(user.UserID, "LOGIN", { status: "Success" });
      return Utils.responseJSON({
        status: "success",
        user: {
          userId: user.UserID,
          username: user.Username,
          role: user.Role,
          email: user.Email
        }
      });
    } else {
      return Utils.responseJSON({
        status: "error",
        message: "Tên đăng nhập hoặc mật khẩu không chính xác!"
      });
    }
  }
};
