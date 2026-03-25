// api/webhook.js
// Telegram шлёт сюда сообщения через webhook
// Мы сохраняем команду в KV, телефон заберёт при следующем poll

import { kv } from "@vercel/kv";

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET    = process.env.WEBHOOK_SECRET; // защита от чужих запросов

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Проверяем секрет в заголовке (Telegram поддерживает X-Telegram-Bot-Api-Secret-Token)
  if (SECRET && req.headers["x-telegram-bot-api-secret-token"] !== SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const update = req.body;
    const msg    = update?.message;
    if (!msg) return res.status(200).json({ ok: true });

    const chat_id = String(msg.chat.id);
    const text    = (msg.text || "").trim();
    const msg_id  = msg.message_id;

    // Кладём команду в очередь для этого устройства
    // Ключ: queue:{chat_id}, значение: массив команд
    const queue_key = `queue:${chat_id}`;
    const existing  = (await kv.get(queue_key)) || [];
    existing.push({ text, msg_id, ts: Date.now() });
    // TTL 60 сек — если телефон не забрал, команда устарела
    await kv.set(queue_key, existing, { ex: 60 });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("webhook error:", e);
    return res.status(200).json({ ok: true }); // всегда 200 для Telegram
  }
}
