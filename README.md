# EHS Manager 3.0 — Hybrid

Hệ thống quản lý EHS đa nhà máy/bộ phận, dữ liệu Google Sheets, frontend GitHub Pages, backend Google Apps Script. Chính sách lưu trữ cấu hình 10 năm; không có job tự xóa dữ liệu.

## Thành phần
- Incident (tương thích dữ liệu ACCIDENT cũ), Near Miss, Unsafe Act, Unsafe Condition.
- Investigation + FIVE_WHY, CAPA + CAPA_VERIFICATION.
- Inspection, Training, PPE, Risk Assessment.
- Employee, Dashboard, Audit Log, System Backup, Working Hours.
- Backend authorization theo role; scope Plant/Department có thể gắn vào tài khoản USER.
- ID tăng tuần tự có khóa script; cập nhật 5 WHY theo InvestigationID + StepNo; phân trang cho module mới.
- KPI không tự ước tính giờ công. Nhập giờ công thực tế vào WORKING_HOURS hoặc SETTING key WORKING_HOURS_<YEAR>.

## 1. Chuẩn bị Google Sheets / Apps Script
1. Tạo hoặc chọn Spreadsheet hiện tại. Không xóa Sheet cũ.
2. Mở Extensions → Apps Script. Tạo/copy toàn bộ file `.gs` trong `backend/` vào project Apps Script (mỗi file giữ nguyên tên).
3. Trong `backend/Config.gs`, cấu hình `SPREADSHEET_ID` (để trống chỉ khi script bound vào Spreadsheet) và `DRIVE_FOLDER_ID` bằng ID thư mục Drive mà tài khoản triển khai có quyền truy cập. ID không hợp lệ sẽ báo lỗi; ứng dụng không tự tạo thư mục thay thế.
4. Chạy `setupEHS()` một lần bằng tài khoản quản trị triển khai. Hàm bổ sung Sheet/header còn thiếu, thêm cài đặt MULTI/HYBRID/10 năm và giữ nguyên bản ghi cũ. Nếu USER rỗng, tạo `admin / Admin@123`; bắt buộc đổi mật khẩu ở lần đăng nhập đầu.
5. Deploy → New deployment → Web app; Execute as: Me. Chọn phạm vi truy cập phù hợp chính sách tổ chức. Nếu dùng truy cập công khai, backend vẫn yêu cầu đăng nhập; nên giới hạn người dùng nếu môi trường Google Workspace cho phép.
6. Cập nhật URL Web App `/exec` vào `frontend/config.js`.

## 2. GitHub Pages
- Đưa repository lên GitHub.
- Settings → Pages → Build and deployment → Source: GitHub Actions.
- Workflow `.github/workflows/pages.yml` tự publish thư mục `frontend/`.
- Đặt `frontend/config.js` trỏ đến URL Apps Script trước khi deploy. Không commit thông tin mật khẩu, token hoặc dữ liệu cá nhân.

## 3. Cấu hình đa nhà máy / bộ phận
- Một công ty, nhiều Plant và Department. USER có cột Plant và Department; để trống nghĩa là không giới hạn theo hai trường này (quyền vẫn phụ thuộc role).
- Gán Plant/Department trực tiếp trong Sheet USER cho tài khoản bị giới hạn.
- Nếu tổ chức cần phân tách dữ liệu nghiêm ngặt theo nhiều pháp nhân, cần mở rộng tenant_id và kiểm thử quyền trước khi vận hành.

## 4. Giờ công và KPI
- Ghi giờ công thực tế vào Sheet `WORKING_HOURS`: Year, Period, Plant, Department, Hours, Source, ApprovedBy, ApprovedDate.
- Hoặc dùng SETTING `WORKING_HOURS_<YEAR>` cho tổng giờ công thực tế toàn công ty.
- Nếu chưa cấu hình giờ công, FR/TRIR/SR trả null, không tự dùng công thức 8×22×12.
- Ngày nghỉ BHXH cùng AccidentID được đối chiếu bằng giá trị lớn nhất giữa BHXH và LostDays của sự cố để tránh cộng trùng. BHXH được lọc theo năm StartDate/CreatedDate.

## 5. Sao lưu và lưu trữ
- Admin gọi action `createBackup` để sao chép Spreadsheet và các file đính kèm được đăng ký trong ATTACHMENT.
- Kiểm tra phục hồi là bước vận hành bắt buộc; backup được tạo không đồng nghĩa đã kiểm thử restore.
- Retention 10 năm là chính sách lưu trữ, không tự động xóa dữ liệu sau 10 năm. Không chạy cleanup tự động.

