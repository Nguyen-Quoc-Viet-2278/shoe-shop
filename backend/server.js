const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
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
