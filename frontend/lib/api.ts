/**
 * WearAware API layer — connects to the Express backend at port 3000.
 *
 * Auth tokens are stored in localStorage and sent as Bearer headers.
 * Every call fails gracefully with a mock fallback when the server is offline.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

// ── Token / user helpers ──────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("wa_token")
}
export function setToken(token: string) {
  localStorage.setItem("wa_token", token)
}
export function clearToken() {
  localStorage.removeItem("wa_token")
  localStorage.removeItem("wa_user")
}
export function setUser(user: object) {
  localStorage.setItem("wa_user", JSON.stringify(user))
}
export function getUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("wa_user")
  return raw ? JSON.parse(raw) : null
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}, fallback: T): Promise<T> {
  const token = getToken()
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
    // 401 = session expired — clear stale token so the user gets prompted to re-login
    if (res.status === 401) {
      clearToken()
      throw new Error("SESSION_EXPIRED")
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const data = await res.json()
    return data.data ?? data
  } catch (err) {
    const msg = (err as Error).message
    if (msg === "SESSION_EXPIRED") {
      console.warn(`[api] ${path}: session expired, token cleared`)
      throw err // re-throw so callers can handle it (e.g. show login modal)
    }
    console.warn(`[api] ${path} fell back to mock:`, msg)
    return fallback
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (data.success) {
    setToken(data.data.session.access_token)
    setUser(data.data.user)
  }
  return data
}

export async function apiRegister(email: string, password: string, username: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username }),
  })
  return res.json()
}

export function apiLogout() {
  clearToken()
}

// ── Wardrobe ──────────────────────────────────────────────────────────────────
export interface WardrobeItem {
  id: string
  name: string
  brand?: string
  category: string
  color?: string
  material?: string
  condition?: string
  purchase_year?: number
  purchase_price?: number
  wear_count?: number
  image_urls?: string[]
  is_active?: boolean
  created_at?: string
}

export async function fetchWardrobe(params?: { category?: string; limit?: number }): Promise<WardrobeItem[]> {
  const q = new URLSearchParams()
  if (params?.category) q.set("category", params.category)
  if (params?.limit) q.set("limit", String(params.limit))
  const result = await apiFetch<{ items?: WardrobeItem[] } | WardrobeItem[]>(`/wardrobe?${q}`, {}, [])
  return Array.isArray(result) ? result : (result.items ?? [])
}

export async function addWardrobeItem(item: Partial<WardrobeItem>): Promise<WardrobeItem | null> {
  return apiFetch("/wardrobe", { method: "POST", body: JSON.stringify(item) }, null)
}

export async function updateWardrobeItem(id: string, updates: Partial<WardrobeItem>): Promise<WardrobeItem | null> {
  return apiFetch(`/wardrobe/${id}`, { method: "PATCH", body: JSON.stringify(updates) }, null)
}

export async function deleteWardrobeItem(id: string): Promise<void> {
  return apiFetch(`/wardrobe/${id}`, { method: "DELETE" }, undefined)
}

export async function logWear(itemId: string, worn_on?: string, occasion?: string) {
  return apiFetch(`/wardrobe/${itemId}/wear`, {
    method: "POST",
    body: JSON.stringify({ worn_on: worn_on ?? new Date().toISOString().split("T")[0], occasion }),
  }, { ok: true })
}

// ── Sustainability Score ──────────────────────────────────────────────────────
export interface SustainabilityScore {
  score: number
  grade: string
  updated_at?: string
  breakdown?: Record<string, unknown>
}

export async function fetchScore(): Promise<SustainabilityScore> {
  return apiFetch("/sustainability/score", {}, { score: 50, grade: "C" })
}

export async function computeScore(): Promise<SustainabilityScore> {
  return apiFetch("/sustainability/compute", { method: "POST" }, { score: 50, grade: "C" })
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function fetchAnalyticsSummary() {
  return apiFetch("/analytics/summary", {}, {
    wardrobe: { total_items: 0, never_worn: 0, total_value: 0, monthly_wear_trend: [], category_breakdown: [] },
    insights: [],
  })
}

// ── Matching / Marketplace ────────────────────────────────────────────────────
export async function fetchMyRtpw() {
  return apiFetch("/matching/rtpw", {}, [])
}

export async function addToRtpw(item_id: string, preference?: string, notes?: string) {
  return apiFetch("/matching/rtpw", { method: "POST", body: JSON.stringify({ item_id, preference, notes }) }, null)
}

export async function addWantedItem(payload: { category: string; description?: string; preferred_colors?: string[] }) {
  return apiFetch("/matching/wanted", { method: "POST", body: JSON.stringify(payload) }, null)
}

export async function searchMatches(wanted_id: string) {
  return apiFetch(`/matching/search/${wanted_id}`, { method: "POST" }, [])
}

export async function proposeMatch(rtpw_item_id: string, wanted_item_id: string) {
  return apiFetch("/matching/propose", {
    method: "POST",
    body: JSON.stringify({ rtpw_item_id, wanted_item_id }),
  }, null)
}

// ── Partner Stores ────────────────────────────────────────────────────────────
export interface PartnerStore {
  id: string
  name: string
  description: string | null
  city: string
  country: string
  commission_pct: number
  contact_email: string | null
  website_url: string | null
}

export async function fetchStores(city?: string): Promise<PartnerStore[]> {
  const q = city ? `?city=${encodeURIComponent(city)}` : ""
  return apiFetch(`/stores${q}`, {}, [])
}

// ── AI ────────────────────────────────────────────────────────────────────────
export interface AIAnalysis {
  analysis:                string
  model:                   string
  tokens_used:             number
  wardrobe_items_compared: number
}

export interface AIPurchaseAdvice {
  verdict:                string
  emoji:                  string
  advice:                 string
  reasons:                string[]
  estimated_score_delta:  number
  fast_fashion_warning:   string | null
}

export interface AIInsights {
  insights: string[]
}

/** Visual Analyzer — pass image_url (https or base64) or a text description */
export async function apiAnalyzeGarment(payload: {
  image_url?:        string
  description?:      string
  include_wardrobe?: boolean
}): Promise<AIAnalysis> {
  return apiFetch("/ai/analyze", { method: "POST", body: JSON.stringify(payload) }, {
    analysis:                "AI analysis unavailable — backend offline.",
    model:                   "offline",
    tokens_used:             0,
    wardrobe_items_compared: 0,
  })
}

