# Changelog

## 3.0.0
- Hybrid deployment package: GitHub Pages workflow + Google Apps Script backend.
- Added Near Miss, Unsafe Act, Unsafe Condition, Inspection, Training, PPE, Risk Assessment and WORKING_HOURS schemas.
- Added generic module CRUD, audit, soft archive, plant/department filters and pagination.
- Fixed Incident field-name normalization, 5 WHY upsert, serialized ID sequence, setup-per-request, Drive folder fallback, first-login password change, CAPA verification gating, BHXH year filtering and KPI actual-hours handling.
- Added Spreadsheet + attachment backup action.
- No migration step deletes existing records. New fields/sheets are additive.


## 3.1.0
- Thêm tab Hướng dẫn sử dụng cho nhân viên và quản lý.
- Thêm EHS Public Dashboard riêng cho toàn công ty, lọc theo năm, chỉ hiển thị dữ liệu tổng hợp không định danh.
- Bổ sung API chỉ đọc `getPublicDashboard`; không trả bản ghi chi tiết.

## 3.1.1
- Mở rộng tab Hướng dẫn sử dụng với sơ đồ quyết định "Chọn đúng tab trong 30 giây".
- Bổ sung ví dụ phân biệt Incident, Near Miss, Unsafe Act, Unsafe Condition, Inspection và Risk Assessment.
- Làm rõ Investigation và CAPA là các bước xử lý tiếp theo, không phải tab khai báo nguy cơ ban đầu; Training và PPE dùng cho nghiệp vụ đào tạo/cấp phát.
- Bổ sung bảng tra nhanh tình huống → tab khai báo.
