const sql = require("mssql");
require("dotenv").config();

const config = {
  server: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

const poolPromise = sql.connect(config)
  .then((pool) => { console.log("✅ Kết nối SQL Server thành công"); return pool; })
  .catch((err) => {
    console.error("❌ Kết nối thất bại:", err.message);
    return null;
  });

// Wrapper: dùng ? như mysql2, trả về [rows, result]
async function query(text, params = []) {
  const pool = await poolPromise;
  if (!pool) throw new Error("Database chưa kết nối");
  const request = pool.request();
  let i = 0;
  const sqlText = text.replace(/\?/g, () => { const name = `p${i}`; i++; return `@${name}`; });
  params.forEach((val, idx) => request.input(`p${idx}`, val));
  const result = await request.query(sqlText);
  return [result.recordset ?? [], result];
}

// Wrapper transaction: callback nhận hàm queryTx(sql, params)
async function transaction(callback) {
  const pool = await poolPromise;
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const queryTx = async (text, params = []) => {
      const req = new sql.Request(tx);
      let i = 0;
      const sqlText = text.replace(/\?/g, () => { const name = `p${i}`; i++; return `@${name}`; });
      params.forEach((val, idx) => req.input(`p${idx}`, val));
      const result = await req.query(sqlText);
      return [result.recordset ?? [], result];
    };
    const result = await callback(queryTx);
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

module.exports = { query, transaction };
