const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoute");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Dummy routes to prevent 404s from frontend Header component
app.get("/api/categories/childCategories", (req, res) => res.json([]));
app.get("/api/categories/parent", (req, res) => res.json({ data: [] }));
app.get("/api/categories/popular", (req, res) => res.json([]));
app.get("/api/cart/getcart", (req, res) => res.json({ success: true, data: { cartItems: [] } }));
app.get("/api/notification", (req, res) => res.json([]));
app.get("/conversation/:id", (req, res) => res.json([]));

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
