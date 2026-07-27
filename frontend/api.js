const API = {
  // Gửi request POST đến Backend
  post: async function(action, data = {}) {
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: action, ...data })
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
