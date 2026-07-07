import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import SanPham from "./pages/SanPham";
import GioiThieu from "./pages/GioiThieu";
import ThanhToan from "./pages/ThanhToan";
import ChiTietSanPham from "./pages/ChiTietSanPham";
import DangNhap from "./pages/DangNhap";
import DangKy from "./pages/DangKy";
import QuenMatKhau from "./pages/QuenMatKhau";
import TrangCaNhan from "./pages/TrangCaNhan";
import AdminDashboard from "./pages/AdminDashboard";
import DonHangCuaToi from "./pages/DonHangCuaToi";
import ThanhToanOnline from "./pages/ThanhToanOnline";
import VNPayReturn from "./pages/VNPayReturn";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/san-pham" element={<SanPham />} />
      <Route path="/san-pham/:id" element={<ChiTietSanPham />} />
      <Route path="/gioi-thieu" element={<GioiThieu />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/thanh-toan" element={<ThanhToan />} />
      <Route path="/dang-nhap" element={<DangNhap />} />
      <Route path="/dang-ky" element={<DangKy />} />
      <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
      <Route path="/ca-nhan" element={<TrangCaNhan />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/don-hang" element={<DonHangCuaToi />} />
      <Route path="/thanh-toan-online" element={<ThanhToanOnline />} />
      <Route path="/vnpay-return" element={<VNPayReturn />} />
    </Routes>
  );
}

export default App;
