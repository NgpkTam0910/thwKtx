/**
 * DORMEX STUDENT SCRIPT
 * Xử lý toàn bộ logic nghiệp vụ cho Cổng thông tin Sinh viên
 */

// 1. TRANG TỔNG QUAN SINH VIÊN (pages/home.html)
function initStudentHome() {
    const user = DormexDB.getCurrentUser();
    if (!user) return;

    // Cập nhật tên chào mừng
    const welcomeName = document.getElementById('studentWelcomeName');
    if (welcomeName) welcomeName.textContent = user.full_name;

    // Thông tin phòng hiện tại
    const roomBox = document.getElementById('myRoomSummaryBox');
    if (roomBox) {
        if (user.room_id) {
            const room = DormexDB.getRoomById(user.room_id);
            if (room) {
                const members = room.members || [];
                roomBox.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <div>
                            <span class="badge" style="background:#e0f2fe; color:#0284c7; font-size:0.9rem;">${room.building}</span>
                            <h2 style="font-size:2rem; font-weight:800; color:#0369a1; margin-top:4px;">Phòng ${room.room_number}</h2>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:1.15rem; font-weight:800; color:#0284c7;">${formatMoney(room.price)}</span>
                            <small style="display:block; color:#64748b;">/ sinh viên / tháng</small>
                        </div>
                    </div>
                    <p style="color:#64748b; font-size:0.92rem; margin-bottom:1.25rem;"><i class="fa-solid fa-circle-info"></i> ${room.description}</p>
                    
                    <h4 style="font-size:1rem; font-weight:700; color:#0f172a; margin-bottom:0.75rem;"><i class="fa-solid fa-users"></i> Bạn cùng phòng (${members.length}/${room.capacity}):</h4>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
                        ${members.map(m => `
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.75rem 1rem; display:flex; align-items:center; gap:10px;">
                                <div style="width:34px; height:34px; border-radius:50%; background:#e0f2fe; color:#0284c7; display:flex; align-items:center; justify-content:center; font-weight:700;">
                                    ${m.full_name.charAt(0)}
                                </div>
                                <div>
                                    <strong style="font-size:0.88rem; color:#0f172a;">${m.full_name}</strong>
                                    <small style="display:block; color:#64748b; font-size:0.78rem;">${m.student_code} - ${m.class_name}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } else {
            roomBox.innerHTML = `
                <div style="text-align:center; padding:2.5rem 1rem;">
                    <div style="width:60px; height:60px; border-radius:50%; background:#f1f5f9; color:#94a3b8; display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 1rem;">
                        <i class="fa-solid fa-bed"></i>
                    </div>
                    <h3 style="color:#0f172a; font-size:1.2rem; margin-bottom:0.5rem;">Bạn chưa có phòng ở Ký Túc Xá</h3>
                    <p style="color:#64748b; font-size:0.92rem; max-width:450px; margin:0 auto 1.5rem;">Hãy nộp đơn đăng ký phòng trực tuyến để được ban quản lý xét duyệt chỗ ở sớm nhất.</p>
                    <a href="registration.html" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> Đăng Ký Phòng Ngay</a>
                </div>
            `;
        }
    }

    // Hóa đơn cần thanh toán
    const billBox = document.getElementById('myUnpaidBillBox');
    if (billBox && user.room_id) {
        const bills = DormexDB.getBills(user.room_id).filter(b => b.status === 'Unpaid');
        if (bills.length > 0) {
            const b = bills[0];
            billBox.innerHTML = `
                <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:1.25rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span class="badge" style="background:#fef3c7; color:#d97706; margin-bottom:4px;">Chưa thanh toán</span>
                            <h4 style="font-size:1.1rem; color:#0f172a; margin:4px 0;">Hóa đơn tháng ${b.month}/${b.year}</h4>
                            <small style="color:#64748b;">Mã HĐ: ${b.bill_code}</small>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:1.4rem; font-weight:800; color:#b45309;">${formatMoney(b.total_amount)}</div>
                            <a href="billing.html" class="btn btn-sm btn-primary" style="margin-top:6px;">Thanh toán ngay</a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            billBox.innerHTML = `
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:1rem; display:flex; align-items:center; gap:12px; color:#166534;">
                    <i class="fa-solid fa-circle-check" style="font-size:1.5rem;"></i>
                    <div>
                        <strong>Không có hóa đơn chưa thanh toán</strong>
                        <small style="display:block; color:#15803d;">Bạn đã hoàn thành toàn bộ nghĩa vụ tài chính kỳ này.</small>
                    </div>
                </div>
            `;
        }
    }

    // Thông báo mới nhất
    const annBox = document.getElementById('homeAnnouncementsList');
    if (annBox) {
        const list = DormexDB.getAnnouncements().slice(0, 3);
        annBox.innerHTML = list.map(item => `
            <div style="padding:1rem 0; border-bottom:1px solid #f1f5f9;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span class="badge" style="background:#e0f2fe; color:#0284c7; font-size:0.75rem;">${item.category}</span>
                    <small style="color:#94a3b8;">${item.created_at}</small>
                </div>
                <h4 style="font-size:0.95rem; font-weight:700; color:#0f172a; margin-bottom:4px;">${item.title}</h4>
                <p style="font-size:0.85rem; color:#64748b; line-height:1.5;">${item.content.substring(0, 110)}...</p>
            </div>
        `).join('');
    }
}

// 2. HỒ SƠ SINH VIÊN (pages/profile.html)
function initStudentProfile() {
    const user = DormexDB.getCurrentUser();
    if (!user) return;

    document.getElementById('profileFullName').value = user.full_name || '';
    document.getElementById('profileCode').value = user.student_code || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileClass').value = user.class_name || '';
    document.getElementById('profileGender').value = user.gender || 'Nam';

    const roomText = document.getElementById('profileRoomText');
    if (roomText) {
        if (user.room_id) {
            const room = DormexDB.getRoomById(user.room_id);
            roomText.textContent = room ? `Phòng ${room.room_number} (${room.building})` : 'Chưa xếp phòng';
        } else {
            roomText.textContent = 'Chưa có phòng';
        }
    }
}

function handleSaveProfile(e) {
    e.preventDefault();
    const user = DormexDB.getCurrentUser();
    if (!user) return;

    user.full_name = document.getElementById('profileFullName').value.trim();
    user.email = document.getElementById('profileEmail').value.trim();
    user.phone = document.getElementById('profilePhone').value.trim();
    user.class_name = document.getElementById('profileClass').value.trim();
    user.gender = document.getElementById('profileGender').value;

    const newPass = document.getElementById('profilePassword').value;
    if (newPass) {
        user.password = newPass;
    }

    DormexDB.saveStudent(user);
    SafeStorage.setItem('dormex_current_user', JSON.stringify(user));
    showToast('Cập nhật thông tin cá nhân thành công!', 'success');
}

// 3. ĐĂNG KÝ PHÒNG (pages/registration.html)
function initRegistrationPage() {
    loadRoomOptionsForStudent('regRoomSelect');

    const user = DormexDB.getCurrentUser();
    if (user) {
        // Tải lịch sử đơn của sinh viên
        const myRegs = DormexDB.getRegistrations(user.id);
        const tbody = document.getElementById('myRegistrationsHistory');
        if (tbody) {
            if (myRegs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#94a3b8;">Bạn chưa gửi đơn đăng ký nào</td></tr>`;
            } else {
                tbody.innerHTML = myRegs.map(reg => {
                    let badgeClass = 'badge-pending';
                    let statusText = 'Đang chờ duyệt';
                    if (reg.status === 'Approved') { badgeClass = 'badge-approved'; statusText = 'Đã chấp thuận'; }
                    if (reg.status === 'Rejected') { badgeClass = 'badge-rejected'; statusText = 'Từ chối'; }

                    return `
                        <tr>
                            <td><strong>Phòng ${reg.room_number}</strong> (${reg.building})</td>
                            <td>${reg.semester}</td>
                            <td>${reg.start_date}</td>
                            <td><span class="badge ${badgeClass}">${statusText}</span></td>
                            <td><small style="color:#64748b;">${reg.note || '---'}</small></td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }
}

function loadRoomOptionsForStudent(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const rooms = DormexDB.getRooms().filter(r => r.status === 'Available');
    select.innerHTML = '<option value="">-- Chọn phòng còn chỗ trống --</option>' + rooms.map(r => `
        <option value="${r.id}">
            Phòng ${r.room_number} - ${r.building} (${r.room_type} | Còn ${r.capacity - r.occupied} chỗ | ${formatMoney(r.price)}/tháng)
        </option>
    `).join('');
}

function handleSubmitRegistration(e) {
    e.preventDefault();
    const user = DormexDB.getCurrentUser();
    if (!user) {
        showToast('Vui lòng đăng nhập trước khi gửi đơn!', 'warning');
        return;
    }

    const roomId = document.getElementById('regRoomSelect').value;
    if (!roomId) {
        showToast('Vui lòng chọn phòng muốn đăng ký!', 'warning');
        return;
    }

    const regData = {
        user_id: user.id,
        room_id: Number(roomId),
        semester: document.getElementById('regSemester').value,
        start_date: document.getElementById('regStartDate').value,
        end_date: document.getElementById('regEndDate').value,
        note: document.getElementById('regNote').value.trim()
    };

    DormexDB.createRegistration(regData);
    document.getElementById('registrationForm').reset();
    initRegistrationPage();
    showToast('Gửi đơn đăng ký thành công! Ban quản lý sẽ sớm duyệt hồ sơ của bạn.', 'success');
}

// 4. DANH SÁCH PHÒNG (pages/rooms.html)
function renderStudentRooms(buildingFilter = '', typeFilter = '') {
    const container = document.getElementById('roomsGridContainer');
    if (!container) return;

    let rooms = DormexDB.getRooms();
    if (buildingFilter) rooms = rooms.filter(r => r.building.includes(buildingFilter));
    if (typeFilter) rooms = rooms.filter(r => r.room_type.includes(typeFilter));

    if (rooms.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#94a3b8;">Không có phòng nào phù hợp với bộ lọc</div>`;
        return;
    }

    container.innerHTML = rooms.map(r => {
        const available = r.capacity - r.occupied;
        const isFull = available <= 0;

        return `
            <div class="room-card-preview">
                <div class="room-card-head">
                    <div>
                        <div class="room-num">Phòng ${r.room_number}</div>
                        <span class="room-bld">${r.building}</span>
                    </div>
                    <span class="badge ${isFull ? 'badge-full' : 'badge-available'}" style="background:#ffffff; color:${isFull ? '#ef4444' : '#0284c7'};">
                        ${isFull ? 'Hết chỗ' : `Còn ${available} chỗ`}
                    </span>
                </div>
                <div class="room-card-body">
                    <div class="room-info-item">
                        <span class="label"><i class="fa-solid fa-layer-group"></i> Tầng</span>
                        <span class="val">Tầng ${r.floor}</span>
                    </div>
                    <div class="room-info-item">
                        <span class="label"><i class="fa-solid fa-shapes"></i> Loại phòng</span>
                        <span class="val">${r.room_type}</span>
                    </div>
                    <div class="room-info-item">
                        <span class="label"><i class="fa-solid fa-users"></i> Sức chứa</span>
                        <span class="val">${r.occupied}/${r.capacity} sinh viên</span>
                    </div>
                    <div style="font-size:0.88rem; color:#64748b; margin:0.75rem 0;">
                        ${r.description}
                    </div>
                    <div class="room-price-tag">
                        ${formatMoney(r.price)} <small style="font-size:0.8rem; font-weight:normal; color:#64748b;">/tháng</small>
                    </div>
                    ${!isFull ? `
                        <a href="registration.html" class="btn btn-primary" style="width:100%;">
                            <i class="fa-solid fa-file-signature"></i> Đăng Ký Phòng Này
                        </a>
                    ` : `
                        <button class="btn btn-outline" style="width:100%; cursor:not-allowed; opacity:0.6;" disabled>
                            Phòng đã kín
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// 5. BÁO HỎNG & BẢO TRÌ (pages/maintenance.html)
function initStudentMaintenance() {
    const user = DormexDB.getCurrentUser();
    if (!user) return;

    const list = DormexDB.getMaintenance(user.id);
    const container = document.getElementById('myMaintList');
    if (container) {
        if (list.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:3rem; color:#94a3b8;">Bạn chưa gửi báo cáo sự cố nào</div>`;
        } else {
            container.innerHTML = list.map(item => {
                let badgeClass = 'badge-pending';
                let statusText = 'Đang chờ tiếp nhận';
                if (item.status === 'Processing') { badgeClass = 'badge-processing'; statusText = 'Đang xử lý'; }
                if (item.status === 'Completed') { badgeClass = 'badge-completed'; statusText = 'Đã hoàn thành'; }

                return `
                    <div class="card" style="margin-bottom:1.25rem;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                            <div>
                                <span class="badge" style="background:#f1f5f9; color:#475569; margin-bottom:6px;">${item.category}</span>
                                <h4 style="font-size:1.1rem; color:#0f172a; margin-top:2px;">${item.title}</h4>
                            </div>
                            <span class="badge ${badgeClass}">${statusText}</span>
                        </div>
                        <p style="color:#475569; font-size:0.92rem; margin-bottom:8px;">${item.description}</p>
                        ${item.staff_note ? `
                            <div style="background:#e0f2fe; border-left:3px solid #0284c7; padding:0.6rem 0.85rem; border-radius:6px; font-size:0.85rem; color:#0369a1; margin:8px 0;">
                                <i class="fa-solid fa-wrench"></i> <strong>Ghi chú kỹ thuật:</strong> ${item.staff_note}
                            </div>
                        ` : ''}
                        <small style="color:#94a3b8;"><i class="fa-solid fa-clock"></i> Gửi lúc: ${item.created_at}</small>
                    </div>
                `;
            }).join('');
        }
    }
}

function handleCreateStudentMaint(e) {
    e.preventDefault();
    const user = DormexDB.getCurrentUser();
    if (!user || !user.room_id) {
        showToast('Bạn cần được xếp phòng trước khi báo hỏng trang thiết bị!', 'warning');
        return;
    }

    const data = {
        user_id: user.id,
        room_id: user.room_id,
        title: document.getElementById('maintTitle').value.trim(),
        category: document.getElementById('maintCategory').value,
        description: document.getElementById('maintDescription').value.trim()
    };

    DormexDB.createMaintenance(data);
    document.getElementById('maintForm').reset();
    initStudentMaintenance();
    showToast('Gửi báo cáo sự cố thành công! Kỹ thuật viên sẽ kiểm tra sớm nhất.', 'success');
}

// 6. HÓA ĐƠN & THANH TOÁN (pages/billing.html)
let currentPayingBill = null;

function initStudentBilling() {
    const user = DormexDB.getCurrentUser();
    if (!user || !user.room_id) {
        const c = document.getElementById('studentBillingContainer');
        if (c) c.innerHTML = `<div style="text-align:center; padding:3rem; color:#94a3b8;">Bạn chưa thuộc phòng nào nên chưa có hóa đơn.</div>`;
        return;
    }

    const bills = DormexDB.getBills(user.room_id);
    const tbody = document.getElementById('studentBillsTableBody');
    if (tbody) {
        if (bills.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#94a3b8;">Phòng bạn chưa có hóa đơn nào</td></tr>`;
        } else {
            tbody.innerHTML = bills.map(b => {
                const isPaid = b.status === 'Paid';
                return `
                    <tr>
                        <td><code>${b.bill_code}</code></td>
                        <td>Tháng ${b.month}/${b.year}</td>
                        <td>${formatMoney(b.room_fee)}</td>
                        <td>
                            <small>Điện: ${b.elec_new - b.elec_old} kWh (${formatMoney(b.elec_fee)})</small><br>
                            <small>Nước: ${b.water_new - b.water_old} m³ (${formatMoney(b.water_fee)})</small>
                        </td>
                        <td style="font-weight:800; color:#0369a1; font-size:1.05rem;">${formatMoney(b.total_amount)}</td>
                        <td><span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}">${isPaid ? 'Đã đóng' : 'Chưa đóng'}</span></td>
                        <td>
                            ${!isPaid ? `
                                <button class="btn btn-sm btn-primary" onclick="openPaymentModal(${b.id})">
                                    <i class="fa-solid fa-qrcode"></i> Thanh toán
                                </button>
                            ` : `<small style="color:#10b981;"><i class="fa-solid fa-circle-check"></i> Đã hoàn tất</small>`}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function openPaymentModal(billId) {
    const bills = DormexDB.getBills();
    const bill = bills.find(b => b.id == billId);
    if (!bill) return;

    currentPayingBill = bill;
    document.getElementById('modalBillCode').textContent = bill.bill_code;
    document.getElementById('modalBillAmount').textContent = formatMoney(bill.total_amount);
    document.getElementById('modalBillDetail').innerHTML = `
        <div class="bill-line"><span>Tiền phòng:</span> <strong>${formatMoney(bill.room_fee)}</strong></div>
        <div class="bill-line"><span>Tiền điện (${bill.elec_new - bill.elec_old} kWh):</span> <strong>${formatMoney(bill.elec_fee)}</strong></div>
        <div class="bill-line"><span>Tiền nước (${bill.water_new - bill.water_old} m³):</span> <strong>${formatMoney(bill.water_fee)}</strong></div>
        <div class="bill-line"><span>Phí dịch vụ & vệ sinh:</span> <strong>${formatMoney(bill.service_fee)}</strong></div>
        <div class="bill-line total"><span>TỔNG CỘNG:</span> <span>${formatMoney(bill.total_amount)}</span></div>
    `;

    openModal('paymentModal');
}

function confirmSimulatedPayment() {
    if (!currentPayingBill) return;
    DormexDB.payBill(currentPayingBill.id);
    closeModal('paymentModal');
    initStudentBilling();
    showToast(`Thanh toán thành công hóa đơn ${currentPayingBill.bill_code}!`, 'success');
    currentPayingBill = null;
}

// 7. SỰ KIỆN SINH VIÊN (pages/events.html)
function initStudentEvents() {
    const events = DormexDB.getEvents();
    const container = document.getElementById('studentEventsGrid');
    if (!container) return;

    container.innerHTML = events.map(ev => `
        <div class="card" style="display:flex; flex-direction:column;">
            <div style="background:linear-gradient(135deg, #0284c7 0%, #38bdf8 100%); padding:1.25rem; border-radius:12px; color:#ffffff; margin-bottom:1.25rem;">
                <div style="font-size:0.85rem; opacity:0.9;"><i class="fa-solid fa-calendar-day"></i> ${ev.event_date}</div>
                <h3 style="font-size:1.2rem; margin-top:4px; font-weight:800;">${ev.title}</h3>
            </div>
            <p style="color:#475569; font-size:0.92rem; flex:1; line-height:1.6; margin-bottom:1rem;">${ev.description}</p>
            <div style="background:#f8fafc; padding:0.75rem 1rem; border-radius:8px; font-size:0.85rem; color:#64748b; margin-bottom:1.25rem;">
                <div><i class="fa-solid fa-location-dot" style="color:#0284c7; width:20px;"></i> ${ev.location}</div>
                <div style="margin-top:4px;"><i class="fa-solid fa-user-group" style="color:#10b981; width:20px;"></i> Đã đăng ký: <strong>${ev.joined}/${ev.capacity}</strong></div>
            </div>
            <button class="btn btn-primary" onclick="handleJoinEvent(${ev.id})" ${ev.joined >= ev.capacity ? 'disabled' : ''} style="width:100%;">
                <i class="fa-solid fa-ticket"></i> ${ev.joined >= ev.capacity ? 'Đã hết chỗ' : 'Đăng Ký Tham Gia'}
            </button>
        </div>
    `).join('');
}

function handleJoinEvent(eventId) {
    const success = DormexDB.joinEvent(eventId);
    if (success) {
        initStudentEvents();
        showToast('Đăng ký tham gia sự kiện thành công! Hẹn gặp bạn tại sự kiện.', 'success');
    } else {
        showToast('Sự kiện đã hết chỗ đăng ký!', 'warning');
    }
}

