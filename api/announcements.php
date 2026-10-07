<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC");
            $list = $stmt->fetchAll();
            sendJsonResponse('success', 'Lấy thông báo thành công', $list);
            break;

        case 'POST':
            $title = trim($input['title'] ?? '');
            $category = trim($input['category'] ?? 'Chung');
            $content = trim($input['content'] ?? '');
            $is_pinned = !empty($input['is_pinned']) ? 1 : 0;
            $author = trim($input['author'] ?? 'Ban Quản Lý');

            if (empty($title) || empty($content)) {
                sendJsonResponse('error', 'Tiêu đề và nội dung thông báo không được để trống', null, 400);
            }

            $stmt = $pdo->prepare("
                INSERT INTO announcements (title, category, content, is_pinned, author)
                VALUES (:ti, :cat, :cnt, :pin, :au)
            ");
            $stmt->execute([
                ':ti' => $title,
                ':cat' => $category,
                ':cnt' => $content,
                ':pin' => $is_pinned,
                ':au' => $author
            ]);

            sendJsonResponse('success', 'Đăng thông báo mới thành công', ['id' => $pdo->lastInsertId()], 201);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? ($input['id'] ?? null);
            if (!$id) {
                sendJsonResponse('error', 'Thiếu ID thông báo cần xóa', null, 400);
            }

            $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = :id");
            $stmt->execute([':id' => $id]);
            sendJsonResponse('success', 'Xóa thông báo thành công');
            break;

        default:
            sendJsonResponse('error', 'Phương thức không hỗ trợ', null, 405);
    }
} catch (Exception $e) {
    sendJsonResponse('error', 'Lỗi hệ thống: ' . $e->getMessage(), null, 500);
}

