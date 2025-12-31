# Sáng Tạo Phái Sinh - Version 1.0

> Platform quản lý công việc localization nội dung AI từ tiếng Trung sang tiếng Việt

---

## 🎯 Mục Tiêu Hệ Thống

### Vấn đề cần giải quyết
- Nhiều tutorial AI chất lượng cao bằng tiếng Trung cần được Việt hóa
- Cần quản lý workflow giữa Manager (người giao việc) và CTV (người thực hiện)
- Đảm bảo chất lượng bản dịch và tuân thủ bản quyền

### Giải pháp
Platform "gig economy" cho phép:
- **Manager** đăng công việc với giá tự động tính theo độ dài/phức tạp
- **CTV** nhận việc theo cơ chế "grab" (ai nhanh được trước)
- **Admin** quản lý hệ thống, users, và cấu hình

---

## ⚙️ Cơ Chế Hoạt Động

### 1. Hệ thống Rank & Credit Score

| Rank | Credit Score tối thiểu | Số việc đồng thời |
|------|------------------------|-------------------|
| Newbie | 0 | 1 |
| Regular | 60 | 2 |
| Trusted | 80 | 3 |
| Expert | 95 | 5 |

- **Tăng điểm**: Hoàn thành việc đúng hạn, được duyệt
- **Trừ điểm**: Timeout (-10 điểm), Trả việc (-2 điểm)

### 2. Hệ thống Pricing

```
Giá = (Số từ × 50đ × Hệ số) + (Phút video × 5,000đ × Hệ số) + Bonus quay lại
```

**Hệ số độ phức tạp:**
- Easy: 1.0x
- Medium: 1.2x  
- Hard: 1.5x
- Expert: 2.0x

**Bonus quay lại màn hình:** +20%

### 3. Deadline động

```
Deadline = 6h + (Số từ / 1000)h + (Phút video / 60)h
```

### 4. Safety Checkboxes (Bắt buộc khi duyệt)

Manager phải xác nhận 4 điều kiện trước khi approve:
1. ✅ An toàn chính trị
2. ✅ Bản đồ đúng (Việt Nam)
3. ✅ Là tác phẩm phái sinh
4. ✅ Không vi phạm bản quyền

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Next.js | 15.x | React framework với SSR |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling utility-first |
| Lucide React | - | Icon library |

### Backend
| Công nghệ | Mục đích |
|-----------|----------|
| Supabase | Database, Auth, Realtime, RLS |
| PostgreSQL | Cơ sở dữ liệu |
| PL/pgSQL | Stored procedures (lock_job, release_job) |
| pg_cron | Scheduled jobs (timeout handler) |

### Deployment
| Service | Mục đích |
|---------|----------|
| Vercel | Frontend hosting, CI/CD |
| Supabase Cloud | Database hosting |

---

## 👤 Luồng Task: ADMIN

### Đăng nhập
1. Truy cập `/login`
2. Nhập email/password của tài khoản admin

### Dashboard (`/admin`)
- Xem thống kê tổng quan:
  - Tổng số users, CTVs
  - Tổng số jobs, jobs pending
  - Tổng số tiền đã thanh toán

### Quản lý Users (`/admin/users`)
1. Xem danh sách tất cả users
2. Kiểm tra role, rank, credit score, số dư
3. Xem trạng thái ký thỏa thuận

### Cấu hình Hệ thống (`/admin/config`)
1. Chỉnh sửa giá tiền:
   - Giá per word
   - Giá per minute
   - Bonus quay lại
2. Chỉnh rank limits:
   - Số job tối đa mỗi rank
   - Điểm credit tối thiểu

---

## 👔 Luồng Task: MANAGER (Quản lý)

### Đăng nhập
1. Truy cập `/login`
2. Nhập email/password của tài khoản manager

### Dashboard (`/manager`)
- Xem thống kê:
  - Jobs đang chờ duyệt
  - Jobs đã tạo
  - Tổng tiền đã approve

### Tạo Việc Mới (`/manager/create`)
1. Nhập tiêu đề công việc
2. Dán URL tài liệu gốc (để CTV xem)
3. Nhập:
   - Số từ cần dịch
   - Thời lượng video (phút)
