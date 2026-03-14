const mockGenerateContent = jest.fn();

jest.mock("@google/genai", () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
    Type: {
      OBJECT: "OBJECT",
      STRING: "STRING",
    },
  };
});

const { suggestBlogContent } = require("../../services/geminiService");

describe("geminiService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("suggestBlogContent", () => {
    it("should return description and tag when Gemini responds with valid JSON", async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          description: "<p>Chăm sóc thú cưng đúng cách.</p>",
          tag: "#thucung",
        }),
      });

      const result = await suggestBlogContent("Cách chăm sóc chó con");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-2.5-flash",
          contents: expect.stringContaining("Cách chăm sóc chó con"),
          config: expect.objectContaining({
            responseMimeType: "application/json",
          }),
        })
      );

      expect(result).toEqual({
        description: "<p>Chăm sóc thú cưng đúng cách.</p>",
        tag: "#thucung",
      });
    });

    it("should return empty strings when JSON does not contain description and tag", async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({}),
      });

      const result = await suggestBlogContent("Mèo ăn gì tốt");

      expect(result).toEqual({
        description: "",
        tag: "",
      });
    });

    it("should trim response text before parsing", async () => {
      mockGenerateContent.mockResolvedValue({
        text: `   ${JSON.stringify({
          description: "<p>Nội dung</p>",
          tag: "#meo",
        })}   `,
      });

      const result = await suggestBlogContent("Cách nuôi mèo");

      expect(result).toEqual({
        description: "<p>Nội dung</p>",
        tag: "#meo",
      });
    });

    it("should fallback to empty object when response.text is missing", async () => {
      mockGenerateContent.mockResolvedValue({});

      const result = await suggestBlogContent("Cách tắm cho chó");

      expect(result).toEqual({
        description: "",
        tag: "",
      });
    });

    it("should throw error when Gemini returns invalid JSON", async () => {
      mockGenerateContent.mockResolvedValue({
        text: "khong-phai-json",
      });

      await expect(
        suggestBlogContent("Cách chăm sóc hamster")
      ).rejects.toThrow();
    });

    it("should throw error when Gemini API fails", async () => {
      mockGenerateContent.mockRejectedValue(new Error("Gemini lỗi"));

      await expect(suggestBlogContent("Cách chăm sóc hamster")).rejects.toThrow(
        "Gemini lỗi"
      );
    });
  });
});
