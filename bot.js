require("dotenv").config();
const { Bot, session, InlineKeyboard } = require("grammy");
const defaultProducts = require("./products");
const fs = require("fs");

// Lấy biến môi trường
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;
const storeName = process.env.STORE_NAME || "✨ Cửa hàng Tiện ích ✨";

if (!token || token.includes("YOUR_TELEGRAM_BOT_TOKEN")) {
  console.error("❌ ERROR: Vui lòng điền TELEGRAM_BOT_TOKEN trong file .env!");
  process.exit(1);
}

// Khởi tạo bot
const bot = new Bot(token);

// Tích hợp Express Server để phục vụ giao diện Web App
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());

// Thiết lập mã bảo mật Content-Security-Policy (CSP) ngăn chặn hoàn toàn quảng cáo và script lạ chèn vào
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://*.telegram.org; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://img.vietqr.io https://*.vietqr.io; " +
    "connect-src 'self' https://api.vietqr.io; " +
    "frame-ancestors 'self' https://telegram.org https://*.telegram.org;"
  );
  
  // Các tiêu đề bảo mật bổ sung để chống chèn iframe (clickjacking)
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  next();
});

// Đường dẫn file cơ sở dữ liệu lưu thống kê & đơn hàng
const dbPath = path.join(__dirname, "db.json");

function loadDB() {
  let data = { visits: { webapp: 0, bot: 0 }, orders: [], products: [] };
  if (fs.existsSync(dbPath)) {
    try {
      const fileContent = fs.readFileSync(dbPath, "utf8");
      data = JSON.parse(fileContent);
    } catch (err) {
      console.error("Error parsing db.json, resetting:", err.message);
    }
  }
  // Đảm bảo cấu trúc luôn đầy đủ các khóa để tránh crash giao diện
  if (!data.visits) data.visits = { webapp: 0, bot: 0 };
  if (typeof data.visits.webapp !== "number") data.visits.webapp = 0;
  if (typeof data.visits.bot !== "number") data.visits.bot = 0;
  if (!data.orders || !Array.isArray(data.orders)) data.orders = [];
  
  // Khởi tạo sản phẩm mặc định nếu trống
  if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
    data.products = defaultProducts;
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
      console.error("Error saving initialized products to db.json:", e.message);
    }
  }
  return data;
}

function getProducts() {
  const db = loadDB();
  return db.products || [];
}

function saveDB(db) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving db.json:", err.message);
  }
}

// Middleware xác thực Admin bằng base64 token trong cookie (có giải mã URL)
function checkAdminAuth(req) {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/admin_token=([^;]+)/);
  if (!match) return false;
  
  try {
    const token = decodeURIComponent(match[1].trim());
    const expectedToken = Buffer.from(
      `${process.env.ADMIN_USERNAME || "admin"}:${process.env.ADMIN_PASSWORD || "admin"}`
    ).toString("base64");
    return token === expectedToken;
  } catch (e) {
    return false;
  }
}

// Middleware đếm lượt truy cập website
app.use((req, res, next) => {
  if (req.path === "/" || req.path === "/index.html") {
    try {
      const db = loadDB();
      db.visits.webapp += 1;
      saveDB(db);
    } catch (err) {
      console.error("Error logging web visit:", err.message);
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

// --- Các API trang quản trị Admin ---

// GET /admin - Kiểm tra quyền truy cập và chuyển hướng
app.get("/admin", (req, res) => {
  if (checkAdminAuth(req)) {
    res.sendFile(path.join(__dirname, "public", "admin", "dashboard.html"));
  } else {
    res.sendFile(path.join(__dirname, "public", "admin", "login.html"));
  }
});

app.get("/admin/", (req, res) => {
  res.redirect("/admin");
});

// POST /api/admin/login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin";

  if (username === expectedUsername && password === expectedPassword) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    // Thiết lập cookie admin_token tồn tại trong 24 giờ
    res.cookie("admin_token", token, { maxAge: 24 * 3600 * 1000, httpOnly: true });
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: "Sai tài khoản hoặc mật khẩu!" });
  }
});

// GET /api/admin/stats - Lấy số liệu thống kê đơn hàng
app.get("/api/admin/stats", (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const db = loadDB();
  res.json({ success: true, stats: { visits: db.visits }, orders: db.orders });
});

// POST /api/admin/logout
app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("admin_token");
  res.json({ success: true });
});

