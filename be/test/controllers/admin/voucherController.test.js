const controller = require("../../../controllers/voucherController");
const Voucher = require("../../../models/voucherModel");
const VoucherUser = require("../../../models/voucherUserModal");
const { mockResponse } = require("../../../utils/mockResponse");

jest.mock("../../../models/voucherModel", () => {
  const MockVoucher = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({
      _id: "1",
      ...data,
    }),
  }));

  MockVoucher.findOne = jest.fn();
  MockVoucher.find = jest.fn();
  MockVoucher.findById = jest.fn();

  return MockVoucher;
});

jest.mock("../../../models/voucherUserModal", () => ({
  find: jest.fn(),
}));

describe("Voucher Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createVoucher", () => {
    it("should create voucher successfully", async () => {
      const req = {
        body: {
          code: "sale10",
          discountPercent: 10,
          maxDiscountAmount: 50000,
          minOrderValue: 100000,
          validFrom: "2025-01-01",
          validTo: "2025-01-10",
          usageLimit: 100,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue(null);

      await controller.createVoucher(req, res);

      expect(Voucher.findOne).toHaveBeenCalledWith({
        code: "SALE10",
      });
      expect(Voucher).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "SALE10",
          discountPercent: 10,
          maxDiscountAmount: 50000,
          minOrderValue: 100000,
          validFrom: "2025-01-01",
          validTo: "2025-01-10",
          usageLimit: 100,
          usedCount: 0,
          isDelete: false,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "1",
          code: "SALE10",
        })
      );
    });

    it("should return 400 if code is empty", async () => {
      const req = {
        body: {
          code: "   ",
          discountPercent: 10,
          maxDiscountAmount: 50000,
          minOrderValue: 100000,
          validFrom: "2025-01-01",
          validTo: "2025-01-10",
          usageLimit: 100,
        },
      };
      const res = mockResponse();

      await controller.createVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.objectContaining({
          code: "Mã voucher không được để trống",
        }),
      });
    });

    it("should return 400 if code duplicated", async () => {
      const req = {
        body: {
          code: "sale10",
          discountPercent: 10,
          maxDiscountAmount: 50000,
          minOrderValue: 100000,
          validFrom: "2025-01-01",
          validTo: "2025-01-10",
          usageLimit: 100,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue({
        _id: "2",
        code: "SALE10",
      });

      await controller.createVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.objectContaining({
          code: "Mã voucher đã tồn tại",
        }),
      });
    });

    it("should return 400 if discountPercent is greater than 100", async () => {
      const req = {
        body: {
          code: "sale10",
          discountPercent: 120,
          maxDiscountAmount: 50000,
          minOrderValue: 100000,
          validFrom: "2025-01-01",
          validTo: "2025-01-10",
          usageLimit: 100,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue(null);

      await controller.createVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.objectContaining({
          discountPercent: "Phần trăm giảm không được lớn hơn 100",
        }),
      });
    });

    it("should return 400 if validTo is earlier than validFrom", async () => {
      const req = {
        body: {
          code: "sale10",
          discountPercent: 10,
          maxDiscountAmount: 50000,
          minOrderValue: 100000,
          validFrom: "2025-01-10",
          validTo: "2025-01-01",
          usageLimit: 100,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue(null);

      await controller.createVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.objectContaining({
          validTo: "Thời gian kết thúc phải lớn hơn thời gian bắt đầu",
        }),
      });
    });

    it("should return 400 if usageLimit is negative", async () => {
      const req = {
        body: {
          code: "sale10",
          discountPercent: 10,
          maxDiscountAmount: 50000,
          minOrderValue: 100000,
          validFrom: "2025-01-01",
          validTo: "2025-01-10",
          usageLimit: -1,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue(null);

      await controller.createVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.objectContaining({
          usageLimit: "Số lượt sử dụng phải là số lớn hơn hoặc bằng 0",
        }),
      });
    });

    it("should return 400 on duplicate key error", async () => {
      const req = {
        body: {
          code: "sale10",
          discountPercent: 10,
          maxDiscountAmount: 50000,
          minOrderValue: 100000,
          validFrom: "2025-01-01",
          validTo: "2025-01-10",
          usageLimit: 100,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue(null);
      Voucher.mockImplementationOnce((data) => ({
        ...data,
        save: jest.fn().mockRejectedValue({ code: 11000 }),
      }));

      await controller.createVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: { code: "Mã voucher đã tồn tại" },
      });
    });
  });

  describe("getAllVouchers", () => {
    it("should return all vouchers successfully", async () => {
      const req = {};
      const res = mockResponse();

      const sortMock = jest.fn().mockResolvedValue([
        { _id: "1", code: "SALE10" },
        { _id: "2", code: "SALE20" },
      ]);

      Voucher.find.mockReturnValue({
        sort: sortMock,
      });

      await controller.getAllVouchers(req, res);

      expect(Voucher.find).toHaveBeenCalledWith({ isDelete: false });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it("should return 500 on server error", async () => {
      const req = {};
      const res = mockResponse();

      Voucher.find.mockImplementation(() => {
        throw new Error("DB lỗi");
      });

      await controller.getAllVouchers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "DB lỗi",
      });
    });
  });

  describe("getVoucherById", () => {
    it("should return voucher by id successfully", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      Voucher.findById.mockResolvedValue({
        _id: "1",
        code: "SALE10",
      });

      await controller.getVoucherById(req, res);

      expect(Voucher.findById).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "1",
          code: "SALE10",
        })
      );
    });

    it("should return 404 if voucher not found", async () => {
      const req = { params: { id: "404" } };
      const res = mockResponse();

      Voucher.findById.mockResolvedValue(null);

      await controller.getVoucherById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Không tìm thấy voucher",
      });
    });

    it("should return 500 on server error", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      Voucher.findById.mockRejectedValue(new Error("DB lỗi"));

      await controller.getVoucherById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "DB lỗi",
      });
    });
  });

  describe("updateVoucher", () => {
    it("should update voucher successfully when voucher not used", async () => {
      const req = {
        params: { id: "1" },
        body: {
          code: "sale20",
          discountPercent: 20,
          maxDiscountAmount: 70000,
          minOrderValue: 150000,
          validFrom: "2025-01-01",
          validTo: "2025-01-15",
          usageLimit: 50,
        },
      };
      const res = mockResponse();

      const saveMock = jest.fn().mockResolvedValue({
        _id: "1",
        code: "SALE20",
      });

      Voucher.findById.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        discountPercent: 10,
        maxDiscountAmount: 50000,
        minOrderValue: 100000,
        validFrom: "2025-01-01",
        validTo: "2025-01-10",
        usageLimit: 100,
        usedCount: 0,
        save: saveMock,
      });

      Voucher.findOne.mockResolvedValue(null);

      await controller.updateVoucher(req, res);

      expect(Voucher.findOne).toHaveBeenCalledWith({
        code: "SALE20",
        _id: { $ne: "1" },
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "1",
          code: "SALE20",
        })
      );
    });

    it("should only update validTo when voucher already used", async () => {
      const req = {
        params: { id: "1" },
        body: {
          validTo: "2025-02-01",
        },
      };
      const res = mockResponse();

      const saveMock = jest.fn().mockResolvedValue({
        _id: "1",
        code: "SALE10",
        validTo: "2025-02-01",
      });

      Voucher.findById.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        discountPercent: 10,
        maxDiscountAmount: 50000,
        minOrderValue: 100000,
        validFrom: "2025-01-01",
        validTo: "2025-01-10",
        usageLimit: 100,
        usedCount: 5,
        save: saveMock,
      });

      await controller.updateVoucher(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "1",
          code: "SALE10",
          validTo: "2025-02-01",
        })
      );
    });

    it("should return 404 if voucher not found", async () => {
      const req = {
        params: { id: "404" },
        body: {
          code: "sale20",
          discountPercent: 20,
          maxDiscountAmount: 70000,
          minOrderValue: 150000,
          validFrom: "2025-01-01",
          validTo: "2025-01-15",
          usageLimit: 50,
        },
      };
      const res = mockResponse();

      Voucher.findById.mockResolvedValue(null);

      await controller.updateVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Không tìm thấy voucher",
      });
    });

    it("should return 400 if code duplicated on update", async () => {
      const req = {
        params: { id: "1" },
        body: {
          code: "sale20",
          discountPercent: 20,
          maxDiscountAmount: 70000,
          minOrderValue: 150000,
          validFrom: "2025-01-01",
          validTo: "2025-01-15",
          usageLimit: 50,
        },
      };
      const res = mockResponse();

      Voucher.findById.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        usedCount: 0,
        save: jest.fn(),
      });

      Voucher.findOne.mockResolvedValue({
        _id: "2",
        code: "SALE20",
      });

      await controller.updateVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.objectContaining({
          code: "Mã voucher đã tồn tại",
        }),
      });
    });

    it("should return 400 if usageLimit is less than usedCount", async () => {
      const req = {
        params: { id: "1" },
        body: {
          code: "sale20",
          discountPercent: 20,
          maxDiscountAmount: 70000,
          minOrderValue: 150000,
          validFrom: "2025-01-01",
          validTo: "2025-01-15",
          usageLimit: 3,
        },
      };
      const res = mockResponse();

      Voucher.findById.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        usedCount: 5,
        discountPercent: 10,
        maxDiscountAmount: 50000,
        minOrderValue: 100000,
        validFrom: "2025-01-01",
        validTo: "2025-01-10",
        save: jest.fn(),
      });

      await controller.updateVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.objectContaining({
          validTo: "Thời gian kết thúc không được để trống",
        }),
      });
    });

    it("should return 400 on duplicate key error when updating", async () => {
      const req = {
        params: { id: "1" },
        body: {
          code: "sale20",
          discountPercent: 20,
          maxDiscountAmount: 70000,
          minOrderValue: 150000,
          validFrom: "2025-01-01",
          validTo: "2025-01-15",
          usageLimit: 50,
        },
      };
      const res = mockResponse();

      Voucher.findById.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        discountPercent: 10,
        maxDiscountAmount: 50000,
        minOrderValue: 100000,
        validFrom: "2025-01-01",
        validTo: "2025-01-10",
        usageLimit: 100,
        usedCount: 0,
        save: jest.fn().mockRejectedValue({ code: 11000 }),
      });

      Voucher.findOne.mockResolvedValue(null);

      await controller.updateVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: { code: "Mã voucher đã tồn tại" },
      });
    });
  });

  describe("deleteVoucher", () => {
    it("should hard delete voucher when usedCount is 0", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      const deleteOneMock = jest.fn().mockResolvedValue(true);

      Voucher.findById.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        usedCount: 0,
        deleteOne: deleteOneMock,
      });

      await controller.deleteVoucher(req, res);

      expect(deleteOneMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Đã xóa voucher thành công",
      });
    });

    it("should soft delete voucher when usedCount > 0", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      const saveMock = jest.fn().mockResolvedValue(true);

      const voucherDoc = {
        _id: "1",
        code: "SALE10",
        usedCount: 3,
        isDelete: false,
        save: saveMock,
      };

      Voucher.findById.mockResolvedValue(voucherDoc);

      await controller.deleteVoucher(req, res);

      expect(voucherDoc.isDelete).toBe(true);
      expect(voucherDoc.code).toContain("SALE10__DELETED__");
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Voucher đã được xóa mềm do đã có lượt sử dụng",
      });
    });

    it("should return 404 if voucher not found", async () => {
      const req = { params: { id: "404" } };
      const res = mockResponse();

      Voucher.findById.mockResolvedValue(null);

      await controller.deleteVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Không tìm thấy voucher",
      });
    });

    it("should return 500 on delete error", async () => {
      const req = { params: { id: "1" } };
      const res = mockResponse();

      Voucher.findById.mockRejectedValue(new Error("DB lỗi"));

      await controller.deleteVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "DB lỗi",
      });
    });
  });

  describe("validateVoucher", () => {
    it("should validate voucher successfully", async () => {
      const req = {
        body: {
          code: "sale10",
          orderValue: 200000,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        discountPercent: 10,
        maxDiscountAmount: 50000,
        minOrderValue: 100000,
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2099-01-01"),
        usageLimit: 100,
        usedCount: 10,
        isDelete: false,
      });

      await controller.validateVoucher(req, res);

      expect(Voucher.findOne).toHaveBeenCalledWith({
        code: "SALE10",
        isDelete: false,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Voucher hợp lệ",
        voucher: {
          id: "1",
          code: "SALE10",
          discountPercent: 10,
          maxDiscountAmount: 50000,
          minOrderValue: 100000,
          discountValue: 20000,
        },
      });
    });

    it("should return 404 if voucher does not exist", async () => {
      const req = {
        body: {
          code: "invalid",
          orderValue: 200000,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue(null);

      await controller.validateVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Mã voucher không tồn tại",
      });
    });

    it("should return 400 if voucher expired", async () => {
      const req = {
        body: {
          code: "sale10",
          orderValue: 200000,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        discountPercent: 10,
        maxDiscountAmount: 50000,
        minOrderValue: 100000,
        validFrom: new Date("2020-01-01"),
        validTo: new Date("2020-01-10"),
        usageLimit: 100,
        usedCount: 10,
        isDelete: false,
      });

      await controller.validateVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Voucher đã hết hạn hoặc chưa đến thời gian sử dụng",
      });
    });

    it("should return 400 if voucher usage limit exceeded", async () => {
      const req = {
        body: {
          code: "sale10",
          orderValue: 200000,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        discountPercent: 10,
        maxDiscountAmount: 50000,
        minOrderValue: 100000,
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2099-01-01"),
        usageLimit: 5,
        usedCount: 5,
        isDelete: false,
      });

      await controller.validateVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Voucher đã hết lượt sử dụng",
      });
    });

    it("should return 400 if order value below minimum", async () => {
      const req = {
        body: {
          code: "sale10",
          orderValue: 50000,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue({
        _id: "1",
        code: "SALE10",
        discountPercent: 10,
        maxDiscountAmount: 50000,
        minOrderValue: 100000,
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2099-01-01"),
        usageLimit: 100,
        usedCount: 10,
        isDelete: false,
      });

      await controller.validateVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Đơn hàng chưa đạt giá trị tối thiểu 100000",
      });
    });

    it("should cap discount value by maxDiscountAmount", async () => {
      const req = {
        body: {
          code: "sale50",
          orderValue: 1000000,
        },
      };
      const res = mockResponse();

      Voucher.findOne.mockResolvedValue({
        _id: "1",
        code: "SALE50",
        discountPercent: 50,
        maxDiscountAmount: 100000,
        minOrderValue: 100000,
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2099-01-01"),
        usageLimit: 100,
        usedCount: 10,
        isDelete: false,
      });

      await controller.validateVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Voucher hợp lệ",
        voucher: {
          id: "1",
          code: "SALE50",
          discountPercent: 50,
          maxDiscountAmount: 100000,
          minOrderValue: 100000,
          discountValue: 100000,
        },
      });
    });
  });

  describe("getVouchersByUserId", () => {
    it("should return vouchers by user id successfully", async () => {
      const req = {
        user: { id: "user1" },
      };
      const res = mockResponse();

      const populateMock = jest.fn().mockResolvedValue([
        {
          _id: "1",
          userId: "user1",
          voucherId: { _id: "v1", code: "SALE10" },
        },
        {
          _id: "2",
          userId: "user1",
          voucherId: null,
        },
      ]);

      VoucherUser.find.mockReturnValue({
        populate: populateMock,
      });

      await controller.getVouchersByUserId(req, res);

      expect(VoucherUser.find).toHaveBeenCalledWith({ userId: "user1" });
      expect(populateMock).toHaveBeenCalledWith({
        path: "voucherId",
        match: { isDelete: false },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        {
          _id: "1",
          userId: "user1",
          voucherId: { _id: "v1", code: "SALE10" },
        },
      ]);
    });

    it("should return 500 on server error", async () => {
      const req = {
        user: { id: "user1" },
      };
      const res = mockResponse();

      VoucherUser.find.mockImplementation(() => {
        throw new Error("DB lỗi");
      });

      await controller.getVouchersByUserId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "DB lỗi",
      });
    });
  });
});
