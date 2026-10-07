<?php
require_once __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse('error', 'Phương thức không được hỗ trợ', null, 405);
}

$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');
$full_name = trim($input['full_name'] ?? '');
$email = trim($input['email'] ?? '');
$student_code = trim($input['student_code'] ?? '');
$phone = trim($input['phone'] ?? '');
$gender = trim($input['gender'] ?? 'Nam');
$class_name = trim($input['class_name'] ?? '');

if (empty($username) || empty($password) || empty($full_name) || empty($email) || empty($student_code)) {
    sendJsonResponse('error', 'Vui lòng nhập đầy đủ các thông tin bắt buộc', null, 400);
}

try {
    // Kiểm tra trùng lặp
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = :u OR email = :e OR student_code = :s LIMIT 1");
    $stmt->execute([':u' => $username, ':e' => $email, ':s' => $student_code]);
    if ($stmt->fetch()) {
        sendJsonResponse('error', 'Tên đăng nhập, email hoặc mã số sinh viên đã tồn tại', null, 409);
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO users (username, password, full_name, student_code, email, phone, gender, class_name, role)
        VALUES (:username, :password, :full_name, :student_code, :email, :phone, :gender, :class_name, 'student')
    ");

    $insertStmt->execute([
        ':username' => $username,
        ':password' => $password, // Cho phép dùng đơn giản cho đồ án môn học
        ':full_name' => $full_name,
        ':student_code' => $student_code,
        ':email' => $email,
        ':phone' => $phone,
        ':gender' => $gender,
        ':class_name' => $class_name
    ]);

    $newId = $pdo->lastInsertId();

    sendJsonResponse('success', 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.', [
        'id' => $newId,
        'username' => $username,
        'full_name' => $full_name
    ], 201);

} catch (Exception $e) {
    sendJsonResponse('error', 'Lỗi đăng ký: ' . $e->getMessage(), null, 500);
}

