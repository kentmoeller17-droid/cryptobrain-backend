import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;

const botsStore = new Map();
const messagesStore = new Map();

function getUserId(req) {
  return req.header("x-user-id") || "guest@local";
}

function getBotKey(userId, botId) {
  return `${userId}::${botId}`;
}

function getSessionKey(userId, botId) {
  return `${userId}::${botId}`;
}

function ensureSeedBots(userId) {
  const existing = Array.from(botsStore.values()).filter((bot) => bot.user_id === userId);
  if (existing.length > 0) return existing;

  const seeded = [
    {
      id: "doge-core-rotation",
      user_id: userId,
      name: "DOGE Core Rotation",
      status: "Live Sim",
      pair: "DOGE/USDT",
      timeframe: "15m",
      config: {
        coreRatio: 0.67,
        blockASellRsi: 70,
        blockABuybackPct: 2,
        blockBSellRsi: 78,
        blockBBuybackPct: 4,
        blockBMode: "defensiv",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "doge-block-ab",
      user_id: userId,
      name: "DOGE Block A/B",
      status: "Replay+AI",
      pair: "DOGE/USDT",
      timeframe: "15m",
      config: {
        coreRatio: 0.67,
        blockASellRsi: 68,
        blockABuybackPct: 1.8,
        blockBSellRsi: 80,
        blockBBuybackPct: 4.6,
        blockBMode: "aggressiv",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const bot of seeded) {
    botsStore.set(getBotKey(userId, bot.id), bot);
  }

  return seeded;
}

function getUserBots(userId) {
  ensureSeedBots(userId);
  return Array.from(botsStore.values()).filter((bot) => bot.user_id === userId);
}

app.get("/", (_req, res) => {
  res.send("CryptoB.R.A.I.N backend läuft 🚀");
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "cryptobrain-backend",
    time: new Date().toISOString(),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
  });
});

app.get("/api/bots", (req, res) => {
  const userId = getUserId(req);
  const bots = getUserBots(userId);
  res.json({ bots });
});

app.post("/api/bots", (req, res) => {
  const userId = getUserId(req);
  const body = req.body || {};

  if (!body.name || !body.pair || !body.timeframe) {
    return res.status(400).json({
      error: "name, pair und timeframe sind erforderlich",
    });
  }

  const bot = {
    id: body.id || `bot-${Date.now()}`,
    user_id: userId,
    name: String(body.name),
    pair: String(body.pair),
    timeframe: String(body.timeframe),
    status: String(body.status || "Draft"),
    config: typeof body.config === "object" && body.config ? body.config : {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  botsStore.set(getBotKey(userId, bot.id), bot);

  res.status(201).json({ bot });
});

app.patch("/api/bots/:id", (req, res) => {
  const userId = getUserId(req);
  const botId = req.params.id;
  const key = getBotKey(userId, botId);

  if (!botsStore.has(key)) {
    return res.status(404).json({ error: "Bot nicht gefunden" });
  }

  const existing = botsStore.get(key);
  const body = req.body || {};

  const updated = {
    ...existing,
    ...body,
    id: existing.id,
    user_id: existing.user_id,
    updated_at: new Date().toISOString(),
    config:
      typeof body.config === "object" && body.config
        ? { ...existing.config, ...body.config }
        : existing.config,
  };

  botsStore.set(key, updated);

  res.json({ bot: updated });
});

app.get("/api/sessions/:botId", (req, res) => {
  const userId = getUserId(req);
  const botId = req.params.botId;
  const key = getSessionKey(userId, botId);
  const messages = messagesStore.get(key) || [];
  res.json({ messages });
});

app.post("/api/sessions/:botId/messages", (req, res) => {
  const userId = getUserId(req);
  const botId = req.params.botId;
  const body = req.body || {};

  if (!body.role || !body.text) {
    return res.status(400).json({ error: "role und text sind erforderlich" });
  }

  const key = getSessionKey(userId, botId);
  const existing = messagesStore.get(key) || [];

  const message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    bot_id: botId,
    role: String(body.role),
    text: String(body.text),
    runtime_provider: body.runtime_provider || "unknown",
    created_at: new Date().toISOString(),
  };

  existing.push(message);
  messagesStore.set(key, existing);

  res.status(201).json({ message });
});

app.post("/api/brain/groq", async (req, res) => {
  try {
    console.log("HAS_GROQ_KEY", Boolean(process.env.GROQ_API_KEY));
    console.log("BODY_PREVIEW", JSON.stringify(req.body)?.slice(0, 800));

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY fehlt" });
    }

    const upstreamBody = {
      model: req.body?.model || "llama-3.3-70b-versatile",
      messages: Array.isArray(req.body?.messages) ? req.body.messages : [],
      temperature: typeof req.body?.temperature === "number" ? req.body.temperature : 0.15,
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify(upstreamBody),
    });

    const rawText = await response.text();

    console.log("GROQ_STATUS", response.status);
    console.log("GROQ_RAW", rawText.slice(0, 2000));

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("GROQ_PROXY_ERROR", error);
    return res.status(500).json({
      error: error?.message || "Groq Proxy failed",
    });
  }
});

app.post("/api/brain/ollama", async (req, res) => {
  try {
    const ollamaUrl =
      process.env.OLLAMA_URL || "http://127.0.0.1:11434/v1/chat/completions";

    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (process.env.OLLAMA_API_KEY || "ollama"),
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Ollama Proxy failed",
    });
  }
});

app.post("/api/brain/vllm", async (req, res) => {
  try {
    const vllmUrl =
      process.env.VLLM_URL || "http://127.0.0.1:8000/v1/chat/completions";

    const response = await fetch(vllmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (process.env.VLLM_API_KEY || "local"),
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "vLLM Proxy failed",
    });
  }
});

app.post("/api/brain/llamacpp", async (req, res) => {
  try {
    const llamacppUrl =
      process.env.LLAMACPP_URL || "http://127.0.0.1:8080/v1/chat/completions";

    const response = await fetch(llamacppUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (process.env.LLAMACPP_API_KEY || "local"),
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "llama.cpp Proxy failed",
    });
  }
});

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