// POST /api/admin/orders/delete - Xóa đơn hàng khỏi thống kê và danh sách
app.post("/api/admin/orders/delete", (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, error: "Thiếu mã đơn hàng!" });
  }
  try {
    const db = loadDB();
    const initialLength = db.orders.length;
    db.orders = db.orders.filter(order => order.orderId !== orderId);
    if (db.orders.length === initialLength) {
      return res.status(404).json({ success: false, error: "Không tìm thấy đơn hàng!" });
    }
    saveDB(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/products - Lấy danh sách sản phẩm quản trị
app.get("/api/admin/products", (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  res.json({ success: true, products: getProducts() });
});

// POST /api/admin/products/save - Lưu sản phẩm (thêm mới hoặc sửa)
app.post("/api/admin/products/save", (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const { id, name, price, category, image, description } = req.body;
  if (!name || !price || !category || !description) {
    return res.status(400).json({ success: false, error: "Vui lòng nhập đầy đủ các trường thông tin bắt buộc!" });
  }
  try {
    const db = loadDB();
    if (id) {
      // Chế độ sửa sản phẩm
      const index = db.products.findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Không tìm thấy sản phẩm cần sửa!" });
      }
      db.products[index] = {
        id,
        name,
        price: parseFloat(price),
        category,
        image: image || "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80",
        description
      };
    } else {
      // Chế độ thêm sản phẩm mới
      const newId = `prod_${Date.now().toString().slice(-6)}`;
      db.products.push({
        id: newId,
        name,
        price: parseFloat(price),
        category,
        image: image || "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80",
        description
      });
    }
    saveDB(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/products/delete - Xóa sản phẩm khỏi hệ thống
app.post("/api/admin/products/delete", (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, error: "Thiếu mã sản phẩm!" });
  }
  try {
    const db = loadDB();
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id !== productId);
    if (db.products.length === initialLength) {
      return res.status(404).json({ success: false, error: "Không tìm thấy sản phẩm!" });
    }
    saveDB(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API trả về danh sách sản phẩm (Dành cho webapp hiển thị)
app.get("/api/products", (req, res) => {
  res.json(getProducts());
});

// API nhận đơn đặt hàng từ Web App gửi lên
app.post("/api/checkout", async (req, res) => {
  try {
    const { cart, orderData, paymentMethod, tgUser } = req.body;
    const itemIds = Object.keys(cart).filter(id => cart[id] > 0);
    const orderId = `BILL-${Date.now().toString().slice(-6)}`;
    
    let productSummary = "";
    let totalAmount = 0;
    
    for (const id of itemIds) {
      const product = getProducts().find(p => p.id === id);
      if (product) {
        const qty = cart[id];
        const itemTotal = product.price * qty;
        totalAmount += itemTotal;
        productSummary += `- ${escapeHTML(product.name)} (x${qty}): ${formatVND(itemTotal)}\n`;
      }
    }
    
    // Tạo QR chuyển khoản ngân hàng nếu chọn payment_bank
    let qrCodeUrl = "";
    let description = "";
    if (paymentMethod === "payment_bank") {
      const BANK_ID = process.env.BANK_ID || "ocb";
      const ACCOUNT_NO = process.env.BANK_ACCOUNT_NO || "0982441446";
      const ACCOUNT_NAME = process.env.BANK_ACCOUNT_NAME || "QUANG NHUT TRI";
      const ORDER_CODE = `DH${Date.now().toString().slice(-6)}`;
      description = `Thanh toan don hang ${ORDER_CODE}`;
      qrCodeUrl = `https://img.vietqr.io/image/${BANK_ID.toUpperCase()}-${ACCOUNT_NO}-compact2.jpg?amount=${Math.round(totalAmount)}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
    }
    
    const paymentLabel = paymentMethod === "payment_bank" ? "Chuyển khoản QR" : "Thanh toán COD (Nhận hàng trả tiền)";
    
    // Gửi thông báo đơn hàng mới cho Admin Chat ID
    if (adminChatId && adminChatId !== "YOUR_ADMIN_CHAT_ID_HERE") {
      let clientLink = "";
      if (tgUser && tgUser.id) {
        clientLink = `<a href="tg://user?id=${tgUser.id}">${escapeHTML(orderData.name)}</a>`;
      } else {
        clientLink = `<b>${escapeHTML(orderData.name)}</b> (Web client)`;
      }
      
      const adminMessage = `🚨 <b>ĐƠN HÀNG MỚI TẠO TỪ WEB APP!</b>\n\n` +
        `👤 <b>Tên khách hàng:</b> ${clientLink}\n` +
        `📞 <b>Số điện thoại:</b> <code>${escapeHTML(orderData.phone)}</code>\n` +
        `📍 <b>Địa chỉ:</b> <i>${escapeHTML(orderData.address)}</i>\n\n` +
        `🛍️ <b>Danh sách sản phẩm đặt:</b>\n${productSummary}\n` +
        `💰 <b>Tổng tiền:</b> <b>${formatVND(totalAmount)}</b>\n` +
        `💳 <b>Hình thức thanh toán:</b> <b>${paymentLabel}</b>\n\n` +
        `🔗 <b>Telegram ID khách:</b> ${tgUser ? `<code>${tgUser.id}</code> (@${tgUser.username || "Không có"})` : "Không dùng Telegram"}`;
        
      try {
        await bot.api.sendMessage(adminChatId, adminMessage, { parse_mode: "HTML" });
        console.log(`✅ Đã gửi thông báo đơn hàng ${orderId} cho Admin.`);
      } catch (err) {
        console.error("❌ Lỗi gửi thông báo cho Admin:", err.message);
      }
    }
    
    // Gửi tin nhắn Telegram riêng tư cám ơn khách hàng (nếu khách dùng Telegram Mini App)
    if (tgUser && tgUser.id) {
      const thankYouText = `🎉 <b>ĐẶT HÀNG THÀNH CÔNG!</b> 🎉\n\n` +
        `Cảm ơn bạn đã mua sắm tại <b>${escapeHTML(storeName)}</b>.\n\n` +
        `🆔 Mã đơn hàng: <code>${orderId}</code>\n` +
        `💰 Tổng tiền: <b>${formatVND(totalAmount)}</b>\n` +
        `💳 Hình thức: <i>${paymentLabel}</i>\n\n` +
        `📞 Nhân viên cửa hàng sẽ liên hệ qua số điện thoại <code>${escapeHTML(orderData.phone)}</code> sớm nhất để xác nhận và giao hàng.`;
        
      try {
        await bot.api.sendMessage(tgUser.id, thankYouText, { parse_mode: "HTML" });
      } catch (err) {
        // Bỏ qua nếu khách chưa chat với bot hoặc chặn bot
      }
    }

    // Lưu đơn hàng vào cơ sở dữ liệu để thống kê
    try {
      const db = loadDB();
      db.orders.push({
        orderId,
        customerName: orderData.name,
        phone: orderData.phone,
        address: orderData.address,
        products: productSummary,
        amount: totalAmount,
        paymentMethod: paymentLabel,
        source: "Web App",
        timestamp: new Date().toISOString()
      });
      saveDB(db);
    } catch (err) {
      console.error("Lỗi lưu đơn hàng vào DB:", err.message);
    }
    
    res.json({
      success: true,
      orderId,
      amount: totalAmount,
      qrCodeUrl,
      bankId: process.env.BANK_ID || "ocb",
      accountNo: process.env.BANK_ACCOUNT_NO || "0982441446",
      accountName: process.env.BANK_ACCOUNT_NAME || "QUANG NHUT TRI",
      description
    });
  } catch (err) {
    console.error("Error in /api/checkout:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Web Server is listening on port ${PORT}...`);
});

// Middleware log update để chẩn đoán lỗi nhận tin nhắn
bot.use(async (ctx, next) => {
  console.log(`📥 Nhận update ID: ${ctx.update.update_id}, Type: ${Object.keys(ctx.update).filter(k => k !== 'update_id')[0]}`);
  return await next();
});

// Khởi tạo session lưu trữ giỏ hàng và trạng thái đơn hàng của người dùng
bot.use(
  session({
    initial() {
      return {
        cart: {}, // key: product_id, value: quantity
        step: "idle", // idle, await_name, await_phone, await_address
        orderData: {
          name: "",
          phone: "",
          address: ""
        }
      };
    }
  })
);

// Hàm định dạng tiền tệ VND
function formatVND(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

// Hàm escape HTML để tránh lỗi phân tích cú pháp (parse_mode HTML) của Telegram
function escapeHTML(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Menu chính của bot
const mainKeyboard = new InlineKeyboard()
  .text("📦 Xem Sản Phẩm", "view_products")
  .text("🛒 Giỏ Hàng", "view_cart")
  .row()
  .text("ℹ️ Hướng Dẫn Mua Hàng", "how_to_buy")
  .text("📞 Hỗ Trợ", "contact_support");

// 1. Lệnh /start
bot.command("start", async (ctx) => {
  // Reset trạng thái
  ctx.session.step = "idle";

  // Ghi nhận lượt tương tác bot telegram
  try {
    const db = loadDB();
    db.visits.bot += 1;
    saveDB(db);
  } catch (err) {}
  
  const welcomeText = `👋 Chào mừng bạn đến với <b>${escapeHTML(storeName)}</b>!\n\n` +
    `🤖 Tôi là bot bán hàng tự động của shop. Tại đây bạn có thể:\n` +
    `👉 Xem danh sách sản phẩm nhanh chóng\n` +
    `👉 Đặt hàng tự động trực tiếp trên Telegram\n` +
    `👉 Thanh toán an toàn, tiện lợi qua ngân hàng (QR Code) hoặc COD.\n\n` +
    `👇 Vui lòng chọn một mục dưới đây để bắt đầu mua sắm:`;

  await ctx.reply(welcomeText, {
    parse_mode: "HTML",
    reply_markup: mainKeyboard
  });
});

// 2. Xem sản phẩm (Dưới dạng một danh sách Menu duy nhất, không dùng ảnh)
bot.callbackQuery("view_products", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showProductMenu(ctx, true);
});

async function showProductMenu(ctx, editInPlace = false) {
  let menuText = `📋 <b>DANH MỤC SẢN PHẨM CỬA HÀNG:</b>\n\n` +
    `<i>Vui lòng chọn trà bạn muốn xem chi tiết và đặt mua bên dưới:</i>`;

  const menuKeyboard = new InlineKeyboard();
  for (const product of getProducts()) {
    menuKeyboard.text(`${product.name} - ${formatVND(product.price)}`, `select_prod:${product.id}`).row();
  }
  menuKeyboard.text("🔙 Quay lại Menu chính", "back_to_main");

  if (editInPlace) {
    try {
      await ctx.editMessageText(menuText, {
        parse_mode: "HTML",
        reply_markup: menuKeyboard
      });
    } catch (err) {
      // Bỏ qua lỗi nếu nội dung trùng lặp
    }
  } else {
    await ctx.reply(menuText, {
      parse_mode: "HTML",
      reply_markup: menuKeyboard
    });
  }
}

// Xem chi tiết một sản phẩm trong menu (Không có ảnh, chỉ có Tên và Giá)
bot.callbackQuery(/^select_prod:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const productId = ctx.match[1];
  const product = getProducts().find(p => p.id === productId);
  if (!product) return;

  const productText = `🍵 <b>${escapeHTML(product.name)}</b>\n\n` +
    `💵 Giá bán: <b>${formatVND(product.price)}</b>\n\n` +
    `<i>Nhấp vào nút "Xem mô tả chi tiết" bên dưới để đọc thêm về sản phẩm.</i>`;

  const productKeyboard = new InlineKeyboard()
    .text("🛒 Thêm vào giỏ", `add_to_cart:${product.id}`)
    .text("ℹ️ Xem mô tả chi tiết", `view_desc:${product.id}`)
    .row()
    .text("🔙 Quay lại danh sách", "view_products");

  try {
    await ctx.editMessageText(productText, {
      parse_mode: "HTML",
      reply_markup: productKeyboard
    });
  } catch (err) {
    // Bỏ qua lỗi nếu nội dung trùng lặp
  }
});

// Hiển thị mô tả chi tiết bằng cách edit tin nhắn (tránh giới hạn 200 ký tự của Pop-up của Telegram)
bot.callbackQuery(/^view_desc:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const productId = ctx.match[1];
  const product = getProducts().find(p => p.id === productId);
  if (!product) return;

  const descText = `🍵 <b>${escapeHTML(product.name)}</b>\n\n` +
    `💵 Giá bán: <b>${formatVND(product.price)}</b>\n\n` +
    `📝 <b>CHI TIẾT SẢN PHẨM:</b>\n` +
    `<i>${escapeHTML(product.description)}</i>`;

  const descKeyboard = new InlineKeyboard()
    .text("🛒 Thêm vào giỏ", `add_to_cart:${product.id}`)
    .row()
    .text("🔙 Quay lại chi tiết", `select_prod:${product.id}`)
    .text("🔙 Quay lại danh sách", "view_products");

  try {
    await ctx.editMessageText(descText, {
      parse_mode: "HTML",
      reply_markup: descKeyboard
    });
  } catch (err) {
    // Bỏ qua lỗi nếu trùng lặp nội dung
  }
});

// 3. Thêm sản phẩm vào giỏ hàng (Chuyển tiếp thẳng đến trang Giỏ hàng để Thanh toán nhanh)
bot.callbackQuery(/^add_to_cart:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const product = getProducts().find(p => p.id === productId);

  if (!product) {
    await ctx.answerCallbackQuery({ text: "Sản phẩm không tồn tại!", show_alert: true });
    return;
  }

  // Cập nhật số lượng trong giỏ hàng
  if (!ctx.session.cart[productId]) {
    ctx.session.cart[productId] = 0;
  }
  ctx.session.cart[productId] += 1;

  // Hiển thị Toast thông báo nhanh ở góc trên màn hình người dùng
  await ctx.answerCallbackQuery({
    text: `✅ Đã thêm ${product.name} vào giỏ!`,
    show_alert: false
  });

  // Chuyển tiếp thẳng đến trang Xem Giỏ Hàng tại tin nhắn hiện tại
  await showCart(ctx, true);
});

// 4. Xem giỏ hàng
bot.callbackQuery("view_cart", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showCart(ctx, false);
});

async function showCart(ctx, editInPlace = false) {
  const cart = ctx.session.cart;
  const itemIds = Object.keys(cart).filter(id => cart[id] > 0);

  if (itemIds.length === 0) {
    const emptyKeyboard = new InlineKeyboard().text("📦 Đi xem sản phẩm", "view_products");
    const emptyText = "🛒 Giỏ hàng của bạn hiện tại đang trống. Hãy lựa chọn sản phẩm nhé!";
    if (editInPlace) {
      try {
        await ctx.editMessageText(emptyText, { reply_markup: emptyKeyboard });
      } catch (err) {
        // Bỏ qua lỗi nếu nội dung trùng lặp
      }
    } else {
      await ctx.reply(emptyText, { reply_markup: emptyKeyboard });
    }
    return;
  }

  let cartText = `🛒 <b>GIỎ HÀNG CỦA BẠN:</b>\n\n`;
  let totalAmount = 0;

  const cartKeyboard = new InlineKeyboard();
  for (const id of itemIds) {
    const product = getProducts().find(p => p.id === id);
    if (product) {
      const qty = cart[id];
      const itemTotal = product.price * qty;
      totalAmount += itemTotal;
      cartText += `🔹 <b>${escapeHTML(product.name)}</b>\n` +
        `   Số lượng: ${qty} x ${formatVND(product.price)}\n` +
        `   Thành tiền: <b>${formatVND(itemTotal)}</b>\n\n`;
        
      cartKeyboard
        .text(`➖`, `cart_decrease:${id}`)
        .text(`${qty} x ${product.name.substring(0, 12)}...`, `noop`)
        .text(`➕`, `cart_increase:${id}`)
        .text(`❌`, `cart_remove:${id}`)
        .row();
    }
  }

  cartText += `━━━━━━━━━━━━━━━━━━\n` +
    `💰 <b>TỔNG CỘNG: ${formatVND(totalAmount)}</b>\n\n` +
    `👇 Bạn có thể chỉnh sửa số lượng ở trên hoặc tiến hành đặt hàng:`;

  cartKeyboard
    .text("💳 Thanh Toán Ngay", "checkout_start")
    .row()
    .text("❌ Xóa Sạch Giỏ Hàng", "clear_cart")
    .text("🔙 Quay Lại Menu", "back_to_main");

  if (editInPlace) {
    try {
      await ctx.editMessageText(cartText, {
        parse_mode: "HTML",
        reply_markup: cartKeyboard
      });
    } catch (err) {
      // Bỏ qua lỗi nếu nội dung trùng lặp
    }
  } else {
    await ctx.reply(cartText, {
      parse_mode: "HTML",
      reply_markup: cartKeyboard
    });
  }
}

// Xử lý nút tăng giảm xóa sản phẩm trong giỏ hàng
bot.callbackQuery(/^cart_decrease:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  if (ctx.session.cart[productId] > 0) {
    ctx.session.cart[productId] -= 1;
  }
  await ctx.answerCallbackQuery();
  await showCart(ctx, true);
});

bot.callbackQuery(/^cart_increase:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  ctx.session.cart[productId] = (ctx.session.cart[productId] || 0) + 1;
  await ctx.answerCallbackQuery();
  await showCart(ctx, true);
});

bot.callbackQuery(/^cart_remove:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  ctx.session.cart[productId] = 0;
  await ctx.answerCallbackQuery();
  await showCart(ctx, true);
});

