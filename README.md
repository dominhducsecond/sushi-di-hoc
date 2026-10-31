# 🌟 Nhật Ký Đi Học Của Sushi (Sushi Đi Học Ngoan)

Ứng dụng Web App (PWA) theo dõi việc đi học hằng ngày của bé **Sushi**, khuyến khích con giữ thói quen đi học đúng giờ và quản lý thời khóa biểu các môn học trong tuần. Được thiết kế tối ưu cho **iPhone (iOS Safari & Màn hình chính)** với khả năng hoạt động 100% cả khi **Offline**.

🔗 **Truy cập ứng dụng trực tiếp:** [https://dominhducsecond.github.io/sushi-di-hoc/](https://dominhducsecond.github.io/sushi-di-hoc/)

---

## ✨ Tính năng chính

1. **Chấm điểm Đi Học Sớm / Đi Học Trễ hằng ngày**
   - **Đi Học Sớm 😊**: Hiển thị hình ảnh thầy/cô giáo cười tươi khen ngợi.
   - **Đi Học Trễ 😢**: Hiển thị hình ảnh thầy/cô giáo buồn mếu nhắc nhở.
   - **Nghỉ Ốm 🤒 / Nghỉ Phép 🏖️**: Đánh dấu ngày nghỉ có phép mà không làm mất chuỗi đi học sớm liên tiếp của bé.

2. **Tích lũy Chuỗi 10 Buổi Đi Sớm Liên Tiếp & Nhận Ngôi Sao To ⭐**
   - Bé đi học từ **Thứ 2 đến Thứ 7**.
   - Mỗi buổi đi học sớm liên tiếp được cộng `+1` vào thanh tiến độ 10 buổi.
   - Chủ nhật, ngày không đi học và ngày nghỉ ốm được **bảo lưu chuỗi**, không bị tính lại từ đầu.
   - Cứ mỗi khi đạt đủ **10 buổi đi sớm liên tiếp**, ngày thứ 10 sẽ được gắn **Ngôi Sao To ⭐** vinh danh trên lịch và cộng vào tổng số sao của bé.

3. **Quản lý Thời Khóa Biểu & Lịch Học Theo Môn**
   - Thêm các môn học định kỳ (ví dụ: *Piano, Tiếng Anh, Bơi lội, Vẽ...*) kèm theo:
     - Tên thầy/cô giáo bộ môn & hình ảnh riêng của thầy/cô.
     - Số điện thoại liên hệ của môn học & số điện thoại trường học chính (chạm để gọi nhanh `📞`).
     - Các khung giờ học trong tuần (ví dụ: *Thứ 4: 07:00 - 08:00, Thứ 7: 06:00 - 07:00*).
     - Ngày bắt đầu học & Ngày kết thúc (tự động ưu tiên hiển thị các môn đang học lên trên và xếp các môn đã kết thúc xuống dưới).
   - Cho phép đánh dấu **Vắng học** riêng cho từng môn học trong ngày (*Giáo viên nghỉ dạy* hoặc *Bé ốm/nghỉ*).

4. **Thống kê theo khoảng thời gian tùy chọn**
   - Đếm tổng số buổi đi học sớm, số buổi đi học trễ, tỷ lệ `%`, số Ngôi Sao To đạt được và số ngày nghỉ ốm theo *Tuần này, Tháng này, Tháng trước* hoặc khoảng ngày bất kỳ.

5. **Tùy biến Hình ảnh & Hoạt động Offline 100%**
   - Thay đổi ảnh khuôn mặt thực tế của bé Sushi và ảnh thật của thầy/cô giáo (cười/mếu) trực tiếp từ thư viện ảnh iPhone.
   - Lưu trữ dữ liệu an toàn ngay trên thiết bị (`localStorage`) kèm tính năng **Xuất / Nhập file sao lưu (`.json`)**.
   - Hỗ trợ **Service Worker (`sw.js`)**: Mở ứng dụng và chấm điểm bình thường ngay cả khi không có mạng Internet (hiển thị nhãn `Offline` xám nhỏ ở góc trên bên phải).

---

## 📲 Hướng dẫn cài đặt ra Màn hình chính iPhone

1. Mở trình duyệt **Safari** trên iPhone và truy cập:  
   👉 `https://dominhducsecond.github.io/sushi-di-hoc/`
2. Chạm vào nút **Chia sẻ (Share)** ⬆️ ở thanh công cụ phía dưới màn hình.
3. Cuộn xuống và chọn **"Thêm vào MH chính" (Add to Home Screen)**.
4. Nhấn **Thêm (Add)** ở góc trên bên phải. Biểu tượng **Sushi Đi Học** sẽ xuất hiện trên màn hình chính iPhone như một ứng dụng độc lập!

---

## 📁 Cấu trúc thư mục

- `index.html` — Giao diện chính của ứng dụng (4 tab: *Điểm Danh, Lịch Môn Học, Thống Kê, Thầy Cô & Cài Đặt*).
- `styles.css` — Hệ thống giao diện chuẩn iOS Mobile-first, hiệu ứng Ngôi Sao To và Bottom Sheet.
- `app.js` — Logic tính chuỗi 10 buổi đi sớm liên tiếp, quản lý môn học, thống kê và sao lưu dữ liệu.
- `sw.js` — Service Worker lưu bộ nhớ đệm giúp ứng dụng hoạt động hoàn toàn khi Offline.
- `manifest.json` & `icon.svg` — Cấu hình Web App (PWA) và biểu tượng ứng dụng trên iPhone.
