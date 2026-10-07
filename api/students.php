<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("
                    SELECT u.*, r.room_number, r.building, r.room_type, r.price 
                    FROM users u 
                    LEFT JOIN rooms r ON u.room_id = r.id 
                    WHERE u.id = :id
                ");
                $stmt->execute([':id' => $_GET['id']]);
                $user = $stmt->fetch();
                if ($user) {
                    unset($user['password']);
                    sendJsonResponse('success', 'Lấy thông tin sinh viên thành công', $user);
                } else {
                    sendJsonResponse('error', 'Không tìm thấy sinh viên', null, 404);
                }
            } else {
                $query = "
                    SELECT u.id, u.username, u.full_name, u.student_code, u.email, u.phone, 
                           u.gender, u.class_name, u.role, u.room_id, u.created_at,
                           r.room_number, r.building, r.price
                    FROM users u
                    LEFT JOIN rooms r ON u.room_id = r.id
                    WHERE u.role = 'student'
                ";
                $params = [];

                if (!empty($_GET['search'])) {
                    $search = '%' . trim($_GET['search']) . '%';
                    $query .= " AND (u.full_name LIKE :s OR u.student_code LIKE :s OR u.email LIKE :s OR r.room_number LIKE :s)";
                    $params[':s'] = $search;
                }

                if (!empty($_GET['room_id'])) {
                    $query .= " AND u.room_id = :room_id";
                    $params[':room_id'] = $_GET['room_id'];
                }

                $query .= " ORDER BY u.id DESC";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $students = $stmt->fetchAll();
                sendJsonResponse('success', 'Lấy danh sách sinh viên thành công', $students);
            }
            break;

        case 'POST':
            $full_name = trim($input['full_name'] ?? '');
            $username = trim($input['username'] ?? '');
            $password = trim($input['password'] ?? '123456');
            $student_code = trim($input['student_code'] ?? '');
            $email = trim($input['email'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $gender = trim($input['gender'] ?? 'Nam');
            $class_name = trim($input['class_name'] ?? '');
            $room_id = !empty($input['room_id']) ? (int)$input['room_id'] : null;

            if (empty($full_name) || empty($student_code) || empty($email)) {
                sendJsonResponse('error', 'Thiếu dữ liệu bắt buộc', null, 400);
            }

            $stmt = $pdo->prepare("
                INSERT INTO users (username, password, full_name, student_code, email, phone, gender, class_name, role, room_id)
                VALUES (:u, :p, :fn, :sc, :em, :ph, :gd, :cn, 'student', :rm)
            ");
            $stmt->execute([
                ':u' => $username ?: strtolower($student_code),
                ':p' => $password,
                ':fn' => $full_name,
                ':sc' => $student_code,
                ':em' => $email,
                ':ph' => $phone,
                ':gd' => $gender,
                ':cn' => $class_name,
                ':rm' => $room_id
            ]);

            // Cập nhật số lượng người trong phòng nếu có gán phòng
            if ($room_id) {
                $pdo->prepare("UPDATE rooms SET occupied = (SELECT COUNT(*) FROM users WHERE room_id = :rm) WHERE id = :rm")->execute([':rm' => $room_id]);
            }

            sendJsonResponse('success', 'Thêm sinh viên thành công', ['id' => $pdo->lastInsertId()], 201);
            break;

        case 'PUT':
            $id = $input['id'] ?? null;
            if (!$id) {
                sendJsonResponse('error', 'Thiếu ID sinh viên', null, 400);
            }

            $full_name = trim($input['full_name'] ?? '');
            $email = trim($input['email'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $gender = trim($input['gender'] ?? 'Nam');
            $class_name = trim($input['class_name'] ?? '');
            $room_id = !empty($input['room_id']) ? (int)$input['room_id'] : null;

            // Lấy phòng cũ để cập nhật occupied
            $oldRoomStmt = $pdo->prepare("SELECT room_id FROM users WHERE id = :id");
            $oldRoomStmt->execute([':id' => $id]);
            $oldRoom = $oldRoomStmt->fetchColumn();

            $sql = "UPDATE users SET full_name = :fn, email = :em, phone = :ph, gender = :gd, class_name = :cn, room_id = :rm";
            $params = [
                ':fn' => $full_name,
                ':em' => $email,
                ':ph' => $phone,
                ':gd' => $gender,
                ':cn' => $class_name,
                ':rm' => $room_id,
                ':id' => $id
            ];

            if (!empty($input['password'])) {
                $sql .= ", password = :pw";
                $params[':pw'] = $input['password'];
            }

            $sql .= " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Cập nhật lại số lượng người ở phòng cũ và phòng mới
            if ($oldRoom) {
                $pdo->prepare("UPDATE rooms SET occupied = (SELECT COUNT(*) FROM users WHERE room_id = :rm) WHERE id = :rm")->execute([':rm' => $oldRoom]);
            }
            if ($room_id) {
                $pdo->prepare("UPDATE rooms SET occupied = (SELECT COUNT(*) FROM users WHERE room_id = :rm) WHERE id = :rm")->execute([':rm' => $room_id]);
            }

            sendJsonResponse('success', 'Cập nhật thông tin sinh viên thành công');
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? ($input['id'] ?? null);
            if (!$id) {
                sendJsonResponse('error', 'Thiếu ID sinh viên cần xóa', null, 400);
            }

            $oldRoomStmt = $pdo->prepare("SELECT room_id FROM users WHERE id = :id");
            $oldRoomStmt->execute([':id' => $id]);
            $oldRoom = $oldRoomStmt->fetchColumn();

            $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id AND role = 'student'");
            $stmt->execute([':id' => $id]);

            if ($oldRoom) {
                $pdo->prepare("UPDATE rooms SET occupied = (SELECT COUNT(*) FROM users WHERE room_id = :rm) WHERE id = :rm")->execute([':rm' => $oldRoom]);
            }

            sendJsonResponse('success', 'Xóa sinh viên thành công');
            break;

        default:
            sendJsonResponse('error', 'Phương thức không hỗ trợ', null, 405);
    }
} catch (Exception $e) {
    sendJsonResponse('error', 'Lỗi hệ thống: ' . $e->getMessage(), null, 500);
}