bot.callbackQuery("noop", async (ctx) => {
  await ctx.answerCallbackQuery();
});

// 5. Xóa sạch giỏ hàng
bot.callbackQuery("clear_cart", async (ctx) => {
  ctx.session.cart = {};
  await ctx.answerCallbackQuery({ text: "Đã xóa toàn bộ sản phẩm khỏi giỏ!", show_alert: true });
  await showCart(ctx, true);
});

// 6. Quay lại Menu chính
bot.callbackQuery("back_to_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "idle";
  
  const welcomeText = `👋 Chào mừng bạn đến với <b>${escapeHTML(storeName)}</b>!\n\n` +
    `🤖 Tôi là bot bán hàng tự động của shop.\n\n` +
    `👇 Vui lòng chọn một mục dưới đây để bắt đầu mua sắm:`;

  await ctx.reply(welcomeText, {
    parse_mode: "HTML",
    reply_markup: mainKeyboard
  });
});

// 7. Quy trình Thanh toán (Checkout State Machine)
bot.callbackQuery("checkout_start", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  // Kiểm tra giỏ hàng trước khi checkout
  const cart = ctx.session.cart;
  const itemIds = Object.keys(cart).filter(id => cart[id] > 0);
  if (itemIds.length === 0) {
    await ctx.reply("❌ Giỏ hàng trống, không thể thanh toán!");
    return;
  }

  ctx.session.step = "await_name";
  await ctx.reply("📝 <b>Bước 1/3:</b> Vui lòng nhập <b>Họ và Tên</b> người nhận hàng:", {
    parse_mode: "HTML"
  });
});

