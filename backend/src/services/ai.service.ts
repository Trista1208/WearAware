/**
 * AI Service — GitHub Models (OpenAI-compatible API)
 *
 * Uses native fetch — no extra npm package required.
 * Primary model: gpt-4o-mini (free tier on GitHub Models)
 * Vision model:  gpt-4o       (required for image analysis)
 * Endpoint: https://models.inference.ai.azure.com
 */

const GITHUB_TOKEN    = process.env.GITHUB_TOKEN || '';
const MODEL           = process.env.GITHUB_AI_MODEL || 'gpt-4o-mini';
const VISION_MODEL    = 'gpt-4o'; // gpt-4o supports vision
const AI_ENDPOINT     = 'https://models.inference.ai.azure.com/chat/completions';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Sustainable Fashion Visual Analyzer
// This is the core persona used across all AI functions.
// ─────────────────────────────────────────────────────────────────────────────
export const VISUAL_ANALYZER_SYSTEM_PROMPT = `You are a Sustainable Fashion Visual Analyzer.

Your task is to analyze clothing items visible in images and provide objective observations that support sustainability assessment.

You must only analyze what is visible in the image. Do not guess information that cannot be visually verified.

## Scope

You may receive:

* A photo of a clothing item
* Photos of items stored in the user's wardrobe database

Your role is to identify visual characteristics and wardrobe similarities.

## Instructions

### 1. Garment Identification

Identify:

* Clothing category
* Main colors
* Patterns
* Visible materials or fabric textures (only if reasonably identifiable)
* Style category
* Visible construction details

If uncertain, state uncertainty.

### 2. Durability Indicators

Describe visible signs that may suggest durability or lack of durability, such as:

* Fabric thickness
* Stitching visibility
* Reinforced construction
* Surface wear
* Structural quality

Do not make claims about actual product quality.

### 3. Trend vs Timelessness

Describe whether the item appears:

* Classic
* Contemporary
* Trend-driven

Explain using visible design elements only.

### 4. Wardrobe Similarity Analysis

Compare the uploaded item with garments available in the user's wardrobe database.

Identify:

* Highly similar items
* Moderately similar items
* Distinct items

Focus on:

* Color
* Silhouette
* Function
* Styling purpose

### 5. Reuse Opportunities

If similar items exist, explain how existing wardrobe items could fulfill a similar styling function.

### Important Rules

* Do not generate sustainability scores.
* Do not generate purchase recommendations.
* Do not generate environmental impact estimates.
* Do not recommend brands.
* Do not infer price, brand, social status, age, gender, income, or lifestyle.
* Do not fabricate information.

Only provide observations supported by visual evidence.

## Output Format

Garment Type:
Observed Features:

Durability Indicators:

* ...

Style Assessment:

* ...

Wardrobe Similarity:

* ...

Potential Existing Alternatives:

* ...

Confidence Level:
High / Medium / Low`;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type TextContent  = { type: 'text'; text: string };
type ImageContent = { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } };
type MessageContent = string | (TextContent | ImageContent)[];

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

interface AIResponse {
  content: string;
  model: string;
  tokens_used: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core chat wrapper
// ─────────────────────────────────────────────────────────────────────────────
export async function chat(
  messages: Message[],
  maxTokens = 600,
  useVision = false,
): Promise<AIResponse> {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not set in environment variables');
  }

  const model = useVision ? VISION_MODEL : MODEL;

