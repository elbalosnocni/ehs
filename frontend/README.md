# EHS Manager 2.0

## 1. Backend
1. Tạo một Google Spreadsheet mới hoặc dùng Spreadsheet hiện tại.
2. Mở Extensions → Apps Script.
3. Copy toàn bộ file `.gs` trong `backend/` vào Apps Script.
4. Trong `Config.gs`, kiểm tra `DRIVE_FOLDER_ID` và nếu cần điền `SPREADSHEET_ID`.
5. Chạy hàm `setupEHS()` một lần bằng tài khoản triển khai. Nếu chưa có USER, hệ thống tạo `admin / Admin@123` và bắt buộc đổi mật khẩu.
6. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone.
7. Copy URL `/exec` của Web App vào `frontend/config.js`.

## 2. Frontend
Upload toàn bộ `frontend/` lên GitHub Pages. Không cần Apps Script HTML Service.

## 3. Lưu ý bảo mật
- Không đặt mật khẩu vào frontend.
- Không chia sẻ file Drive `Anyone with link`.
- Có thể đổi `DRIVE_FOLDER_ID` sang thư mục EHS riêng.
- Sau khi login bằng tài khoản admin mặc định, đổi mật khẩu ngay.
- Nếu thay đổi backend, deploy version mới và cập nhật URL nếu Google tạo deployment URL khác.

## 4. Luồng nghiệp vụ
Incident → Timeline → Investigation → 5 Why/Root Cause → CAPA → Evidence → Verification → Closed.

## 5. Tương thích dữ liệu cũ
`setupEHS()` tạo sheet còn thiếu và bổ sung header còn thiếu; không xóa dữ liệu cũ. `EMPLOYEE` import là upsert theo EmpID, không xóa nhân viên cũ.
