const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws'); // <-- Bring in the WebSocket fix

const supabase = createClient(
    "https://fwkycpwgpbqrivxafkoe.supabase.co", 
    "sb_secret_yK7GE9aI9wQWsitPoe6ySA_xgttAkeg",
    {
        auth: {
            persistSession: false
        },
        realtime: {
            transport: WebSocket // <-- Tell Supabase to use it
        }
    }
);

// ... keep the rest of the testNewTables() function exactly the same!

async function testNewTables() {
    try {
        console.log("1. Fetching a dummy user profile...");
        const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
        if (!profile) throw new Error("No profiles found. Create a user first.");
        
        console.log("2. Fetching a dummy clothing item...");
        const { data: item } = await supabase.from('clothing_items').select('id').limit(1).single();
        if (!item) throw new Error("No clothing items found. Upload an item first.");

        console.log("3. Testing Daily Wear Log entry...");
        const { data: log, error: logError } = await supabase.from('daily_wear_logs').insert({
            user_id: profile.id,
            item_id: item.id
        }).select().single();
        if (logError) throw logError;
        console.log("✅ daily_wear_logs table verified successfully!");

        console.log("4. Testing Marketplace Trades entry...");
        const { data: trade, error: tradeError } = await supabase.from('marketplace_trades').insert({
            item_id: item.id,
            requester_id: profile.id,
            owner_id: profile.id, // Testing with self for validation
            status: 'pending'
        }).select().single();
        if (tradeError) throw tradeError;
        console.log("✅ marketplace_trades table verified successfully!");

    } catch (error) {
        console.error("❌ Database verification failed:", error.message);
    }
}

testNewTables();