<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            $query = "
                SELECT m.*, u.full_name, u.student_code, u.phone, r.room_number, r.building
                FROM maintenance m
                JOIN users u ON m.user_id = u.id
                JOIN rooms r ON m.room_id = r.id
                WHERE 1=1
            ";
            $params = [];

            if (!empty($_GET['user_id'])) {
                $query .= " AND m.user_id = :uid";
                $params[':uid'] = $_GET['user_id'];
            }

            if (!empty($_GET['status'])) {
                $query .= " AND m.status = :st";
                $params[':st'] = $_GET['status'];
            }

            $query .= " ORDER BY m.created_at DESC";
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $items = $stmt->fetchAll();

            sendJsonResponse('success', 'Lấy danh sách yêu cầu bảo trì thành công', $items);
            break;

        case 'POST':
            $user_id = (int)($input['user_id'] ?? 0);
            $room_id = (int)($input['room_id'] ?? 0);
            $title = trim($input['title'] ?? '');
            $category = trim($input['category'] ?? 'Khác');
            $description = trim($input['description'] ?? '');

            if (!$user_id || !$room_id || empty($title) || empty($description)) {
                sendJsonResponse('error', 'Vui lòng điền đầy đủ tiêu đề và mô tả sự cố', null, 400);
            }

            $stmt = $pdo->prepare("
                INSERT INTO maintenance (user_id, room_id, title, category, description, status)
                VALUES (:uid, :rid, :ti, :cat, :des, 'Pending')
            ");
            $stmt->execute([
                ':uid' => $user_id,
                ':rid' => $room_id,
                ':ti' => $title,
                ':cat' => $category,
                ':des' => $description
            ]);

            sendJsonResponse('success', 'Gửi báo cáo bảo trì thành công! Đội kỹ thuật sẽ liên hệ sớm nhất.', [
                'id' => $pdo->lastInsertId()
            ], 201);
            break;

        case 'PUT':
            $id = $input['id'] ?? null;
            $status = $input['status'] ?? null;
            $staff_note = $input['staff_note'] ?? null;

            if (!$id || !$status) {
                sendJsonResponse('error', 'Thiếu thông tin cập nhật bảo trì', null, 400);
            }

            $resolved_at = ($status === 'Completed') ? date('Y-m-d H:i:s') : null;

            $stmt = $pdo->prepare("
                UPDATE maintenance 
                SET status = :st, staff_note = COALESCE(:sn, staff_note), resolved_at = COALESCE(:ra, resolved_at)
                WHERE id = :id
            ");
            $stmt->execute([
                ':st' => $status,
                ':sn' => $staff_note,
                ':ra' => $resolved_at,
                ':id' => $id
            ]);

            sendJsonResponse('success', 'Cập nhật tiến độ bảo trì thành công');
            break;

        default:
            sendJsonResponse('error', 'Phương thức không hỗ trợ', null, 405);
    }
} catch (Exception $e) {
    sendJsonResponse('error', 'Lỗi hệ thống: ' . $e->getMessage(), null, 500);
}

