// Admin Dashboard Application Logic
document.addEventListener("DOMContentLoaded", () => {
  
  // Format currency VND
  function formatVND(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  // Format timestamp to localized readable string
  function formatTime(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (e) {
      return isoString || "Không rõ";
    }
  }

  // Fetch stats and render
  async function loadDashboard() {
    const ordersTableBody = document.getElementById("ordersTableBody");
    ordersTableBody.innerHTML = `<tr><td colspan="9" class="no-data">⌛ Đang tải dữ liệu...</td></tr>`;

    try {
      const res = await fetch("/api/admin/stats");
      
      // If unauthorized, redirect to login
      if (res.status === 401) {
        window.location.href = "/admin/login.html";
        return;
      }

      const data = await res.json();
      if (!data.success) {
        alert("Lỗi tải dữ liệu: " + data.error);
        return;
      }

      const stats = data.stats || {};
      const visits = stats.visits || { webapp: 0, bot: 0 };
      const orders = data.orders || [];

      // 1. Render Stats Cards
      document.getElementById("statWebVisits").textContent = (visits.webapp || 0).toLocaleString("vi-VN");
      document.getElementById("statBotVisits").textContent = (visits.bot || 0).toLocaleString("vi-VN");
      document.getElementById("statTotalOrders").textContent = orders.length.toLocaleString("vi-VN");
      
      // Calculate total revenue
      const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
      document.getElementById("statTotalRevenue").textContent = formatVND(totalRevenue);

      // 2. Render Orders Table
      ordersTableBody.innerHTML = "";
      if (orders.length === 0) {
        ordersTableBody.innerHTML = `<tr><td colspan="10" class="no-data">📭 Chưa có đơn hàng nào được tạo.</td></tr>`;
        return;
      }

      // Sort orders newest first
      const sortedOrders = [...orders].reverse();

      sortedOrders.forEach(order => {
        const row = document.createElement("tr");
        
        // Define badge style for source
        const sourceClass = order.source === "Web App" ? "badge-webapp" : "badge-bot";
        
        row.innerHTML = `
          <td>${formatTime(order.timestamp)}</td>
          <td><code>${order.orderId}</code></td>
          <td><b>${order.customerName}</b></td>
          <td><code>${order.phone}</code></td>
          <td><i>${order.address}</i></td>
          <td class="order-products">${order.products.trim()}</td>
          <td style="color: var(--primary); font-weight: 700;">${formatVND(order.amount)}</td>
          <td>${order.paymentMethod}</td>
          <td><span class="badge-source ${sourceClass}">${order.source}</span></td>
          <td><button class="btn-delete" data-id="${order.orderId}">🗑️ Xóa</button></td>
        `;
        ordersTableBody.appendChild(row);
      });

      // 3. Render danh sách sản phẩm quản lý
      await loadProducts();

    } catch (err) {
      console.error("Dashboard loading error:", err);
      ordersTableBody.innerHTML = `<tr><td colspan="10" class="no-data">❌ Lỗi tải dữ liệu. Vui lòng bấm "Làm mới" thử lại!</td></tr>`;
    }
  }

  // Handle Delete Order (Event Delegation)
  document.getElementById("ordersTableBody").addEventListener("click", async (e) => {
    if (e.target && e.target.classList.contains("btn-delete")) {
      const orderId = e.target.getAttribute("data-id");
      if (!confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${orderId} này?`)) return;

      try {
        const res = await fetch("/api/admin/orders/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId })
        });
        const data = await res.json();
        if (data.success) {
          loadDashboard(); // reload stats and orders table
        } else {
          alert("Lỗi xóa đơn hàng: " + data.error);
        }
      } catch (err) {
        alert("Lỗi kết nối đến máy chủ!");
      }
    }
  });

  // Handle Logout
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;
    
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/admin/login.html";
      } else {
        alert("Đăng xuất thất bại!");
      }
    } catch (err) {
      alert("Lỗi kết nối mạng!");
    }
  });

  // Handle Refresh
  document.getElementById("refreshBtn").addEventListener("click", loadDashboard);

  // --- QUẢN LÝ SẢN PHẨM JS ---
  let cachedProducts = [];

  // Tải danh sách sản phẩm quản trị
  async function loadProducts() {
    const productsTableBody = document.getElementById("productsTableBody");
    productsTableBody.innerHTML = `<tr><td colspan="7" class="no-data">⌛ Đang tải danh sách sản phẩm...</td></tr>`;

    try {
      const res = await fetch("/api/admin/products");
      if (res.status === 401) {
        window.location.href = "/admin/login.html";
        return;
      }
      const data = await res.json();
      if (!data.success) {
        productsTableBody.innerHTML = `<tr><td colspan="7" class="no-data">❌ Lỗi: ${data.error}</td></tr>`;
        return;
      }

      cachedProducts = data.products || [];
      productsTableBody.innerHTML = "";

      if (cachedProducts.length === 0) {
        productsTableBody.innerHTML = `<tr><td colspan="7" class="no-data">📭 Không có sản phẩm nào trong hệ thống.</td></tr>`;
        return;
      }

      cachedProducts.forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><img src="${p.image}" class="product-thumb" alt="${p.name}"></td>
          <td><code>${p.id}</code></td>
          <td><b>${p.name}</b></td>
          <td><span class="badge-source badge-webapp">${p.category}</span></td>
          <td style="color: var(--primary); font-weight: 700;">${formatVND(p.price)}</td>
          <td style="font-size: 0.8rem; color: var(--text-muted); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.description}">
            ${p.description}
          </td>
          <td>
            <button class="btn-edit" data-id="${p.id}">✏️ Sửa</button>
            <button class="btn-delete btn-delete-product" data-id="${p.id}">🗑️ Xóa</button>
          </td>
        `;
        productsTableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading products:", err);
      productsTableBody.innerHTML = `<tr><td colspan="7" class="no-data">❌ Lỗi kết nối máy chủ khi tải sản phẩm.</td></tr>`;
    }
  }

  // Khai báo các phần tử DOM Modal
  const productModal = document.getElementById("productModal");
  const addProductBtn = document.getElementById("addProductBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelProductBtn = document.getElementById("cancelProductBtn");
  const productForm = document.getElementById("productForm");

  // Mở Modal để Thêm sản phẩm mới
  addProductBtn.addEventListener("click", () => {
    document.getElementById("modalTitle").textContent = "Thêm sản phẩm mới";
    productForm.reset();
    document.getElementById("prodId").value = "";
    productModal.classList.add("show");
  });

  // Đóng Modal
  function closeModal() {
    productModal.classList.remove("show");
  }
  closeModalBtn.addEventListener("click", closeModal);
  cancelProductBtn.addEventListener("click", closeModal);

  // Đóng Modal khi bấm ra ngoài vùng nội dung
  window.addEventListener("click", (e) => {
    if (e.target === productModal) {
      closeModal();
    }
  });

  // Lắng nghe sự kiện Sửa sản phẩm (Event Delegation)
  document.getElementById("productsTableBody").addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("btn-edit")) {
      const prodId = e.target.getAttribute("data-id");
      const product = cachedProducts.find(p => p.id === prodId);
      if (!product) return;

      document.getElementById("modalTitle").textContent = "Chỉnh sửa sản phẩm";
      document.getElementById("prodId").value = product.id;
      document.getElementById("prodName").value = product.name;
      document.getElementById("prodPrice").value = product.price;
      document.getElementById("prodCategory").value = product.category;
      document.getElementById("prodImage").value = product.image || "";
      document.getElementById("prodDescription").value = product.description;

      productModal.classList.add("show");
    }
  });

  // Xử lý gửi Form để Lưu (Thêm/Sửa) sản phẩm
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("prodId").value;
    const name = document.getElementById("prodName").value;
    const price = document.getElementById("prodPrice").value;
    const category = document.getElementById("prodCategory").value;
    const image = document.getElementById("prodImage").value;
    const description = document.getElementById("prodDescription").value;

    const saveBtn = document.getElementById("saveProductBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "⌛ Đang lưu...";

    try {
      const res = await fetch("/api/admin/products/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, price, category, image, description })
      });
      const data = await res.json();
      if (data.success) {
        closeModal();
        loadProducts(); // reload sản phẩm
      } else {
        alert("Lỗi lưu sản phẩm: " + data.error);
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Lưu lại";
    }
  });

  // Xử lý sự kiện Xóa sản phẩm (Event Delegation)
  document.getElementById("productsTableBody").addEventListener("click", async (e) => {
    if (e.target && e.target.classList.contains("btn-delete-product")) {
      const productId = e.target.getAttribute("data-id");
      const product = cachedProducts.find(p => p.id === productId);
      const productName = product ? product.name : productId;
      
      if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" khỏi cửa hàng?\nHành động này cũng sẽ làm mất sản phẩm trên Web App và Bot Telegram.`)) return;

      try {
        const res = await fetch("/api/admin/products/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId })
        });
        const data = await res.json();
        if (data.success) {
          loadProducts(); // reload danh sách
        } else {
          alert("Lỗi xóa sản phẩm: " + data.error);
        }
      } catch (err) {
        alert("Lỗi kết nối máy chủ!");
      }
    }
  });

  // Initial Load
  loadDashboard();
});
