-- ========================================================
-- CƠ SỞ DỮ LIỆU HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ DORMEX
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `dormex_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dormex_db`;

-- 1. BẢNG PHÒNG (ROOMS)
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_number` VARCHAR(20) NOT NULL UNIQUE,
    `building` VARCHAR(50) NOT NULL,
    `floor` INT NOT NULL,
    `room_type` VARCHAR(50) NOT NULL,
    `capacity` INT NOT NULL DEFAULT 4,
    `occupied` INT NOT NULL DEFAULT 0,
    `price` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `status` ENUM('Available', 'Full', 'Maintenance') DEFAULT 'Available',
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG NGƯỜI DÙNG (USERS)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `student_code` VARCHAR(20) DEFAULT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `gender` ENUM('Nam', 'Nữ', 'Khác') DEFAULT 'Nam',
    `class_name` VARCHAR(50) DEFAULT NULL,
    `role` ENUM('admin', 'student') DEFAULT 'student',
    `room_id` INT DEFAULT NULL,
    `avatar` VARCHAR(255) DEFAULT 'default-avatar.png',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG ĐĂNG KÝ PHÒNG (REGISTRATIONS)
DROP TABLE IF EXISTS `registrations`;
CREATE TABLE `registrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `room_id` INT NOT NULL,
    `semester` VARCHAR(50) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE DEFAULT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    `note` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_reg_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reg_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG HÓA ĐƠN & TIỀN ĐIỆN NƯỚC (BILLS)
DROP TABLE IF EXISTS `bills`;
CREATE TABLE `bills` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bill_code` VARCHAR(30) NOT NULL UNIQUE,
    `room_id` INT NOT NULL,
    `user_id` INT DEFAULT NULL,
    `month` INT NOT NULL,
    `year` INT NOT NULL,
    `room_fee` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `elec_old` INT NOT NULL DEFAULT 0,
    `elec_new` INT NOT NULL DEFAULT 0,
    `elec_fee` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `water_old` INT NOT NULL DEFAULT 0,
    `water_new` INT NOT NULL DEFAULT 0,
    `water_fee` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `service_fee` DECIMAL(12,2) NOT NULL DEFAULT 50000,
    `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `status` ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    `payment_date` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_bills_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG BẢO TRÌ & SỬA CHỮA (MAINTENANCE)
DROP TABLE IF EXISTS `maintenance`;
CREATE TABLE `maintenance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `room_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `category` ENUM('Điện', 'Nước', 'Nội thất', 'Mạng', 'Khác') DEFAULT 'Khác',
    `description` TEXT NOT NULL,
    `status` ENUM('Pending', 'Processing', 'Completed') DEFAULT 'Pending',
    `staff_note` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` DATETIME DEFAULT NULL,
    CONSTRAINT `fk_maint_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_maint_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG THÔNG BÁO (ANNOUNCEMENTS)
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `category` ENUM('Chung', 'Thanh toán', 'Nội quy', 'Bảo trì', 'Sự kiện') DEFAULT 'Chung',
    `content` TEXT NOT NULL,
    `is_pinned` TINYINT(1) DEFAULT 0,
    `author` VARCHAR(100) DEFAULT 'Ban Quản Lý KTX',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG SỰ KIỆN KTX (EVENTS)
DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `location` VARCHAR(150) NOT NULL,
    `event_date` DATETIME NOT NULL,
    `organizer` VARCHAR(100) DEFAULT 'Đoàn Thanh Niên KTX',
    `capacity` INT DEFAULT 100,
    `joined` INT DEFAULT 0,
    `status` ENUM('Upcoming', 'Ongoing', 'Finished') DEFAULT 'Upcoming',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG NỘI QUY (RULES)
DROP TABLE IF EXISTS `rules`;
CREATE TABLE `rules` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(20) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `penalty` VARCHAR(255) DEFAULT 'Cảnh cáo và trừ điểm rèn luyện',
    `category` VARCHAR(50) DEFAULT 'An ninh trật tự'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- DỮ LIỆU KHỞI TẠO (SEED DATA)
-- ========================================================

