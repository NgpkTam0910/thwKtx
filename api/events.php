<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM events ORDER BY event_date ASC");
            $events = $stmt->fetchAll();
            sendJsonResponse('success', 'Lấy danh sách sự kiện thành công', $events);
            break;

        case 'POST':
            $action = $input['action'] ?? 'create';

            if ($action === 'register') {
                $event_id = (int)($input['event_id'] ?? 0);
                if (!$event_id) {
                    sendJsonResponse('error', 'Thiếu ID sự kiện', null, 400);
                }

                $stmt = $pdo->prepare("UPDATE events SET joined = joined + 1 WHERE id = :id AND joined < capacity");
                $stmt->execute([':id' => $event_id]);
                if ($stmt->rowCount() > 0) {
                    sendJsonResponse('success', 'Đăng ký tham gia sự kiện thành công!');
                } else {
                    sendJsonResponse('error', 'Sự kiện đã hết chỗ tham gia hoặc không tồn tại', null, 400);
                }
            } else {
                $title = trim($input['title'] ?? '');
                $description = trim($input['description'] ?? '');
                $location = trim($input['location'] ?? '');
                $event_date = trim($input['event_date'] ?? '');
                $organizer = trim($input['organizer'] ?? 'Ban Quản Lý');
                $capacity = (int)($input['capacity'] ?? 100);

                if (empty($title) || empty($event_date) || empty($location)) {
                    sendJsonResponse('error', 'Vui lòng điền đủ thông tin sự kiện', null, 400);
                }

                $stmt = $pdo->prepare("
                    INSERT INTO events (title, description, location, event_date, organizer, capacity, joined, status)
                    VALUES (:ti, :de, :lo, :ed, :og, :cp, 0, 'Upcoming')
                ");
                $stmt->execute([
                    ':ti' => $title,
                    ':de' => $description,
                    ':lo' => $location,
                    ':ed' => $event_date,
                    ':og' => $organizer,
                    ':cp' => $capacity
                ]);

                sendJsonResponse('success', 'Tạo sự kiện mới thành công', ['id' => $pdo->lastInsertId()], 201);
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? ($input['id'] ?? null);
            if (!$id) {
                sendJsonResponse('error', 'Thiếu ID sự kiện', null, 400);
            }
            $stmt = $pdo->prepare("DELETE FROM events WHERE id = :id");
            $stmt->execute([':id' => $id]);
            sendJsonResponse('success', 'Xóa sự kiện thành công');
            break;

        default:
            sendJsonResponse('error', 'Phương thức không hỗ trợ', null, 405);
    }
} catch (Exception $e) {
    sendJsonResponse('error', 'Lỗi hệ thống: ' . $e->getMessage(), null, 500);
}

