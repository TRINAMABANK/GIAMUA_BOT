// Shop GIAMUA.COM.VN Client Application Logic
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Telegram Web App SDK
  const tg = window.Telegram ? window.Telegram.WebApp : null;
  if (tg) {
    tg.ready();
    tg.expand(); // Open in full screen inside Telegram
    console.log("Telegram Web App SDK Initialized:", tg.initDataUnsafe);
  }

  // Cart State (stored in localStorage)
  let cart = JSON.parse(localStorage.getItem("giamua_cart")) || {};
  let productsData = [];

  // DOM Elements
  const productsGrid = document.getElementById("productsGrid");
  const cartBadge = document.getElementById("cartBadge");
  const cartTrigger = document.getElementById("cartTrigger");
  const cartDrawer = document.getElementById("cartDrawer");
  const closeCartDrawer = document.getElementById("closeCartDrawer");
  const cartItemsList = document.getElementById("cartItemsList");
  const cartTotal = document.getElementById("cartTotal");
  const checkoutForm = document.getElementById("checkoutForm");
  const detailModal = document.getElementById("detailModal");
  const detailModalBody = document.getElementById("detailModalBody");
  const closeDetailModal = document.getElementById("closeDetailModal");
  const qrModal = document.getElementById("qrModal");
  const qrModalBody = document.getElementById("qrModalBody");
  const closeQrModalBtn = document.getElementById("closeQrModalBtn");

  // Fetch products and render
  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      productsData = await res.json();
      renderProducts(productsData);
      updateCartUI();
    } catch (err) {
      console.error("Error fetching products:", err);
      productsGrid.innerHTML = `<div class="loading-spinner">❌ Không thể tải danh sách sản phẩm. Vui lòng thử lại!</div>`;
    }
  }

  // Format currency
  function formatVND(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  // Render product cards
  function renderProducts(products) {
    productsGrid.innerHTML = "";
    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="product-bottom">
            <span class="product-price">${formatVND(p.price)}</span>
            <div class="btn-actions">
              <button class="btn-view-detail" data-id="${p.id}">ℹ️</button>
              <button class="btn-add-cart" data-id="${p.id}">🛒 Mua</button>
            </div>
          </div>
        </div>
      `;
      productsGrid.appendChild(card);
    });

    // Attach event listeners to render buttons
    document.querySelectorAll(".btn-view-detail").forEach(btn => {
      btn.addEventListener("click", () => showProductDetail(btn.dataset.id));
    });

    document.querySelectorAll(".btn-add-cart").forEach(btn => {
      btn.addEventListener("click", () => {
        addToCart(btn.dataset.id);
        openCart();
      });
    });
  }

  // Cart operations
  function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    saveCart();
    updateCartUI();
  }

  function decreaseQty(productId) {
    if (cart[productId] > 1) {
      cart[productId] -= 1;
    } else {
      delete cart[productId];
    }
    saveCart();
    updateCartUI();
  }

  function increaseQty(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    saveCart();
    updateCartUI();
  }

  function saveCart() {
    localStorage.setItem("giamua_cart", JSON.stringify(cart));
  }

  function updateCartUI() {
    // Update Badge
    const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "flex" : "none";

    // Update Drawer list
    cartItemsList.innerHTML = "";
    let totalAmount = 0;

    const itemIds = Object.keys(cart);
    if (itemIds.length === 0) {
      cartItemsList.innerHTML = `<div class="loading-spinner">🛒 Giỏ hàng trống.</div>`;
      cartTotal.textContent = "0 ₫";
      return;
    }

    itemIds.forEach(id => {
      const product = productsData.find(p => p.id === id);
      if (product) {
        const qty = cart[id];
        const itemTotal = product.price * qty;
        totalAmount += itemTotal;

        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
          <div class="cart-item-info">
            <h5>${product.name}</h5>
            <p>${formatVND(product.price)} x ${qty}</p>
          </div>
          <div class="cart-item-actions">
            <button class="qty-btn btn-minus" data-id="${id}">-</button>
            <span>${qty}</span>
            <button class="qty-btn btn-plus" data-id="${id}">+</button>
          </div>
        `;
        cartItemsList.appendChild(row);
      }
    });

    cartTotal.textContent = formatVND(totalAmount);

    // Attach listeners to drawer buttons
    document.querySelectorAll(".btn-minus").forEach(btn => {
      btn.addEventListener("click", () => decreaseQty(btn.dataset.id));
    });
    document.querySelectorAll(".btn-plus").forEach(btn => {
      btn.addEventListener("click", () => increaseQty(btn.dataset.id));
    });
  }

  // View single product details in modal
  function showProductDetail(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    detailModalBody.innerHTML = `
      <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 15px; color: var(--primary);">${product.name}</h3>
      <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-main); margin-bottom: 20px;">${product.description}</p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 1.3rem; font-weight: 700; color: var(--primary);">${formatVND(product.price)}</span>
        <button class="btn-add-cart" id="modalAddBtn" data-id="${product.id}">🛒 Thêm vào giỏ</button>
      </div>
    `;

    document.getElementById("modalAddBtn").addEventListener("click", () => {
      addToCart(product.id);
      closeDetail();
      openCart();
    });

    detailModal.classList.add("active");
  }

  // Open & Close Drawer
  function openCart() {
    cartDrawer.classList.add("active");
  }

  function closeCart() {
    cartDrawer.classList.remove("active");
  }

  function closeDetail() {
    detailModal.classList.remove("active");
  }

  cartTrigger.addEventListener("click", openCart);
  closeCartDrawer.addEventListener("click", closeCart);
  closeDetailModal.addEventListener("click", closeDetail);

  // Close modal when clicking backdrop
  window.addEventListener("click", (e) => {
    if (e.target === cartDrawer) closeCart();
    if (e.target === detailModal) closeDetail();
  });

  // Pre-fill user data if inside Telegram
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    document.getElementById("customerName").value = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  }

  // Handle checkout form submission
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const address = document.getElementById("customerAddress").value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    const itemIds = Object.keys(cart);
    if (itemIds.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    const submitBtn = document.getElementById("submitOrderBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "⌛ ĐANG XỬ LÝ ĐƠN HÀNG...";

    // Order payload
    const orderPayload = {
      cart: cart,
      orderData: { name, phone, address },
      paymentMethod: paymentMethod,
      tgUser: tg && tg.initDataUnsafe ? tg.initDataUnsafe.user : null
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();

      if (data.success) {
        // Clear local storage cart
        cart = {};
        saveCart();
        updateCartUI();
        closeCart();

        if (paymentMethod === "payment_bank" && data.qrCodeUrl) {
          // Show QR Modal for bank transfer
          qrModalBody.innerHTML = `
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px;">Mã đơn hàng: <b>${data.orderId}</b></p>
            <p style="font-size: 0.95rem; margin-bottom: 15px;">Hãy quét mã QR bên dưới hoặc chuyển khoản chính xác số tiền:</p>
            <img src="${data.qrCodeUrl}" alt="Mã chuyển khoản VietQR">
            <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; font-size: 0.85rem; text-align: left; border: var(--glass-border);">
              <p>🏦 Ngân hàng: <b>${data.bankId.toUpperCase()}</b></p>
              <p>Số tài khoản: <code>${data.accountNo}</code></p>
              <p>Chủ tài khoản: <b>${data.accountName}</b></p>
              <p>Số tiền: <b style="color: var(--primary);">${formatVND(data.amount)}</b></p>
              <p>Nội dung: <code>${data.description}</code></p>
            </div>
          `;
          qrModal.classList.add("active");
        } else {
          // COD payment
          alert(`🎉 ĐẶT HÀNG THÀNH CÔNG!\nMã đơn hàng: ${data.orderId}\nNhân viên sẽ liên hệ với bạn qua SĐT ${phone} để xác nhận.`);
          if (tg) {
            tg.close(); // Close Telegram view
          }
        }
      } else {
        alert("❌ Đã xảy ra lỗi khi tạo đơn hàng: " + (data.error || "Lỗi không xác định."));
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("❌ Lỗi kết nối mạng, vui lòng thử lại!");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 ĐẶT HÀNG NGAY";
    }
  });

  // Close QR Modal and close Telegram App
  closeQrModalBtn.addEventListener("click", () => {
    qrModal.classList.remove("active");
    if (tg) {
      tg.close();
    }
  });

  // Initial fetch
  fetchProducts();
});