// Hủy đặt hàng
bot.callbackQuery("checkout_cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "idle";
  const welcomeText = `❌ Đã hủy quá trình đặt hàng.\n\n` +
    `🤖 Tôi là trợ lý ảo bán hàng. Vui lòng chọn hành động bên dưới:`;
  await ctx.reply(welcomeText, {
    reply_markup: mainKeyboard
  });
});

// Lắng nghe tin nhắn văn bản từ người dùng để nhập thông tin đơn hàng
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  const step = ctx.session.step;

  if (step === "await_name") {
    ctx.session.orderData.name = text;
    ctx.session.step = "await_phone";
    await ctx.reply(`👤 Tên người nhận: <b>${escapeHTML(text)}</b>\n\n📞 <b>Bước 2/3:</b> Vui lòng nhập <b>Số điện thoại</b> liên hệ:`, {
      parse_mode: "HTML"
    });
  } 
  else if (step === "await_phone") {
    // Regex kiểm tra số điện thoại cơ bản
    const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(text.replace(/\s+/g, ""))) {
      await ctx.reply("❌ Số điện thoại không hợp lệ. Vui lòng nhập lại số điện thoại (ví dụ: 0987654321):", {
        parse_mode: "HTML"
      });
      return;
    }
    ctx.session.orderData.phone = text;
    ctx.session.step = "await_address";
    await ctx.reply(`📞 Số điện thoại: <b>${escapeHTML(text)}</b>\n\n📍 <b>Bước 3/3:</b> Vui lòng nhập <b>Địa chỉ giao hàng</b> cụ thể:`, {
      parse_mode: "HTML"
    });
  } 
  else if (step === "await_address") {
    ctx.session.orderData.address = text;
    ctx.session.step = "idle"; // Đã hoàn thành nhập liệu

    // Tổng hợp thông tin đơn hàng để xác nhận thanh toán
    const cart = ctx.session.cart;
    const itemIds = Object.keys(cart).filter(id => cart[id] > 0);
    
    let orderDetails = `📋 <b>THÔNG TIN ĐƠN HÀNG CỦA BẠN:</b>\n\n` +
      `👤 Người nhận: <b>${escapeHTML(ctx.session.orderData.name)}</b>\n` +
      `📞 Điện thoại: <b>${escapeHTML(ctx.session.orderData.phone)}</b>\n` +
      `📍 Địa chỉ: <b>${escapeHTML(ctx.session.orderData.address)}</b>\n\n` +
      `🛒 <b>Sản phẩm đã chọn:</b>\n`;

    let totalAmount = 0;
    for (const id of itemIds) {
      const product = getProducts().find(p => p.id === id);
      if (product) {
        const qty = cart[id];
        const itemTotal = product.price * qty;
        totalAmount += itemTotal;
        orderDetails += `- ${escapeHTML(product.name)} (x${qty}): <b>${formatVND(itemTotal)}</b>\n`;
      }
    }

    orderDetails += `\n💰 <b>Tổng thanh toán: ${formatVND(totalAmount)}</b>\n\n` +
      `👇 Vui lòng chọn phương thức thanh toán hoặc hủy đơn:`;

    const paymentKeyboard = new InlineKeyboard()
      .text("💵 Thanh Toán Khi Nhận Hàng (COD)", "payment_cod")
      .row()
      .text("🏦 Chuyển Khoản Ngân Hàng (QR Code)", "payment_bank")
      .row()
      .text("❌ Hủy Đặt Hàng", "checkout_cancel");

    await ctx.reply(orderDetails, {
      parse_mode: "HTML",
      reply_markup: paymentKeyboard
    });
  }
  else {
    // Nếu người dùng nhắn tin tự do khi đang rảnh (idle)
    const unrecognizedKeyboard = new InlineKeyboard().text("📦 Xem Sản Phẩm", "view_products");
    await ctx.reply("🤖 Chào bạn! Tôi là trợ lý ảo bán hàng. Nếu cần mua sắm, vui lòng bấm nút dưới đây:", {
      reply_markup: unrecognizedKeyboard
    });
  }
});

