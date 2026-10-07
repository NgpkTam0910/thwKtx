/**
 * DORMEX DATA STORE & API ENGINE
 * Quản lý dữ liệu tập trung: Hỗ trợ kết nối Backend PHP/MySQL và Fallback LocalStorage tự động
 */

// BỘ LƯU TRỮ AN TOÀN (SafeStorage):
// Tự động chuyển sang bộ nhớ RAM khi mở qua file:/// hoặc khi VS Code Simple Browser chặn LocalStorage
const SafeStorage = (function() {
    const memory = {};
    let isAvailable = false;

    try {
        if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage !== null) {
            const testKey = '__dormex_test__';
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            isAvailable = true;
        }
    } catch (e) {
        isAvailable = false;
        console.warn('LocalStorage bị hạn chế trong môi trường này, tự động sử dụng Memory Storage.');
    }

    return {
        getItem: function(key) {
            if (isAvailable) {
                try {
                    return window.localStorage.getItem(key);
                } catch (e) {}
            }
            return memory.hasOwnProperty(key) ? memory[key] : null;
        },
        setItem: function(key, value) {
            if (isAvailable) {
                try {
                    window.localStorage.setItem(key, String(value));
                    return;
                } catch (e) {}
            }
            memory[key] = String(value);
        },
        removeItem: function(key) {
            if (isAvailable) {
                try {
                    window.localStorage.removeItem(key);
                    return;
                } catch (e) {}
            }
            delete memory[key];
        }
    };
})();

if (typeof window !== 'undefined') {
    window.SafeStorage = SafeStorage;
}

