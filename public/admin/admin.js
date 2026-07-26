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
        ordersTableBody.innerHTML = `<tr><td colspan="9" class="no-data">📭 Chưa có đơn hàng nào được tạo.</td></tr>`;
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
        `;
        ordersTableBody.appendChild(row);
      });

    } catch (err) {
      console.error("Dashboard loading error:", err);
      ordersTableBody.innerHTML = `<tr><td colspan="9" class="no-data">❌ Lỗi tải dữ liệu. Vui lòng bấm "Làm mới" thử lại!</td></tr>`;
    }
  }

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

  // Initial Load
  loadDashboard();
});