// 8. Xử lý Phương thức thanh toán COD
bot.callbackQuery("payment_cod", async (ctx) => {
  await ctx.answerCallbackQuery();
  await processOrderComplete(ctx, "Thanh toán COD (Nhận hàng trả tiền)");
});

// 9. Xử lý Phương thức thanh toán Chuyển khoản (VietQR Code tự động)
bot.callbackQuery("payment_bank", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  // Tính tổng tiền đơn hàng
  const cart = ctx.session.cart;
  let totalAmount = 0;
  for (const id in cart) {
    const product = getProducts().find(p => p.id === id);
    if (product) totalAmount += product.price * cart[id];
  }

  // Thông tin cấu hình tài khoản nhận tiền
  const BANK_ID = process.env.BANK_ID || "ocb";
  const ACCOUNT_NO = process.env.BANK_ACCOUNT_NO || "0982441446";
  const ACCOUNT_NAME = process.env.BANK_ACCOUNT_NAME || "Cửa hàng";
  const ORDER_CODE = `DH${Date.now().toString().slice(-6)}`; // Mã đơn hàng ngẫu nhiên

  // Tạo đường dẫn ảnh VietQR theo chuẩn API (Dùng định dạng .jpg và uppercase BANK_ID để tương thích tối đa với app ngân hàng)
  const description = encodeURIComponent(`Thanh toan don hang ${ORDER_CODE}`);
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID.toUpperCase()}-${ACCOUNT_NO}-compact2.jpg?amount=${Math.round(totalAmount)}&addInfo=${description}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const instructions = `🏦 <b>HƯỚNG DẪN CHUYỂN KHOẢN:</b>\n\n` +
    `🔹 Ngân hàng: <b>${BANK_ID.toUpperCase()}</b>\n` +
    `🔹 Số tài khoản: <code>${ACCOUNT_NO}</code>\n` +
    `🔹 Tên chủ tài khoản: <b>${ACCOUNT_NAME}</b>\n` +
    `🔹 Số tiền: <b>${formatVND(totalAmount)}</b>\n` +
    `🔹 Nội dung chuyển khoản: <code>Thanh toan don hang ${ORDER_CODE}</code>\n\n` +
    `📸 Bạn hãy quét mã QR bên dưới trên app ngân hàng để thanh toán nhanh (được điền sẵn số tiền và nội dung).`;

  await ctx.replyWithPhoto(vietQrUrl, {
    caption: instructions,
    parse_mode: "HTML"
  });

  // Tiếp tục hoàn thành đơn và lưu lịch sử
  await processOrderComplete(ctx, `Chuyển khoản Ngân hàng (Mã GD: ${ORDER_CODE})`);
});

