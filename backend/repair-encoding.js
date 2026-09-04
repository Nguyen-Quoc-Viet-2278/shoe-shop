const { query } = require("./db");

const columns = [
  ["users", ["full_name"]],
  ["products", ["name", "brand", "category", "info", "details", "colors"]],
  ["orders", ["customer_name", "customer_address"]],
  ["order_items", ["product_name", "color"]],
  ["addresses", ["full_name", "address"]],
  ["notifications", ["message"]],
  ["reviews", ["comment"]],
];

function repair(value) {
  if (typeof value !== "string" || !/(?:Ã|Â|Æ|Ä|Å|Ð|á»|áº|Ä‘)/.test(value)) return value;
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

async function main() {
  let updated = 0;
  for (const [table, fields] of columns) {
    const [rows] = await query(`SELECT id, ${fields.join(", ")} FROM dbo.${table}`);
    for (const row of rows) {
      const values = fields.map((field) => repair(row[field]));
      if (values.some((value, index) => value !== row[fields[index]])) {
        await query(
          `UPDATE dbo.${table} SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`,
          [...values, row.id]
        );
        updated += 1;
      }
    }
  }

  const seededReviews = [
    ["nguyenvana@gmail.com", 1, "Giày rất đẹp, chất liệu tốt, đi êm chân. Sẽ ủng hộ shop lần sau!"],
    ["nguyenvana@gmail.com", 2, "Giày đẹp, đúng size, giao hàng nhanh. Trừ 1 sao vì hộp bị móp nhẹ."],
    ["tranthib@gmail.com", 6, "Vans Old Skool cực kỳ ưng ý, phối đồ gì cũng hợp!"],
    ["tranthib@gmail.com", 8, "Reebok Classic nhẹ, thoáng khí, phù hợp đi gym hằng ngày."],
    ["levanc@gmail.com", 5, "Jordan 1 đỉnh của đỉnh! Fullbox xịn, giao đúng màu đúng size."],
  ];
  for (const [email, productId, comment] of seededReviews) {
    await query(
      `UPDATE reviews SET comment = ?
       WHERE user_id = (SELECT id FROM users WHERE email = ?) AND product_id = ?`,
      [comment, email, productId]
    );
  }
  console.log(`Encoding repair complete. Updated ${updated} rows.`);
}

main().catch((error) => {
  console.error("Encoding repair failed:", error.message);
  process.exit(1);
});
