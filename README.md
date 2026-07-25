# 🤖 Hướng Dẫn Tự Làm Chatbot Bán Hàng Tự Động Trên Telegram

Dự án này hướng dẫn bạn xây dựng một Chatbot bán hàng tự động 24/7 trên Telegram bằng ngôn ngữ **Node.js** và thư viện **grammY** (một framework hiện đại, nhanh, và tiết kiệm bộ nhớ).

---

## ✨ Các Tính Năng Nổi Bật Của Bot
1. 📦 **Danh mục sản phẩm trực quan:** Hiển thị ảnh sản phẩm, tên, mô tả và giá bán bằng tiền Việt Nam (VND).
2. 🛒 **Quản lý giỏ hàng:** Cho phép khách hàng thêm sản phẩm vào giỏ, xem giỏ hàng, cập nhật số lượng hoặc xóa giỏ hàng trực tuyến.
3. 👤 **Quy trình đặt hàng thông minh:** State Machine tự động thu thập Họ tên, Số điện thoại (có validate định dạng), và Địa chỉ giao hàng.
4. 💳 **Thanh toán VietQR tự động:** Tự sinh ảnh QR Code chứa thông tin tài khoản ngân hàng của bạn, đúng số tiền và kèm theo cú pháp nội dung chuyển khoản tự sinh.
5. 🚨 **Báo cáo đơn hàng về Admin:** Ngay khi khách đặt hàng thành công, bot gửi ngay một tin nhắn chi tiết (Mã đơn, thông tin khách, giỏ hàng, phương thức thanh toán) về tài khoản Telegram của Admin/Shop.

---

## 🛠️ Quy Trình Từng Bước Thực Hiện

### Bước 1: Tạo Bot Telegram Qua @BotFather
1. Mở ứng dụng Telegram, tìm kiếm tài khoản [@BotFather](https://t.me/BotFather) (có tích xanh chính chủ).
2. Gửi lệnh `/newbot` để tạo bot mới.
3. Nhập tên hiển thị của bot (ví dụ: `My Shop Bot`).
4. Nhập username cho bot (phải kết thúc bằng chữ `bot` hoặc `_bot`, ví dụ: `my_gadget_shop_bot`).
5. Sau khi tạo xong, **BotFather** sẽ gửi cho bạn một chuỗi **HTTP API Token** (Token có dạng `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`). Hãy copy và lưu giữ bí mật Token này.

### Bước 2: Lấy Chat ID Để Nhận Đơn Hàng (Admin Chat ID)
Để bot gửi thông tin đơn hàng của khách về máy của bạn (Admin):
1. Tìm kiếm và bắt đầu chat với bot [@userinfobot](https://t.me/userinfobot) hoặc [@RawDataBot](https://t.me/RawDataBot).
2. Gửi bất kỳ ký tự nào, bot sẽ trả về thông tin cá nhân của bạn.
3. Hãy copy dãy số ở dòng `Id:` (ví dụ: `987654321`). Đây chính là **ADMIN_CHAT_ID** của bạn.

### Bước 3: Cài Đặt Và Cấu Hình Dự Án
1. Mở thư mục dự án này trong Terminal hoặc Command Prompt của máy tính.
2. Sao chép file `.env.example` thành file `.env` và cập nhật thông tin:
   ```env
   TELEGRAM_BOT_TOKEN=Điền_token_từ_BotFather_ở_đây
   ADMIN_CHAT_ID=Điền_chat_id_của_bạn_ở_đây
   STORE_NAME="✨ Cửa Hàng Gadget Cao Cấp ✨"
   ```
3. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```

### Bước 4: Khởi Chạy Chatbot
* Chạy bot ở chế độ thường:
  ```bash
  npm start
  ```
* Chạy bot ở chế độ phát triển (tự động tải lại code khi bạn thay đổi):
  ```bash
  npm run dev
  ```

---

## 📂 Cấu Trúc Mã Nguồn Trong Dự Án
Dự án được thiết kế rất tối giản và dễ mở rộng:
- 📄 [package.json](file:///C:/Users/QUANG%20TRI/.gemini/antigravity/scratch/telegram-sales-chatbot/package.json): Định nghĩa các thư viện phụ thuộc (`grammy`, `dotenv`) và các scripts khởi động.
- 📄 [.env](file:///C:/Users/QUANG%20TRI/.gemini/antigravity/scratch/telegram-sales-chatbot/.env): Nơi lưu trữ an toàn các thông tin nhạy cảm (Token bot, Admin Chat ID).
- 📄 [products.js](file:///C:/Users/QUANG%20TRI/.gemini/antigravity/scratch/telegram-sales-chatbot/products.js): Đóng vai trò là cơ sở dữ liệu mẫu chứa danh sách sản phẩm, giá bán, hình ảnh và danh mục. Bạn có thể dễ dàng sửa file này để đổi sản phẩm của shop mình.
- 📄 [bot.js](file:///C:/Users/QUANG%20TRI/.gemini/antigravity/scratch/telegram-sales-chatbot/bot.js): Trái tim của chatbot. Chứa logic xử lý các nút bấm, lưu giỏ hàng của từng khách hàng qua session, quản lý quy trình nhập thông tin người nhận, hiển thị VietQR và thông báo cho admin.

---

## 💡 Hướng Dẫn Tùy Chỉnh Nâng Cao
* **Thay đổi sản phẩm:** Chỉ cần mở file `products.js` và cập nhật danh sách các sản phẩm (thêm/sửa/xóa tên, giá, link ảnh từ Unsplash hoặc link ảnh bất kỳ).
* **Đổi tài khoản ngân hàng nhận tiền QR:** Trong file `bot.js`, tìm đến khu vực xử lý callback `payment_bank` (khoảng dòng 300) và sửa lại các biến sau để khớp với tài khoản của bạn:
  ```javascript
  const BANK_ID = "vietcombank"; // Xem mã định dạng ngân hàng tại vietqr.io (ví dụ: mbbank, techcombank, bidv,...)
  const ACCOUNT_NO = "1023847596"; // Số tài khoản ngân hàng của bạn
  const ACCOUNT_NAME = "NGUYEN VAN A"; // Tên chủ tài khoản ngân hàng viết hoa không dấu
  ```
