<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            $query = "
                SELECT reg.*, 
                       u.full_name, u.student_code, u.email, u.phone, u.gender, u.class_name,
                       r.room_number, r.building, r.room_type, r.price, r.capacity, r.occupied
                FROM registrations reg
                JOIN users u ON reg.user_id = u.id
                JOIN rooms r ON reg.room_id = r.id
            ";
            $params = [];

            if (!empty($_GET['user_id'])) {
                $query .= " WHERE reg.user_id = :uid";
                $params[':uid'] = $_GET['user_id'];
            } elseif (!empty($_GET['status'])) {
                $query .= " WHERE reg.status = :st";
                $params[':st'] = $_GET['status'];
            }

            $query .= " ORDER BY reg.created_at DESC";
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $registrations = $stmt->fetchAll();

            sendJsonResponse('success', 'Lấy danh sách đơn đăng ký thành công', $registrations);
            break;

        case 'POST':
            $user_id = $input['user_id'] ?? null;
            $room_id = $input['room_id'] ?? null;
            $semester = trim($input['semester'] ?? 'Học kỳ 1 - 2024-2025');
            $start_date = trim($input['start_date'] ?? date('Y-m-d'));
            $end_date = trim($input['end_date'] ?? date('Y-m-d', strtotime('+5 months')));
            $note = trim($input['note'] ?? '');

            if (!$user_id || !$room_id) {
                sendJsonResponse('error', 'Vui lòng chọn phòng đăng ký', null, 400);
            }

            // Kiểm tra phòng còn chỗ không
            $roomStmt = $pdo->prepare("SELECT capacity, occupied FROM rooms WHERE id = :rid");
            $roomStmt->execute([':rid' => $room_id]);
            $room = $roomStmt->fetch();
            if (!$room || $room['occupied'] >= $room['capacity']) {
                sendJsonResponse('error', 'Phòng này hiện đã đủ người, vui lòng chọn phòng khác', null, 400);
            }

            // Kiểm tra sinh viên có đơn đang chờ duyệt không
            $checkStmt = $pdo->prepare("SELECT id FROM registrations WHERE user_id = :uid AND status = 'Pending'");
            $checkStmt->execute([':uid' => $user_id]);
            if ($checkStmt->fetch()) {
                sendJsonResponse('error', 'Bạn đã có đơn đăng ký đang chờ xét duyệt', null, 400);
            }

            $insert = $pdo->prepare("
                INSERT INTO registrations (user_id, room_id, semester, start_date, end_date, status, note)
                VALUES (:uid, :rid, :sem, :sdate, :edate, 'Pending', :note)
            ");
            $insert->execute([
                ':uid' => $user_id,
                ':rid' => $room_id,
                ':sem' => $semester,
                ':sdate' => $start_date,
                ':edate' => $end_date,
                ':note' => $note
            ]);

            sendJsonResponse('success', 'Gửi đơn đăng ký phòng thành công! Vui lòng chờ ban quản lý phê duyệt.', [
                'id' => $pdo->lastInsertId()
            ], 201);
            break;

        case 'PUT':
            $id = $input['id'] ?? null;
            $status = $input['status'] ?? null; // 'Approved' hoặc 'Rejected'
            $admin_note = $input['note'] ?? null;

            if (!$id || !in_array($status, ['Approved', 'Rejected'])) {
                sendJsonResponse('error', 'Trạng thái xử lý không hợp lệ', null, 400);
            }

            // Lấy thông tin đơn
            $regStmt = $pdo->prepare("SELECT user_id, room_id FROM registrations WHERE id = :id");
            $regStmt->execute([':id' => $id]);
            $reg = $regStmt->fetch();

            if (!$reg) {
                sendJsonResponse('error', 'Không tìm thấy đơn đăng ký', null, 404);
            }

            $pdo->beginTransaction();

            $updateStmt = $pdo->prepare("UPDATE registrations SET status = :st, note = COALESCE(:note, note) WHERE id = :id");
            $updateStmt->execute([':st' => $status, ':note' => $admin_note, ':id' => $id]);

            if ($status === 'Approved') {
                // Gán phòng cho sinh viên
                $pdo->prepare("UPDATE users SET room_id = :rid WHERE id = :uid")->execute([
                    ':rid' => $reg['room_id'],
                    ':uid' => $reg['user_id']
                ]);
                // Cập nhật occupied của phòng
                $pdo->prepare("UPDATE rooms SET occupied = (SELECT COUNT(*) FROM users WHERE room_id = :rid) WHERE id = :rid")->execute([
                    ':rid' => $reg['room_id']
                ]);
            }

            $pdo->commit();
            sendJsonResponse('success', 'Cập nhật trạng thái đơn thành công');
            break;

        default:
            sendJsonResponse('error', 'Phương thức không hỗ trợ', null, 405);
    }
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJsonResponse('error', 'Lỗi hệ thống: ' . $e->getMessage(), null, 500);
}

