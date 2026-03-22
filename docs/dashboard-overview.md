# 📊 Tài liệu Dashboard – Pet Nest & Grooming

> Tài liệu này mô tả chi tiết **cơ chế hoạt động**, **luồng dữ liệu** và **các thành phần** của hai màn hình Dashboard trong hệ thống.

---

## Mục lục

1. [Admin Dashboard](#1-admin-dashboard)
2. [Staff Dashboard](#2-staff-dashboard)
3. [So sánh nhanh](#3-so-sánh-nhanh)
4. [Luồng dữ liệu tổng quát](#4-luồng-dữ-liệu-tổng-quát)

---

## 1. Admin Dashboard

### 📍 Đường dẫn truy cập
- **Frontend:** `http://localhost:3000/admin/dashboard`
- **API:** `GET /api/admin/stats`

### 🔐 Phân quyền
| Role | Có thể truy cập? |
|---|---|
| Admin (role = 0) | ✅ Có |
| Staff (role = 2) | ❌ Không |
| User thường | ❌ Không |

---

### 🏗 Cấu trúc file

```
Backend:
be/controllers/adminDashboardController.js   ← Xử lý logic thống kê
be/routes/adminDashboardRoute.js             ← Định nghĩa route /api/admin/stats
be/server.js                                 ← Đăng ký route: app.use('/api/admin', ...)

Frontend:
fe/src/app/admin/dashboard/page.tsx          ← Trang hiển thị Dashboard
fe/src/app/admin/layout.tsx                  ← Layout + Sidebar Admin
fe/src/app/admin/page.tsx                    ← Redirect /admin → /admin/dashboard
```

---

### 📡 API: `GET /api/admin/stats`

**Headers cần thiết:**
```
Authorization: Bearer <JWT_TOKEN_ADMIN>
```

**Response trả về:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 120,
      "newUsersThisMonth": 15,
      "userChange": 25,          // % tăng/giảm so với tháng trước
      "totalOrders": 340,
      "ordersThisMonth": 28,
      "ordersChange": -5,
      "pendingOrders": 3,
      "totalBookings": 210,
      "bookingsThisMonth": 18,
      "bookingsChange": 12,
      "pendingBookings": 5,
      "revenueThisMonth": 15000000,
      "revenueChange": 8,
      "totalRevenueSpa": 250000000
    },
    "charts": {
      "bookingsByMonth": [        // 12 tháng trong năm hiện tại
        { "month": "T1", "total": 10, "completed": 8, "cancelled": 1 },
        ...
      ],
      "revenueByMonth": [         // Doanh thu Spa mỗi tháng (chỉ completed + paid)
        { "month": "T1", "revenue": 5000000 },
        ...
      ],
      "usersByMonth": [           // Người dùng đăng ký mới mỗi tháng
        { "month": "T1", "users": 12 },
        ...
      ]
    },
    "recentBookings": [           // 5 Booking Spa tạo gần nhất
      {
        "bookingCode": "SPA-001",
        "customerSnapshot": { "name": "Nguyễn Văn A" },
        "serviceSnapshot": { "name": "Cắt tỉa", "price": 200000 },
        "status": "pending",
        "paymentStatus": "unpaid",
        "createdAt": "2026-03-22T04:00:00.000Z"
      }
    ]
  }
}
```

---

### 🖥 Các thành phần hiển thị

#### 1. Stat Cards (4 thẻ tổng quan)
| Thẻ | Nguồn dữ liệu | Ý nghĩa |
|---|---|---|
| **Người dùng** | `totalUsers`, `newUsersThisMonth` | Tổng user trong hệ thống + người mới tháng này |
| **Đơn hàng TMĐT** | `totalOrders`, `pendingOrders` | Tổng đơn hàng sản phẩm + số đơn đang chờ |
| **Booking Spa** | `totalBookings`, `pendingBookings` | Tổng đặt lịch + số booking chờ xác nhận |
| **Doanh thu Spa** | `revenueThisMonth`, `totalRevenueSpa` | Doanh thu tháng này + tổng doanh thu lịch sử |

> ⚠️ **Lưu ý:** Doanh thu Spa chỉ tính những đơn có `status = "completed"` VÀ `paymentStatus = "paid"`. Đơn đã trả tiền nhưng chưa hoàn tất **không được tính**.

#### 2. Biểu đồ Booking Spa theo tháng (BarChart)
- Dữ liệu: `charts.bookingsByMonth` (12 tháng trong năm)
- 3 cột: **Tổng** (xanh indigo) · **Hoàn tất** (xanh lá) · **Huỷ** (đỏ)
- Thư viện: `recharts` – `<BarChart>`

#### 3. Biểu đồ Doanh thu theo tháng (AreaChart)
- Dữ liệu: `charts.revenueByMonth`
- Hiển thị doanh thu Spa theo từng tháng trong năm (đơn vị: VNĐ)
- Thư viện: `recharts` – `<AreaChart>`

#### 4. Biểu đồ Người dùng mới theo tháng (AreaChart)
- Dữ liệu: `charts.usersByMonth`
- Thư viện: `recharts` – `<AreaChart>`

#### 5. Bảng Booking gần đây
- Dữ liệu: `recentBookings` (5 booking mới nhất)
- Hiển thị: Tên khách hàng, tên dịch vụ, mã booking, trạng thái, ngày tạo

---

### ⚙️ Logic xử lý trong Controller

```
adminDashboardController.js → getAdminStats()

1. Lấy ngày hiện tại (server time)
2. Tính startOfMonth, monthStart-1 (tháng trước) để so sánh
3. Chạy song song (Promise.all) các query:
   - User.countDocuments(...)        → Đếm user
   - Order.countDocuments(...)       → Đếm đơn hàng
   - SpaBooking.countDocuments(...)  → Đếm booking
   - SpaBooking.aggregate(...)       → Tổng doanh thu
4. Chạy 3 aggregate pipeline cho 3 biểu đồ
5. Lấy 5 booking gần nhất bằng .sort({createdAt: -1}).limit(5)
6. Tính % thay đổi: ((hiện tại - trước) / trước) × 100
7. Trả về JSON
```

---

## 2. Staff Dashboard

### 📍 Đường dẫn truy cập
- **Frontend:** `http://localhost:3000/staff/dashboard`
- **API:** `GET /api/staff/dashboard/stats`

### 🔐 Phân quyền
| Role | Có thể truy cập? |
|---|---|
| Admin (role = 0) | ❌ Không |
| Staff (role = 2) | ✅ Có |
| User thường | ❌ Không |

> 🔑 **Quan trọng:** Staff chỉ thấy **dữ liệu của chính mình** (lọc theo `staffId` từ JWT token). Không thể xem dữ liệu của nhân viên khác.

---

### 🏗 Cấu trúc file

```
Backend:
be/controllers/staffDashboardController.js   ← Xử lý logic thống kê cá nhân
be/routes/staffDashboardRoute.js             ← Route /api/staff/dashboard/stats
be/server.js                                 ← app.use('/api/staff/dashboard', ...)

Frontend:
fe/src/app/staff/dashboard/page.tsx          ← Trang hiển thị Staff Dashboard
fe/src/app/staff/layout.tsx                  ← Layout + Sidebar Staff
```

---

### 📡 API: `GET /api/staff/dashboard/stats`

**Headers cần thiết:**
```
Authorization: Bearer <JWT_TOKEN_STAFF>
```

**Response trả về:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "todayBookings": 3,          // Số đơn được giao hôm nay
      "todayCompleted": 1,         // Đã hoàn tất hôm nay
      "todayPending": 2,           // Đang chờ hôm nay
      "monthBookings": 28,         // Tổng đơn tháng này
      "monthCompleted": 25,        // Hoàn tất tháng này
      "monthChange": 12,           // % thay đổi so với tháng trước
      "revenueThisMonth": 5000000, // Doanh thu thu hộ tháng này
      "revenueChange": 8,
      "totalCompleted": 150,       // Tổng hoàn tất từ trước đến nay
      "completionRate": 95         // Tỷ lệ hoàn tất (%)
    },
    "todaySchedule": {             // Lịch làm việc hôm nay (null nếu chưa có)
      "shiftStart": "08:00",
      "shiftEnd": "12:00",
      "isOff": false,
      "note": "Ca sáng"
    },
    "todayBookings": [             // Danh sách đơn hàng hôm nay (của staff này)
      {
        "bookingCode": "SPA-123",
        "customerSnapshot": { "name": "Trần Thị B" },
        "serviceSnapshot": { "name": "Tắm thú cưng", "price": 150000 },
        "petSnapshot": { "name": "Bông" },
        "status": "confirmed",
        "paymentStatus": "unpaid",
        "startAt": "2026-03-22T02:00:00.000Z"
      }
    ],
    "charts": {
      "weekly": [                  // 7 ngày gần nhất
        { "day": "16/03", "completed": 4 },
        { "day": "17/03", "completed": 6 },
        ...
      ],
      "monthly": [                 // 12 tháng trong năm
        { "month": "T1", "completed": 20 },
        ...
      ]
    }
  }
}
```

---

### 🖥 Các thành phần hiển thị

#### 1. Greeting Card (Banner chào mừng)
- Hiển thị: Tên nhân viên (lấy từ JWT token), ngày hôm nay (tiếng Việt), số đơn đang chờ
- Màu: Gradient xanh emerald–teal

#### 2. Stat Cards (4 thẻ)
| Thẻ | Dữ liệu | Ý nghĩa |
|---|---|---|
| **Đơn hôm nay** | `todayBookings`, `todayCompleted`, `todayPending` | Tổng đơn trong ngày của staff này |
| **Hoàn tất tháng này** | `monthCompleted`, `monthChange` | Số đơn đã làm xong + % so tháng trước |
| **Tỷ lệ hoàn tất** | `completionRate` | Tổng completed / tổng tất cả đơn (%) |
| **Doanh thu tháng** | `revenueThisMonth`, `revenueChange` | Thu hộ từ các đơn completed + paid |

#### 3. Lịch làm việc hôm nay
- Nguồn: Collection `staffSchedules` – lọc theo `staffId` và `workDate = hôm nay`
- 3 trạng thái hiển thị:
  - ✅ **Có ca:** Hiển thị giờ bắt đầu–kết thúc  
  - 🏖 **Ngày nghỉ:** `isOff = true`
  - ⚠️ **Chưa có lịch:** `todaySchedule = null`

#### 4. Bảng đơn hàng hôm nay
- Hiển thị tất cả booking có `startAt` trong ngày hôm nay, được giao cho staff này
- Sắp xếp tăng dần theo giờ (`startAt ASC`)
- Cột: Giờ · Khách hàng · Dịch vụ · Thú cưng · Trạng thái · Giá

#### 5. Biểu đồ 7 ngày gần nhất (BarChart)
- Dữ liệu: `charts.weekly`
- Hiển thị số đơn đã hoàn tất trong 7 ngày qua

#### 6. Biểu đồ hiệu suất 12 tháng (BarChart)
- Dữ liệu: `charts.monthly`
- Hiển thị tổng hoàn tất từng tháng trong năm hiện tại

---

### ⚙️ Logic xử lý trong Controller

```
staffDashboardController.js → getStaffDashboardStats()