## 6. Lưu ý phạm vi hoàn thiện
Các module nghiệp vụ mới có CRUD cơ bản, audit, soft archive và phân trang. Các quy trình phê duyệt chuyên sâu, checklist tùy biến, import/export theo từng module, kiểm thử khôi phục tự động, SSO và phân quyền theo từng trường dữ liệu cần được cấu hình/kiểm thử tiếp theo trước khi đưa vào môi trường sản xuất có dữ liệu nhạy cảm. Không lưu hồ sơ y tế nhạy cảm trong module công khai; MEDICAL cần role/field policy chuyên biệt trước khi sử dụng.

## 7. Nâng cấp
- Sao lưu trước khi cập nhật.
- Deploy backend version mới, cập nhật frontend.
- Không chạy setup trên môi trường đang ghi dữ liệu nếu chưa có backup gần nhất.
- Version 3.0 bổ sung sheet/header; không xóa dữ liệu cũ.


## 8. EHS Manager 3.1 – Hướng dẫn & Public Dashboard
- Menu **Hướng dẫn sử dụng** chứa quy trình thao tác cho 10 module và nguyên tắc bảo mật/dữ liệu.
- Menu **Dashboard công khai** mở `frontend/public-dashboard.html` trong tab mới. Trang này gọi action `getPublicDashboard` không cần đăng nhập và CHỈ trả số liệu tổng hợp (KPI, số lượng theo module, Incident theo tháng); không trả tên nhân viên, mã hồ sơ, mô tả, hồ sơ y tế, bằng chứng hoặc nội dung điều tra.
- Dashboard công khai là công khai theo URL GitHub Pages. Chỉ đưa URL này lên mạng nội bộ/trang công ty sau khi bộ phận EHS và IT duyệt chính sách công bố. Nếu không muốn công khai Internet, giới hạn quyền truy cập ở lớp hosting/proxy hoặc không chia sẻ URL; GitHub Pages public repository không phải cơ chế xác thực.
- API `getPublicDashboard` được thiết kế chỉ đọc và tổng hợp. Trước vận hành, rà soát các chỉ số tổng hợp có thể nhạy cảm theo quy định công ty và kiểm tra CORS/deployment thực tế.

## 9. Hướng dẫn chọn tab khai báo (3.1.1)
Dùng nguyên tắc phân loại nhanh trong tab **Hướng dẫn sử dụng**:
- Đã có thương tích/thiệt hại hoặc sự cố đã xảy ra → **Incident**.
- Suýt gây hậu quả nhưng chưa có thương tích/thiệt hại → **Near Miss**.
- Nguy cơ xuất phát từ hành vi/cách làm của con người → **Unsafe Act**.
- Nguy cơ xuất phát từ tình trạng thiết bị, nơi làm việc hoặc môi trường → **Unsafe Condition**.
- Đang thực hiện đợt kiểm tra có kế hoạch/checklist → **Inspection**.
- Cần nhận diện mối nguy và chấm/đánh giá rủi ro của hoạt động → **Risk Assessment**.
- Ghi nhận một khóa/buổi đào tạo → **Training**; ghi cấp phát/đổi/theo dõi bảo hộ → **PPE**.
- Cần phân tích nguyên nhân của Incident đã ghi nhận → **Investigation**; giao và theo dõi hành động khắc phục/phòng ngừa → **CAPA** (trong khu vực Điều tra & CAPA).

Đây là hướng dẫn thao tác để chọn đúng chức năng phần mềm. Trường hợp nghiêm trọng hoặc chưa rõ phân loại, ưu tiên bảo đảm an toàn, báo quản lý/EHS ngay và để EHS quyết định phân loại theo quy trình nội bộ. Không trì hoãn thông báo khẩn cấp để chờ khai báo trên hệ thống.

## 10. Dashboard 3.2.0
- Bộ lọc năm, nhà máy, bộ phận; áp dụng ở backend và tôn trọng phạm vi tài khoản.
- FR/TRIR/SR hiện “Chưa cấu hình” nếu thiếu giờ công; không tự ước tính giờ công.
- Recordable tạm tính từ MedicalRequired, LostTime, LostDays và Classification; cần EHS phê duyệt quy tắc trước nghiệm thu.
- Sau cập nhật cần deploy phiên bản Apps Script mới và publish lại GitHub Pages.
