const { GoogleGenAI, Type } = require("@google/genai");

let aiClient = null;

function getAiClient() {
  if (aiClient) return aiClient;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình");
  }

  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  return aiClient;
}

async function suggestBlogContent(title) {
  const ai = getAiClient();
  const prompt = `
Bạn là chuyên gia viết blog cho website Pet Nest về chăm sóc thú cưng.

Hãy tạo nội dung gợi ý dựa trên tiêu đề sau:
"${title}"

Yêu cầu:
- Viết bằng tiếng Việt.
- "description" phải là HTML đẹp, dễ đọc.
- Cấu trúc gồm:
  - 1 đoạn <p> mở đầu
  - 2 hoặc 3 tiêu đề phụ <h2>
  - mỗi phần có <p> hoặc <ul><li>
- Nội dung hữu ích, tự nhiên, khoảng 120-200 từ.
- "tag" chỉ gồm 1 tag duy nhất, đúng định dạng #xxx, không có khoảng trắng.
- Không trả markdown.
- Không giải thích thêm.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: {
            type: Type.STRING,
            description: "Nội dung blog dạng HTML",
          },
          tag: {
            type: Type.STRING,
            description: "Một tag duy nhất theo định dạng #xxx",
          },
        },
        required: ["description", "tag"],
        propertyOrdering: ["description", "tag"],
      },
    },
  });

  const text = response.text?.trim() || "{}";
  const parsed = JSON.parse(text);

  return {
    description: parsed.description || "",
    tag: parsed.tag || "",
  };
}

async function askCustomerSupport(message, history = [], knowledgeContext = "") {
  const ai = getAiClient();

  const sanitizedHistory = Array.isArray(history)
    ? history
        .slice(-8)
        .map((item) => ({
          role: item?.role === "assistant" ? "assistant" : "user",
          text: (item?.text || "").toString().slice(0, 1000),
        }))
        .filter((item) => item.text.trim())
    : [];

  const formattedHistory = sanitizedHistory
    .map((item) => `${item.role === "assistant" ? "Trợ lý" : "Khách"}: ${item.text}`)
    .join("\n");

  const prompt = `
Bạn là chatbot CSKH của Pet Nest.

Nguyên tắc trả lời:
- Luôn trả lời bằng tiếng Việt.
- Giọng điệu lịch sự, thân thiện, rõ ràng.
- Ưu tiên tư vấn sản phẩm thú cưng, dịch vụ spa, quy trình đặt hàng, thanh toán, vận chuyển.
- Chỉ sử dụng dữ liệu hệ thống được cung cấp ở phần "DỮ LIỆU THAM CHIẾU" khi nêu thông tin cụ thể (tên, giá, slug, dịch vụ).
- Nếu dữ liệu tham chiếu không có thông tin phù hợp, phải nói rõ là chưa có dữ liệu tương ứng và mời khách liên hệ CSKH.
- Không bịa đặt chính sách cụ thể khi không có dữ liệu.
- Trả lời ngắn gọn, tối đa khoảng 120 từ.

DỮ LIỆU THAM CHIẾU:
${knowledgeContext || "(không có dữ liệu tham chiếu)"}

Lịch sử gần nhất:
${formattedHistory || "(chưa có)"}

Khách hàng hỏi:
${message}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: {
            type: Type.STRING,
            description: "Câu trả lời cho khách hàng bằng tiếng Việt",
          },
        },
        required: ["reply"],
      },
    },
  });

  const text = response.text?.trim() || "{}";

  try {
    const parsed = JSON.parse(text);
    return (parsed.reply || "").trim();
  } catch {
    return text;
  }
}

module.exports = { suggestBlogContent, askCustomerSupport };
