import { supabaseAdmin } from '../config/supabase';

/**
 * Aggregated wardrobe statistics for a user.
 */
export async function getWardrobeStats(userId: string) {
  // 1. Category breakdown
  const { data: categories } = await supabaseAdmin
    .from('clothing_items')
    .select('category')
    .eq('owner_id', userId)
    .eq('is_active', true);

  const categoryCount: Record<string, number> = {};
  (categories || []).forEach((r: { category: string }) => {
    categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
  });

  // 2. Material breakdown
  const { data: materials } = await supabaseAdmin
    .from('clothing_items')
    .select('material')
    .eq('owner_id', userId)
    .eq('is_active', true)
    .not('material', 'is', null);

  const materialCount: Record<string, number> = {};
  (materials || []).forEach((r: { material: string | null }) => {
    if (r.material) materialCount[r.material] = (materialCount[r.material] || 0) + 1;
  });

  // 3. Items never worn
  const { data: allItems } = await supabaseAdmin
    .from('clothing_items')
    .select('id')
    .eq('owner_id', userId)
    .eq('is_active', true);

  const allItemIds = (allItems || []).map((i: { id: string }) => i.id);

  const { data: wornItemIds } = await supabaseAdmin
    .from('wear_logs')
    .select('item_id')
    .eq('user_id', userId)
    .in('item_id', allItemIds.length > 0 ? allItemIds : ['00000000-0000-0000-0000-000000000000']);

  const wornSet = new Set((wornItemIds || []).map((w: { item_id: string }) => w.item_id));
  const neverWornCount = allItemIds.filter((id) => !wornSet.has(id)).length;

  // 4. Wear frequency over last 12 months (monthly wear count)
  const { data: wearTrend } = await supabaseAdmin
    .from('wear_logs')
    .select('worn_on')
    .eq('user_id', userId)
    .gte('worn_on', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const monthlyWears: Record<string, number> = {};
  (wearTrend || []).forEach((w: { worn_on: string }) => {
    const month = w.worn_on.slice(0, 7); // YYYY-MM
    monthlyWears[month] = (monthlyWears[month] || 0) + 1;
  });

  // 5. Cost per wear estimate
  const { data: itemsWithPrice } = await supabaseAdmin
    .from('clothing_items')
    .select('id, purchase_price')
    .eq('owner_id', userId)
    .eq('is_active', true)
    .not('purchase_price', 'is', null);

  const totalValue = (itemsWithPrice || []).reduce(
    (sum: number, i: { purchase_price: number }) => sum + (i.purchase_price || 0), 0,
  );
  const totalWears  = Object.values(monthlyWears).reduce((a, b) => a + b, 0);
  const costPerWear = totalWears > 0 ? totalValue / totalWears : null;

  return {
    total_items:      allItemIds.length,
    never_worn_count: neverWornCount,
    never_worn_pct:   allItemIds.length > 0 ? Math.round((neverWornCount / allItemIds.length) * 100) : 0,
    category_breakdown: Object.entries(categoryCount).map(([k, v]) => ({ category: k, count: v })),
    material_breakdown: Object.entries(materialCount).map(([k, v]) => ({ material: k, count: v })),
    monthly_wear_trend: Object.entries(monthlyWears)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
    total_wardrobe_value:   totalValue,
    estimated_cost_per_wear: costPerWear,
  };
}

/**
 * Sustainability score trend for a user over time.
 */
export async function getScoreTrend(userId: string, days = 90) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('sustainability_events')
    .select('event_type, delta, score_after, created_at')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Key sustainability insights with actionable recommendations.
 */
export async function getSustainabilityInsights(userId: string) {
  const stats = await getWardrobeStats(userId);
  const insights: Array<{ severity: 'high' | 'medium' | 'low'; message: string; action: string }> = [];

  if (stats.never_worn_pct > 40) {
    insights.push({
      severity: 'high',
      message:  `${stats.never_worn_pct}% of your wardrobe has never been worn — that's ${stats.never_worn_count} items accumulating unused carbon cost.`,
      action:   'Add unworn items to your Ready-to-Part-With list to swap or donate them.',
    });
  } else if (stats.never_worn_pct > 20) {
    insights.push({
      severity: 'medium',
      message:  `${stats.never_worn_pct}% of your wardrobe is unworn. Consider curating your collection.`,
      action:   "Review items you haven't worn in 6+ months and consider passing them on.",
    });
  }

  const totalMaterials  = stats.material_breakdown.reduce((s, m) => s + m.count, 0);
  const syntheticCount  = stats.material_breakdown
    .filter((m) => ['polyester','nylon','acrylic'].includes(m.material))
    .reduce((s, m) => s + m.count, 0);
  const syntheticPct    = totalMaterials > 0 ? Math.round((syntheticCount / totalMaterials) * 100) : 0;

  if (syntheticPct > 50) {
    insights.push({
      severity: 'high',
      message:  `${syntheticPct}% of your wardrobe uses synthetic fabrics (polyester, nylon, acrylic) which shed microplastics.`,
      action:   'When buying new items, favour natural fibres like cotton, linen, or wool.',
    });
  }

  if (stats.total_items > 100) {
    insights.push({
      severity: 'medium',
      message:  `With ${stats.total_items} items, your wardrobe is quite large. More items = more manufacturing emissions.`,
      action:   'Aim for a more curated capsule wardrobe. Move excess items to RTPW.',
    });
  }

  if (stats.estimated_cost_per_wear !== null && stats.estimated_cost_per_wear > 20) {
    insights.push({
      severity: 'low',
      message:  `Your estimated cost per wear is $${stats.estimated_cost_per_wear.toFixed(2)} — your items aren't being used enough relative to their price.`,
      action:   'Wear existing items more often before buying new ones.',
    });
  }

  return insights;
}
