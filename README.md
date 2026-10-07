# DORMEX - HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ SINH VIÊN

Đồ án / Bài tập lớn môn **Thiết Kế Web**  
Xây dựng theo chuẩn 100% cấu trúc thư mục quy định trong tài liệu `Dormex.docx`.

---

## 🎨 1. Tone Màu Giao Diện
- **Tone chủ đạo:** **Xanh nhạt & Trắng Pastel** (`Light Blue & White`).
  - Màu nhấn chính: `#0284c7`, `#0ea5e9`, `#38bdf8`
  - Màu nền mềm dịu: `#e0f2fe`, `#f0f9ff`, `#ffffff`
  - Giao diện sạch sẽ, thân thiện, tương thích tối đa trên cả máy tính, máy tính bảng và điện thoại di động (Responsive).

---

## 🗂️ 2. Cấu Trúc Dự Án (Theo Đúng File Dormex.docx)

```
Dormex-website/
├── index.html                  # Trang chủ giới thiệu KTX Dormex
├── login.html                  # Đăng nhập phân quyền (Admin & Sinh viên)
├── register.html               # Đăng ký tài khoản sinh viên mới
├── forgot-password.html        # Khôi phục mật khẩu
├── admin/                      # PHÂN HỆ BAN QUẢN LÝ KTX (ADMIN)
│   ├── index.html              # Dashboard thống kê tổng quan
│   ├── users.html              # Quản lý hồ sơ sinh viên lưu trú
│   ├── registrations.html      # Duyệt đơn xin đăng ký phòng
│   ├── rooms.html              # Quản lý quỹ phòng, giá phòng, trạng thái
│   ├── billing.html            # Lập & quản lý hóa đơn tiền phòng, điện nước
│   ├── maintenance.html        # Tiếp nhận & phân công sửa chữa CSVC
│   ├── announcements.html      # Đăng & ghim thông báo toàn KTX
│   ├── events.html             # Quản lý hoạt động & sự kiện ngoại khóa
│   └── rules.html              # Quản lý nội quy & mức phạt vi phạm
├── pages/                      # PHÂN HỆ SINH VIÊN & TRA CỨU
│   ├── home.html               # Trang tổng quan phòng ở của sinh viên
│   ├── profile.html            # Hồ sơ cá nhân & đổi mật khẩu
│   ├── registration.html       # Nộp đơn đăng ký phòng trực tuyến
│   ├── rooms.html              # Tra cứu phòng trống & tiện nghi
│   ├── announcements.html      # Xem bảng tin thông báo của BQL
│   ├── maintenance.html        # Báo hỏng thiết bị (điện, nước, wifi)
│   ├── billing.html            # Tra cứu hóa đơn & quét mã QR chuyển khoản
│   ├── events.html             # Đăng ký tham gia sự kiện KTX
│   ├── rules.html              # Xem nội quy ký túc xá & hotline
│   └── map.html                # Sơ đồ bản đồ khuôn viên KTX tương tác
├── assets/
│   ├── css/
│   │   ├── style.css           # CSS hệ thống, layout và màu sắc
│   │   ├── admin.css           # CSS bảng điều khiển quản trị
│   │   └── pages.css           # CSS cổng sinh viên & bản đồ
│   ├── js/
│   │   ├── main.js             # Script tiện ích (Toast, modal, auth check)
│   │   ├── data-store.js       # Data Engine (Hỗ trợ PHP API và fallback LocalStorage)
│   │   ├── admin.js            # Logic nghiệp vụ quản trị
│   │   └── student.js          # Logic nghiệp vụ sinh viên
│   └── images/
├── api/                        # BACKEND REST API (PHP)
│   ├── login.php               # Xác thực đăng nhập
│   ├── register.php            # Đăng ký tài khoản
│   ├── students.php            # API CRUD sinh viên
│   ├── registrations.php       # API đơn đăng ký
│   ├── rooms.php               # API CRUD phòng
│   ├── bills.php               # API hóa đơn điện nước
│   ├── maintenance.php         # API bảo trì sự cố
│   ├── announcements.php       # API thông báo
│   └── events.php              # API sự kiện
├── config/
│   └── database.php            # Kết nối PDO MySQL bảo mật
└── database/
    └── dormex.sql              # Kịch bản DDL & dữ liệu mẫu hoàn chỉnh
```

