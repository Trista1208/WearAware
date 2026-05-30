/**
 * seed-test-user.ts
 *
 * Creates a realistic test user with a full wardrobe, wear history,
 * sustainability score, ready-to-part-with items and wanted items.
 *
 * Run:
 *   npx ts-node scripts/seed-test-user.ts
 */

import dotenv from 'dotenv';
dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ws = require('ws');
import { createClient } from '@supabase/supabase-js';
import { computeAndSaveScore } from '../src/services/sustainability.service';

// ─── Supabase admin client ────────────────────────────────────────────────────
const supabaseUrl         = process.env.SUPABASE_URL!;
const supabaseServiceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth:     { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

// ─── Test user credentials (save these for the browser) ──────────────────────
const TEST_EMAIL    = 'demo.wearaware@gmail.com';
const TEST_PASSWORD = 'WearAware2026!';
const TEST_USERNAME = 'demo_user';

// ─── Wardrobe seed data ───────────────────────────────────────────────────────
interface SeedItem {
  name: string;
  brand: string;
  category: string;
  color: string;
  material: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  purchase_price?: number;
  wears: number;          // how many wear-log entries to create
  fast_fashion?: boolean; // just a label hint — scoring uses brand list
}

const WARDROBE: SeedItem[] = [
  // ── Sustainable / ethical ──────────────────────────────────────────────────
  { name: 'Hemp Crew Tee',           brand: 'Patagonia',     category: 'tops',        color: 'white',   material: 'natural_blend', condition: 'like_new', purchase_price: 55,  wears: 88 },
  { name: 'Organic Cotton Hoodie',   brand: 'Patagonia',     category: 'tops',        color: 'grey',    material: 'cotton',        condition: 'good',     purchase_price: 110, wears: 42 },
  { name: 'Recycled Denim Jeans',    brand: 'Nudie Jeans',   category: 'bottoms',     color: 'blue',    material: 'denim',         condition: 'good',     purchase_price: 140, wears: 60 },
  { name: 'Linen Button-Up',         brand: 'Arket',         category: 'tops',        color: 'beige',   material: 'linen',         condition: 'like_new', purchase_price: 75,  wears: 23 },
  { name: 'Wool Overcoat',           brand: 'Vintage Find',  category: 'outerwear',   color: 'camel',   material: 'wool',          condition: 'good',     purchase_price: 95,  wears: 18 },
  { name: 'Leather Sneakers',        brand: 'Veja',          category: 'footwear',    color: 'white',   material: 'leather',       condition: 'good',     purchase_price: 160, wears: 75 },
  { name: 'Canvas Tote Bag',         brand: 'Baggu',         category: 'accessories', color: 'natural', material: 'cotton',        condition: 'like_new', purchase_price: 45,  wears: 34 },
  { name: 'Organic Chino Shorts',    brand: 'Outerknown',    category: 'bottoms',     color: 'khaki',   material: 'cotton',        condition: 'good',     purchase_price: 80,  wears: 12 },
  { name: 'Merino Knit Sweater',     brand: 'Sheep Inc.',    category: 'tops',        color: 'navy',    material: 'wool',          condition: 'good',     purchase_price: 200, wears: 5  },

  // ── Fast fashion (penalised by algorithm) ──────────────────────────────────
  { name: 'Basic White Tee',         brand: 'Zara',          category: 'tops',        color: 'white',   material: 'cotton',        condition: 'good',     purchase_price: 18,  wears: 6,  fast_fashion: true },
  { name: 'Slim-Fit Chinos',         brand: 'H&M',           category: 'bottoms',     color: 'black',   material: 'cotton',        condition: 'fair',     purchase_price: 25,  wears: 4,  fast_fashion: true },
  { name: 'Oversized Hoodie',        brand: 'Zara',          category: 'tops',        color: 'black',   material: 'cotton',        condition: 'good',     purchase_price: 35,  wears: 2,  fast_fashion: true },
  { name: 'Polyester Blazer',        brand: 'Shein',         category: 'outerwear',   color: 'grey',    material: 'polyester',     condition: 'fair',     purchase_price: 22,  wears: 1,  fast_fashion: true },
  { name: 'Graphic Tee',             brand: 'Primark',       category: 'tops',        color: 'red',     material: 'cotton',        condition: 'good',     purchase_price: 8,   wears: 2,  fast_fashion: true },

  // ── Low utilisation (≤2 wears → penalised) ────────────────────────────────
  { name: 'Silk Blouse',             brand: 'Mango',         category: 'tops',        color: 'ivory',   material: 'silk',          condition: 'like_new', purchase_price: 60,  wears: 1  },
  { name: 'Suede Loafers',           brand: 'Vintage Find',  category: 'footwear',    color: 'brown',   material: 'leather',       condition: 'good',     purchase_price: 80,  wears: 1  },
  { name: 'Cotton Cap',              brand: 'Tentree',       category: 'accessories', color: 'green',   material: 'cotton',        condition: 'like_new', purchase_price: 35,  wears: 0  },
  { name: 'Linen Trousers',          brand: 'COS',           category: 'bottoms',     color: 'beige',   material: 'linen',         condition: 'good',     purchase_price: 90,  wears: 2  },
  { name: 'Statement Necklace',      brand: 'ASOS',          category: 'accessories', color: 'gold',    material: 'other',         condition: 'like_new', purchase_price: 20,  wears: 1  },

  // ── Duplicates: multiple similar tops (triggers similarity penalty) ────────
  { name: 'White Crew Tee #2',       brand: 'Uniqlo',        category: 'tops',        color: 'white',   material: 'cotton',        condition: 'good',     purchase_price: 15,  wears: 10 },
  { name: 'White Crew Tee #3',       brand: 'Uniqlo',        category: 'tops',        color: 'white',   material: 'cotton',        condition: 'fair',     purchase_price: 15,  wears: 3  },
  { name: 'Blue Denim Jeans #2',     brand: 'Levi\'s',       category: 'bottoms',     color: 'blue',    material: 'denim',         condition: 'good',     purchase_price: 100, wears: 7  },
  { name: 'Black Sneakers',          brand: 'Adidas',        category: 'footwear',    color: 'black',   material: 'synthetic_blend',condition: 'good',    purchase_price: 90,  wears: 30 },
  { name: 'Running Shoes',           brand: 'Nike',          category: 'footwear',    color: 'grey',    material: 'synthetic_blend',condition: 'fair',    purchase_price: 130, wears: 55 },
];

// ─── RTPW items (items ready to swap/donate) ──────────────────────────────────
const RTPW_INDICES = [11, 12, 13, 18]; // Oversized Hoodie, Polyester Blazer, Graphic Tee, Statement Necklace

// ─── Wanted items ─────────────────────────────────────────────────────────────
const WANTED_ITEMS = [
  { description: 'Vintage Levi\'s 501 jeans', category: 'bottoms', preferred_colors: ['blue', 'black'], preferred_brands: ['Levi\'s'] },
  { description: 'Second-hand wool blazer for winter', category: 'outerwear', preferred_colors: ['grey', 'camel', 'navy'], preferred_brands: [] },
  { description: 'Sustainable white sneakers size 42', category: 'footwear', preferred_colors: ['white'], preferred_brands: ['Veja', 'Adidas'] },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function randomPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌿 WearAware — Test Data Seeder\n');

  // ── 1. Create / find test user ───────────────────────────────────────────────
  console.log(`📧  Creating test user: ${TEST_EMAIL}`);

  let userId: string;

  // Try creating a new user via admin API (bypasses email confirmation)
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email:             TEST_EMAIL,
    password:          TEST_PASSWORD,
    email_confirm:     true,        // mark email as already confirmed
    user_metadata:     { username: TEST_USERNAME },
  });

  if (createError) {
    if (createError.message.includes('already been registered')) {
      console.log('   ℹ️  User already exists — fetching existing user');
      // Fetch by email
      const { data: listData, error: listError } = await admin.auth.admin.listUsers();
      if (listError) { console.error('❌  Could not list users:', listError.message); process.exit(1); }
      const existing = listData.users.find((u) => u.email === TEST_EMAIL);
      if (!existing) { console.error('❌  User not found after listing'); process.exit(1); }
      userId = existing.id;
    } else {
      console.error('❌  Failed to create user:', createError.message);
      process.exit(1);
    }
  } else {
    userId = createData.user.id;
    console.log(`   ✅  User created: ${userId}`);
  }

  // ── 2. Upsert profile ────────────────────────────────────────────────────────
  console.log('👤  Upserting profile...');
  const { error: profileError } = await admin.from('profiles').upsert({
    id:           userId,
    username:     TEST_USERNAME,
    display_name: 'Demo User',
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'id' });

  if (profileError) {
    console.error('   ⚠️  Profile upsert error (non-fatal):', profileError.message);
  } else {
    console.log('   ✅  Profile saved');
  }

  // ── 3. Remove existing wardrobe items for this user (clean re-seed) ──────────
  console.log('🗑   Clearing existing wardrobe items...');
  await admin.from('clothing_items').delete().eq('owner_id', userId);

  // ── 4. Insert wardrobe items ──────────────────────────────────────────────────
  console.log(`👗  Inserting ${WARDROBE.length} clothing items...`);
  const insertedIds: string[] = [];

  for (const item of WARDROBE) {
    const { data, error } = await admin.from('clothing_items').insert({
      owner_id:       userId,
      name:           item.name,
      brand:          item.brand,
      category:       item.category,
      color:          item.color,
      material:       item.material,
      condition:      item.condition,
      purchase_price: item.purchase_price ?? null,
      is_active:      true,
      image_urls:     [],
      ai_tags:        [],
    }).select('id').single();

    if (error) {
      console.error(`   ⚠️  Could not insert "${item.name}":`, error.message);
      insertedIds.push('');
    } else {
      insertedIds.push(data.id);
    }
  }

  const validIds = insertedIds.filter(Boolean);
  console.log(`   ✅  ${validIds.length} items created`);

  // ── 5. Insert wear logs ───────────────────────────────────────────────────────
  console.log('📅  Creating wear logs...');
  let totalWears = 0;

  for (let i = 0; i < WARDROBE.length; i++) {
    const item  = WARDROBE[i];
    const itemId = insertedIds[i];
    if (!itemId || item.wears === 0) continue;

    const wearLogs = Array.from({ length: item.wears }, (_, j) => ({
      item_id:  itemId,
      user_id:  userId,
      worn_on:  randomPastDate(Math.floor(Math.random() * 365) + 1),
      occasion: ['casual', 'work', 'outdoor', 'evening', 'weekend'][j % 5],
    }));

    const { error } = await admin.from('wear_logs').insert(wearLogs);
    if (error) {
      console.error(`   ⚠️  Wear logs for "${item.name}":`, error.message);
    } else {
      totalWears += item.wears;
    }
    await sleep(30); // throttle to avoid rate limits
  }

  console.log(`   ✅  ${totalWears} wear-log entries created`);

  // ── 6. Compute & save sustainability score ────────────────────────────────────
  console.log('🌿  Computing sustainability score...');

  try {
    const breakdown = await computeAndSaveScore(userId);
    console.log(`   ✅  Score: ${breakdown.final_score} (${breakdown.grade})`);
    console.log(`        Penalties — size: ${breakdown.penalties.wardrobe_size.penalty}, fast-fashion: ${breakdown.penalties.fast_fashion.penalty}, similar: ${breakdown.penalties.similar_items.penalty}, low-util: ${breakdown.penalties.low_utilisation.penalty}`);
    console.log(`        Bonus    — high-wear: ${breakdown.bonuses.high_wear.bonus}`);
  } catch (err) {
    console.error('   ⚠️  Score computation error:', (err as Error).message);
  }

  // ── 7. Add RTPW items ─────────────────────────────────────────────────────────
  console.log('♻️   Adding Ready-to-Part-With items...');
  for (const idx of RTPW_INDICES) {
    const itemId = insertedIds[idx];
    if (!itemId) continue;
    const { error } = await admin.from('ready_to_part_with').insert({
      user_id:    userId,
      item_id:    itemId,
      preference: ['swap', 'donate'],
      is_matched: false,
    });
    if (error && !error.message.includes('duplicate')) {
      console.error(`   ⚠️  RTPW insert:`, error.message);
    }
  }
  console.log(`   ✅  ${RTPW_INDICES.length} items listed as ready to part with`);

  // ── 8. Add wanted items ───────────────────────────────────────────────────────
  console.log('🔍  Adding wanted items...');
  for (const wanted of WANTED_ITEMS) {
    const { error } = await admin.from('wanted_items').insert({
      user_id:          userId,
      description:      wanted.description,
      category:         wanted.category,
      preferred_colors: wanted.preferred_colors,
      preferred_brands: wanted.preferred_brands,
    });
    if (error) console.error(`   ⚠️  Wanted item:`, error.message);
  }
  console.log(`   ✅  ${WANTED_ITEMS.length} wanted items added`);

  // ── 9. Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55));
  console.log('🎉  Seed complete! Use these credentials in the app:\n');
  console.log(`   Email    : ${TEST_EMAIL}`);
  console.log(`   Password : ${TEST_PASSWORD}`);
  console.log(`   User ID  : ${userId}`);
  console.log('\n   Open → http://localhost:3001  and sign in ✅');
  console.log('─'.repeat(55) + '\n');
}

main().catch((err) => {
  console.error('\n❌  Seed failed:', err);
  process.exit(1);
});
