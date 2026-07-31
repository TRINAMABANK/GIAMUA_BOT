# TÀI LIỆU DỰ ÁN: CHATBOT BÁN HÀNG TỰ ĐỘNG TELEGRAM (GIAMUA_BOT)
> **Thương hiệu:** Shop GIAMUA.COM.VN  
> **Phiên bản:** V1.0 (Bản phát hành chính thức)  
> **Nền tảng chạy:** Máy chủ ảo VPS (chạy 24/7 bằng PM2)  
> **Kho lưu trữ Git:** [GitHub - TRINAMABANK/GIAMUA_BOT](https://github.com/TRINAMABANK/GIAMUA_BOT)

---

## 1. TỔNG QUAN HỆ THỐNG (PROJECT OVERVIEW)

Chatbot được phát triển bằng ngôn ngữ **Node.js** sử dụng thư viện **grammY** (framework lập trình Telegram Bot hiệu năng cao). Dự án được thiết kế để tự động hóa toàn bộ quy trình từ giới thiệu sản phẩm trà cao cấp, quản lý giỏ hàng, thu thập thông tin nhận hàng, sinh mã QR thanh toán động và báo cáo đơn hàng về tài khoản Admin thời gian thực.

---

## 2. DANH SÁCH 10 SẢN PHẨM TRÀ CAO CẤP (PRODUCT DATABASE)

Mã nguồn sản phẩm nằm tại file [products.js](file:///C:/Users/QUANG%20TRI/.gemini/antigravity/scratch/telegram-sales-chatbot/products.js) gồm các dòng sản phẩm Đôi Dép:
1. **Bích Thủy Hoàn Nguyên (Oolong):** 2.699.000 VNĐ - Hương hoa mạnh mẽ xen lẫn cỏ cây tự nhiên, hậu vị ngọt ngào.
2. **Bất Thụ Đông Phong (Oolong):** 2.699.000 VNĐ - Hoàng trà bồi hỏa, mang vị khói rang đặc trưng, béo bùi.
3. **Hoàng Tỳ Nhật Minh (Oolong):** 1.799.000 VNĐ - Hắc trà hương gỗ quế, khói thuốc và xì gà, giúp thải độc, ngủ ngon.
4. **Hương Phù Ngõa Đỉnh (Trà xanh):** 2.699.000 VNĐ - Vị ngọt sữa và trái cây tươi, chát nhẹ tinh tế.
5. **Ngũ Vị Trà (Bộ quà tặng):** 2.499.000 VNĐ - Kết hợp 5 loại trà thượng hạng làm quà tặng sang trọng.
6. **Ngọc Trác Trà (Oolong):** 1.799.000 VNĐ - Hoàng trà cao cấp vị ngọt ngào, đậm đà kết hợp hương sữa nổi bật.
7. **Phong Mật Trà (Oolong):** 1.899.000 VNĐ - Hồng trà mang hương mật ong, mật mía ấm áp, thư giãn.
8. **Tâm Thanh Mỹ Nhân (Hồng trà):** 2.699.000 VNĐ - Sắc nước đỏ vàng, hương trái cây chín mọng và khói nhẹ.
9. **Xuân Nhật Trà (Oolong):** 1.799.000 VNĐ - Mang trọn hương vị mùa xuân, thích hợp thưởng thức buổi sáng.
10. **Đại Hoàng Bào (Oolong):** 2.699.000 VNĐ - Hương hoa dành dành thanh tao, hậu vị kéo dài tinh tế.

---

## 3. CÁC TÍNH NĂNG ĐỘC QUYỀN ĐÃ ĐƯỢC TỐI ƯU HÓA (CORE FEATURES)

### 3.1. Menu Danh Mục Trải Nghiệm Tối Giản (Text-Only Menu)
* **Không dùng ảnh đại trà:** Loại bỏ việc gửi hàng loạt hình ảnh sản phẩm để tránh làm loãng chat và tăng tốc độ tải tin nhắn lên gấp 5 lần.
* **Cơ chế Menu 2 cấp:** 
  * Cấp 1 hiển thị toàn bộ danh sách 10 loại trà kèm giá bán dưới dạng nút bấm dọc.
  * Cấp 2 hiển thị chi tiết rút gọn khi người dùng click vào một sản phẩm cụ thể.
* **Xem chi tiết tại chỗ:** Thay thế hộp thoại pop-up (bị giới hạn 200 ký tự của Telegram) bằng cơ chế cập nhật nội dung tin nhắn tại chỗ (in-place edit) để khách hàng có thể đọc những phần mô tả dài mà không gặp lỗi.

### 3.2. Luồng Mua Sắm Siêu Tốc (Fast Checkout Flow)
* **Chuyển tiếp trực tiếp:** Ngay sau khi bấm nút `🛒 Thêm vào giỏ`, màn hình chat sẽ lập tức hiển thị giỏ hàng kèm các nút chỉnh sửa số lượng (`➕`, `➖`, `❌`) và nút `💳 Thanh Toán Ngay` mà không cần thông qua menu trung gian.
* **Các bước nhập liệu gọn gàng:** Lược bỏ nút "Hủy đặt hàng" ở Bước 1 (Nhập Tên), Bước 2 (Nhập SĐT), và Bước 3 (Nhập Địa chỉ) giúp giao diện sạch sẽ nhất. Nút hủy chỉ xuất hiện ở bước cuối cùng tại phần lựa chọn thanh toán.

### 3.3. Thanh Toán Quét Mã VietQR Thông Minh
* **Liên kết động:** Sử dụng API của `vietqr.io` để tự sinh ảnh QR Code chứa thông tin tài khoản ngân hàng **OCB** của chủ shop.
* **Tự điền số tiền:** Nhúng trực tiếp giá trị đơn hàng được làm tròn (`Math.round(totalAmount)`) và mã hóa nội dung chuyển khoản tự động vào mã QR dưới định dạng `.jpg`. Khi khách hàng dùng ứng dụng ngân hàng để quét, ứng dụng sẽ tự động điền đúng Số tài khoản, Tên chủ shop và Số tiền cần thanh toán.

### 3.4. Báo Cáo Đơn Hàng Admin Chuyên Nghiệp
* **Liên kết nick Telegram:** Khách hàng đặt hàng xong, hệ thống gửi báo cáo chi tiết đến Admin Chat ID. Tên khách hàng chứa liên kết ẩn dạng `tg://user?id=<USER_ID>`. Admin chỉ cần nhấp vào Tên khách hàng để mở trực tiếp khung chat riêng tư với khách mà không cần add số hay tìm kiếm.

---

## 4. HƯỚNG DẪN VẬN HÀNH VÀ TRIỂN KHAI (DEVIATION & DEPLOYMENT GUIDE)

### 4.1. Cấu hình biến môi trường (.env)
Tệp tin cấu hình chứa các tham số:
```env
TELEGRAM_BOT_TOKEN=8769432062:AAGd_YUqycuTEAj9Bzw4cp2kFMXEObK_6sw
ADMIN_CHAT_ID=5162745582
STORE_NAME="✨ Shop GIAMUA.COM.VN ✨"
BANK_ID=ocb
BANK_ACCOUNT_NO=0982441446
BANK_ACCOUNT_NAME="QUANG NHUT TRI"
```

### 4.2. Quản lý tiến trình trên VPS bằng PM2
Hệ thống được thiết lập chạy ngầm trên VPS Linux của bạn bằng công cụ PM2:
* **Khởi chạy bot ngầm:**
  ```bash
  cd /root/telegram-sales-chatbot
  pm2 start bot.js --name "giamua-bot"
  ```
* **Kiểm tra trạng thái bot đang chạy:**
  ```bash
  pm2 list
  ```
* **Xem nhật ký hoạt động (Logs):**
  ```bash
  pm2 logs giamua-bot
  ```
* **Lưu trạng thái tự động khởi động cùng VPS:**
  ```bash
  pm2 save
  pm2 startup
  ```
* **Khởi động lại bot sau khi sửa code:**
  ```bash
  pm2 restart giamua-bot
  ```

### 4.3. Cấu hình tường lửa bảo mật VPS (UFW)
VPS đã được cài đặt và kích hoạt tường lửa để chống xâm nhập:
* **Cổng mở:** Cổng 22 (SSH) dành cho quản trị.
* **Cổng chặn:** Deny tất cả các kết nối incoming không xác định khác để giữ an toàn cho VPS.
* **Trạng thái:** Hoạt động (`Status: active`).

---

## 5. HƯỚNG DẪN QUẢN LÝ PHIÊN BẢN VỚI GIT (VERSION CONTROL)

Dự án sử dụng Git để quản lý phiên bản cục bộ và đồng bộ lên tài khoản GitHub cá nhân của bạn:
* **Email cấu hình:** `triqnamabank@gmail.com`
* **Kho lưu trữ GitHub:** [https://github.com/TRINAMABANK/GIAMUA_BOT](https://github.com/TRINAMABANK/GIAMUA_BOT)
* **Tag phiên bản:** `v1.0` (Đã được phát hành chính thức).

Khi bạn có chỉnh sửa mã nguồn dưới máy tính và muốn cập nhật lên GitHub, hãy dùng các lệnh sau:
```bash
# 1. Thêm các file đã chỉnh sửa
git add .

# 2. Tạo commit ghi nhận thay đổi
git commit -m "mô_tả_thay_đổi"

# 3. Cập nhật nhãn phiên bản v1.0 (Nếu cần đè lên tag cũ)
git tag -d v1.0
git tag -a v1.0 -m "Cập nhật mã nguồn"

# 4. Đẩy code lên GitHub
git push origin main
git push origin :refs/tags/v1.0
git push origin --tags
```

---
*Tài liệu được khởi tạo tự động bởi AI Trợ lý Antigravity vào lúc 19:49 ngày 25/07/2026.*