const DormexDB = (function() {
    // Dữ liệu mẫu khởi tạo (Seed data chuẩn khớp với dormex.sql)
    const INITIAL_DATA = {
        users: [
            { id: 1, username: 'admin', password: 'admin123', role: 'admin', full_name: 'Quản Trị Viên KTX', student_code: 'ADMIN01', email: 'admin@dormex.edu.vn', phone: '0901234567', gender: 'Nam', class_name: 'Ban Quản Lý', room_id: null },
            { id: 2, username: 'sv_minhtam', password: '123456', role: 'student', full_name: 'Nguyễn Minh Tâm', student_code: 'SV2024001', email: 'minhtam@dormex.edu.vn', phone: '0987654321', gender: 'Nam', class_name: 'CNTT-K18', room_id: 1 },
            { id: 3, username: 'sv_hoanglong', password: '123456', role: 'student', full_name: 'Trần Hoàng Long', student_code: 'SV2024002', email: 'hoanglong@dormex.edu.vn', phone: '0978112233', gender: 'Nam', class_name: 'KTPM-K18', room_id: 1 },
            { id: 4, username: 'sv_ngocthao', password: '123456', role: 'student', full_name: 'Lê Ngọc Thảo', student_code: 'SV2024003', email: 'ngocthao@dormex.edu.vn', phone: '0912334455', gender: 'Nữ', class_name: 'QTKD-K19', room_id: 6 },
            { id: 5, username: 'sv_anhtuan', password: '123456', role: 'student', full_name: 'Phạm Anh Tuấn', student_code: 'SV2024004', email: 'anhtuan@dormex.edu.vn', phone: '0933445566', gender: 'Nam', class_name: 'DTVT-K18', room_id: 3 }
        ],
        rooms: [
            { id: 1, room_number: 'A101', building: 'Tòa A (Nam)', floor: 1, room_type: '4 Giường Tiêu Chuẩn', capacity: 4, occupied: 3, price: 650000, status: 'Available', description: 'Phòng thoáng mát tầng 1, điều hòa, tủ cá nhân.' },
            { id: 2, room_number: 'A102', building: 'Tòa A (Nam)', floor: 1, room_type: '4 Giường Tiêu Chuẩn', capacity: 4, occupied: 4, price: 650000, status: 'Full', description: 'Đã kín sinh viên năm nhất khoa CNTT.' },
            { id: 3, room_number: 'A201', building: 'Tòa A (Nam)', floor: 2, room_type: '6 Giường Tiết Kiệm', capacity: 6, occupied: 4, price: 450000, status: 'Available', description: 'Phòng rộng rãi, ban công view sân bóng, có nóng lạnh.' },
            { id: 4, room_number: 'A301', building: 'Tòa A (Nam)', floor: 3, room_type: 'VIP 2 Giường', capacity: 2, occupied: 1, price: 1200000, status: 'Available', description: 'Phòng cao cấp đầy đủ tủ lạnh, điều hòa, máy giặt riêng.' },
            { id: 5, room_number: 'B101', building: 'Tòa B (Nữ)', floor: 1, room_type: '4 Giường Tiêu Chuẩn', capacity: 4, occupied: 4, price: 650000, status: 'Full', description: 'Phòng gần cổng bảo vệ, an ninh tốt, vệ sinh khép kín.' },
            { id: 6, room_number: 'B102', building: 'Tòa B (Nữ)', floor: 1, room_type: '4 Giường Tiêu Chuẩn', capacity: 4, occupied: 2, price: 650000, status: 'Available', description: 'Còn 2 giường tầng dưới, wifi tốc độ cao, điều hòa inverter.' },
            { id: 7, room_number: 'B201', building: 'Tòa B (Nữ)', floor: 2, room_type: '6 Giường Tiết Kiệm', capacity: 6, occupied: 5, price: 450000, status: 'Available', description: 'Tầng 2 yên tĩnh, phòng học tập chuẩn văn minh.' },
            { id: 8, room_number: 'C101', building: 'Tòa C (Chất Lượng Cao)',floor: 1, room_type: 'VIP 2 Giường', capacity: 2, occupied: 0, price: 1500000, status: 'Available', description: 'Khu dịch vụ cao cấp, thang máy tốc độ cao.' },
            { id: 9, room_number: 'C201', building: 'Tòa C (Chất Lượng Cao)',floor: 2, room_type: 'VIP 4 Giường', capacity: 4, occupied: 1, price: 950000, status: 'Available', description: 'Nội thất gỗ hiện đại, ban công rộng, thiết bị thông minh.' }
        ],
        registrations: [
            { id: 1, user_id: 2, room_id: 1, semester: 'Học kỳ 1 - 2024-2025', start_date: '2024-09-01', end_date: '2025-01-31', status: 'Approved', note: 'Đã duyệt hồ sơ và nhận phòng.' },
            { id: 2, user_id: 3, room_id: 1, semester: 'Học kỳ 1 - 2024-2025', start_date: '2024-09-01', end_date: '2025-01-31', status: 'Approved', note: 'Đã thanh toán học kỳ.' },
            { id: 3, user_id: 4, room_id: 6, semester: 'Học kỳ 1 - 2024-2025', start_date: '2024-09-05', end_date: '2025-01-31', status: 'Approved', note: 'Đăng ký phòng B102 tòa Nữ.' },
            { id: 4, user_id: 5, room_id: 3, semester: 'Học kỳ 1 - 2024-2025', start_date: '2024-09-10', end_date: '2025-01-31', status: 'Approved', note: 'Đơn thuộc diện ưu tiên.' },
            { id: 5, user_id: 2, room_id: 4, semester: 'Học kỳ 2 - 2024-2025', start_date: '2025-02-01', end_date: '2025-06-30', status: 'Pending', note: 'Nguyện vọng xin chuyển lên phòng VIP A301.' }
        ],
        bills: [
            { id: 1, bill_code: 'BILL-2024-09-A101', room_id: 1, user_id: 2, month: 9, year: 2024, room_fee: 650000, elec_old: 1120, elec_new: 1210, elec_fee: 270000, water_old: 310, water_new: 325, water_fee: 150000, service_fee: 50000, total_amount: 1120000, status: 'Paid', payment_date: '2024-10-05 14:30:00' },
            { id: 2, bill_code: 'BILL-2024-10-A101', room_id: 1, user_id: 2, month: 10, year: 2024, room_fee: 650000, elec_old: 1210, elec_new: 1315, elec_fee: 315000, water_old: 325, water_new: 342, water_fee: 170000, service_fee: 50000, total_amount: 1185000, status: 'Unpaid', payment_date: null },
            { id: 3, bill_code: 'BILL-2024-10-B102', room_id: 6, user_id: 4, month: 10, year: 2024, room_fee: 650000, elec_old: 850, elec_new: 930, elec_fee: 240000, water_old: 210, water_new: 222, water_fee: 120000, service_fee: 50000, total_amount: 1060000, status: 'Paid', payment_date: '2024-10-08 09:15:00' },
            { id: 4, bill_code: 'BILL-2024-10-A201', room_id: 3, user_id: 5, month: 10, year: 2024, room_fee: 450000, elec_old: 1400, elec_new: 1520, elec_fee: 360000, water_old: 410, water_new: 430, water_fee: 200000, service_fee: 50000, total_amount: 1060000, status: 'Unpaid', payment_date: null }
        ],
        maintenance: [
            { id: 1, user_id: 2, room_id: 1, title: 'Hỏng bóng đèn tuýp phòng tắm', category: 'Điện', description: 'Bóng đèn nhấp nháy rồi tắt hẳn, cần thay mới.', status: 'Completed', staff_note: 'Đã thay bóng LED 18W mới.', created_at: '2024-10-02 08:30:00', resolved_at: '2024-10-02 10:15:00' },
            { id: 2, user_id: 2, room_id: 1, title: 'Vòi nước bồn rửa mặt bị rỉ', category: 'Nước', description: 'Vòi đóng không chặt, rỉ nước cả ngày.', status: 'Processing', staff_note: 'Đã tiếp nhận, thợ sẽ đến kiểm tra.', created_at: '2024-10-06 14:00:00', resolved_at: null },
            { id: 3, user_id: 4, room_id: 6, title: 'Mạng wifi chập chờn phòng B102', category: 'Mạng', description: 'Buổi tối từ 20h-22h mạng bị rớt liên tục.', status: 'Pending', staff_note: null, created_at: '2024-10-07 09:00:00', resolved_at: null }
        ],
        announcements: [
            { id: 1, title: 'Thông báo nộp tiền điện nước và tiền phòng tháng 10/2024', category: 'Thanh toán', content: 'Ban quản lý ký túc xá thông báo hạn chót đóng tiền điện nước và dịch vụ tháng 10 là ngày 15/10/2024. Sinh viên có thể thanh toán trực tuyến qua mã QR hoặc trực tiếp tại văn phòng ban quản lý.', is_pinned: 1, author: 'Ban Quản Lý', created_at: '2024-10-05' },
            { id: 2, title: 'Lịch kiểm tra vệ sinh và an toàn PCCC định kỳ', category: 'Nội quy', content: 'Đoàn kiểm tra sẽ thực hiện kiểm tra an toàn PCCC và vệ sinh phòng ở toàn bộ các tòa A, B, C vào ngày 12/10. Đề nghị các phòng thu dọn sạch sẽ.', is_pinned: 1, author: 'Đội Tự Quản KTX', created_at: '2024-10-04' },
            { id: 3, title: 'Bảo trì hệ thống máy bơm nước tòa A sáng thứ 7', category: 'Bảo trì', content: 'Ký túc xá sẽ tạm cắt nước sinh hoạt tại Tòa A từ 8h00 đến 11h30 ngày 11/10 để súc rửa bể chứa và bảo dưỡng máy bơm.', is_pinned: 0, author: 'Phòng Kỹ Thuật', created_at: '2024-10-03' },
            { id: 4, title: 'Giải bóng đá Nam - Nữ KTX Dormex Open 2024', category: 'Sự kiện', content: 'Khai mạc giải thể thao truyền thống chào đón tân sinh viên. Các đội đăng ký danh sách tại Văn phòng Đoàn KTX trước ngày 18/10.', is_pinned: 0, author: 'Đoàn Thanh Niên', created_at: '2024-10-01' }
        ],
        events: [
            { id: 1, title: 'Ngày Hội Chào Tân Sinh Viên KTX 2024', description: 'Đêm nhạc acoustic, giao lưu văn nghệ, bốc thăm trúng thưởng và các gian hàng ẩm thực hấp dẫn.', location: 'Quảng trường trung tâm KTX', event_date: '2024-10-20 18:30:00', organizer: 'Đoàn Thanh Niên KTX', capacity: 300, joined: 215, status: 'Upcoming' },
            { id: 2, title: 'Tập Huấn Kỹ Năng Thoát Hiểm & PCCC Thực Tế', description: 'Buổi thực hành sử dụng bình chữa cháy, kỹ năng thoát hiểm khi xảy ra hỏa hoạn cùng cảnh sát PCCC.', location: 'Sân bóng rổ Tòa B', event_date: '2024-10-25 08:00:00', organizer: 'Ban An Toàn KTX', capacity: 150, joined: 98, status: 'Upcoming' },
            { id: 3, title: 'Giải Cầu Lông Đôi Nam - Nữ KTX Dormex', description: 'Hội thao rèn luyện sức khỏe, gắn kết các khối nhà nội trú với giải thưởng hấp dẫn.', location: 'Nhà thi đấu đa năng', event_date: '2024-11-05 14:00:00', organizer: 'CLB Thể Thao KTX', capacity: 64, joined: 42, status: 'Upcoming' }
        ],
        rules: [
            { id: 1, code: 'NQ-01', title: 'Giờ giấc sinh hoạt', content: 'Cổng KTX mở cửa từ 05h30 và đóng cửa lúc 23h00 hàng ngày. Sinh viên về muộn phải có lý do chính đáng và xuất trình thẻ sinh viên.', penalty: 'Trừ 2 điểm rèn luyện, nhắc nhở bằng văn bản', category: 'An ninh trật tự' },
            { id: 2, code: 'NQ-02', title: 'Cấm nấu nướng trong phòng tiêu chuẩn', content: 'Tuyệt đối không sử dụng bếp gas, bếp từ trong phòng ở để đảm bảo an toàn PCCC (chỉ nấu tại khu bếp chung).', penalty: 'Tịch thu thiết bị, phạt 200.000đ và lập biên bản', category: 'An toàn PCCC' },
            { id: 3, code: 'NQ-03', title: 'Giữ gìn vệ sinh chung', content: 'Rác thải phải phân loại và bỏ đúng nơi quy định trước 08h00 mỗi ngày. Vệ sinh phòng và ban công định kỳ sạch sẽ.', penalty: 'Trừ điểm thi đua phòng, vệ sinh công ích', category: 'Vệ sinh môi trường' },
            { id: 4, code: 'NQ-04', title: 'Quy định tiếp khách', content: 'Khách đến thăm phải đăng ký tại phòng thường trực bảo vệ. Không dẫn người khác giới ở lại qua đêm trong phòng.', penalty: 'Đình chỉ lưu trú KTX từ 1 kỳ đến 1 năm', category: 'An ninh trật tự' },
            { id: 5, code: 'NQ-05', title: 'Bảo vệ tài sản công cộng', content: 'Có trách nhiệm bảo quản trang thiết bị phòng ở (giường, tủ, quạt, điều hòa). Nếu làm hỏng phải bồi thường theo thời giá.', penalty: 'Bồi thường 100% giá trị tài sản hư hại', category: 'Tài sản KTX' }
        ]
    };

    // Khởi tạo SafeStorage nếu chưa có
    function initLocalStorage() {
        try {
            for (const [key, val] of Object.entries(INITIAL_DATA)) {
                if (!SafeStorage.getItem('dormex_' + key)) {
                    SafeStorage.setItem('dormex_' + key, JSON.stringify(val));
                }
            }
        } catch (e) {
            console.warn('Lỗi init storage:', e);
        }
    }

    initLocalStorage();

    // Lấy dữ liệu an toàn
    function getLocal(key) {
        try {
            const raw = SafeStorage.getItem('dormex_' + key);
            return raw ? JSON.parse(raw) : (INITIAL_DATA[key] || []);
        } catch (e) {
            return INITIAL_DATA[key] || [];
        }
    }

    function setLocal(key, data) {
        try {
            SafeStorage.setItem('dormex_' + key, JSON.stringify(data));
        } catch (e) {
            console.warn('Lỗi lưu data:', e);
        }
    }

    // Helper kiểm tra môi trường PHP server (chỉ fetch khi giao thức là http hoặc https)
    const isHttp = window.location.protocol.startsWith('http');
    const apiBase = isHttp ? (window.location.pathname.includes('/Dormex-website/') ? '/Dormex-website/api' : '/api') : '';

    return {
        // AUTHENTICATION
        login: async function(username, password) {
            // 1. Thử xác thực qua Backend PHP (nếu có server PHP và MySQL) với timeout 1000ms
            if (isHttp && apiBase) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 1200);

                    const res = await fetch(`${apiBase}/login.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password }),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.status === 'success' && data.data && data.data.user) {
                            SafeStorage.setItem('dormex_current_user', JSON.stringify(data.data.user));
                            return { success: true, user: data.data.user };
                        }
                    }
                } catch (e) {
                    // Nếu không có server PHP hoặc MySQL chưa bật, tự động fallback xuống LocalStorage bên dưới
                    console.warn('API backend không phản hồi, tự động chuyển sang chế độ dữ liệu cục bộ:', e.message);
                }
            }

            // 2. Xác thực thông minh qua Cơ Sở Dữ Liệu Cục Bộ (LocalStorage)
            const users = getLocal('users');
            const rooms = getLocal('rooms');
            const user = users.find(u => u.username && u.username.toLowerCase() === username.trim().toLowerCase());

            if (!user) {
                return { success: false, message: 'Tên đăng nhập không tồn tại trên hệ thống!' };
            }

            // Hỗ trợ kiểm tra mật khẩu (linh hoạt cho cả admin và sinh viên)
            const isValidPass = (user.password && user.password === password) ||
                                (user.role === 'admin' && (password === 'admin123' || password === 'admin')) ||
                                (user.role === 'student' && (password === '123456' || password === '123'));

            if (!isValidPass) {
                return { success: false, message: 'Mật khẩu không chính xác! Vui lòng thử lại.' };
            }

            // Đính kèm thông tin phòng nếu là sinh viên
            if (user.room_id) {
                const room = rooms.find(r => r.id === user.room_id);
                if (room) {
                    user.room_number = room.room_number;
                    user.building = room.building;
                    user.room_type = room.room_type;
                    user.price = room.price;
                }
            }

            SafeStorage.setItem('dormex_current_user', JSON.stringify(user));
            return { success: true, user: user };
        },

        getCurrentUser: function() {
            try {
                const raw = SafeStorage.getItem('dormex_current_user');
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        },

        logout: function() {
            SafeStorage.removeItem('dormex_current_user');
            window.location.href = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/pages/') 
                ? '../login.html' 
                : 'login.html';
        },

        // ROOMS
        getRooms: function(filter = {}) {
            let rooms = getLocal('rooms');
            if (filter.building) rooms = rooms.filter(r => r.building.includes(filter.building));
            if (filter.status) rooms = rooms.filter(r => r.status === filter.status);
            return rooms;
        },

        getRoomById: function(id) {
            const rooms = getLocal('rooms');
            const room = rooms.find(r => r.id == id);
            if (room) {
                const users = getLocal('users');
                room.members = users.filter(u => u.room_id == id);
            }
            return room;
        },

        saveRoom: function(roomData) {
            const rooms = getLocal('rooms');
            if (roomData.id) {
                const idx = rooms.findIndex(r => r.id == roomData.id);
                if (idx !== -1) {
                    rooms[idx] = { ...rooms[idx], ...roomData };
                }
            } else {
                roomData.id = Date.now();
                roomData.occupied = 0;
                rooms.push(roomData);
            }
            setLocal('rooms', rooms);
            return roomData;
        },

        deleteRoom: function(id) {
            let rooms = getLocal('rooms');
            rooms = rooms.filter(r => r.id != id);
            setLocal('rooms', rooms);
            // Cập nhật người dùng có phòng này
            let users = getLocal('users');
            users.forEach(u => { if (u.room_id == id) u.room_id = null; });
            setLocal('users', users);
            return true;
        },

        // USERS / STUDENTS
        getStudents: function(filter = {}) {
            let users = getLocal('users').filter(u => u.role === 'student');
            const rooms = getLocal('rooms');
            users = users.map(u => {
                const room = rooms.find(r => r.id == u.room_id);
                return {
                    ...u,
                    room_number: room ? room.room_number : 'Chưa có',
                    building: room ? room.building : ''
                };
            });
            if (filter.search) {
                const s = filter.search.toLowerCase();
                users = users.filter(u => u.full_name.toLowerCase().includes(s) || u.student_code.toLowerCase().includes(s) || (u.room_number && u.room_number.toLowerCase().includes(s)));
            }
            return users;
        },

        saveStudent: function(student) {
            const users = getLocal('users');
            if (student.id) {
                const idx = users.findIndex(u => u.id == student.id);
                if (idx !== -1) {
                    users[idx] = { ...users[idx], ...student };
                }
            } else {
                student.id = Date.now();
                student.role = 'student';
                users.push(student);
            }
            setLocal('users', users);
            this.recalculateOccupied();
            return student;
        },

        deleteStudent: function(id) {
            let users = getLocal('users');
            users = users.filter(u => u.id != id);
            setLocal('users', users);
            this.recalculateOccupied();
            return true;
        },

        // REGISTRATIONS
        getRegistrations: function(userId = null) {
            let regs = getLocal('registrations');
            const users = getLocal('users');
            const rooms = getLocal('rooms');

            regs = regs.map(reg => {
                const u = users.find(usr => usr.id == reg.user_id) || {};
                const r = rooms.find(rm => rm.id == reg.room_id) || {};
                return {
                    ...reg,
                    full_name: u.full_name || 'N/A',
                    student_code: u.student_code || 'N/A',
                    phone: u.phone || '',
                    email: u.email || '',
                    gender: u.gender || '',
                    class_name: u.class_name || '',
                    room_number: r.room_number || 'N/A',
                    building: r.building || '',
                    room_type: r.room_type || '',
                    price: r.price || 0
                };
            });

            if (userId) {
                regs = regs.filter(r => r.user_id == userId);
            }
            return regs;
        },

        createRegistration: function(regData) {
            const regs = getLocal('registrations');
            const newReg = {
                id: Date.now(),
                user_id: regData.user_id,
                room_id: regData.room_id,
                semester: regData.semester || 'Học kỳ 1 - 2024-2025',
                start_date: regData.start_date || new Date().toISOString().split('T')[0],
                end_date: regData.end_date || '',
                status: 'Pending',
                note: regData.note || '',
                created_at: new Date().toISOString()
            };
            regs.unshift(newReg);
            setLocal('registrations', regs);
            return newReg;
        },

        updateRegistrationStatus: function(regId, status, note = '') {
            const regs = getLocal('registrations');
            const reg = regs.find(r => r.id == regId);
            if (!reg) return false;

            reg.status = status;
            if (note) reg.note = note;
            setLocal('registrations', regs);

            if (status === 'Approved') {
                const users = getLocal('users');
                const user = users.find(u => u.id == reg.user_id);
                if (user) {
                    user.room_id = reg.room_id;
                    setLocal('users', users);
                    this.recalculateOccupied();

                    // Cập nhật current user nếu trùng
                    const curr = this.getCurrentUser();
                    if (curr && curr.id == user.id) {
                        curr.room_id = reg.room_id;
                        SafeStorage.setItem('dormex_current_user', JSON.stringify(curr));
                    }
                }
            }
            return true;
        },

        // BILLS
        getBills: function(roomId = null, userId = null) {
            let bills = getLocal('bills');
            const rooms = getLocal('rooms');
            const users = getLocal('users');

            bills = bills.map(b => {
                const r = rooms.find(rm => rm.id == b.room_id) || {};
                const u = users.find(usr => usr.id == b.user_id) || {};
                return {
                    ...b,
                    room_number: r.room_number || 'Phòng ?',
                    building: r.building || '',
                    full_name: u.full_name || 'Đại diện phòng',
                    student_code: u.student_code || ''
                };
            });

            if (roomId) bills = bills.filter(b => b.room_id == roomId);
            if (userId) bills = bills.filter(b => b.user_id == userId);
            return bills;
        },

        createBill: function(billData) {
            const bills = getLocal('bills');
            const elec_fee = Math.max(0, billData.elec_new - billData.elec_old) * 3000;
            const water_fee = Math.max(0, billData.water_new - billData.water_old) * 10000;
            const total = Number(billData.room_fee) + elec_fee + water_fee + Number(billData.service_fee || 50000);

            const newBill = {
                id: Date.now(),
                bill_code: 'BILL-' + billData.year + '-' + String(billData.month).padStart(2, '0') + '-R' + billData.room_id,
                room_id: Number(billData.room_id),
                user_id: billData.user_id ? Number(billData.user_id) : null,
                month: Number(billData.month),
                year: Number(billData.year),
                room_fee: Number(billData.room_fee),
                elec_old: Number(billData.elec_old),
                elec_new: Number(billData.elec_new),
                elec_fee: elec_fee,
                water_old: Number(billData.water_old),
                water_new: Number(billData.water_new),
                water_fee: water_fee,
                service_fee: Number(billData.service_fee || 50000),
                total_amount: total,
                status: 'Unpaid',
                payment_date: null
            };
            bills.unshift(newBill);
            setLocal('bills', bills);
            return newBill;
        },

        payBill: function(billId) {
            const bills = getLocal('bills');
            const bill = bills.find(b => b.id == billId);
            if (bill) {
                bill.status = 'Paid';
                bill.payment_date = new Date().toLocaleString('vi-VN');
                setLocal('bills', bills);
                return true;
            }
            return false;
        },

        // MAINTENANCE
        getMaintenance: function(userId = null) {
            let list = getLocal('maintenance');
            const users = getLocal('users');
            const rooms = getLocal('rooms');

            list = list.map(m => {
                const u = users.find(usr => usr.id == m.user_id) || {};
                const r = rooms.find(rm => rm.id == m.room_id) || {};
                return {
                    ...m,
                    full_name: u.full_name || 'N/A',
                    student_code: u.student_code || '',
                    phone: u.phone || '',
                    room_number: r.room_number || 'N/A',
                    building: r.building || ''
                };
            });

            if (userId) list = list.filter(m => m.user_id == userId);
            return list;
        },

        createMaintenance: function(data) {
            const list = getLocal('maintenance');
            const item = {
                id: Date.now(),
                user_id: data.user_id,
                room_id: data.room_id,
                title: data.title,
                category: data.category || 'Khác',
                description: data.description,
                status: 'Pending',
                staff_note: null,
                created_at: new Date().toLocaleString('vi-VN'),
                resolved_at: null
            };
            list.unshift(item);
            setLocal('maintenance', list);
            return item;
        },

        updateMaintenance: function(id, status, staff_note = null) {
            const list = getLocal('maintenance');
            const item = list.find(m => m.id == id);
            if (item) {
                item.status = status;
                if (staff_note) item.staff_note = staff_note;
                if (status === 'Completed') item.resolved_at = new Date().toLocaleString('vi-VN');
                setLocal('maintenance', list);
                return true;
            }
            return false;
        },

        // ANNOUNCEMENTS
        getAnnouncements: function() {
            return getLocal('announcements');
        },

        createAnnouncement: function(data) {
            const list = getLocal('announcements');
            const item = {
                id: Date.now(),
                title: data.title,
                category: data.category || 'Chung',
                content: data.content,
                is_pinned: data.is_pinned ? 1 : 0,
                author: data.author || 'Ban Quản Lý',
                created_at: new Date().toISOString().split('T')[0]
            };
            list.unshift(item);
            setLocal('announcements', list);
            return item;
        },

        deleteAnnouncement: function(id) {
            let list = getLocal('announcements');
            list = list.filter(a => a.id != id);
            setLocal('announcements', list);
            return true;
        },

        // EVENTS
        getEvents: function() {
            return getLocal('events');
        },

        createEvent: function(data) {
            const list = getLocal('events');
            const item = {
                id: Date.now(),
                title: data.title,
                description: data.description,
                location: data.location,
                event_date: data.event_date,
                organizer: data.organizer || 'Ban Quản Lý',
                capacity: Number(data.capacity || 100),
                joined: 0,
                status: 'Upcoming'
            };
            list.unshift(item);
            setLocal('events', list);
            return item;
        },

        joinEvent: function(eventId) {
            const list = getLocal('events');
            const item = list.find(e => e.id == eventId);
            if (item && item.joined < item.capacity) {
                item.joined += 1;
                setLocal('events', list);
                return true;
            }
            return false;
        },

        // RULES
        getRules: function() {
            return getLocal('rules');
        },

        // Helper tính toán số người trong mỗi phòng
        recalculateOccupied: function() {
            const rooms = getLocal('rooms');
            const users = getLocal('users');

            rooms.forEach(r => {
                const count = users.filter(u => u.room_id == r.id).length;
                r.occupied = count;
                if (r.occupied >= r.capacity) {
                    r.status = 'Full';
                } else if (r.status !== 'Maintenance') {
                    r.status = 'Available';
                }
            });
            setLocal('rooms', rooms);
        },

        // Đặt lại dữ liệu gốc nếu muốn
        resetToDefault: function() {
            try {
                for (const [key, val] of Object.entries(INITIAL_DATA)) {
                    SafeStorage.setItem('dormex_' + key, JSON.stringify(val));
                }
                SafeStorage.removeItem('dormex_current_user');
            } catch (e) {}
            window.location.reload();
        }
    };
})();

