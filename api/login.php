<?php
require_once __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse('error', 'Phương thức không được hỗ trợ', null, 405);
}

$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($username) || empty($password)) {
    sendJsonResponse('error', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu', null, 400);
}

try {
    $stmt = $pdo->prepare("
        SELECT u.*, r.room_number, r.building, r.room_type, r.price 
        FROM users u 
        LEFT JOIN rooms r ON u.room_id = r.id 
        WHERE u.username = :username LIMIT 1
    ");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if (!$user) {
        sendJsonResponse('error', 'Tài khoản không tồn tại trên hệ thống', null, 401);
    }

    // Kiểm tra mật khẩu (hỗ trợ cả plain text mẫu và password_verify)
    $passwordValid = false;
    if ($password === $user['password'] || password_verify($password, $user['password'])) {
        $passwordValid = true;
    }

    if (!$passwordValid) {
        sendJsonResponse('error', 'Mật khẩu không chính xác', null, 401);
    }

    unset($user['password']);

    sendJsonResponse('success', 'Đăng nhập thành công', [
        'user' => $user,
        'token' => bin2hex(random_bytes(16))
    ]);

} catch (Exception $e) {
    sendJsonResponse('error', 'Lỗi hệ thống: ' . $e->getMessage(), null, 500);
}

