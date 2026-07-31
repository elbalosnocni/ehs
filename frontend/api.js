const API = {
  // Gửi request POST đến Backend
  post: async function(action, data = {}) {
    try {
      let payload = {};

      // Kiểm tra nếu tham số thứ nhất truyền vào là 1 Object (như trong employee.js)
      if (typeof action === 'object' && action !== null) {
        payload = action;
      } else {
        // Nếu truyền 2 tham số riêng biệt: API.post('importEmployees', { ... })
        payload = { action: action, ...data };
      }

      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      console.error("API Post Error:", error);
      return { status: "error", message: "Lỗi kết nối Server!" };
    }
  },

  // Gửi request GET đến Backend
  get: async function(action) {
    try {
      const response = await fetch(`${CONFIG.API_URL}?action=${action}`);
      return await response.json();
    } catch (error) {
      console.error("API Get Error:", error);
      return { status: "error", message: "Lỗi kết nối Server!" };
    }
  }
};
