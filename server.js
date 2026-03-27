const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

let OpenAI = null;
try {
  OpenAI = require("openai");
} catch (_) {}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const HAS_OPENAI = !!process.env.OPENAI_API_KEY && !!OpenAI;
const openai = HAS_OPENAI
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, { messages: [] });
  }
  return sessions.get(id);
}

function limitHistory(messages, max = 4) {
  return messages.slice(-max);
}

async function getPrice(symbol = "BTCUSDT") {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await res.json();
    return parseFloat(data.price);
  } catch {
    return null;
  }
}

function demoAnswer(msg) {
  const q = msg.toLowerCase();

  if (q.includes("btc")) return "BTC Trend leicht bullish.";
  if (q.includes("eth")) return "ETH aktuell neutral.";
  return "System aktiv. Frage zu BTC, ETH oder Bots.";
}

async function askAI(session, message) {
  if (!HAS_OPENAI) return demoAnswer(message);

  const btc = await getPrice("BTCUSDT");
  const eth = await getPrice("ETHUSDT");

  const messages = [
    {
      role: "system",
      content: `Du bist ein Trading AI.
      BTC Preis: ${btc}
      ETH Preis: ${eth}
      Antworte kurz und präzise.`
    },
    ...limitHistory(session.messages),
    { role: "user", content: message }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages
    });

    return completion.choices[0].message.content;
  } catch {
    return "AI Fehler.";
  }
}

app.post("/api/chat", async (req, res) => {
  const { message, sessionId = "default" } = req.body;

  const session = getSession(sessionId);
  session.messages.push({ role: "user", content: message });

  const reply = await askAI(session, message);

  session.messages.push({ role: "assistant", content: reply });

  res.json({ reply });
});

app.get("/api/price", async (req, res) => {
  const btc = await getPrice("BTCUSDT");
  const eth = await getPrice("ETHUSDT");

  res.json({ btc, eth });
});

app.listen(PORT, () => {
  console.log(`🚀 CryptoBRAIN läuft auf Port ${PORT}`);
});
