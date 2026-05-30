const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. HARDCODE YOUR EXACT API KEY HERE (JUST FOR THIS TEST)
// Make sure there are no spaces before or after the key!
const apiKey = "AQ.Ab8RN6LUJGT-Rg3hs_U-Zu20CMUfuwq1eZbhY_8CIn9xl8XTbw"; 
const genAI = new GoogleGenerativeAI(apiKey);

async function checkConnection() {
    try {
        console.log("1. Asking Google for your allowed models...");
        
        // This asks Google's servers directly to list your available models
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        
        if (data.error) {
            console.error("GOOGLE REJECTED THE KEY:", data.error.message);
            return;
        }

        const models = data.models.map(m => m.name.replace('models/', ''));
        const geminiModels = models.filter(m => m.includes('gemini'));
        
        console.log("✅ Success! Your allowed models are:");
        console.log(geminiModels);

        console.log("\n2. Attempting a simple text test with gemini-1.5-flash...");
        
        // Test a simple text prompt to ensure it isn't an image-upload issue
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Respond with exactly two words: Connection Successful.");
        
        console.log("✅ AI Says:", result.response.text());

    } catch (error) {
        console.error("\n❌ SCRIPT FAILED:", error.message);
    }
}

checkConnection();