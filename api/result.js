// api/result.js
// Телефон присылает результат выполнения команды
// Vercel пересылает его в Telegram

const BOT_TOKEN   = process.env.BOT_TOKEN;
const POLL_SECRET = process.env.POLL_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const auth = req.headers["x-device-secret"];
  if (POLL_SECRET && auth !== POLL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const { chat_id, text, photo_base64, filename, file_base64 } = req.body;

    if (!chat_id) return res.status(400).json({ error: "chat_id required" });

    const tg = `https://api.telegram.org/bot${BOT_TOKEN}`;

    if (photo_base64) {
      // Отправка фото
      const buf      = Buffer.from(photo_base64, "base64");
      const boundary = "----HelperBoundary";
      const body     = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chat_id}\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="screen.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
        buf,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);
      await fetch(`${tg}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
        body,
      });
    } else if (file_base64 && filename) {
      // Отправка файла
      const buf      = Buffer.from(file_base64, "base64");
      const boundary = "----HelperBoundary";
      const body     = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chat_id}\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`),
        buf,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);
      await fetch(`${tg}/sendDocument`, {
        method: "POST",
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
        body,
      });
    } else if (text) {
      // Отправка текста
      await fetch(`${tg}/sendMessage`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chat_id, text, parse_mode: "HTML" }),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("result error:", e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
