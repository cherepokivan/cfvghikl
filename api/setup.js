// api/setup.js
// Открой в браузере один раз чтобы зарегистрировать webhook у Telegram
// https://твой-домен.vercel.app/api/setup

const BOT_TOKEN     = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export default async function handler(req, res) {
  try {
    const host        = req.headers.host;
    const webhook_url = `https://${host}/api/webhook`;

    const r = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          url:          webhook_url,
          secret_token: WEBHOOK_SECRET || undefined,
          allowed_updates: ["message"],
        }),
      }
    );
    const data = await r.json();

    return res.status(200).json({
      webhook_url,
      telegram_response: data,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