// 10. Hoàn thành đơn hàng & gửi thông báo cho Admin
async function processOrderComplete(ctx, paymentMethod) {
  const cart = ctx.session.cart;
  const orderData = ctx.session.orderData;
  const itemIds = Object.keys(cart).filter(id => cart[id] > 0);
  const orderId = `BILL-${Date.now().toString().slice(-6)}`;

  let productSummary = "";
  let totalAmount = 0;

  for (const id of itemIds) {
    const product = getProducts().find(p => p.id === id);
    if (product) {
      const qty = cart[id];
      const itemTotal = product.price * qty;
      totalAmount += itemTotal;
      productSummary += `- ${escapeHTML(product.name)} (x${qty}): ${formatVND(itemTotal)}\n`;
    }
  }

  // 10.1. Gửi thông báo cho Admin (Nếu được cấu hình)
  if (adminChatId && adminChatId !== "YOUR_ADMIN_CHAT_ID_HERE") {
    const adminMessage = `🚨 <b>ĐƠN HÀNG MỚI ĐÃ ĐƯỢC TẠO!</b>\n\n` +
      `👤 <b>Tên khách hàng:</b> <a href="tg://user?id=${ctx.from.id}">${escapeHTML(orderData.name)}</a>\n` +
      `📞 <b>Số điện thoại:</b> <code>${escapeHTML(orderData.phone)}</code>\n` +
      `📍 <b>Địa chỉ:</b> <i>${escapeHTML(orderData.address)}</i>\n\n` +
      `🛍️ <b>Danh sách sản phẩm đặt:</b>\n${productSummary}\n` +
      `💰 <b>Tổng tiền:</b> <b>${formatVND(totalAmount)}</b>\n` +
      `💳 <b>Hình thức thanh toán:</b> <b>${escapeHTML(paymentMethod)}</b>\n\n` +
      `🔗 <b>Liên kết Telegram khách:</b> @${escapeHTML(ctx.from.username || "Không có username")} (ID: <code>${ctx.from.id}</code>)`;

    try {
      await bot.api.sendMessage(adminChatId, adminMessage, { parse_mode: "HTML" });
      console.log(`✅ Đã gửi thông báo đơn hàng ${orderId} cho Admin.`);
    } catch (err) {
      console.error(`❌ Không thể gửi thông báo cho Admin Chat ID: ${adminChatId}`, err.message);
    }
  } else {
    console.log("ℹ️ ADMIN_CHAT_ID chưa được thiết lập. Không thể gửi thông báo cho Admin.");
  }

  // 10.2. Gửi lời cảm ơn cho khách hàng
  const successText = `🎉 <b>ĐẶT HÀNG THÀNH CÔNG!</b> 🎉\n\n` +
    `Cảm ơn <b>${escapeHTML(orderData.name)}</b> đã tin tưởng và ủng hộ shop.\n\n` +
    `🆔 Mã đơn hàng của bạn: <code>${orderId}</code>\n` +
    `💰 Tổng thanh toán: <b>${formatVND(totalAmount)}</b>\n` +
    `💳 Hình thức: <i>${escapeHTML(paymentMethod)}</i>\n\n` +
    `📞 Nhân viên cửa hàng sẽ liên hệ với bạn qua số điện thoại <code>${escapeHTML(orderData.phone)}</code> sớm nhất để xác nhận giao hàng.\n\n` +
    `Chúc bạn một ngày tuyệt vời! ✨`;

  const homeKeyboard = new InlineKeyboard().text("🔙 Quay về Trang Chủ", "back_to_main");
  await ctx.reply(successText, {
    parse_mode: "HTML",
    reply_markup: homeKeyboard
  });

  // Lưu đơn hàng vào cơ sở dữ liệu để thống kê
  try {
    const db = loadDB();
    db.orders.push({
      orderId,
      customerName: orderData.name,
      phone: orderData.phone,
      address: orderData.address,
      products: productSummary,
      amount: totalAmount,
      paymentMethod,
      source: "Telegram Bot",
      timestamp: new Date().toISOString()
    });
    saveDB(db);
  } catch (err) {
    console.error("Lỗi lưu đơn hàng Telegram vào DB:", err.message);
  }

  // Reset giỏ hàng của người dùng
  ctx.session.cart = {};
}

