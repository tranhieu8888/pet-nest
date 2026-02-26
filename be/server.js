const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoute");
const blogRoute = require("./routes/blogRoute");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoute);

// Dummy routes to prevent 404s from frontend Header component
app.get("/api/categories/childCategories", (req, res) => res.json([]));
app.get("/api/categories/parent", (req, res) => res.json({ data: [] }));
app.get("/api/categories/popular", (req, res) => res.json([]));
app.get("/api/cart/getcart", (req, res) => res.json({ success: true, data: { cartItems: [] } }));
app.get("/api/notification", (req, res) => res.json([]));
app.get("/conversation/:id", (req, res) => res.json([]));
app.get("/api/banners", (req, res) => res.json([]));
app.get("/api/products/best-selling", (req, res) => res.json([]));

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
