const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function suggestBlogContent(title) {
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

module.exports = { suggestBlogContent };
