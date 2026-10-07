<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            $query = "
                SELECT b.*, r.room_number, r.building, u.full_name, u.student_code
                FROM bills b
                JOIN rooms r ON b.room_id = r.id
                LEFT JOIN users u ON b.user_id = u.id
                WHERE 1=1
            ";
            $params = [];

            if (!empty($_GET['room_id'])) {
                $query .= " AND b.room_id = :rid";
                $params[':rid'] = $_GET['room_id'];
            }

            if (!empty($_GET['user_id'])) {
                $query .= " AND b.user_id = :uid";
                $params[':uid'] = $_GET['user_id'];
            }

            if (!empty($_GET['status'])) {
                $query .= " AND b.status = :st";
                $params[':st'] = $_GET['status'];
            }

            $query .= " ORDER BY b.year DESC, b.month DESC, b.id DESC";
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $bills = $stmt->fetchAll();

            sendJsonResponse('success', 'Lấy danh sách hóa đơn thành công', $bills);
            break;

        case 'POST':
            $room_id = (int)($input['room_id'] ?? 0);
            $user_id = !empty($input['user_id']) ? (int)$input['user_id'] : null;
            $month = (int)($input['month'] ?? date('m'));
            $year = (int)($input['year'] ?? date('Y'));
            $room_fee = (float)($input['room_fee'] ?? 0);
            $elec_old = (int)($input['elec_old'] ?? 0);
            $elec_new = (int)($input['elec_new'] ?? 0);
            $water_old = (int)($input['water_old'] ?? 0);
            $water_new = (int)($input['water_new'] ?? 0);
            $service_fee = (float)($input['service_fee'] ?? 50000);

            if ($room_id <= 0) {
                sendJsonResponse('error', 'Vui lòng chọn phòng', null, 400);
            }

            // Đơn giá: Điện 3.000đ/kWh, Nước 10.000đ/m3
            $elec_fee = max(0, $elec_new - $elec_old) * 3000;
            $water_fee = max(0, $water_new - $water_old) * 10000;
            $total_amount = $room_fee + $elec_fee + $water_fee + $service_fee;

            $bill_code = 'BILL-' . $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-R' . $room_id . '-' . rand(100, 999);

            $stmt = $pdo->prepare("
                INSERT INTO bills (bill_code, room_id, user_id, month, year, room_fee, elec_old, elec_new, elec_fee, water_old, water_new, water_fee, service_fee, total_amount, status)
                VALUES (:bc, :rid, :uid, :m, :y, :rf, :eo, :en, :ef, :wo, :wn, :wf, :sf, :tot, 'Unpaid')
            ");
            $stmt->execute([
                ':bc' => $bill_code,
                ':rid' => $room_id,
                ':uid' => $user_id,
                ':m' => $month,
                ':y' => $year,
                ':rf' => $room_fee,
                ':eo' => $elec_old,
                ':en' => $elec_new,
                ':ef' => $elec_fee,
                ':wo' => $water_old,
                ':wn' => $water_new,
                ':wf' => $water_fee,
                ':sf' => $service_fee,
                ':tot' => $total_amount
            ]);

            sendJsonResponse('success', 'Tạo hóa đơn thành công', ['id' => $pdo->lastInsertId(), 'bill_code' => $bill_code], 201);
            break;

        case 'PUT':
            $id = $input['id'] ?? null;
            $status = $input['status'] ?? 'Paid';

            if (!$id) {
                sendJsonResponse('error', 'Thiếu ID hóa đơn', null, 400);
            }

            $payment_date = ($status === 'Paid') ? date('Y-m-d H:i:s') : null;

            $stmt = $pdo->prepare("UPDATE bills SET status = :st, payment_date = :pd WHERE id = :id");
            $stmt->execute([':st' => $status, ':pd' => $payment_date, ':id' => $id]);

            sendJsonResponse('success', 'Cập nhật trạng thái thanh toán thành công');
            break;

        default:
            sendJsonResponse('error', 'Phương thức không hỗ trợ', null, 405);
    }
} catch (Exception $e) {
    sendJsonResponse('error', 'Lỗi hệ thống: ' . $e->getMessage(), null, 500);
}

