import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: 開発時は全許可、本番はVERCEL_URLで指定されたオリジンのみ許可
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : true; // true = すべて許可

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Model fallback list: best → fallback → last resort
const MODELS = ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];

// ============================================================
// PROMPT TEMPLATES
// ============================================================

const DILEMMA_PROMPT = (genre) => `
あなたは「究極の2択」で場を盛り上げるプロです。
「${genre}」のジャンルで、友達や合コンで出したら絶対盛り上がる究極の2択を1つ作ってください。

【重要なスタイル指定】
- 選択肢は超シンプルに！「愛 vs お金」「飲む / 飲まない」「男 / 女」のような短いフレーズ
- 長い説明文や形容詞はNG。選択肢は最大15文字以内
- Yes/No形式や二項対立がベスト
- 日本のネット・飲み会文化で定番のノリ感

【良い例】
- optionA: "愛"  optionB: "お金"
- optionA: "飲む"  optionB: "飲まない"（不老不死の薬）
- optionA: "男"  optionB: "女"（生まれ変わるなら）
- optionA: "過去に戻る"  optionB: "未来に行く"
- optionA: "有名人"  optionB: "一般人のまま"

以下のJSON形式のみで返してください（コードブロックや前置き文は付けないこと）:
{
  "optionA": "選択肢A（15文字以内）",
  "optionB": "選択肢B（15文字以内）",
  "tagline": "この問いのシチュエーション説明（30文字以内、例：不老不死の薬があったら？）",
  "explanation": "それぞれを選ぶ人の気持ちや、選ぶのが難しい理由を会話調・カジュアルに100文字程度で"
}
`.trim();

const EXPLAIN_PROMPT = (genre, chosen, other) => `
あなたは「究極の2択」を盛り上げるMCです。
ジャンル「${genre}」で、ユーザーが「${chosen}」を選び、「${other}」を選びませんでした。

この選択について、以下のノリで短くコメントしてください：
- 友達にツッコむような、明るくてテンポのいい口調
- 「それ選ぶ人は〜な性格だよね」という性格診断風
- 選ばなかった側の魅力も少し触れる
- 最後に「あなたはどう？」など会話を広げる一言

80〜120文字程度のプレーンテキストで。マークダウン・箇条書き不要。
`.trim();

// ============================================================
// HELPERS — retry with exponential backoff on 429
// ============================================================

async function generateText(prompt) {
  let lastError;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (modelName !== MODELS[0]) {
        console.log(`✅ Used fallback model: ${modelName}`);
      }
      return text;
    } catch (err) {
      lastError = err;
      const msg = String(err?.message ?? '');
      const is429 = err?.status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate');
      const is503 = err?.status === 503 || msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('high demand');

      if (is429) {
        // Rate limit on this model — wait then try next
        console.warn(`⏳ 429 on ${modelName} — waiting 3s then trying next model...`);
        await new Promise((r) => setTimeout(r, 3000));
      } else if (is503) {
        // Service unavailable — try next model immediately
        console.warn(`⚡ 503 on ${modelName} — trying next model...`);
      } else {
        // Unknown error — throw immediately
        throw err;
      }
    }
  }
  throw lastError;
}

// ============================================================
// API ROUTES
// ============================================================

app.post('/api/dilemma', async (req, res) => {
  const { genre } = req.body;
  if (!genre) {
    return res.status(400).json({ error: 'genre is required' });
  }

  try {
    const raw = await generateText(DILEMMA_PROMPT(genre));

    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const data = JSON.parse(cleaned);

    res.json({
      optionA: data.optionA,
      optionB: data.optionB,
      tagline: data.tagline,
      explanation: data.explanation,
    });
  } catch (err) {
    console.error('Dilemma API error:', err?.status ?? '', err?.message ?? err);
    const is429 = String(err?.message).includes('429') || err?.status === 429;
    res.status(is429 ? 429 : 500).json({
      error: is429
        ? 'レート制限に達しました。少し待ってからお試しください。'
        : 'AI生成に失敗しました。',
      detail: err?.message,
    });
  }
});

app.post('/api/explain', async (req, res) => {
  const { genre, chosen, other } = req.body;
  if (!genre || !chosen || !other) {
    return res.status(400).json({ error: 'genre, chosen, other are required' });
  }

  try {
    const text = await generateText(EXPLAIN_PROMPT(genre, chosen, other));
    res.json({ text: text.trim() });
  } catch (err) {
    console.error('Explain API error:', err?.status ?? '', err?.message ?? err);
    res.status(500).json({ error: 'Explanation generation failed', detail: err?.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', models: MODELS }));

app.listen(PORT, () => {
  console.log(`🚀 Dilemma backend running on http://localhost:${PORT}`);
  console.log(`🤖 Models (priority order): ${MODELS.join(' → ')}`);
});
