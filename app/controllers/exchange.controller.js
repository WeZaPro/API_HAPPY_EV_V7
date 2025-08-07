const pool = require("../config/config.booking");

function toMySQLDateTime(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

exports.saveExchange = async (req, res) => {
  const { base, target, rate, timestamp } = req.body;

  if (base == null || target == null || rate == null) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
  }

  const createdAt =
    toMySQLDateTime(timestamp) ||
    new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    const conn = await pool.getConnection();

    const sql = `
      INSERT INTO exchange (base, target, rate, created_at)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rate = VALUES(rate),
        created_at = VALUES(created_at)
    `;

    await conn.execute(sql, [base, target, rate, createdAt]);
    conn.release();

    res.json({ message: "✅ บันทึกค่าเงินเรียบร้อย (insert หรือ update)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExchange = async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // สามารถใช้ query string filter ได้ เช่น ?base=USD&target=THB
    const { base, target } = req.query;

    let sql = "SELECT * FROM exchange";
    const params = [];

    if (base && target) {
      sql += " WHERE base = ? AND target = ?";
      params.push(base, target);
    } else if (base) {
      sql += " WHERE base = ?";
      params.push(base);
    } else if (target) {
      sql += " WHERE target = ?";
      params.push(target);
    }

    const [rows] = await conn.execute(sql, params);
    conn.release();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
