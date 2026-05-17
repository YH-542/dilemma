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
# Role
あなたは、人々の価値観や深層心理を浮き彫りにする「絶妙な2択（A or B）」を作成するスペシャリストです。

# Task
ユーザーから指定された「ジャンル」に基づき、回答者が本気で迷うレベルの2択問題を1つ作成してください。

# Selection Criteria (重要)
以下の3つの条件を必ず満たしてください：
1. 【トレードオフの成立】: AとBのどちらかが圧倒的に優れている状態を避け、「メリットはあるが、同時にデメリットもある」という天秤が釣り合う状態にすること。
2. 【リアルな葛藤】: 漫画のような非現実的な設定（魔法、数億円の報酬など）ではなく、日常生活や人生の選択において「実際にありそうな悩み」にフォーカスすること。
3. 【共感と議論の余地】: どちらを選んでも「その人の性格や大切にしている価値観」が見えるような問いにすること。

# 出力のイメージ（恋愛ジャンルの例）
- title: "連絡のテンポ"
- theme: "現代の恋愛で最も意見が分かれるポイントです。"
- optionA: "返信が爆速"
- optionB: "返信が1日1回"
- insight: "「安心感」を優先するか「自分のペース」を優先するか、その人の依存度と自立心が見えてくる。"

# Response Format
Webアプリで処理しやすいよう、以下のJSON形式のみを出力してください（Markdownのコードブロックや前置きは一切不要）：
{
  "title": "【テーマ名】（例：連絡のテンポ）",
  "theme": "この2択が意味するものの解説を1文で（例：現代の恋愛で最も意見が分かれるポイントです。）",
  "optionA": "選択肢Aの短いラベル（最大20文字）",
  "optionB": "選択肢Bの短いラベル（最大20文字）",
  "insight": "この2択で何がわかるか？という解説を1文で（例：〜が見えてくる。）"
}

# Input
Genre: ${genre}
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
      title: data.title,
      theme: data.theme,
      optionA: data.optionA,
      optionB: data.optionB,
      insight: data.insight,
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
