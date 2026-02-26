const { ROLES } = require('../config/role.js');

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa xác thực" });
    }

    const userRole = req.user.role;

    // 👇 Nếu ADMIN (0) thì cho qua ngay
    if (userRole === ROLES.ADMIN) {
      return next();
    }

    let requiredRoles = 0;
    for (const role of allowedRoles) {
      requiredRoles |= role;
    }

    if ((userRole & requiredRoles) !== 0) {
      return next();
    }

    return res.status(403).json({ message: "Bạn không có quyền truy cập" });
  };
}

module.exports = authorizeRoles;