-- Chèn dữ liệu phòng
INSERT INTO `rooms` (`id`, `room_number`, `building`, `floor`, `room_type`, `capacity`, `occupied`, `price`, `status`, `description`) VALUES
(1, 'A101', 'Tòa A (Nam)', 1, '4 Giường Tiêu Chuẩn', 4, 3, 650000, 'Available', 'Phòng thoáng mát tầng 1, điều hòa, tủ đồ cá nhân, bàn học riêng.'),
(2, 'A102', 'Tòa A (Nam)', 1, '4 Giường Tiêu Chuẩn', 4, 4, 650000, 'Full', 'Đã kín sinh viên năm nhất khoa CNTT.'),
(3, 'A201', 'Tòa A (Nam)', 2, '6 Giường Tiết Kiệm', 6, 4, 450000, 'Available', 'Phòng rộng rãi, ban công view sân bóng rổ, có nóng lạnh.'),
(4, 'A301', 'Tòa A (Nam)', 3, 'VIP 2 Giường', 2, 1, 1200000, 'Available', 'Phòng cao cấp đầy đủ tủ lạnh, điều hòa, máy giặt riêng, view toàn cảnh.'),
(5, 'B101', 'Tòa B (Nữ)', 1, '4 Giường Tiêu Chuẩn', 4, 4, 650000, 'Full', 'Phòng gần cổng bảo vệ, an ninh tốt, vệ sinh khép kín.'),
(6, 'B102', 'Tòa B (Nữ)', 1, '4 Giường Tiêu Chuẩn', 4, 2, 650000, 'Available', 'Còn 2 giường tầng dưới, wifi tốc độ cao, điều hòa inverter.'),
(7, 'B201', 'Tòa B (Nữ)', 2, '6 Giường Tiết Kiệm', 6, 5, 450000, 'Available', 'Tầng 2 yên tĩnh, phòng học tập chuẩn văn minh.'),
(8, 'C101', 'Tòa C (Chất Lượng Cao)', 1, 'VIP 2 Giường', 2, 0, 1500000, 'Available', 'Khu dịch vụ cao cấp, bếp từ chung tầng, thang máy tốc độ cao.'),
(9, 'C201', 'Tòa C (Chất Lượng Cao)', 2, 'VIP 4 Giường', 4, 1, 950000, 'Available', 'Nội thất gỗ hiện đại, ban công rộng, đầy đủ thiết bị thông minh.');

-- Chèn dữ liệu người dùng (Mật khẩu admin: admin123, sinh viên: 123456)
INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `student_code`, `email`, `phone`, `gender`, `class_name`, `role`, `room_id`, `avatar`) VALUES
(1, 'admin', 'admin123', 'Quản Trị Viên KTX', 'ADMIN01', 'admin@dormex.edu.vn', '0901234567', 'Nam', 'Ban Quản Lý', 'admin', NULL, 'admin.svg'),
(2, 'sv_minhtam', '123456', 'Nguyễn Minh Tâm', 'SV2024001', 'minhtam@dormex.edu.vn', '0987654321', 'Nam', 'CNTT-K18', 'student', 1, 'student1.svg'),
(3, 'sv_hoanglong', '123456', 'Trần Hoàng Long', 'SV2024002', 'hoanglong@dormex.edu.vn', '0978112233', 'Nam', 'KTPM-K18', 'student', 1, 'student2.svg'),
(4, 'sv_ngocthao', '123456', 'Lê Ngọc Thảo', 'SV2024003', 'ngocthao@dormex.edu.vn', '0912334455', 'Nữ', 'QTKD-K19', 'student', 6, 'student3.svg'),
(5, 'sv_anhtuan', '123456', 'Phạm Anh Tuấn', 'SV2024004', 'anhtuan@dormex.edu.vn', '0933445566', 'Nam', 'DTVT-K18', 'student', 3, 'student4.svg');