/** AI-powered purchase advice via the sustainability endpoint */
export async function apiGetPurchaseAdvice(payload: {
  item_description?: string
  brand?:            string
  material?:         string
  is_second_hand:    boolean
  is_local_brand:    boolean
}): Promise<AIPurchaseAdvice> {
  return apiFetch("/sustainability/advice", {
    method: "POST",
    body: JSON.stringify(payload),
  }, {
    verdict:               "unknown",
    emoji:                 "🤔",
    advice:                "Could not reach the AI advisor. Please try again.",
    reasons:               [],
    estimated_score_delta: 0,
    fast_fashion_warning:  null,
  })
}

/** 3 AI wardrobe insights based on the user's stats */
export async function apiWardrobeInsights(): Promise<string[]> {
  const result = await apiFetch<AIInsights>("/ai/wardrobe-insights", {}, {
    insights: ["Add more items to unlock AI insights."],
  })
  return result.insights ?? []
}

export interface TradeInsightResult {
  verdict:        'great' | 'good' | 'neutral' | 'caution'
  headline:       string
  rationale:      string
  sustainability: string
  style_tip:      string
  score_impact:   string
  emoji:          string
}

/** AI trade verdict — call after a match is found */
export async function apiTradeInsight(payload: {
  wanted_item:  { name: string; category: string; brand?: string; tag?: string }
  offered_item: { name: string; category: string; brand?: string; wears?: number; tag?: string }
}): Promise<TradeInsightResult> {
  return apiFetch("/ai/trade-insight", { method: "POST", body: JSON.stringify(payload) }, {
    verdict:        "good",
    headline:       "Solid circular fashion move.",
    rationale:      "Swapping keeps both items in active use.",
    sustainability: "Trading extends garment life and reduces waste.",
    style_tip:      "Pair your new piece with what you already own.",
    score_impact:   "+5 pts",
    emoji:          "♻️",
  })
}

/** Conversational style chat using the Visual Analyzer persona */
export async function apiStyleChat(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<string> {
  const result = await apiFetch<{ reply: string }>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  }, { reply: "AI advisor is currently offline. Please try again shortly." })
  return result.reply ?? ""
}

// ── Legacy stubs (backward compat with existing Shaurya UI components) ────────
export async function uploadClothingItem(base64: string): Promise<{ ok: boolean; id?: string }> {
  return apiFetch("/wardrobe/upload", {
    method: "POST",
    body: JSON.stringify({ image: base64 }),
  }, { ok: true, id: crypto.randomUUID() })
}

export async function fetchCategoryItems(category: string): Promise<unknown[]> {
  return fetchWardrobe({ category })
}

export async function logDailyWear(itemId: string): Promise<{ ok: boolean }> {
  await logWear(itemId)
  return { ok: true }
}

export async function executeTrade(itemId: string, matchUserId: string): Promise<{ ok: boolean }> {
  return apiFetch("/matching/propose", {
    method: "POST",
    body: JSON.stringify({ rtpw_item_id: itemId, wanted_item_id: matchUserId }),
  }, { ok: true })
}
