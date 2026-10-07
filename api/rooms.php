<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("SELECT * FROM rooms WHERE id = :id");
                $stmt->execute([':id' => $_GET['id']]);
                $room = $stmt->fetch();
                if ($room) {
                    // Lấy danh sách thành viên trong phòng
                    $memStmt = $pdo->prepare("SELECT id, full_name, student_code, email, phone, gender, class_name FROM users WHERE room_id = :rid");
                    $memStmt->execute([':rid' => $room['id']]);
                    $room['members'] = $memStmt->fetchAll();
                    sendJsonResponse('success', 'Lấy chi tiết phòng thành công', $room);
                } else {
                    sendJsonResponse('error', 'Không tìm thấy phòng', null, 404);
                }
            } else {
                $query = "SELECT r.*, (r.capacity - r.occupied) AS available_beds FROM rooms r WHERE 1=1";
                $params = [];

                if (!empty($_GET['building'])) {
                    $query .= " AND r.building LIKE :building";
                    $params[':building'] = '%' . $_GET['building'] . '%';
                }

                if (!empty($_GET['status'])) {
                    $query .= " AND r.status = :status";
                    $params[':status'] = $_GET['status'];
                }

                if (!empty($_GET['room_type'])) {
                    $query .= " AND r.room_type LIKE :room_type";
                    $params[':room_type'] = '%' . $_GET['room_type'] . '%';
                }

                $query .= " ORDER BY r.building ASC, r.room_number ASC";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $rooms = $stmt->fetchAll();

                sendJsonResponse('success', 'Lấy danh sách phòng thành công', $rooms);
            }
            break;

        case 'POST':
            $room_number = trim($input['room_number'] ?? '');
            $building = trim($input['building'] ?? '');
            $floor = (int)($input['floor'] ?? 1);
            $room_type = trim($input['room_type'] ?? '4 Giường');
            $capacity = (int)($input['capacity'] ?? 4);
            $price = (float)($input['price'] ?? 650000);
            $status = trim($input['status'] ?? 'Available');
            $description = trim($input['description'] ?? '');

            if (empty($room_number) || empty($building)) {
                sendJsonResponse('error', 'Số phòng và tên tòa nhà là bắt buộc', null, 400);
            }

            $stmt = $pdo->prepare("
                INSERT INTO rooms (room_number, building, floor, room_type, capacity, occupied, price, status, description)
                VALUES (:rn, :bd, :fl, :rt, :cp, 0, :pr, :st, :ds)
            ");
            $stmt->execute([
                ':rn' => $room_number,
                ':bd' => $building,
                ':fl' => $floor,
                ':rt' => $room_type,
                ':cp' => $capacity,
                ':pr' => $price,
                ':st' => $status,
                ':ds' => $description
            ]);

            sendJsonResponse('success', 'Thêm phòng mới thành công', ['id' => $pdo->lastInsertId()], 201);
            break;

        case 'PUT':
            $id = $input['id'] ?? null;
            if (!$id) {
                sendJsonResponse('error', 'Thiếu ID phòng cần sửa', null, 400);
            }

            $room_number = trim($input['room_number'] ?? '');
            $building = trim($input['building'] ?? '');
            $floor = (int)($input['floor'] ?? 1);
            $room_type = trim($input['room_type'] ?? '4 Giường');
            $capacity = (int)($input['capacity'] ?? 4);
            $price = (float)($input['price'] ?? 650000);
            $status = trim($input['status'] ?? 'Available');
            $description = trim($input['description'] ?? '');

            $stmt = $pdo->prepare("
                UPDATE rooms 
                SET room_number = :rn, building = :bd, floor = :fl, room_type = :rt, 
                    capacity = :cp, price = :pr, status = :st, description = :ds
                WHERE id = :id
            ");
            $stmt->execute([
                ':rn' => $room_number,
                ':bd' => $building,
                ':fl' => $floor,
                ':rt' => $room_type,
                ':cp' => $capacity,
                ':pr' => $price,
                ':st' => $status,
                ':ds' => $description,
                ':id' => $id
            ]);

            sendJsonResponse('success', 'Cập nhật thông tin phòng thành công');
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? ($input['id'] ?? null);
            if (!$id) {
                sendJsonResponse('error', 'Thiếu ID phòng cần xóa', null, 400);
            }

            // Gỡ phòng khỏi sinh viên trước
            $pdo->prepare("UPDATE users SET room_id = NULL WHERE room_id = :id")->execute([':id' => $id]);

            $stmt = $pdo->prepare("DELETE FROM rooms WHERE id = :id");
            $stmt->execute([':id' => $id]);

            sendJsonResponse('success', 'Xóa phòng thành công');
            break;

        default:
            sendJsonResponse('error', 'Phương thức không hỗ trợ', null, 405);
    }
} catch (Exception $e) {
    sendJsonResponse('error', 'Lỗi hệ thống: ' . $e->getMessage(), null, 500);
}

