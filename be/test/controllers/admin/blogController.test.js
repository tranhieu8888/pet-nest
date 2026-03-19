const mongoose = require("mongoose");
const Blog = require("../../../models/blogModel");
const { suggestBlogContent } = require("../../../services/geminiService");
const controller = require("../../../controllers/blogController");
const { mockResponse } = require("../../../utils/mockResponse");

jest.mock("../../../models/blogModel");
jest.mock("../../../services/geminiService", () => ({
  suggestBlogContent: jest.fn(),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

const fs = require("fs");

describe("Blog Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBlog", () => {
    it("should create blog successfully", async () => {
      const req = {
        body: {
          title: "Đây là tiêu đề blog hợp lệ",
          description:
            "<p>Đây là mô tả đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "#blog",
        },
        file: { filename: "image1.jpg" },
        protocol: "http",
        get: jest.fn().mockReturnValue("localhost:5000"),
      };
      const res = mockResponse();

      Blog.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      Blog.create.mockResolvedValue({
        _id: "1",
        title: req.body.title,
        slug: "day-la-tieu-de-blog-hop-le",
        description: req.body.description,
        tag: req.body.tag,
        image: {
          url: "http://localhost:5000/uploads/image1.jpg",
          public_id: "image1.jpg",
        },
      });

      await controller.createBlog(req, res);

      expect(Blog.findOne).toHaveBeenCalled();
      expect(Blog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Đây là tiêu đề blog hợp lệ",
          tag: "#blog",
          slug: expect.any(String),
          image: {
            url: "http://localhost:5000/uploads/image1.jpg",
            public_id: "image1.jpg",
          },
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          blog: expect.any(Object),
        })
      );
    });

    it("should return 400 if title is empty", async () => {
      const req = {
        body: {
          title: "   ",
          description:
            "<p>Đây là mô tả đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "#blog",
        },
        file: { filename: "image1.jpg" },
      };
      const res = mockResponse();

      await controller.createBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Tiêu đề không được để trống",
        })
      );
    });

    it("should return 400 if title too short", async () => {
      const req = {
        body: {
          title: "Tiêu đề",
          description:
            "<p>Đây là mô tả đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "#blog",
        },
        file: { filename: "image1.jpg" },
      };
      const res = mockResponse();

      await controller.createBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Tiêu đề phải từ 10 ký tự trở lên",
        })
      );
    });

    it("should return 400 if description too short", async () => {
      const req = {
        body: {
          title: "Đây là tiêu đề blog hợp lệ",
          description: "<p>Quá ngắn</p>",
          tag: "#blog",
        },
        file: { filename: "image1.jpg" },
      };
      const res = mockResponse();

      await controller.createBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Mô tả phải từ 50 ký tự trở lên",
        })
      );
    });

    it("should return 400 if tag invalid", async () => {
      const req = {
        body: {
          title: "Đây là tiêu đề blog hợp lệ",
          description:
            "<p>Đây là mô tả đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "blog",
        },
        file: { filename: "image1.jpg" },
      };
      const res = mockResponse();

      await controller.createBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it("should return 400 if image missing", async () => {
      const req = {
        body: {
          title: "Đây là tiêu đề blog hợp lệ",
          description:
            "<p>Đây là mô tả đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "#blog",
        },
        protocol: "http",
        get: jest.fn().mockReturnValue("localhost:5000"),
      };
      const res = mockResponse();

      await controller.createBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Vui lòng upload 1 ảnh",
        })
      );
    });

    it("should generate unique slug when slug already exists", async () => {
      const req = {
        body: {
          title: "Đây là tiêu đề blog hợp lệ",
          description:
            "<p>Đây là mô tả đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "#blog",
        },
        file: { filename: "image1.jpg" },
        protocol: "http",
        get: jest.fn().mockReturnValue("localhost:5000"),
      };
      const res = mockResponse();

      Blog.findOne
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ _id: "existing" }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(null),
        });

      Blog.create.mockResolvedValue({
        _id: "1",
        slug: "day-la-tieu-de-blog-hop-le-1",
      });

      await controller.createBlog(req, res);

      expect(Blog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: expect.stringContaining("-1"),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getAllBlogs", () => {
    it("should return all blogs successfully", async () => {
      const req = {};
      const res = mockResponse();

      const sortMock = jest.fn().mockResolvedValue([
        { _id: "1", title: "Blog 1" },
        { _id: "2", title: "Blog 2" },
      ]);

      Blog.find.mockReturnValue({
        sort: sortMock,
      });

      await controller.getAllBlogs(req, res);

      expect(Blog.find).toHaveBeenCalled();
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        blogs: expect.any(Array),
      });
    });

    it("should handle server error", async () => {
      const req = {};
      const res = mockResponse();

      Blog.find.mockImplementation(() => {
        throw new Error("DB error");
      });

      await controller.getAllBlogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "DB error",
        })
      );
    });
  });

  describe("getBlog", () => {
    it("should return 400 if blog id invalid", async () => {
      const req = { params: { id: "abc" } };
      const res = mockResponse();

      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

      await controller.getBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid blog ID",
      });
    });

    it("should return blog and related blogs", async () => {
      const req = { params: { id: "507f1f77bcf86cd799439011" } };
      const res = mockResponse();

      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);

      const blog = { _id: "1", title: "Blog 1", tag: "#news" };

      Blog.findByIdAndUpdate.mockResolvedValue(blog);

      const relatedSortMock = jest
        .fn()
        .mockResolvedValue([{ _id: "2", title: "Related 1" }]);

      Blog.find.mockReturnValue({
        sort: relatedSortMock,
      });

      await controller.getBlog(req, res);

      expect(Blog.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { $inc: { views: 1 } },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        blog,
        related: expect.any(Array),
      });
    });

    it("should return 404 if blog not found", async () => {
      const req = { params: { id: "507f1f77bcf86cd799439011" } };
      const res = mockResponse();

      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      Blog.findByIdAndUpdate.mockResolvedValue(null);

      await controller.getBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found",
      });
    });
  });

  describe("updateBlog", () => {
    it("should update blog successfully without changing image", async () => {
      const req = {
        params: { id: "1" },
        body: {
          title: "Đây là tiêu đề blog đã cập nhật",
          description:
            "<p>Đây là mô tả mới đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "#updated",
        },
        protocol: "http",
        get: jest.fn().mockReturnValue("localhost:5000"),
      };
      const res = mockResponse();

      const saveMock = jest.fn().mockResolvedValue(true);

      Blog.findById.mockResolvedValue({
        _id: "1",
        title: "Tiêu đề cũ rất dài",
        slug: "tieu-de-cu-rat-dai",
        image: { url: "old-url", public_id: "old.jpg" },
        save: saveMock,
      });

      Blog.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await controller.updateBlog(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          blog: expect.any(Object),
        })
      );
    });

    it("should return 404 if blog not found", async () => {
      const req = {
        params: { id: "1" },
        body: {
          title: "Đây là tiêu đề blog đã cập nhật",
          description:
            "<p>Đây là mô tả mới đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "#updated",
        },
      };
      const res = mockResponse();

      Blog.findById.mockResolvedValue(null);

      await controller.updateBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found",
      });
    });

    it("should return 400 if removeImage=true but no new file", async () => {
      const req = {
        params: { id: "1" },
        body: {
          title: "Tiêu đề cũ rất dài",
          description:
            "<p>Đây là mô tả mới đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "#updated",
          removeImage: "true",
        },
      };
      const res = mockResponse();

      Blog.findById.mockResolvedValue({
        _id: "1",
        title: "Tiêu đề cũ rất dài",
        image: { url: "old-url", public_id: "old.jpg" },
      });

      await controller.updateBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Không thể xoá ảnh mà không upload ảnh mới",
      });
    });

    it("should replace old image when new file uploaded", async () => {
      const req = {
        params: { id: "1" },
        body: {
          title: "Đây là tiêu đề blog đã cập nhật",
          description:
            "<p>Đây là mô tả mới đủ dài hơn năm mươi ký tự để vượt qua validate controller.</p>",
          tag: "#updated",
        },
        file: { filename: "new.jpg" },
        protocol: "http",
        get: jest.fn().mockReturnValue("localhost:5000"),
      };
      const res = mockResponse();

      const saveMock = jest.fn().mockResolvedValue(true);

      Blog.findById.mockResolvedValue({
        _id: "1",
        title: "Tiêu đề cũ rất dài",
        slug: "tieu-de-cu-rat-dai",
        image: { url: "old-url", public_id: "old.jpg" },
        save: saveMock,
      });

      Blog.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      fs.existsSync.mockReturnValue(true);

      await controller.updateBlog(req, res);

      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe("deleteBlog", () => {
    it("should delete blog successfully", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      const deleteOneMock = jest.fn().mockResolvedValue(true);

      Blog.findById.mockResolvedValue({
        _id: "1",
        image: { public_id: "old.jpg" },
        deleteOne: deleteOneMock,
      });

      fs.existsSync.mockReturnValue(true);

      await controller.deleteBlog(req, res);

      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(deleteOneMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Deleted",
      });
    });

    it("should return 404 if blog not found", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      Blog.findById.mockResolvedValue(null);

      await controller.deleteBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found",
      });
    });
  });

  describe("getBlogBySlug", () => {
    it("should return blog by slug successfully", async () => {
      const req = { params: { slug: "bai-viet-1" } };
      const res = mockResponse();

      const blog = { _id: "1", title: "Blog 1", tag: "#tech" };

      Blog.findOneAndUpdate.mockResolvedValue(blog);

      const relatedSortMock = jest
        .fn()
        .mockResolvedValue([{ _id: "2", title: "Related blog" }]);

      Blog.find.mockReturnValue({
        sort: relatedSortMock,
      });

      await controller.getBlogBySlug(req, res);

      expect(Blog.findOneAndUpdate).toHaveBeenCalledWith(
        { slug: "bai-viet-1" },
        { $inc: { views: 1 } },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        blog,
        related: expect.any(Array),
      });
    });

    it("should return 404 if slug not found", async () => {
      const req = { params: { slug: "not-found" } };
      const res = mockResponse();

      Blog.findOneAndUpdate.mockResolvedValue(null);

      await controller.getBlogBySlug(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found",
      });
    });
  });

  describe("suggestBlog", () => {
    it("should suggest blog content successfully", async () => {
      const req = {
        body: { title: "Cách viết blog chuẩn SEO" },
      };
      const res = mockResponse();

      suggestBlogContent.mockResolvedValue({
        description: "<p>Nội dung AI gợi ý</p>",
        tag: "#seo",
      });

      await controller.suggestBlog(req, res);

      expect(suggestBlogContent).toHaveBeenCalledWith(
        "Cách viết blog chuẩn SEO"
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        description: "<p>Nội dung AI gợi ý</p>",
        tag: "#seo",
      });
    });

    it("should return 400 if title empty", async () => {
      const req = {
        body: { title: "   " },
      };
      const res = mockResponse();

      await controller.suggestBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Tiêu đề không được để trống",
      });
    });

    it("should return 400 if title too short", async () => {
      const req = {
        body: { title: "abc" },
      };
      const res = mockResponse();

      await controller.suggestBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Tiêu đề quá ngắn để AI gợi ý",
      });
    });

    it("should handle AI service error", async () => {
      const req = {
        body: { title: "Cách viết blog chuẩn SEO" },
      };
      const res = mockResponse();

      suggestBlogContent.mockRejectedValue(new Error("Gemini lỗi"));

      await controller.suggestBlog(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Gemini lỗi",
      });
    });
  });
});