-- Chèn dữ liệu đăng ký phòng
INSERT INTO `registrations` (`id`, `user_id`, `room_id`, `semester`, `start_date`, `end_date`, `status`, `note`) VALUES
(1, 2, 1, 'Học kỳ 1 - 2024-2025', '2024-09-01', '2025-01-31', 'Approved', 'Đã duyệt hồ sơ và nhận phòng.'),
(2, 3, 1, 'Học kỳ 1 - 2024-2025', '2024-09-01', '2025-01-31', 'Approved', 'Đã thanh toán học kỳ.'),
(3, 4, 6, 'Học kỳ 1 - 2024-2025', '2024-09-05', '2025-01-31', 'Approved', 'Đăng ký phòng B102 tòa Nữ.'),
(4, 5, 3, 'Học kỳ 1 - 2024-2025', '2024-09-10', '2025-01-31', 'Approved', 'Đơn thuộc diện ưu tiên chính sách.'),
(5, 2, 4, 'Học kỳ 2 - 2024-2025', '2025-02-01', '2025-06-30', 'Pending', 'Nguyện vọng xin chuyển lên phòng VIP A301.');

-- Chèn dữ liệu hóa đơn
INSERT INTO `bills` (`id`, `bill_code`, `room_id`, `user_id`, `month`, `year`, `room_fee`, `elec_old`, `elec_new`, `elec_fee`, `water_old`, `water_new`, `water_fee`, `service_fee`, `total_amount`, `status`, `payment_date`) VALUES
(1, 'BILL-2024-09-A101', 1, 2, 9, 2024, 650000, 1120, 1210, 270000, 310, 325, 150000, 50000, 1120000, 'Paid', '2024-10-05 14:30:00'),
(2, 'BILL-2024-10-A101', 1, 2, 10, 2024, 650000, 1210, 1315, 315000, 325, 342, 170000, 50000, 1185000, 'Unpaid', NULL),
(3, 'BILL-2024-10-B102', 6, 4, 10, 2024, 650000, 850, 930, 240000, 210, 222, 120000, 50000, 1060000, 'Paid', '2024-10-08 09:15:00'),
(4, 'BILL-2024-10-A201', 3, 5, 10, 2024, 450000, 1400, 1520, 360000, 410, 430, 200000, 50000, 1060000, 'Unpaid', NULL);

-- Chèn dữ liệu bảo trì
INSERT INTO `maintenance` (`id`, `user_id`, `room_id`, `title`, `category`, `description`, `status`, `staff_note`, `created_at`, `resolved_at`) VALUES
(1, 2, 1, 'Hỏng bóng đèn tuýp phòng tắm', 'Điện', 'Bóng đèn nhấp nháy rồi tắt hẳn từ tối hôm qua, cần hỗ trợ thay mới.', 'Completed', 'Đã thay bóng đèn LED 18W mới lúc 10h sáng.', '2024-10-02 08:30:00', '2024-10-02 10:15:00'),
(2, 2, 1, 'Vòi nước bồn rửa mặt bị rỉ', 'Nước', 'Vòi nước đóng không chặt, rỉ nước cả ngày gây lãng phí.', 'Processing', 'Đã tiếp nhận, thợ điện nước sẽ qua kiểm tra vào chiều nay.', '2024-10-06 14:00:00', NULL),
(3, 4, 6, 'Mạng wifi chập chờn phòng B102', 'Mạng', 'Tối từ 20h-22h mạng bị mất kết nối liên tục, không làm bài tập được.', 'Pending', NULL, '2024-10-07 09:00:00', NULL);

-- Chèn dữ liệu thông báo
INSERT INTO `announcements` (`id`, `title`, `category`, `content`, `is_pinned`, `author`) VALUES
(1, 'Thông báo nộp tiền điện nước và tiền phòng tháng 10/2024', 'Thanh toán', 'Ban quản lý ký túc xá thông báo hạn chót đóng tiền điện nước và dịch vụ tháng 10 là ngày 15/10/2024. Sinh viên có thể đóng trực tuyến qua mã QR hoặc trực tiếp tại phòng QLKTX tầng 1 tòa A.', 1, 'Ban Quản Lý'),
(2, 'Lịch kiểm tra vệ sinh và an toàn PCCC định kỳ', 'Nội quy', 'Vào ngày 12/10/2024, đoàn kiểm tra sẽ thực hiện kiểm tra công tác an toàn phòng cháy chữa cháy và vệ sinh phòng ở toàn bộ các tòa A, B, C. Đề nghị các phòng thu dọn ngăn nắp và không sử dụng thiết bị nấu nướng trái phép.', 1, 'Đội Tự Quản KTX'),
(3, 'Bảo trì hệ thống máy bơm nước tòa A sáng thứ 7', 'Bảo trì', 'Ký túc xá sẽ tạm cắt nước sinh hoạt tại Tòa A từ 8h00 đến 11h30 ngày 11/10 để súc rửa bể chứa và bảo dưỡng máy bơm. Mong các bạn sinh viên chủ động tích trữ nước sử dụng.', 0, 'Phòng Kỹ Thuật'),
(4, 'Giải bóng đá Nam - Nữ KTX Dormex Open 2024', 'Sự kiện', 'Khai mạc giải thể thao truyền thống chào đón tân sinh viên. Các đội đăng ký danh sách tại Văn phòng Đoàn KTX trước ngày 18/10.', 0, 'Đoàn Thanh Niên');

