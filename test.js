const fs = require('fs');

async function runTest() {
    try {
        // 1. Read your local image file and convert it to Base64
        const imagePath = 'src/test1.jpg';
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // 2. The UUID you copied from your Supabase profiles table
        const dummyUserId = "3a854932-8f17-482e-a2ef-323757951951"; // <--- REMEMBER TO PASTE YOUR UUID HERE

        console.log("Sending photo to backend...");

        // 3. Fire it at your local Express server
        const response = await fetch('http://localhost:3000/api/wardrobe/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: dummyUserId,
                imageBase64: base64Image,
                mimeType: "image/jpeg"
            })
        });

        const data = await response.json();
        
        console.log("\n--- SERVER RESPONSE ---");
        console.dir(data, { depth: null, colors: true });
        console.log("-----------------------\n");

    } catch (error) {
         console.error("Test failed to connect:", error);
    }
}

runTest();