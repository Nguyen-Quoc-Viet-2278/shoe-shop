const { execSync } = require("child_process");
const path = require("path");
require("dotenv").config();

const server = (process.env.DB_HOST || "").replace(/\\\\/g, "\\");
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const sqlFile = path.join(__dirname, "database", "schema.sql");

console.log(`Connecting to ${server}...`);

try {
  execSync(
    `sqlcmd -S "${server}" -U ${user} -P ${password} -f 65001 -i "${sqlFile}" -C`,
    { stdio: "inherit" }
  );
  console.log("✅ Database updated successfully.");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
}
