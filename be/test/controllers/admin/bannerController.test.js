const controller = require("../../../controllers/bannerController");
const Banner = require("../../../models/bannerModel");
const { mockResponse } = require("../../../utils/mockResponse");

jest.mock("../../../models/bannerModel", () => {
  const MockBanner = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({
      _id: "1",
      ...data,
    }),
  }));

  MockBanner.findOne = jest.fn();
  MockBanner.find = jest.fn();
  MockBanner.findById = jest.fn();
  MockBanner.findByIdAndDelete = jest.fn();

  return MockBanner;
});

describe("Banner Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBanner", () => {
    it("should create banner successfully", async () => {
      const req = {
        body: {
          title: "Banner Trang Chủ",
          description: "Mô tả banner hợp lệ",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Xem ngay",
        },
        file: { filename: "banner.jpg" },
        protocol: "http",
        get: jest.fn().mockReturnValue("localhost:5000"),
      };
      const res = mockResponse();

      Banner.findOne.mockResolvedValue(null);

      await controller.createBanner(req, res);

      expect(Banner.findOne).toHaveBeenCalled();
      expect(Banner).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Banner Trang Chủ",
          description: "Mô tả banner hợp lệ",
          imageUrl: "http://localhost:5000/uploads/banner.jpg",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Xem ngay",
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "1",
          title: "Banner Trang Chủ",
        })
      );
    });

    it("should return 400 if title is empty", async () => {
      const req = {
        body: {
          title: "   ",
          description: "Mô tả banner hợp lệ",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Xem ngay",
        },
        file: { filename: "banner.jpg" },
      };
      const res = mockResponse();

      await controller.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Tiêu đề không được để trống",
          errors: expect.objectContaining({
            title: "Tiêu đề không được để trống",
          }),
        })
      );
    });

    it("should return 400 if description is empty", async () => {
      const req = {
        body: {
          title: "Banner Trang Chủ",
          description: "   ",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Xem ngay",
        },
        file: { filename: "banner.jpg" },
      };
      const res = mockResponse();

      Banner.findOne.mockResolvedValue(null);

      await controller.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Mô tả không được để trống",
        })
      );
    });

    it("should return 400 if status invalid", async () => {
      const req = {
        body: {
          title: "Banner Trang Chủ",
          description: "Mô tả banner hợp lệ",
          status: "abc",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Xem ngay",
        },
        file: { filename: "banner.jpg" },
      };
      const res = mockResponse();

      Banner.findOne.mockResolvedValue(null);

      await controller.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Trạng thái không hợp lệ",
        })
      );
    });

    it("should return 400 if image missing", async () => {
      const req = {
        body: {
          title: "Banner Trang Chủ",
          description: "Mô tả banner hợp lệ",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Xem ngay",
        },
      };
      const res = mockResponse();

      Banner.findOne.mockResolvedValue(null);

      await controller.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Ảnh không được để trống",
        })
      );
    });

    it("should return 400 if link invalid", async () => {
      const req = {
        body: {
          title: "Banner Trang Chủ",
          description: "Mô tả banner hợp lệ",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "abc",
          buttonText: "Xem ngay",
        },
        file: { filename: "banner.jpg" },
      };
      const res = mockResponse();

      Banner.findOne.mockResolvedValue(null);

      await controller.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Link không hợp lệ",
        })
      );
    });

    it("should return 400 if endDate <= startDate", async () => {
      const req = {
        body: {
          title: "Banner Trang Chủ",
          description: "Mô tả banner hợp lệ",
          status: "active",
          startDate: "2025-01-10",
          endDate: "2025-01-01",
          link: "https://example.com",
          buttonText: "Xem ngay",
        },
        file: { filename: "banner.jpg" },
      };
      const res = mockResponse();

      Banner.findOne.mockResolvedValue(null);

      await controller.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Ngày kết thúc phải lớn hơn ngày bắt đầu",
        })
      );
    });

    it("should return 400 if title already exists", async () => {
      const req = {
        body: {
          title: "Banner Trang Chủ",
          description: "Mô tả banner hợp lệ",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Xem ngay",
        },
        file: { filename: "banner.jpg" },
      };
      const res = mockResponse();

      Banner.findOne.mockResolvedValue({
        _id: "2",
        title: "Banner Trang Chủ",
      });

      await controller.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Tiêu đề đã tồn tại",
        })
      );
    });

    it("should return 500 when save throws error", async () => {
      const req = {
        body: {
          title: "Banner Trang Chủ",
          description: "Mô tả banner hợp lệ",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Xem ngay",
        },
        file: { filename: "banner.jpg" },
        protocol: "http",
        get: jest.fn().mockReturnValue("localhost:5000"),
      };
      const res = mockResponse();

      Banner.findOne.mockResolvedValue(null);
      Banner.mockImplementationOnce((data) => ({
        ...data,
        save: jest.fn().mockRejectedValue(new Error("DB lỗi")),
      }));

      await controller.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Lỗi server khi tạo banner",
      });
    });
  });

  describe("getAllBanners", () => {
    it("should return banner list successfully", async () => {
      const req = {};
      const res = mockResponse();

      const sortMock = jest.fn().mockResolvedValue([
        { _id: "1", title: "Banner 1" },
        { _id: "2", title: "Banner 2" },
      ]);

      Banner.find.mockReturnValue({
        sort: sortMock,
      });

      await controller.getAllBanners(req, res);

      expect(Banner.find).toHaveBeenCalled();
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it("should return 500 on server error", async () => {
      const req = {};
      const res = mockResponse();

      Banner.find.mockImplementation(() => {
        throw new Error("DB lỗi");
      });

      await controller.getAllBanners(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Lỗi server khi lấy danh sách banner",
      });
    });
  });

  describe("getBannerById", () => {
    it("should return banner by id successfully", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      Banner.findById.mockResolvedValue({
        _id: "1",
        title: "Banner 1",
      });

      await controller.getBannerById(req, res);

      expect(Banner.findById).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "1",
          title: "Banner 1",
        })
      );
    });

    it("should return 404 if banner not found", async () => {
      const req = { params: { id: "404" } };
      const res = mockResponse();

      Banner.findById.mockResolvedValue(null);

      await controller.getBannerById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Banner không tồn tại",
      });
    });

    it("should return 500 on server error", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      Banner.findById.mockRejectedValue(new Error("DB lỗi"));

      await controller.getBannerById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Lỗi server khi lấy chi tiết banner",
      });
    });
  });

  describe("updateBanner", () => {
    it("should update banner successfully without new image", async () => {
      const req = {
        params: { id: "1" },
        body: {
          title: "Banner Mới",
          description: "Mô tả banner mới",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Mua ngay",
        },
        protocol: "http",
        get: jest.fn().mockReturnValue("localhost:5000"),
      };
      const res = mockResponse();

      const saveMock = jest.fn().mockResolvedValue({
        _id: "1",
        title: "Banner Mới",
      });

      Banner.findById.mockResolvedValue({
        _id: "1",
        title: "Banner Cũ",
        description: "Mô tả cũ",
        imageUrl: "old.jpg",
        status: "inactive",
        startDate: "2024-01-01",
        endDate: "2024-01-10",
        link: "https://old.com",
        buttonText: "Cũ",
        save: saveMock,
      });

      Banner.findOne.mockResolvedValue(null);

      await controller.updateBanner(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "1",
          title: "Banner Mới",
        })
      );
    });

    it("should update banner successfully with new image", async () => {
      const req = {
        params: { id: "1" },
        body: {
          title: "Banner Mới",
          description: "Mô tả banner mới",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Mua ngay",
        },
        file: { filename: "new-banner.jpg" },
        protocol: "http",
        get: jest.fn().mockReturnValue("localhost:5000"),
      };
      const res = mockResponse();

      const bannerDoc = {
        _id: "1",
        title: "Banner Cũ",
        description: "Mô tả cũ",
        imageUrl: "old.jpg",
        status: "inactive",
        startDate: "2024-01-01",
        endDate: "2024-01-10",
        link: "https://old.com",
        buttonText: "Cũ",
        save: jest.fn().mockResolvedValue({
          _id: "1",
          title: "Banner Mới",
          imageUrl: "http://localhost:5000/uploads/new-banner.jpg",
        }),
      };

      Banner.findById.mockResolvedValue(bannerDoc);
      Banner.findOne.mockResolvedValue(null);

      await controller.updateBanner(req, res);

      expect(bannerDoc.imageUrl).toBe(
        "http://localhost:5000/uploads/new-banner.jpg"
      );
      expect(bannerDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if banner not found", async () => {
      const req = {
        params: { id: "404" },
        body: {
          title: "Banner Mới",
          description: "Mô tả banner mới",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Mua ngay",
        },
      };
      const res = mockResponse();

      Banner.findById.mockResolvedValue(null);

      await controller.updateBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Banner không tồn tại",
      });
    });

    it("should return 400 if title duplicated with another banner", async () => {
      const req = {
        params: { id: "1" },
        body: {
          title: "Banner Trùng",
          description: "Mô tả banner mới",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Mua ngay",
        },
      };
      const res = mockResponse();

      Banner.findById.mockResolvedValue({
        _id: "1",
        title: "Banner Cũ",
        save: jest.fn(),
      });

      Banner.findOne.mockResolvedValue({
        _id: "2",
        title: "Banner Trùng",
      });

      await controller.updateBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Tiêu đề đã tồn tại",
        })
      );
    });

    it("should return 500 on update server error", async () => {
      const req = {
        params: { id: "1" },
        body: {
          title: "Banner Mới",
          description: "Mô tả banner mới",
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-01-10",
          link: "https://example.com",
          buttonText: "Mua ngay",
        },
      };
      const res = mockResponse();

      Banner.findById.mockRejectedValue(new Error("DB lỗi"));

      await controller.updateBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Lỗi server khi cập nhật banner",
      });
    });
  });

  describe("deleteBanner", () => {
    it("should delete banner successfully", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      Banner.findById.mockResolvedValue({
        _id: "1",
        title: "Banner 1",
      });
      Banner.findByIdAndDelete.mockResolvedValue({
        _id: "1",
      });

      await controller.deleteBanner(req, res);

      expect(Banner.findById).toHaveBeenCalledWith("1");
      expect(Banner.findByIdAndDelete).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Xóa banner thành công",
      });
    });

    it("should return 404 if banner not found", async () => {
      const req = { params: { id: "404" } };
      const res = mockResponse();

      Banner.findById.mockResolvedValue(null);

      await controller.deleteBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Banner không tồn tại",
      });
    });

    it("should return 500 on delete server error", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      Banner.findById.mockRejectedValue(new Error("DB lỗi"));

      await controller.deleteBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Lỗi server khi xóa banner",
      });
    });
  });
});
