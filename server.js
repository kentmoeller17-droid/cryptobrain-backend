const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

let OpenAI = null;
try {
  OpenAI = require("openai");
} catch (_) {
  OpenAI = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

const HAS_OPENAI = !!process.env.OPENAI_API_KEY && !!OpenAI;
const openai = HAS_OPENAI
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const sessions = new Map();

const bots = [
  { id: "bot-1", name: "BTC Momentum", symbol: "BTC/USDT", strategy: "Momentum", riskLevel: "Medium", active: true },
  { id: "bot-2", name: "ETH Swing", symbol: "ETH/USDT", strategy: "Swing", riskLevel: "Low", active: true },
  { id: "bot-3", name: "SOL Fast", symbol: "SOL/USDT", strategy: "Scalp", riskLevel: "High", active: false }
];

const trades = [
  { id: "t1", botId: "bot-1", pnl: 48.2 },
  { id: "t2", botId: "bot-2", pnl: -12.7 },
  { id: "t3", botId: "bot-1", pnl: 19.4 },
  { id: "t4", botId: "bot-3", pnl: 31.6 }
];

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, { messages: [] });
  }
  return sessions.get(id);
}

function limitHistory(messages, max = 6) {
  return messages.slice(-max);
}

function computeStats() {
  const total = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter(t => t.pnl > 0).length;
  return {
    pnl: total.toFixed(2),
    winrate: ((wins / trades.length) * 100).toFixed(1)
  };
}

function demoAnswer(msg) {
  const q = msg.toLowerCase();

  if (q.includes("btc")) return "BTC aktuell leicht bullish. Trend beobachten.";
  if (q.includes("eth")) return "ETH neutral. Kein klares Signal.";
  if (q.includes("bot")) return "BTC Momentum ist aktuell der beste Bot.";
  if (q.includes("pnl")) {
    const s = computeStats();
    return `PnL: ${s.pnl} USDT | Winrate: ${s.winrate}%`;
  }

  return "CryptoB.R.A.I.N aktiv. Frag nach Bots, BTC, ETH oder Performance.";
}

async function askAI(session, message) {
  if (!HAS_OPENAI) return demoAnswer(message);

  const messages = [
    { role: "system", content: "Du bist ein Trading AI Assistant. Kurz, präzise." },
    ...limitHistory(session.messages),
    { role: "user", content: message }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages
    });

    return completion.choices[0].message.content;
  } catch (e) {
    return "AI Fehler → fallback aktiv.";
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

app.get("/api/stats", (req, res) => {
  res.json(computeStats());
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
