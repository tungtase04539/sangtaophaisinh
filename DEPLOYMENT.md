# Deployment Guide - Sáng Tạo Phái Sinh Platform

## 1. Cấu hình Supabase

### Bước 1: Tạo Project
1. Truy cập [supabase.com](https://supabase.com)
2. Đăng nhập và click **New Project**
3. Chọn Organization, đặt tên project và password database
4. Chọn region gần nhất (Singapore recommended)

### Bước 2: Chạy Migrations
Trong SQL Editor của Supabase, chạy lần lượt:

1. `supabase/migrations/001_initial_schema.sql` - Schema chính
2. `supabase/migrations/002_rls_policies.sql` - Row Level Security
3. `supabase/migrations/003_lock_job_function.sql` - Functions
4. `supabase/migrations/004_cron_timeout.sql` - Cron jobs (cần pg_cron extension)

### Bước 3: Lấy API Keys
1. Vào **Settings > API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Bước 4: Bật Realtime
1. Vào **Database > Replication**
2. Bật Realtime cho tables: `jobs`, `submissions`

---

## 2. Deploy lên Vercel

### Bước 1: Push Code lên GitHub
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### Bước 2: Import Project
1. Truy cập [vercel.com](https://vercel.com)
2. Click **Add New > Project**
3. Import repository từ GitHub
4. Chọn folder: `frontend`

### Bước 3: Environment Variables
Trong Vercel project settings, thêm:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` |

### Bước 4: Deploy
Click **Deploy** và chờ build hoàn tất.

---

## 3. Cấu hình Auth Redirects

Trong Supabase **Authentication > URL Configuration**:

| Field | Value |
|-------|-------|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/**` |

---

## 4. Tạo User Đầu Tiên

### Admin User
1. Đăng ký tại `/register`
2. Trong Supabase SQL Editor:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-id-here';
```

### Manager User
```sql
UPDATE profiles 
SET role = 'manager' 
WHERE id = 'user-id-here';
```

---

## 5. Checklist Final

- [ ] Supabase project created
- [ ] All migrations executed
- [ ] Realtime enabled for jobs/submissions
- [ ] Vercel deployed
- [ ] Environment variables set
- [ ] Auth redirects configured
- [ ] Admin user created
- [ ] Test job creation & submission flow

---

## Troubleshooting

### "Invalid API key"
- Kiểm tra lại NEXT_PUBLIC_SUPABASE_ANON_KEY

### "Row level security"
- Đảm bảo đã chạy `002_rls_policies.sql`

### "Function not found"
- Đảm bảo đã chạy `003_lock_job_function.sql`

### Realtime không hoạt động
- Kiểm tra Replication settings trong Supabase

---

## 🚨 Trước khi Go Production

> **QUAN TRỌNG**: Nhớ làm những việc sau trước khi public cho users thật!

- [ ] **Bật lại Email Confirmation** (Authentication → Providers → Email → Enable "Confirm email")
- [ ] Cấu hình SMTP cho email (Authentication → SMTP Settings)
- [ ] Thêm custom domain cho Vercel
- [ ] Bật RLS cho tất cả tables
- [ ] Review security policies
- [ ] Backup database
