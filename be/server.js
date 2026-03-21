const dotenv = require("dotenv");
const path = require("path");
const http = require("http");

dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoute");
const blogRoute = require("./routes/blogRoute");
const categoryRoute = require("./routes/categoryRoute");
const productRoute = require("./routes/productRoute");
const wishlistRoute = require("./routes/wishlistRoute");
const reviewRoute = require("./routes/reviewRoute");
const bannerRoute = require("./routes/bannerRoute");
const attributeRoute = require("./routes/attributeRoute");
const voucherRoute = require("./routes/voucherRoute");
const subscriberRoutes = require("./routes/subscriberRoute");
const notificationRoute = require("./routes/notificationRoute");
const spaServiceRoute = require("./routes/spaServiceRoute");
const spaBookingRoute = require("./routes/spaBookingRoute");
const petRoute = require("./routes/petRoute");
const staffSpaBookingRoute = require("./routes/staffSpaBookingRoute");
const adminStaffScheduleRoute = require("./routes/adminStaffScheduleRoute");
const adminUserRoute = require("./routes/adminUserRoute");
const staffScheduleRoute = require("./routes/staffScheduleRoute");
const adminSpaServiceRoute = require("./routes/adminSpaServiceRoute");
const searchRoute = require("./routes/searchRoute");
const adminSpaBookingRoute = require("./routes/adminSpaBookingRoute");
const adminOrderRoute = require("./routes/adminOrderRoute");

const { setupSocket, getIO } = require("./config/socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const server = http.createServer(app);

// Khởi tạo socket.io đúng trên server HTTP
setupSocket(server);

// Middleware để dùng io trong req nếu cần
app.use((req, res, next) => {
  req.io = getIO();
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/products", productRoute);
app.use("/api/wishlist", wishlistRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/banners", bannerRoute);
app.use("/api/attributes", attributeRoute);
app.use("/uploads", express.static("uploads"));
app.use("/api/vouchers", voucherRoute);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/notifications", notificationRoute);
app.use("/api/spa-services", spaServiceRoute);
app.use("/api/spa-bookings", spaBookingRoute);
app.use("/api/pets", petRoute);
app.use("/api/staff/spa-bookings", staffSpaBookingRoute);
app.use("/api/admin/staff-schedules", adminStaffScheduleRoute);
app.use("/api/admin/users", adminUserRoute);
app.use("/api/staff/schedules", staffScheduleRoute);
app.use("/api/admin/spa-services", adminSpaServiceRoute);
app.use("/api/search", searchRoute);
app.use("/api/admin/spa-bookings", adminSpaBookingRoute);
app.use("/api/admin/orders", adminOrderRoute);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

// Phải dùng server.listen thay vì app.listen để socket hoạt động realtime
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