1. Lấy staffId từ req.user (JWT đã giải mã bởi middleware verifyToken)
2. Tính timezone Việt Nam (+7) bằng moment-timezone:
   - todayStart / todayEnd    → Đầu và cuối ngày hôm nay
   - monthStart / monthEnd    → Đầu và cuối tháng này
   - lastMonthStart/End       → Để tính % thay đổi
   - yearStart                → Để vẽ biểu đồ 12 tháng
3. Query song song (Promise.all):
   - SpaBooking.countDocuments({ staffId, startAt: HÔM_NAY })   → Đơn hôm nay
   - SpaBooking.countDocuments({ staffId, status: "completed" }) → Đã hoàn tất
   - SpaBooking.aggregate([...])                                  → Doanh thu
4. Lấy lịch làm việc hôm nay:
   - StaffSchedule.findOne({ staffId, workDate: HÔM_NAY })
5. Lấy danh sách booking hôm nay:
   - SpaBooking.find({ staffId, startAt: HÔM_NAY }).sort({startAt: 1})
6. Aggregate 7 ngày gần nhất (group by date string)
7. Aggregate 12 tháng (group by month number)
8. Trả về JSON
```

---

## 3. So sánh nhanh

| Tiêu chí | Admin Dashboard | Staff Dashboard |
|---|---|---|
| **Người dùng** | Admin (role = 0) | Staff (role = 2) |
| **Phạm vi dữ liệu** | Toàn hệ thống | Chỉ của nhân viên đó |
| **Thống kê** | User + Orders + Booking + Doanh thu | Đơn cá nhân + Tỷ lệ hoàn tất + Doanh thu cá nhân |
| **Biểu đồ** | 3 biểu đồ (Booking, Doanh thu, User) | 2 biểu đồ (7 ngày, 12 tháng) |
| **Đặc biệt** | Bảng booking gần nhất | Lịch làm việc hôm nay + Bảng đơn hôm nay |
| **API** | `GET /api/admin/stats` | `GET /api/staff/dashboard/stats` |
| **Controller** | `adminDashboardController.js` | `staffDashboardController.js` |

---

## 4. Luồng dữ liệu tổng quát

```
User mở trang Dashboard
       │
       ▼
