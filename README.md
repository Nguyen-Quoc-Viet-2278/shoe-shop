
# Shoe Shop

Website bán giày trực tuyến với giao diện khách hàng và trang quản trị (Admin Dashboard).

- Đăng ký / đăng nhập (kèm đăng nhập bằng Google)
- Xem danh sách sản phẩm, chi tiết sản phẩm
- Giỏ hàng, đặt hàng, thanh toán online (VNPAY)
- Theo dõi đơn hàng của tôi
- Thông báo
- Trang quản trị: thống kê, quản lý sản phẩm/đơn hàng

## Công nghệ sử dụng

**Frontend:** React 19, React Router, Tailwind CSS, Vite, @react-oauth/google

**Backend:** Node.js, Express, JWT, bcryptjs, MSSQL/MySQL, Google Auth Library, VNPAY

## Cấu trúc dự án


Shoe_Shop/
├── backend/      # API Express (auth, products, orders, payment, stats, notifications)
└── frontend/     # Ứng dụng React (Vite)


## Cài đặt & chạy dự án

### 1. Clone repo và cài dependencies

git clone <repo-url>
cd Shoe_Shop
npm install
cd backend && npm install
cd ../frontend && npm install


### 2. Cấu hình biến môi trường

Sao chép file mẫu và điền thông tin thực tế:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

- `backend/.env`: thông tin database (SQL Server), JWT_SECRET, Google Client ID, cấu hình VNPAY
- `frontend/.env`: URL backend API, Google Client ID

### 5. Deploy Vercel + Railway

**Backend trên Railway:**

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Thêm các biến trong `backend/.env.example`, thay domain thật cho `FRONTEND_URL`, `ALLOWED_ORIGINS` và `PUBLIC_API_URL`.
- Chạy migration và seed trên SQL Server trước khi mở website.

**Frontend trên Vercel:**

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Thêm `VITE_API_URL=https://your-backend.up.railway.app` và `VITE_GOOGLE_CLIENT_ID`.
- `frontend/vercel.json` đã cấu hình fallback cho React Router.

Ảnh upload hiện được lưu trong `backend/uploads`. Railway có thể xóa filesystem khi redeploy; production nên chuyển ảnh sang Cloudinary, S3 hoặc storage persistent trước khi dùng lâu dài.

### 3. Khởi tạo & seed database

```bash
npm run db:migrate
npm run db:seed
```



- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Ghi chú

- Để đăng nhập Google hoạt động, cần tạo OAuth Client ID tại [Google Cloud Console](https://console.cloud.google.com/) và điền vào `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID`.
- Thanh toán VNPAY dùng môi trường sandbox, đăng ký tài khoản test tại [sandbox VNPAY](https://sandbox.vnpayment.vn/).
