/**
 * WearAware API layer.
 *
 * These functions map 1:1 to the local Express backend endpoints. The UI is
 * fully driven by React `useState`, so each call is wrapped in try/catch and
 * fails gracefully (returning a mocked result) when the backend is offline.
 * Swap the mock fallbacks for real responses once the server is running.
 */

const API_BASE = "http://localhost:3000/api/wardrobe"

/**
 * uploadClothingItem(base64)
 * POST http://localhost:3000/api/wardrobe/upload
 * Used by both the standard "Upload File" flow and the in-store camera capture.
 */
export async function uploadClothingItem(base64: string): Promise<{ ok: boolean; id?: string }> {
  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.log("[v0] uploadClothingItem fell back to mock:", (err as Error).message)
    return { ok: true, id: crypto.randomUUID() }
  }
}

/**
 * fetchCategoryItems(category)
 * GET http://localhost:3000/api/wardrobe/items?category={category}
 * Populates the 3D carousel for the selected category.
 */
export async function fetchCategoryItems(category: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_BASE}/items?category=${encodeURIComponent(category)}`)
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.log("[v0] fetchCategoryItems fell back to local state:", (err as Error).message)
    return []
  }
}

/**
 * logDailyWear(itemId)
 * POST http://localhost:3000/api/wardrobe/track
 * Increments the wear counter for an item.
 */
export async function logDailyWear(itemId: string): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    })
    if (!res.ok) throw new Error(`Track failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.log("[v0] logDailyWear fell back to mock:", (err as Error).message)
    return { ok: true }
  }
}

/**
 * executeTrade(itemId, matchUserId)
 * POST http://localhost:3000/api/wardrobe/trade
 * Triggered when the avatar TRADE button is clicked.
 */
export async function executeTrade(itemId: string, matchUserId: string): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, matchUserId }),
    })
    if (!res.ok) throw new Error(`Trade failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.log("[v0] executeTrade fell back to mock:", (err as Error).message)
    return { ok: true }
  }
}
