// api/poll.js
// Телефон дёргает этот endpoint каждую секунду
// Возвращает список новых команд и очищает очередь

import { kv } from "@vercel/kv";

const POLL_SECRET = process.env.POLL_SECRET; // пароль плагина

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  // Простая авторизация плагина
  const auth = req.headers["x-device-secret"];
  if (POLL_SECRET && auth !== POLL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const chat_id = req.query.chat_id;
  if (!chat_id) return res.status(400).json({ error: "chat_id required" });

  try {
    const queue_key = `queue:${chat_id}`;
    const commands  = (await kv.get(queue_key)) || [];

    if (commands.length > 0) {
      // Очищаем очередь — телефон забрал
      await kv.del(queue_key);
    }

    return res.status(200).json({ ok: true, commands });
  } catch (e) {
    console.error("poll error:", e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