Frontend (page.tsx)
  └─ useEffect() chạy khi component mount
  └─ api.get("/admin/stats") hoặc api.get("/staff/dashboard/stats")
  └─ axios tự gắn Authorization: Bearer <token> (từ utils/axios.ts)
       │
       ▼
Backend Middleware
  └─ verifyToken      → Giải mã JWT, lưu req.user = { id, role, name, ... }
  └─ authorizeRoles() → Kiểm tra role có được phép không
       │
       ▼
Controller (getAdminStats / getStaffDashboardStats)
  └─ Đọc req.user.id để biết ai đang gọi
  └─ Chạy các MongoDB query (countDocuments, aggregate, find)
  └─ Tính toán % thay đổi so với tháng trước
  └─ Trả về JSON
       │
       ▼
Frontend
  └─ setData(res.data.data)
  └─ Render Stat Cards, Charts, Tables
```

---

## 5. Các trạng thái Booking quan trọng

| Status | Ý nghĩa | Có tính doanh thu? |
|---|---|---|
| `pending` | Chờ Staff xác nhận | ❌ |
| `confirmed` | Staff đã xác nhận | ❌ |
| `completed` | Staff đã hoàn tất dịch vụ | ✅ (nếu paid) |
| `cancelled` | Đã huỷ | ❌ |

| PaymentStatus | Ý nghĩa |
|---|---|
| `unpaid` | Chưa thanh toán |
| `paid` | Đã thanh toán (tiền mặt hoặc PayOS) |
| `deposited` | Đã đặt cọc 50% qua PayOS |

> ✅ **Quy tắc doanh thu:** Chỉ tính vào doanh thu khi đơn có `status = "completed"` **VÀ** `paymentStatus = "paid"`.