-- Chèn dữ liệu sự kiện
INSERT INTO `events` (`id`, `title`, `description`, `location`, `event_date`, `organizer`, `capacity`, `joined`, `status`) VALUES
(1, 'Ngày Hội Chào Tân Sinh Viên KTX 2024', 'Đêm nhạc acoustic, giao lưu văn nghệ, bốc thăm trúng thưởng và các gian hàng ẩm thực hấp dẫn.', 'Quảng trường trung tâm KTX', '2024-10-20 18:30:00', 'Đoàn Thanh Niên & CLB Âm Nhạc', 300, 215, 'Upcoming'),
(2, 'Tập Huấn Kỹ Năng Thoát Hiểm & PCCC Thực Tế', 'Buổi thực hành sử dụng bình chữa cháy, kỹ năng thoát hiểm khi xảy ra hỏa hoạn nhà cao tầng cùng cảnh sát PCCC.', 'Sân bóng rổ Tòa B', '2024-10-25 08:00:00', 'Ban An Toàn KTX', 150, 98, 'Upcoming'),
(3, 'Giải Cầu Lông Đôi Nam - Nữ KTX Dormex', 'Hội thao rèn luyện sức khỏe, gắn kết các khối nhà nội trú với giải thưởng hấp dẫn.', 'Nhà thi đấu đa năng', '2024-11-05 14:00:00', 'CLB Thể Thao KTX', 64, 42, 'Upcoming');

-- Chèn dữ liệu nội quy
INSERT INTO `rules` (`id`, `code`, `title`, `content`, `penalty`, `category`) VALUES
(1, 'NQ-01', 'Giờ giấc sinh hoạt', 'Cổng KTX mở cửa từ 05h30 và đóng cửa lúc 23h00 hàng ngày. Sinh viên về muộn phải có lý do chính đáng và xuất trình thẻ sinh viên.', 'Trừ 2 điểm rèn luyện, nhắc nhở bằng văn bản', 'An ninh trật tự'),
(2, 'NQ-02', 'Cấm nấu nướng trong phòng tiêu chuẩn', 'Tuyệt đối không sử dụng bếp gas, bếp từ, nồi lẩu công suất lớn trong phòng ở để đảm bảo an toàn PCCC (chỉ được nấu tại khu bếp chung).', 'Tịch thu thiết bị, phạt 200.000đ và lập biên bản', 'An toàn PCCC'),
(3, 'NQ-03', 'Giữ gìn vệ sinh chung', 'Rác thải phải được phân loại và bỏ đúng nơi quy định trước 08h00 sáng mỗi ngày. Vệ sinh phòng và khu vực ban công định kỳ sạch sẽ.', 'Trừ điểm thi đua phòng, vệ sinh công ích', 'Vệ sinh môi trường'),
(4, 'NQ-04', 'Quy định tiếp khách', 'Khách đến thăm phải đăng ký tại phòng thường trực bảo vệ. Không dẫn người lạ hoặc người khác giới ở lại qua đêm trong phòng ký túc xá.', 'Đình chỉ lưu trú KTX từ 1 kỳ đến 1 năm', 'An ninh trật tự'),
(5, 'NQ-05', 'Bảo vệ tài sản công cộng', 'Có trách nhiệm bảo quản trang thiết bị phòng ở (giường, tủ, quạt, điều hòa). Nếu làm hỏng hoặc mất mát phải bồi thường theo thời giá.', 'Bồi thường 100% giá trị tài sản hư hại', 'Tài sản KTX');

SET FOREIGN_KEY_CHECKS = 1;

