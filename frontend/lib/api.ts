/**
 * WearAware API layer — wired to the Express/Supabase backend at localhost:3000.
 * All calls include the JWT token stored in localStorage.
 * Falls back gracefully when the backend is offline.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("wa_token")
}

export function setToken(token: string): void {
  localStorage.setItem("wa_token", token)
}

export function clearToken(): void {
  localStorage.removeItem("wa_token")
  localStorage.removeItem("wa_user")
}

export function setUser(user: { id: string; email?: string }): void {
  localStorage.setItem("wa_user", JSON.stringify(user))
}

export function getUser(): { id: string; email?: string } | null {
  if (typeof window === "undefined") return null
  const u = localStorage.getItem("wa_user")
  return u ? JSON.parse(u) : null
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  fallback: T,
): Promise<T> {
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn(`[WearAware API] ${path} → ${res.status}`, err)
      return fallback
    }
    const data = await res.json()
    return data.data ?? data
  } catch (err) {
    console.warn(`[WearAware API] ${path} offline →`, (err as Error).message)
    return fallback
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(email: string, password: string, username: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || "Registration failed" }
    if (data.data?.session?.access_token) {
      setToken(data.data.session.access_token)
      setUser(data.data.user)
    }
    return { ok: true, data: data.data }
  } catch {
    return { ok: false, error: "Cannot reach server" }
  }
}

export async function login(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || "Login failed" }
    if (data.data?.session?.access_token) {
      setToken(data.data.session.access_token)
      setUser(data.data.user)
    }
    return { ok: true, data: data.data }
  } catch {
    return { ok: false, error: "Cannot reach server" }
  }
}

export function logout(): void {
  clearToken()
}

// ─── Wardrobe ─────────────────────────────────────────────────────────────────

export interface BackendItem {
  id: string
  name: string
  brand: string | null
  category: string
  color: string | null
  material: string | null
  condition: string
  wear_count?: number
  image_urls: string[]
  ai_tags: string[]
  is_active: boolean
  created_at: string
}

export async function fetchWardrobe(category?: string): Promise<BackendItem[]> {
  const q = category ? `?category=${encodeURIComponent(category)}&limit=100` : "?limit=100"
  return apiFetch<BackendItem[]>(`/wardrobe${q}`, {}, [])
}

export async function addWardrobeItem(item: {
  name: string
  brand?: string
  category: string
  color?: string
  material?: string
  condition?: string
  image_urls?: string[]
}): Promise<BackendItem | null> {
  return apiFetch<BackendItem | null>("/wardrobe", {
    method: "POST",
    body: JSON.stringify(item),
  }, null)
}

export async function logWear(itemId: string, occasion?: string): Promise<boolean> {
  const result = await apiFetch<{ id: string } | null>(`/wardrobe/${itemId}/wear`, {
    method: "POST",
    body: JSON.stringify({ occasion }),
  }, null)
  return result !== null
}

// Legacy alias used by daily-tracker-tab
export async function logDailyWear(itemId: string): Promise<{ ok: boolean }> {
  const ok = await logWear(itemId)
  return { ok }
}

// Legacy alias used by wardrobe-tab
export async function fetchCategoryItems(category: string): Promise<BackendItem[]> {
  return fetchWardrobe(category)
}

// Not in backend yet (AI teammate handles this) — kept for compatibility
export async function uploadClothingItem(base64: string): Promise<{ ok: boolean; id?: string }> {
  console.log("[WearAware] uploadClothingItem: AI endpoint not yet live, using mock")
  return { ok: true, id: crypto.randomUUID() }
}

// ─── Sustainability ────────────────────────────────────────────────────────────

export interface SustainabilityScore {
  score: number
  grade: string
  items_analysed: number
  updated_at: string
}

export interface ScoreBreakdown {
  base_score: number
  final_score: number
  grade: string
  total_penalty: number
  total_bonus: number
  items_analysed: number
  summary: string[]
  penalties: {
    wardrobe_size:   { total_items: number; items_over_threshold: number; penalty: number; description: string }
    fast_fashion:    { items_count: number; brands_found: string[]; penalty: number; description: string }
    similar_items:   { penalty: number; description: string }
    low_utilisation: { items_count: number; penalty: number; description: string }
  }
  bonuses: {
    high_wear: { items_count: number; bonus: number; description: string }
  }
}

export async function fetchScore(): Promise<SustainabilityScore | null> {
  return apiFetch<SustainabilityScore | null>("/sustainability/score", {}, null)
}

export async function computeScore(): Promise<{ score: number; grade: string; breakdown: ScoreBreakdown } | null> {
  return apiFetch<{ score: number; grade: string; breakdown: ScoreBreakdown } | null>(
    "/sustainability/compute",
    { method: "POST", body: JSON.stringify({}) },
    null,
  )
}

export async function fetchBreakdown(): Promise<ScoreBreakdown | null> {
  return apiFetch<ScoreBreakdown | null>("/sustainability/breakdown", {}, null)
}

export async function getPurchaseAdvice(opts: {
  item_description?: string
  brand?: string
  material?: string
  is_second_hand?: boolean
  is_local_brand?: boolean
}) {
  return apiFetch<{
    advice_log_id: string
    verdict: string
    reasons: string[]
    estimated_score_delta: number
    fast_fashion_warning: string | null
    tip: string
  } | null>("/sustainability/advice", {
    method: "POST",
    body: JSON.stringify({
      item_description: opts.item_description,
      brand: opts.brand,
      material: opts.material,
      is_second_hand: opts.is_second_hand ?? false,
      is_local_brand: opts.is_local_brand ?? false,
    }),
  }, null)
}

export async function fetchFastFashionBrands(): Promise<string[]> {
  const data = await apiFetch<{ brands: string[] } | null>("/sustainability/fast-fashion-brands", {}, null)
  return data?.brands ?? []
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  score: { score: number; grade: string; updated_at: string } | null
  wardrobe: {
    total_items: number
    never_worn_count: number
    never_worn_pct: number
    category_breakdown: { category: string; count: number }[]
    material_breakdown: { material: string; count: number }[]
    monthly_wear_trend: { month: string; count: number }[]
    total_wardrobe_value: number
    estimated_cost_per_wear: number | null
  }
  score_trend: { event_type: string; delta: number; score_after: number; created_at: string }[]
  insights: { severity: string; message: string; action: string }[]
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  return apiFetch<AnalyticsSummary | null>("/analytics/summary", {}, null)
}

// ─── Matching / RTPW ──────────────────────────────────────────────────────────

export interface RtpwItem {
  id: string
  item_id: string
  preference: string[]
  notes: string | null
  is_matched: boolean
  added_at: string
  clothing_items?: { name: string; category: string; color: string; image_urls: string[] }
}

export interface WantedItem {
  id: string
  description: string
  category: string | null
  preferred_colors: string[]
  preferred_brands: string[]
}

export interface MatchCandidate {
  rtpw_id: string
  item_id: string
  offering_user_id: string
  category: string
  color: string | null
  match_score: number
}

export async function fetchMyRtpw(): Promise<RtpwItem[]> {
  return apiFetch<RtpwItem[]>("/matching/rtpw", {}, [])
}

export async function addToRtpw(itemId: string, preference = ["swap"]): Promise<boolean> {
  const result = await apiFetch<{ id: string } | null>("/matching/rtpw", {
    method: "POST",
    body: JSON.stringify({ item_id: itemId, preference }),
  }, null)
  return result !== null
}

export async function addWantedItem(opts: {
  description: string
  category?: string
  preferred_colors?: string[]
  preferred_brands?: string[]
}): Promise<WantedItem | null> {
  return apiFetch<WantedItem | null>("/matching/wanted", {
    method: "POST",
    body: JSON.stringify(opts),
  }, null)
}

export async function searchMatches(wantedItemId: string): Promise<MatchCandidate[]> {
  return apiFetch<MatchCandidate[]>(`/matching/search/${wantedItemId}`, { method: "POST", body: "{}" }, [])
}

export async function proposeMatch(opts: {
  rtpw_id: string
  receiving_user_id: string
  match_score?: number
}): Promise<{ match_id: string } | null> {
  return apiFetch<{ match_id: string } | null>("/matching/propose", {
    method: "POST",
    body: JSON.stringify(opts),
  }, null)
}

export async function acceptMatch(matchId: string): Promise<boolean> {
  const result = await apiFetch<{ message: string } | null>(`/matching/matches/${matchId}/accept`, {
    method: "POST", body: "{}",
  }, null)
  return result !== null
}

// Legacy alias used by marketplace-tab
export async function executeTrade(itemId: string, matchUserId: string): Promise<{ ok: boolean }> {
  const result = await proposeMatch({ rtpw_id: itemId, receiving_user_id: matchUserId, match_score: 80 })
  return { ok: result !== null }
}

// ─── Partner Stores ───────────────────────────────────────────────────────────

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
  return apiFetch<PartnerStore[]>(`/stores${q}`, {}, [])
}

export async function donateToStore(storeId: string, itemId: string): Promise<boolean> {
  const result = await apiFetch<{ donation: unknown } | null>("/stores/donate", {
    method: "POST",
    body: JSON.stringify({ store_id: storeId, item_id: itemId }),
  }, null)
  return result !== null
}
