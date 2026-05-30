// 1. PASTE YOUR IDs HERE:
const testUserId = "3a854932-8f17-482e-a2ef-323757951951";
const testItemId = "2ff479a2-fa9c-4a58-8784-59316e6f7587";

async function testExpressRoutes() {
    console.log("Testing Express API Routes on localhost:3000...\n");

    try {
        // Test 1: Fetching the 3D Carousel Items
        console.log("1. Fetching wardrobe items...");
        const getRes = await fetch(`http://localhost:3000/api/wardrobe/items?userId=${testUserId}`);
        const getData = await getRes.json();
        console.log("Carousel Response:", getData.success ? "✅ Success!" : "❌ Failed", `(Found ${getData.items?.length} items)`);

        // Test 2: Simulating a 'Worn Today' button click
        console.log("\n2. Simulating a 'Worn Today' button click...");
        const trackRes = await fetch('http://localhost:3000/api/wardrobe/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: testUserId,
                itemId: testItemId
            })
        });
        const trackData = await trackRes.json();
        console.log("Tracker Response:", trackData.success ? "✅ Success!" : "❌ Failed", trackData.message);


        // Add this at the very top with your other IDs:
        const matchUserId = "48bd91da-1415-487b-bbd5-7f7d81f1888b";

        // ... [Keep your other tests inside the try block] ...

        // Add this at the bottom of your try { ... } block:
        console.log("\n3. Simulating a P2P Avatar Trade...");
        const tradeRes = await fetch('http://localhost:3000/api/wardrobe/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                itemId: testItemId,     // The shirt being traded
                myUserId: testUserId,   // You (receiving the shirt)
                matchUserId: matchUserId // The matched user (losing the shirt)
            })
        });
        const tradeData = await tradeRes.json();
        console.log("Trade Response:", tradeData.success ? "✅ Success!" : "❌ Failed", tradeData.message);

    } catch (error) {
        console.error("❌ API Test Failed! Is your server running?", error.message);
    }
}

testExpressRoutes();