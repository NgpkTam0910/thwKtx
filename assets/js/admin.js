/**
 * DORMEX ADMIN SCRIPT
 * Xử lý toàn bộ logic nghiệp vụ cho Dashboard và các trang quản trị
 */

// 1. DASHBOARD OVERVIEW (admin/index.html)
function initAdminDashboard() {
    const rooms = DormexDB.getRooms();
    const students = DormexDB.getStudents();
    const bills = DormexDB.getBills();
    const pendingRegs = DormexDB.getRegistrations().filter(r => r.status === 'Pending');
    const pendingMaint = DormexDB.getMaintenance().filter(m => m.status === 'Pending');

    // Thống kê thẻ
    const totalRoomsEl = document.getElementById('statTotalRooms');
    const totalStudentsEl = document.getElementById('statTotalStudents');
    const totalRevenueEl = document.getElementById('statTotalRevenue');
    const pendingTasksEl = document.getElementById('statPendingTasks');

    if (totalRoomsEl) totalRoomsEl.textContent = rooms.length;
    if (totalStudentsEl) totalStudentsEl.textContent = students.length;
    if (pendingTasksEl) pendingTasksEl.textContent = pendingRegs.length + pendingMaint.length;

    // Tính tổng doanh thu hóa đơn đã thu
    const revenue = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + Number(b.total_amount), 0);
    if (totalRevenueEl) totalRevenueEl.textContent = formatMoney(revenue);

    // Render bảng đơn đăng ký cần duyệt gần đây
    const regTbody = document.getElementById('recentRegistrationsTable');
    if (regTbody) {
        if (pendingRegs.length === 0) {
            regTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">Không có đơn đăng ký mới cần duyệt</td></tr>`;
        } else {
            regTbody.innerHTML = pendingRegs.slice(0, 5).map(reg => `
                <tr>
                    <td><strong>${reg.full_name}</strong><br><small style="color:#64748b;">${reg.student_code}</small></td>
                    <td><span class="badge" style="background:#e0f2fe; color:#0284c7;">${reg.room_number}</span> - ${reg.building}</td>
                    <td>${reg.semester}</td>
                    <td><span class="badge badge-pending">Chờ duyệt</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-sm btn-success" onclick="approveReg(${reg.id})" title="Duyệt"><i class="fa-solid fa-check"></i> Duyệt</button>
                            <button class="btn btn-sm btn-danger" onclick="rejectReg(${reg.id})" title="Từ chối"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Render sự cố bảo trì mới
    const maintTbody = document.getElementById('recentMaintenanceTable');
    if (maintTbody) {
        if (pendingMaint.length === 0) {
            maintTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">Hiện không có sự cố nào cần xử lý</td></tr>`;
        } else {
            maintTbody.innerHTML = pendingMaint.slice(0, 5).map(m => `
                <tr>
                    <td><strong>Phòng ${m.room_number}</strong></td>
                    <td><span class="badge" style="background:#f1f5f9; color:#475569;">${m.category}</span> ${m.title}</td>
                    <td><span class="badge badge-pending">Đang chờ</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="openMaintModal(${m.id})"><i class="fa-solid fa-screwdriver-wrench"></i> Xử lý</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// 2. QUẢN LÝ SINH VIÊN (admin/users.html)
function renderUsersTable(search = '') {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    const students = DormexDB.getStudents({ search });
    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#94a3b8;">Không tìm thấy sinh viên nào</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map((s, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>
                <strong>${s.full_name}</strong><br>
                <small style="color:#64748b;">${s.student_code}</small>
            </td>
            <td>${s.class_name || '---'}</td>
            <td>${s.gender}</td>
            <td>
                <span class="badge" style="background:#e0f2fe; color:#0284c7; font-weight:700;">
                    ${s.room_number !== 'Chưa có' ? 'Phòng ' + s.room_number : 'Chưa xếp phòng'}
                </span>
            </td>
            <td>
                <small><i class="fa-solid fa-envelope"></i> ${s.email}</small><br>
                <small><i class="fa-solid fa-phone"></i> ${s.phone || '---'}</small>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-action" onclick="editStudent(${s.id})" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-action btn-del" onclick="deleteStudent(${s.id})" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddStudentModal() {
    document.getElementById('studentModalTitle').textContent = 'Thêm Sinh Viên Mới';
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    loadRoomOptions('studentRoomSelect');
    openModal('studentModal');
}

function editStudent(id) {
    const students = DormexDB.getStudents();
    const s = students.find(item => item.id == id);
    if (!s) return;

    document.getElementById('studentModalTitle').textContent = 'Chỉnh Sửa Thông Tin Sinh Viên';
    document.getElementById('studentId').value = s.id;
    document.getElementById('studentFullName').value = s.full_name;
    document.getElementById('studentCode').value = s.student_code;
    document.getElementById('studentEmail').value = s.email;
    document.getElementById('studentPhone').value = s.phone || '';
    document.getElementById('studentClass').value = s.class_name || '';
    document.getElementById('studentGender').value = s.gender || 'Nam';

    loadRoomOptions('studentRoomSelect', s.room_id);
    openModal('studentModal');
}

function handleSaveStudent(e) {
    e.preventDefault();
    const id = document.getElementById('studentId').value;
    const studentData = {
        id: id ? Number(id) : null,
        full_name: document.getElementById('studentFullName').value.trim(),
        student_code: document.getElementById('studentCode').value.trim(),
        username: document.getElementById('studentCode').value.trim().toLowerCase(),
        email: document.getElementById('studentEmail').value.trim(),
        phone: document.getElementById('studentPhone').value.trim(),
        class_name: document.getElementById('studentClass').value.trim(),
        gender: document.getElementById('studentGender').value,
        room_id: document.getElementById('studentRoomSelect').value ? Number(document.getElementById('studentRoomSelect').value) : null
    };

    DormexDB.saveStudent(studentData);
    closeModal('studentModal');
    renderUsersTable();
    showToast(id ? 'Cập nhật sinh viên thành công!' : 'Thêm sinh viên mới thành công!', 'success');
}

function deleteStudent(id) {
    if (confirm('Bạn có chắc chắn muốn xóa sinh viên này khỏi hệ thống ký túc xá?')) {
        DormexDB.deleteStudent(id);
        renderUsersTable();
        showToast('Đã xóa sinh viên thành công', 'success');
    }
}

// 3. QUẢN LÝ PHÒNG (admin/rooms.html)
function renderRoomsTable(building = '', status = '') {
    const tbody = document.getElementById('roomsTableBody');
    if (!tbody) return;

    let rooms = DormexDB.getRooms({ building, status });

    if (rooms.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:#94a3b8;">Không tìm thấy phòng phù hợp</td></tr>`;
        return;
    }

    tbody.innerHTML = rooms.map(r => {
        let badgeClass = 'badge-available';
        let statusText = 'Còn chỗ';
        if (r.status === 'Full') { badgeClass = 'badge-full'; statusText = 'Đã kín'; }
        if (r.status === 'Maintenance') { badgeClass = 'badge-maintenance'; statusText = 'Bảo trì'; }

        return `
            <tr>
                <td><strong>Phòng ${r.room_number}</strong></td>
                <td>${r.building}</td>
                <td>Tầng ${r.floor}</td>
                <td>${r.room_type}</td>
                <td>
                    <span style="font-weight:700; color:${r.occupied >= r.capacity ? '#ef4444' : '#0284c7'};">
                        ${r.occupied} / ${r.capacity}
                    </span> người
                </td>
                <td style="font-weight:700; color:#0369a1;">${formatMoney(r.price)} / tháng</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action" onclick="editRoom(${r.id})" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn-action btn-del" onclick="deleteRoom(${r.id})" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openAddRoomModal() {
    document.getElementById('roomModalTitle').textContent = 'Thêm Phòng Ký Túc Xá Mới';
    document.getElementById('roomForm').reset();
    document.getElementById('roomId').value = '';
    openModal('roomModal');
}

function editRoom(id) {
    const room = DormexDB.getRoomById(id);
    if (!room) return;

    document.getElementById('roomModalTitle').textContent = 'Chỉnh Sửa Phòng ' + room.room_number;
    document.getElementById('roomId').value = room.id;
    document.getElementById('roomNumber').value = room.room_number;
    document.getElementById('roomBuilding').value = room.building;
    document.getElementById('roomFloor').value = room.floor;
    document.getElementById('roomType').value = room.room_type;
    document.getElementById('roomCapacity').value = room.capacity;
    document.getElementById('roomPrice').value = room.price;
    document.getElementById('roomStatus').value = room.status;
    document.getElementById('roomDescription').value = room.description || '';

    openModal('roomModal');
}

function handleSaveRoom(e) {
    e.preventDefault();
    const id = document.getElementById('roomId').value;
    const roomData = {
        id: id ? Number(id) : null,
        room_number: document.getElementById('roomNumber').value.trim(),
        building: document.getElementById('roomBuilding').value,
        floor: Number(document.getElementById('roomFloor').value),
        room_type: document.getElementById('roomType').value,
        capacity: Number(document.getElementById('roomCapacity').value),
        price: Number(document.getElementById('roomPrice').value),
        status: document.getElementById('roomStatus').value,
        description: document.getElementById('roomDescription').value.trim()
    };

    DormexDB.saveRoom(roomData);
    closeModal('roomModal');
    renderRoomsTable();
    showToast(id ? 'Cập nhật phòng thành công!' : 'Thêm phòng mới thành công!', 'success');
}

function deleteRoom(id) {
    if (confirm('Bạn có chắc muốn xóa phòng này? Sinh viên thuộc phòng này sẽ được gỡ bỏ phòng.')) {
        DormexDB.deleteRoom(id);
        renderRoomsTable();
        showToast('Đã xóa phòng thành công!', 'success');
    }
}

// 4. QUẢN LÝ ĐƠN ĐĂNG KÝ (admin/registrations.html)
function renderRegistrationsTable(statusFilter = '') {
    const tbody = document.getElementById('registrationsTableBody');
    if (!tbody) return;

    let regs = DormexDB.getRegistrations();
    if (statusFilter) regs = regs.filter(r => r.status === statusFilter);

    if (regs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#94a3b8;">Không có đơn đăng ký nào</td></tr>`;
        return;
    }

    tbody.innerHTML = regs.map(reg => {
        let badgeClass = 'badge-pending';
        let statusText = 'Chờ duyệt';
        if (reg.status === 'Approved') { badgeClass = 'badge-approved'; statusText = 'Đã duyệt'; }
        if (reg.status === 'Rejected') { badgeClass = 'badge-rejected'; statusText = 'Từ chối'; }

        return `
            <tr>
                <td>
                    <strong>${reg.full_name}</strong><br>
                    <small style="color:#64748b;">${reg.student_code} - ${reg.class_name}</small>
                </td>
                <td>
                    <strong>Phòng ${reg.room_number}</strong><br>
                    <small style="color:#64748b;">${reg.building}</small>
                </td>
                <td>${reg.semester}</td>
                <td><small>${reg.start_date} → ${reg.end_date || 'Kết thúc kỳ'}</small></td>
                <td><small style="color:#64748b;">${reg.note || 'Không có ghi chú'}</small></td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>
                    ${reg.status === 'Pending' ? `
                        <div class="action-btns">
                            <button class="btn btn-sm btn-success" onclick="approveReg(${reg.id})"><i class="fa-solid fa-check"></i> Duyệt</button>
                            <button class="btn btn-sm btn-danger" onclick="rejectReg(${reg.id})"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    ` : `<span style="color:#94a3b8; font-size:0.85rem;">Đã xử lý</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

function approveReg(id) {
    if (confirm('Duyệt đơn đăng ký này? Sinh viên sẽ được chuyển vào phòng đã đăng ký.')) {
        DormexDB.updateRegistrationStatus(id, 'Approved', 'Ban quản lý đã phê duyệt');
        if (typeof renderRegistrationsTable === 'function') renderRegistrationsTable();
        if (typeof initAdminDashboard === 'function') initAdminDashboard();
        showToast('Đã phê duyệt đơn thành công!', 'success');
    }
}

function rejectReg(id) {
    const reason = prompt('Nhập lý do từ chối đơn:', 'Phòng đã đủ số lượng hoặc hồ sơ chưa hợp lệ');
    if (reason !== null) {
        DormexDB.updateRegistrationStatus(id, 'Rejected', reason);
        if (typeof renderRegistrationsTable === 'function') renderRegistrationsTable();
        if (typeof initAdminDashboard === 'function') initAdminDashboard();
        showToast('Đã từ chối đơn đăng ký', 'warning');
    }
}

// 5. QUẢN LÝ HÓA ĐƠN (admin/billing.html)
function renderBillsTable(statusFilter = '') {
    const tbody = document.getElementById('billsTableBody');
    if (!tbody) return;

    let bills = DormexDB.getBills();
    if (statusFilter) bills = bills.filter(b => b.status === statusFilter);

    if (bills.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:#94a3b8;">Không có hóa đơn nào</td></tr>`;
        return;
    }

    tbody.innerHTML = bills.map(b => {
        const isPaid = b.status === 'Paid';
        return `
            <tr>
                <td><code>${b.bill_code}</code></td>
                <td><strong>Phòng ${b.room_number}</strong><br><small style="color:#64748b;">${b.building}</small></td>
                <td>Tháng ${b.month}/${b.year}</td>
                <td>
                    <small>Tiền phòng: ${formatMoney(b.room_fee)}</small><br>
                    <small>Điện: ${b.elec_new - b.elec_old} kWh (${formatMoney(b.elec_fee)})</small><br>
                    <small>Nước: ${b.water_new - b.water_old} m³ (${formatMoney(b.water_fee)})</small>
                </td>
                <td style="font-size:1.05rem; font-weight:800; color:#0369a1;">${formatMoney(b.total_amount)}</td>
                <td>
                    <span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}">
                        ${isPaid ? 'Đã thu' : 'Chưa thu'}
                    </span>
                    ${isPaid && b.payment_date ? `<br><small style="color:#64748b; font-size:0.75rem;">${b.payment_date}</small>` : ''}
                </td>
                <td>
                    ${!isPaid ? `
                        <button class="btn btn-sm btn-success" onclick="markBillPaid(${b.id})">
                            <i class="fa-solid fa-check"></i> Thu tiền
                        </button>
                    ` : `<span style="color:#10b981; font-weight:600;"><i class="fa-solid fa-circle-check"></i> Hoàn tất</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

function openAddBillModal() {
    document.getElementById('billForm').reset();
    loadRoomOptions('billRoomSelect');
    // Mặc định tháng hiện tại
    const now = new Date();
    document.getElementById('billMonth').value = now.getMonth() + 1;
    document.getElementById('billYear').value = now.getFullYear();
    openModal('billModal');
}

function handleSaveBill(e) {
    e.preventDefault();
    const roomId = document.getElementById('billRoomSelect').value;
    const room = DormexDB.getRoomById(roomId);

    const billData = {
        room_id: Number(roomId),
        user_id: room && room.members && room.members.length > 0 ? room.members[0].id : null,
        month: Number(document.getElementById('billMonth').value),
        year: Number(document.getElementById('billYear').value),
        room_fee: Number(document.getElementById('billRoomFee').value || (room ? room.price : 650000)),
        elec_old: Number(document.getElementById('billElecOld').value || 0),
        elec_new: Number(document.getElementById('billElecNew').value || 0),
        water_old: Number(document.getElementById('billWaterOld').value || 0),
        water_new: Number(document.getElementById('billWaterNew').value || 0),
        service_fee: Number(document.getElementById('billServiceFee').value || 50000)
    };

    DormexDB.createBill(billData);
    closeModal('billModal');
    renderBillsTable();
    showToast('Tạo hóa đơn mới thành công!', 'success');
}

function markBillPaid(id) {
    if (confirm('Xác nhận đã nhận đủ tiền hóa đơn này?')) {
        DormexDB.payBill(id);
        renderBillsTable();
        showToast('Đã xác nhận thanh toán thành công!', 'success');
    }
}

// 6. QUẢN LÝ BẢO TRÌ (admin/maintenance.html)
function renderMaintenanceTable(statusFilter = '') {
    const tbody = document.getElementById('maintTableBody');
    if (!tbody) return;

    let list = DormexDB.getMaintenance();
    if (statusFilter) list = list.filter(m => m.status === statusFilter);

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#94a3b8;">Không có yêu cầu bảo trì nào</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(m => {
        let badgeClass = 'badge-pending';
        let statusText = 'Đang chờ';
        if (m.status === 'Processing') { badgeClass = 'badge-processing'; statusText = 'Đang xử lý'; }
        if (m.status === 'Completed') { badgeClass = 'badge-completed'; statusText = 'Đã hoàn thành'; }

        return `
            <tr>
                <td><strong>Phòng ${m.room_number}</strong><br><small style="color:#64748b;">${m.building}</small></td>
                <td>
                    <strong>${m.title}</strong>
                    <p style="font-size:0.85rem; color:#475569; margin-top:2px;">${m.description}</p>
                </td>
                <td><span class="badge" style="background:#f1f5f9; color:#334155;">${m.category}</span></td>
                <td><small>${m.full_name} (${m.phone || 'SĐT?'})</small></td>
                <td><small>${m.created_at}</small></td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="openMaintModal(${m.id})">
                        <i class="fa-solid fa-pen-to-square"></i> Cập nhật
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openMaintModal(id) {
    const list = DormexDB.getMaintenance();
    const item = list.find(m => m.id == id);
    if (!item) return;

    document.getElementById('maintId').value = item.id;
    document.getElementById('maintInfoTitle').textContent = `Sự cố: ${item.title} (Phòng ${item.room_number})`;
    document.getElementById('maintStatus').value = item.status;
    document.getElementById('maintStaffNote').value = item.staff_note || '';

    openModal('maintModal');
}

function handleUpdateMaint(e) {
    e.preventDefault();
    const id = document.getElementById('maintId').value;
    const status = document.getElementById('maintStatus').value;
    const note = document.getElementById('maintStaffNote').value.trim();

    DormexDB.updateMaintenance(id, status, note);
    closeModal('maintModal');
    if (typeof renderMaintenanceTable === 'function') renderMaintenanceTable();
    if (typeof initAdminDashboard === 'function') initAdminDashboard();
    showToast('Cập nhật tiến độ bảo trì thành công!', 'success');
}

// 7. QUẢN LÝ THÔNG BÁO (admin/announcements.html)
function renderAnnouncementsAdmin() {
    const container = document.getElementById('adminAnnouncementsList');
    if (!container) return;

    const list = DormexDB.getAnnouncements();
    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:3rem; color:#94a3b8;">Chưa có thông báo nào</div>`;
        return;
    }

    container.innerHTML = list.map(item => `
        <div class="card" style="margin-bottom:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <span class="badge" style="background:#e0f2fe; color:#0284c7; margin-bottom:6px;">${item.category}</span>
                    ${item.is_pinned ? `<span class="badge" style="background:#fef3c7; color:#d97706;"><i class="fa-solid fa-thumbtack"></i> Đã ghim</span>` : ''}
                    <h3 style="font-size:1.15rem; color:#0f172a; margin:4px 0 8px;">${item.title}</h3>
                    <p style="color:#475569; font-size:0.92rem; line-height:1.6;">${item.content}</p>
                    <small style="color:#94a3b8; display:block; margin-top:10px;">
                        <i class="fa-solid fa-user-pen"></i> ${item.author} &bull; <i class="fa-solid fa-clock"></i> ${item.created_at}
                    </small>
                </div>
                <button class="btn-action btn-del" onclick="deleteAnnouncement(${item.id})" title="Xóa thông báo">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function handleCreateAnnouncement(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('annTitle').value.trim(),
        category: document.getElementById('annCategory').value,
        content: document.getElementById('annContent').value.trim(),
        is_pinned: document.getElementById('annPinned').checked,
        author: 'Ban Quản Lý'
    };

    DormexDB.createAnnouncement(data);
    closeModal('annModal');
    document.getElementById('annForm').reset();
    renderAnnouncementsAdmin();
    showToast('Đăng thông báo mới thành công!', 'success');
}

function deleteAnnouncement(id) {
    if (confirm('Bạn có chắc muốn xóa thông báo này?')) {
        DormexDB.deleteAnnouncement(id);
        renderAnnouncementsAdmin();
        showToast('Đã xóa thông báo!', 'success');
    }
}

// 8. QUẢN LÝ SỰ KIỆN (admin/events.html)
function renderEventsAdmin() {
    const container = document.getElementById('adminEventsList');
    if (!container) return;

    const list = DormexDB.getEvents();
    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:3rem; color:#94a3b8;">Chưa có sự kiện nào</div>`;
        return;
    }

    container.innerHTML = list.map(ev => `
        <div class="card" style="margin-bottom:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex:1;">
                    <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
                        <span class="badge" style="background:#e0f2fe; color:#0284c7;"><i class="fa-solid fa-calendar-day"></i> ${ev.event_date}</span>
                        <span class="badge" style="background:#dcfce7; color:#16a34a;"><i class="fa-solid fa-location-dot"></i> ${ev.location}</span>
                    </div>
                    <h3 style="font-size:1.15rem; color:#0f172a; margin-bottom:6px;">${ev.title}</h3>
                    <p style="color:#475569; font-size:0.92rem; line-height:1.6; margin-bottom:8px;">${ev.description}</p>
                    <div style="display:flex; gap:16px; font-size:0.85rem; color:#64748b;">
                        <span><i class="fa-solid fa-users"></i> Tham gia: <strong>${ev.joined}/${ev.capacity}</strong></span>
                        <span><i class="fa-solid fa-sitemap"></i> Đơn vị: ${ev.organizer}</span>
                    </div>
                </div>
                <button class="btn-action btn-del" onclick="deleteEventAdmin(${ev.id})" title="Xóa sự kiện">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function handleCreateEvent(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('evTitle').value.trim(),
        event_date: document.getElementById('evDate').value,
        location: document.getElementById('evLocation').value.trim(),
        organizer: document.getElementById('evOrganizer').value.trim(),
        capacity: document.getElementById('evCapacity').value,
        description: document.getElementById('evDescription').value.trim()
    };

    DormexDB.createEvent(data);
    closeModal('eventModal');
    document.getElementById('eventForm').reset();
    renderEventsAdmin();
    showToast('Tạo sự kiện mới thành công!', 'success');
}

function deleteEventAdmin(id) {
    let events = DormexDB.getEvents().filter(e => e.id != id);
    SafeStorage.setItem('dormex_events', JSON.stringify(events));
    renderEventsAdmin();
    showToast('Đã xóa sự kiện!', 'success');
}

// 9. QUẢN LÝ NỘI QUY (admin/rules.html)
function renderRulesAdmin() {
    const container = document.getElementById('adminRulesList');
    if (!container) return;

    const list = DormexDB.getRules();
    container.innerHTML = list.map(r => `
        <div class="rule-card">
            <div class="rule-header">
                <div>
                    <span class="rule-code">${r.code}</span>
                    <strong style="margin-left:8px; font-size:1.05rem; color:#0f172a;">${r.title}</strong>
                </div>
                <span class="badge" style="background:#f1f5f9; color:#475569;">${r.category}</span>
            </div>
            <p style="color:#475569; font-size:0.92rem; margin:8px 0;">${r.content}</p>
            <div class="rule-penalty"><i class="fa-solid fa-triangle-exclamation"></i> Hình thức xử lý: ${r.penalty}</div>
        </div>
    `).join('');
}

// Helper tải danh sách phòng vào thẻ <select>
function loadRoomOptions(selectId, selectedId = null) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const rooms = DormexDB.getRooms();
    select.innerHTML = '<option value="">-- Chọn phòng --</option>' + rooms.map(r => `
        <option value="${r.id}" ${selectedId == r.id ? 'selected' : ''}>
            Phòng ${r.room_number} (${r.building} - Còn ${r.capacity - r.occupied} chỗ)
        </option>
    `).join('');
}

