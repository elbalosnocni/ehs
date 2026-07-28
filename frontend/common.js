// common.js - Cấu hình API kết nối Google Apps Script (GAS)
const API_URL = "https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec";

const API = {
  /**
   * 1. Hàm GET dữ liệu từ Google Apps Script
   * @param {string} action - Tên hành động (vd: getEmployees, getAccidents, getCAPA)
   * @param {object} params - Các tham số bổ sung nếu có
   */
  async get(action, params = {}) {
    try {
      let url = new URL(API_URL);
      url.searchParams.append('action', action);
      
      // Thêm các param khác vào URL nếu có
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API GET Error - ${action}]:`, error);
      return { status: 'error', message: error.toString() };
    }
  },

  /**
   * 2. Hàm POST dữ liệu lên Google Apps Script
   * @param {object} payload - Đối tượng gửi đi (bao gồm action và dữ liệu)
   */
  async post(payload) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          // Dùng text/plain để tránh kích hoạt CORS OPTIONS Preflight trên GAS
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API POST Error]:`, error);
      return { status: 'error', message: error.toString() };
    }
  }
};
