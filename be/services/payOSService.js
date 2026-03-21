const crypto = require("crypto");
const axios = require("axios");

class PayOSService {
  constructor() {
    this.clientId = process.env.PAYOS_CLIENT_ID;
    this.apiKey = process.env.PAYOS_API_KEY;
    this.checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    this.baseUrl = "https://api-merchant.payos.vn/v2/payment-requests";
  }

  /**
   * Tạo chuỗi signature theo chuẩn PayOS
   * Các trường phải được xếp theo thứ tự alpha: amount, cancelUrl, description, orderCode, returnUrl
   */
  createSignature(data) {
    const sortedData = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join("&");

    return crypto
      .createHmac("sha256", this.checksumKey)
      .update(sortedData)
      .digest("hex");
  }

  /**
   * Khởi tạo link thanh toán
   */
  async createPaymentLink({
    orderCode,
    amount,
    description,
    cancelUrl,
    returnUrl,
  }) {
    try {
      const body = {
        orderCode,
        amount,
        description,
        cancelUrl,
        returnUrl,
      };

      const signature = this.createSignature(body);
      body.signature = signature;

      const response = await axios.post(this.baseUrl, body, {
        headers: {
          "x-client-id": this.clientId,
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (response.data.code === "00") {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Lấy thông tin thanh toán từ PayOS qua orderCode
   */
  async getPaymentLinkInformation(orderCode) {
    try {
      const response = await axios.get(`${this.baseUrl}/${orderCode}`, {
        headers: {
          "x-client-id": this.clientId,
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (response.data.code === "00") {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error("PayOS GET INFO ERROR:", error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Xác thực dữ liệu webhook từ PayOS
   */
  verifyWebhookData(webhookData) {
    const { data, signature } = webhookData;
    
    // Sắp xếp các key trong data theo alphabet
    const sortedData = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join("&");

    const expectedSignature = crypto
      .createHmac("sha256", this.checksumKey)
      .update(sortedData)
      .digest("hex");

    console.log("--- PAYOS WEBHOOK VERIFICATION ---");
    console.log("Sorted Data String:", sortedData);
    console.log("Expected Signature:", expectedSignature);
    console.log("Received Signature:", signature);
    console.log("Match:", expectedSignature === signature);
    console.log("----------------------------------");

    return expectedSignature === signature;
  }
}

module.exports = new PayOSService();