// 11. Hướng dẫn mua hàng
bot.callbackQuery("how_to_buy", async (ctx) => {
  await ctx.answerCallbackQuery();
  const guideText = `📖 <b>HƯỚNG DẪN MUA HÀNG TRÊN TELEGRAM BOT:</b>\n\n` +
    `1️⃣ Nhấn <b>[📦 Xem Sản Phẩm]</b> để xem danh sách các mặt hàng đang bán lẻ.\n` +
    `2️⃣ Chọn sản phẩm bạn thích, nhấn nút <b>[🛒 Thêm vào giỏ]</b> ngay bên dưới ảnh.\n` +
    `3️⃣ Nhấn <b>[🛒 Giỏ Hàng]</b> để kiểm tra lại các sản phẩm và số lượng.\n` +
    `4️⃣ Nhấn <b>[💳 Thanh Toán Ngay]</b> và điền đầy đủ các thông tin theo hướng dẫn của bot.\n` +
    `5️⃣ Chọn phương thức thanh toán (COD hoặc Quét QR chuyển khoản) để hoàn tất.\n\n` +
    `⚡ Đơn giản, tự động hóa và tiện lợi 24/7!`;

  const backKeyboard = new InlineKeyboard().text("🔙 Quay lại Menu", "back_to_main");
  await ctx.reply(guideText, {
    parse_mode: "HTML",
    reply_markup: backKeyboard
  });
});