  const res = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens:  maxTokens,
      temperature: 0.4, // lower temp = more objective/factual analysis
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub AI API error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    choices: { message: { content: string } }[];
    model: string;
    usage: { total_tokens: number };
  };

  return {
    content:     data.choices[0].message.content,
    model:       data.model,
    tokens_used: data.usage?.total_tokens ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual Garment Analysis (image_url or base64)
// ─────────────────────────────────────────────────────────────────────────────
export interface WardrobeItem {
  name: string;
  category: string;
  color?: string;
  material?: string;
}

export interface VisualAnalysisInput {
  image_url:        string;           // https:// URL or data:image/...;base64,...
  wardrobe_items?:  WardrobeItem[];   // user's existing wardrobe for similarity
}

export interface VisualAnalysisResult {
  analysis:   string;   // structured text in the defined output format
  model:      string;
  tokens_used: number;
}

export async function analyzeGarmentImage(input: VisualAnalysisInput): Promise<VisualAnalysisResult> {
  const wardrobeContext = input.wardrobe_items && input.wardrobe_items.length > 0
    ? `\n\nUser's existing wardrobe (for similarity comparison):\n${
        input.wardrobe_items
          .map(i => `- ${i.name} (${i.category}${i.color ? `, ${i.color}` : ''}${i.material ? `, ${i.material}` : ''})`)
          .join('\n')
      }`
    : '\n\nNo existing wardrobe items provided for comparison.';

  const userContent: (TextContent | ImageContent)[] = [
    {
      type: 'image_url',
      image_url: {
        url:    input.image_url,
        detail: 'high',
      },
    },
    {
      type: 'text',
      text: `Please analyze this clothing item following your instructions exactly.${wardrobeContext}`,
    },
  ];

  const { content, model, tokens_used } = await chat(
    [
      { role: 'system', content: VISUAL_ANALYZER_SYSTEM_PROMPT },
      { role: 'user',   content: userContent },
    ],
    800,
    true, // use vision model
  );

  return { analysis: content, model, tokens_used };
}

// ─────────────────────────────────────────────────────────────────────────────
// Text-only garment analysis (when no image is provided)
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeGarmentText(
  description: string,
  wardrobeItems?: WardrobeItem[],
): Promise<string> {
  const wardrobeContext = wardrobeItems && wardrobeItems.length > 0
    ? `\n\nUser's existing wardrobe:\n${wardrobeItems.map(i => `- ${i.name} (${i.category}${i.color ? `, ${i.color}` : ''})`).join('\n')}`
    : '';

  const { content } = await chat([
    { role: 'system', content: VISUAL_ANALYZER_SYSTEM_PROMPT },
    {
      role:    'user',
      content: `Analyze this clothing item based on the description provided. Note that no image is available — provide analysis based only on what the description states, and mark Confidence Level as Low for visual attributes.\n\nItem description: ${description}${wardrobeContext}`,
    },
  ], 700);

  return content;
}

// ─────────────────────────────────────────────────────────────────────────────
// Purchase Advice (separate from visual analysis — uses its own focused prompt)
// ─────────────────────────────────────────────────────────────────────────────
export interface PurchaseAdviceInput {
  item_description?: string;
  brand?:            string;
  material?:         string;
  is_second_hand:    boolean;
  is_local_brand:    boolean;
  rule_verdict:      string;
  rule_reasons:      string[];
  score_delta:       number;
  wardrobe_size:     number;
  similar_items?:    number;
}

export async function getPurchaseAdvice(input: PurchaseAdviceInput): Promise<{
  verdict: string;
  advice:  string;
  emoji:   string;
}> {
  const system = `You are a sustainable fashion advisor for the WearAware app.
You give honest, concise advice (2-4 sentences max) about whether to buy a clothing item.
Be direct and friendly. Focus on sustainability impact and wardrobe utilisation.
Always end with one actionable tip.
Start your response with one emoji that captures your verdict (✅ good, ⚠️ neutral, ❌ not recommended).`;

  const user = `Should I buy this item?

Item: ${input.item_description || 'Not specified'}
Brand: ${input.brand || 'Unknown'}
Material: ${input.material || 'Unknown'}
Second-hand: ${input.is_second_hand ? 'Yes' : 'No'}
Local brand: ${input.is_local_brand ? 'Yes' : 'No'}
My wardrobe size: ${input.wardrobe_size} items
Similar items I already own: ${input.similar_items ?? 0}
Sustainability score impact: ${input.score_delta >= 0 ? '+' : ''}${input.score_delta} points
Assessment: ${input.rule_verdict} — ${input.rule_reasons.join(', ')}`;

  const { content } = await chat([
    { role: 'system', content: system },
    { role: 'user',   content: user },
  ], 300);

  const emojiMatch = content.match(/^(\p{Emoji})/u);
  const emoji  = emojiMatch ? emojiMatch[1] : (input.score_delta >= 0 ? '✅' : '⚠️');
  const advice = content.replace(/^(\p{Emoji}\s*)/u, '').trim();

  return { verdict: input.rule_verdict, advice, emoji };
}

// ─────────────────────────────────────────────────────────────────────────────
// Wardrobe Insights
// ─────────────────────────────────────────────────────────────────────────────
export interface WardrobeSnapshot {
  total_items:          number;
  never_worn:           number;
  avg_wears:            number;
  top_categories:       { category: string; count: number }[];
  fast_fashion_count:   number;
  sustainability_score: number;
  grade:                string;
}

export async function getWardrobeInsights(snapshot: WardrobeSnapshot): Promise<string[]> {
  const system = `You are a sustainable fashion analyst for WearAware.
Generate exactly 3 short, actionable insights about a user's wardrobe.
Each insight must be one sentence. Be specific, encouraging, and data-driven.
Return ONLY a JSON array of 3 strings, nothing else.`;

  const user = `Wardrobe data:
- Total items: ${snapshot.total_items}
- Never worn: ${snapshot.never_worn} (${Math.round(snapshot.never_worn / Math.max(snapshot.total_items, 1) * 100)}%)
- Average wears per item: ${snapshot.avg_wears.toFixed(1)}
- Top categories: ${snapshot.top_categories.map(c => `${c.category} (${c.count})`).join(', ')}
- Fast fashion items: ${snapshot.fast_fashion_count}
- Sustainability score: ${snapshot.sustainability_score}/100 (${snapshot.grade})`;

  const { content } = await chat([
    { role: 'system', content: system },
    { role: 'user',   content: user },
  ], 300);

  try {
    const jsonStr = content.match(/\[[\s\S]*\]/)?.[0] ?? content;
    return JSON.parse(jsonStr) as string[];
  } catch {
    return content
      .split('\n')
      .filter(l => l.trim().length > 10)
      .slice(0, 3)
      .map(l => l.replace(/^[-•*\d.]\s*/, '').trim());
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Style Chat (conversational, uses Visual Analyzer persona)
// ─────────────────────────────────────────────────────────────────────────────
export async function styleChat(
  userMessage: string,
  wardrobeContext: string,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
): Promise<string> {
  // Extend the visual analyzer system prompt with wardrobe context for chat
  const system = `${VISUAL_ANALYZER_SYSTEM_PROMPT}

---
You are also a conversational assistant. When the user asks questions in a chat format, you may answer conversationally while staying within the scope above.
Keep responses concise (3-5 sentences max).

User's wardrobe context: ${wardrobeContext}`;

  const messages: Message[] = [
    { role: 'system', content: system },
    ...history.slice(-6),
    { role: 'user',   content: userMessage },
  ];

  const { content } = await chat(messages, 400);
  return content;
}

// ─────────────────────────────────────────────────────────────────────────────
// Trade Insight
// ─────────────────────────────────────────────────────────────────────────────
export interface TradeInsightInput {
  wanted_item:  { name: string; category: string; brand?: string; tag?: string }
  offered_item: { name: string; category: string; brand?: string; wears?: number; tag?: string }
  user_score:   number
}

export interface TradeInsightResult {
  verdict:       'great' | 'good' | 'neutral' | 'caution'
  headline:      string
  rationale:     string
  sustainability: string
  style_tip:     string
  score_impact:  string
  emoji:         string
}

export async function getTradeInsight(input: TradeInsightInput): Promise<TradeInsightResult> {
  const system = `You are a sustainable fashion trade advisor for WearAware.
When two community members consider swapping clothes, evaluate the trade and give a brief practical assessment.
Be encouraging of circular fashion, honest about sustainability, and mention style compatibility.
Keep your total response under 120 words.
Reply ONLY with a valid JSON object — no markdown, no extra text.`;

  const user = `Evaluate this clothing swap:

WANTED (item the user wants to receive):
- Name: ${input.wanted_item.name}
- Category: ${input.wanted_item.category}
- Brand: ${input.wanted_item.brand || 'Unknown'}
- Sustainability tag: ${input.wanted_item.tag || 'None'}

OFFERED (item the user is giving away):
- Name: ${input.offered_item.name}
- Category: ${input.offered_item.category}
- Brand: ${input.offered_item.brand || 'Unknown'}
- Times worn: ${input.offered_item.wears ?? '?'}
- Sustainability tag: ${input.offered_item.tag || 'None'}

User's sustainability score: ${input.user_score}/100

Reply with this exact JSON shape:
{
  "verdict": "great" | "good" | "neutral" | "caution",
  "headline": "one sentence verdict",
  "rationale": "1-2 sentences why this trade makes sense",
  "sustainability": "one sentence on circular fashion impact",
  "style_tip": "one sentence on how to style the incoming item",
  "score_impact": "+8 pts or No change etc",
  "emoji": "single emoji"
}`;

  const { content } = await chat([
    { role: 'system', content: system },
    { role: 'user',   content: user },
  ], 350);

  try {
    const jsonStr = content.match(/\{[\s\S]*\}/)?.[0] ?? content;
    return JSON.parse(jsonStr) as TradeInsightResult;
  } catch {
    return {
      verdict:        'good',
      headline:       'Solid circular fashion move.',
      rationale:      'Swapping keeps both items in use and out of landfill.',
      sustainability: 'Trading extends garment life and reduces textile waste.',
      style_tip:      'Pair your new piece with what you already own.',
      score_impact:   '+5 pts',
      emoji:          '♻️',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────
export async function testConnection(): Promise<{ ok: boolean; model: string; message: string }> {
  try {
    const { content, model } = await chat([
      { role: 'user', content: 'Reply with exactly: "WearAware AI ready"' },
    ], 20);
    return { ok: true, model, message: content.trim() };
  } catch (err) {
    return { ok: false, model: MODEL, message: (err as Error).message };
  }
}
