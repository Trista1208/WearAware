import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini using the key from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeClothingImage = async (imageBase64: string, mimeType: string) => {
    try {
        // We use Gemini 1.5 Flash because it is the fastest multimodal model for hackathons
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // This prompt perfectly matches the 'clothing_items' table your teammate built
        const prompt = `
        Analyze this clothing item. Return ONLY a raw, minified JSON object (no markdown, no backticks).
        Use this exact structure:
        {
            "category": "string (must be one of: tops, bottoms, dresses, outerwear, footwear, accessories, underwear, sportswear, formalwear, other)",
            "color": "string (the primary color)",
            "secondary_colors": ["string", "string"],
            "material": "string (must be one of: cotton, wool, silk, linen, polyester, nylon, acrylic, viscose, denim, leather, synthetic_blend, natural_blend, other)",
            "ai_tags": ["string", "string", "string"] (3-5 style keywords like 'vintage', 'minimalist'),
            "ai_style_summary": "string (a 1-sentence description of the item's vibe)"
        }`;
        
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType
            }
        };

        console.log("Sending image to Gemini for analysis...");
        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();
        
        // Clean the response to ensure it's pure JSON just in case Gemini adds markdown
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanedText);
        
        console.log("Gemini Analysis Complete:", parsedData);
        return parsedData;

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw new Error("Failed to analyze clothing image with Gemini.");
    }
};