---

## 💾 3. Cơ Sở Dữ Liệu (Nhúng Database)
File `Dormex-website/database/dormex.sql` gồm 8 bảng quan hệ chuẩn:
1. `rooms`: Quản lý phòng ở, tòa nhà (A, B, C), loại phòng, sức chứa, giá thuê, tình trạng.
2. `users`: Tài khoản quản trị (`admin`) và sinh viên (`student`).
3. `registrations`: Đơn xin vào ở ký túc xá, ngày bắt đầu, trạng thái duyệt (`Pending`, `Approved`, `Rejected`).
4. `bills`: Hóa đơn từng tháng, chỉ số điện cũ/mới, chỉ số nước cũ/mới, tiền phòng, trạng thái thanh toán.
5. `maintenance`: Báo cáo sự cố thiết bị, tiến độ xử lý và ghi chú thợ kỹ thuật.
6. `announcements`: Thông tin thông báo, bài viết ghim, danh mục thông báo.
7. `events`: Các hoạt động ngoại khóa, hội thao, số lượng đăng ký tham gia.
8. `rules`: Các điều khoản nội quy ký túc xá và chế tài xử lý.

---

## 🚀 4. Hướng Dẫn Chạy Chương Trình

Hệ thống được thiết kế theo cơ chế **Hybrid Data Store thông minh**, cho phép bạn chạy theo 2 cách:

### Cách 1: Chạy trực tiếp không cần cài đặt (Rất tiện lợi để chấm điểm nhanh)
- Nhấp đúp chuột trực tiếp vào file `index.html` hoặc `Dormex-website/index.html` bằng bất kỳ trình duyệt nào (Chrome, Edge, Cốc Cốc, Firefox).
- Hoặc sử dụng tiện ích **Live Server** trên VS Code.
- Mọi chức năng thêm/sửa/xóa, duyệt đơn, tạo hóa đơn, chuyển khoản mô phỏng, báo hỏng... đều hoạt động 100% nhờ bộ máy `data-store.js` tự động khởi tạo dữ liệu mẫu tương thích với MySQL vào `localStorage`.

### Cách 2: Chạy đầy đủ với Máy Chủ PHP & MySQL (XAMPP / WampServer / Laragon)
1. Mở XAMPP Control Panel, Start **Apache** và **MySQL**.
2. Mở trình duyệt vào `http://localhost/phpmyadmin`.
3. Tạo cơ sở dữ liệu tên: `dormex_db` (hoặc import trực tiếp file `Dormex-website/database/dormex.sql`).
4. Đặt thư mục dự án vào `htdocs` của XAMPP:
   - Đường dẫn: `C:\xampp\htdocs\Dormex-website`
5. Truy cập trình duyệt theo địa chỉ:
   - `http://localhost/Dormex-website/index.html`

---

## 🔑 5. Tài Khoản Đăng Nhập Mẫu

| Vai Trò | Tên Đăng Nhập | Mật Khẩu | Quyền Hạn |
|---|---|---|---|
| **Ban Quản Lý (Admin)** | `admin` | `admin123` | Quản lý toàn quyền: Sinh viên, duyệt đơn, thêm/sửa phòng, lập hóa đơn, phân công sửa chữa, đăng tin tức, sự kiện |
| **Sinh Viên Nam (Tòa A)** | `sv_minhtam` | `123456` | Xem phòng A101, bạn cùng phòng, đóng tiền điện nước, báo hỏng bóng đèn/vòi nước |
| **Sinh Viên Nữ (Tòa B)** | `sv_ngocthao` | `123456` | Xem phòng B102, xem hóa đơn, đăng ký tham gia ngày hội tân sinh viên |

*(Lưu ý: Tại màn hình đăng nhập `login.html`, có sẵn nút bấm tiện lợi **Admin: admin** và **SV: sv_minhtam** để tự động điền tài khoản nhanh chóng chỉ bằng 1 cú nhấp chuột!)*