// 12. Hỗ trợ liên hệ
bot.callbackQuery("contact_support", async (ctx) => {
  await ctx.answerCallbackQuery();
  const supportText = `📞 <b>HỖ TRỢ KHÁCH HÀNG:</b>\n\n` +
    `Bạn có câu hỏi, thắc mắc hoặc cần giải quyết sự cố đơn hàng?\n\n` +
    `💬 Vui lòng liên hệ trực tiếp với Admin qua chat:\n` +
    `👉 <b>Hotline/Zalo:</b> 0982441446\n` +
    `👉 <b>Telegram Admin:</b> @triqn2026\n\n` +
    `Chúng tôi luôn sẵn sàng hỗ trợ bạn!`;

  const backKeyboard = new InlineKeyboard().text("🔙 Quay lại Menu", "back_to_main");
  await ctx.reply(supportText, {
    parse_mode: "HTML",
    reply_markup: backKeyboard
  });
});

// Bộ xử lý lỗi toàn cục (ngăn chặn bot bị crash khi có lỗi mạng hoặc lỗi API)
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`❌ Lỗi xảy ra khi xử lý update ${ctx.update.update_id}:`);
  console.error(err.error);
});

// Bắt đầu chạy bot bằng chế độ Long Polling
console.log(`🤖 Bot đang được khởi chạy trên cửa hàng: ${storeName}...`);
bot.start().catch((err) => {
  console.error("❌ Đã xảy ra lỗi khi khởi động bot:", err);
});
