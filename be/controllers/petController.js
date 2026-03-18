const mongoose = require("mongoose");
const Pet = require("../models/petModel");

function validatePetInput(body, isUpdate = false) {
  const errors = {};

  const checkRequiredString = (field, label) => {
    if (
      body[field] === undefined ||
      body[field] === null ||
      String(body[field]).trim() === ""
    ) {
      errors[field] = `${label} không được để trống`;
    }
  };

  const checkRequiredNumber = (field, label) => {
    if (
      body[field] === undefined ||
      body[field] === null ||
      String(body[field]).trim() === ""
    ) {
      errors[field] = `${label} không được để trống`;
      return;
    }

    const num = Number(body[field]);

    if (Number.isNaN(num)) {
      errors[field] = `${label} phải là số hợp lệ`;
      return;
    }

    if (num < 0) {
      errors[field] = `${label} không được nhỏ hơn 0`;
    }
  };

  if (!isUpdate || body.name !== undefined) {
    checkRequiredString("name", "Tên thú cưng");
  }

  if (!isUpdate || body.type !== undefined) {
    if (!body.type || String(body.type).trim() === "") {
      errors.type = "Loại thú cưng không được để trống";
    } else if (!["dog", "cat"].includes(body.type)) {
      errors.type = "Loại thú cưng không hợp lệ";
    }
  }

  if (!isUpdate || body.breed !== undefined) {
    checkRequiredString("breed", "Giống");
  }

  if (!isUpdate || body.gender !== undefined) {
    if (!body.gender || String(body.gender).trim() === "") {
      errors.gender = "Giới tính không được để trống";
    } else if (!["male", "female", "unknown"].includes(body.gender)) {
      errors.gender = "Giới tính không hợp lệ";
    }
  }

  if (!isUpdate || body.age !== undefined) {
    checkRequiredNumber("age", "Tuổi");
  }

  if (!isUpdate || body.weight !== undefined) {
    checkRequiredNumber("weight", "Cân nặng");
  }

  // if (!isUpdate || body.note !== undefined) {
  //   checkRequiredString("note", "Ghi chú");
  // }

  // if (!isUpdate || body.allergies !== undefined) {
  //   checkRequiredString("allergies", "Dị ứng");
  // }

  // if (!isUpdate || body.behaviorNote !== undefined) {
  //   checkRequiredString("behaviorNote", "Hành vi cần lưu ý");
  // }

  return errors;
}

// GET pets của customer đang đăng nhập
exports.getMyPets = async (req, res) => {
  try {
    const customerId = req.user.id || req.user._id;

    const pets = await Pet.find({
      customerId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: pets,
    });
  } catch (e) {
    console.error("GET MY PETS ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy danh sách thú cưng",
    });
  }
};

// CREATE pet
exports.createPet = async (req, res) => {
  try {
    const customerId = req.user.id || req.user._id;
    const errors = validatePetInput(req.body, false);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors,
      });
    }

    const pet = await Pet.create({
      customerId,
      name: req.body.name.trim(),
      type: req.body.type,
      breed: req.body.breed.trim(),
      gender: req.body.gender,
      age: Number(req.body.age),
      weight: Number(req.body.weight),
      note: req.body.note.trim(),
      allergies: req.body.allergies.trim(),
      behaviorNote: req.body.behaviorNote.trim(),
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Thêm thú cưng thành công",
      data: pet,
    });
  } catch (e) {
    console.error("CREATE PET ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi thêm thú cưng",
    });
  }
};

// UPDATE pet
exports.updatePet = async (req, res) => {
  try {
    const customerId = req.user.id || req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID thú cưng không hợp lệ",
      });
    }

    const pet = await Pet.findById(id);

    if (!pet || !pet.isActive) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thú cưng",
      });
    }

    if (String(pet.customerId) !== String(customerId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật thú cưng này",
      });
    }

    const errors = validatePetInput(req.body, true);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors,
      });
    }

    if (req.body.name !== undefined) pet.name = req.body.name.trim();
    if (req.body.type !== undefined) pet.type = req.body.type;
    if (req.body.breed !== undefined) pet.breed = req.body.breed.trim();
    if (req.body.gender !== undefined) pet.gender = req.body.gender;
    if (req.body.age !== undefined) pet.age = Number(req.body.age);
    if (req.body.weight !== undefined) pet.weight = Number(req.body.weight);
    if (req.body.note !== undefined) pet.note = req.body.note.trim();
    if (req.body.allergies !== undefined)
      pet.allergies = req.body.allergies.trim();
    if (req.body.behaviorNote !== undefined)
      pet.behaviorNote = req.body.behaviorNote.trim();

    await pet.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật thú cưng thành công",
      data: pet,
    });
  } catch (e) {
    console.error("UPDATE PET ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi cập nhật thú cưng",
    });
  }
};

// DELETE pet (soft delete)
exports.deletePet = async (req, res) => {
  try {
    const customerId = req.user.id || req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID thú cưng không hợp lệ",
      });
    }

    const pet = await Pet.findById(id);

    if (!pet || !pet.isActive) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thú cưng",
      });
    }

    if (String(pet.customerId) !== String(customerId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa thú cưng này",
      });
    }

    pet.isActive = false;
    await pet.save();

    return res.status(200).json({
      success: true,
      message: "Xóa thú cưng thành công",
    });
  } catch (e) {
    console.error("DELETE PET ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi xóa thú cưng",
    });
  }
};