4. Chọn độ phức tạp (Dễ/TB/Khó/Pro)
5. Check "Yêu cầu quay lại" nếu cần
6. Chọn các công cụ AI trong tài liệu
7. Thêm ghi chú cho CTV (nếu có)
8. Xem preview giá → Click "Tạo công việc"

### Duyệt Bài (`/manager/review`)
1. Xem danh sách submissions đang chờ
2. Click vào submission để review
3. Xem video đã nộp
4. **Bắt buộc check 4 safety checkboxes**
5. Chọn:
   - ✅ **Approve**: Duyệt và thanh toán cho CTV
   - ❌ **Reject**: Yêu cầu sửa + ghi lý do

---

## 🎯 Luồng Task: CTV (Cộng tác viên)

### Đăng ký lần đầu
1. Truy cập `/register`
2. Nhập họ tên, email, password
3. Được redirect đến `/agreement`
4. **Đọc và check 4 điều khoản bắt buộc:**
   - Điều khoản sử dụng
   - Quy tắc ứng xử  
   - Chính sách bản quyền
   - Miễn trừ trách nhiệm
5. Click "Đồng ý và Tiếp tục"

### Xem Việc Available (`/jobs`)
1. Xem danh sách jobs đang có
2. Mỗi job hiển thị:
   - Tiêu đề
   - Số từ, thời lượng
   - Độ phức tạp
   - Thù lao
   - Link "Xem tài liệu gốc"
3. Click **"Nhận việc"** để grab

### Việc Của Tôi (`/jobs/my-jobs`)
1. Xem các jobs đang làm:
   - **Đang thực hiện**: Có countdown timer
   - **Đã nộp**: Đang chờ Manager duyệt
   - **Bị reject**: Cần sửa và nộp lại
   - **Đã duyệt**: Hoàn thành

### Nộp Bài (`/jobs/submit/[id]`)
1. Mở từ "Việc của tôi" hoặc link trực tiếp
2. Nhập URL video đã làm
3. Nhập link Google Drive (tùy chọn)
4. Thêm ghi chú (tùy chọn)
5. **Check 2 xác nhận bắt buộc:**
   - ✅ Đây là tác phẩm phái sinh
   - ✅ Không vi phạm bản quyền
6. Click "Nộp bài"

### Trả Việc (Nếu không làm được)
1. Vào "Việc của tôi"
2. Click "Trả việc" trên job đang làm
3. Xác nhận (sẽ bị trừ 2 điểm credit)

---

## 📁 Cấu Trúc Thư Mục

```
sangtaophaisinh/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # Pages & Routes
│   │   │   ├── (auth)/      # Login, Register, Agreement
│   │   │   └── (dashboard)/ # Jobs, Manager, Admin
│   │   ├── components/      # Reusable components
│   │   ├── lib/             # Utilities, Supabase client
│   │   └── types/           # TypeScript definitions
│   └── package.json
│
├── supabase/
│   └── migrations/          # SQL migration files
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_lock_job_function.sql
│       └── 004_cron_timeout.sql
│
├── backend/                 # Python services (reference)
│   └── services/
│       └── pricing.py
│
├── schemas/                 # JSON schemas
├── DEPLOYMENT.md           # Hướng dẫn deploy
└── README.md               # File này
```

---

## 🚀 Hướng Dẫn Cài Đặt

### Development
```bash
cd frontend
npm install
cp .env.example .env.local  # Thêm Supabase keys
npm run dev
```

### Production
Xem chi tiết trong [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📋 Version History

### Version 1.0 (2024-12-31)
- ✅ Hệ thống authentication với agreement flow
- ✅ CTV: Xem jobs, grab jobs, submit, release
- ✅ Manager: Tạo job, review, approve/reject
- ✅ Admin: Dashboard, user management, config
- ✅ Pricing tự động theo word count + video duration
- ✅ Rank system với credit score
- ✅ Safety checkboxes bắt buộc
- ✅ Realtime notifications
- ✅ Countdown timer cho deadline

---

## 📞 Liên Hệ

Phát triển bởi: [Tên của bạn]  
Email: [Email của bạn]

---

© 2024 Sáng Tạo Phái Sinh. All rights reserved.
