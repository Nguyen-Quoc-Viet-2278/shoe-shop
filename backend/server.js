const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [...new Set([
  ...(process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:5174").split(","),
  process.env.FRONTEND_URL,
].filter(Boolean).map((origin) => origin.trim().replace(/\/+$/, "")).filter(Boolean))];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/addresses", require("./routes/addresses"));
app.use("/api/newsletter", require("./routes/newsletter"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/wishlist", require("./routes/wishlist"));

app.get("/", (req, res) => res.send("Shoe Shop API đang chạy ✓"));

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
