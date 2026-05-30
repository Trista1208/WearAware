import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws'; // 1. ADD THIS IMPORT
import { analyzeClothingImage } from '../services/ai.service';

// 2. INJECT WEBSOCKET INTO THE CLIENT OPTIONS
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            persistSession: false
        },
        realtime: {
            transport: WebSocket as any
        }
    }
);

export const uploadClothingItem = async (req: Request, res: Response) => {
    try {
        // 2. Catch the data sent from the mobile app
        const { imageBase64, mimeType, userId } = req.body;

        if (!imageBase64 || !userId) {
            return res.status(400).json({ error: "Missing image or user ID." });
        }

        console.log(`Processing new item upload for user: ${userId}`);

        // 3. Send the image to your Gemini AI Service!
        const aiData = await analyzeClothingImage(imageBase64, mimeType || 'image/jpeg');

        // 4. Convert the base64 string back into a physical image file
        const buffer = Buffer.from(imageBase64, 'base64');
        const fileName = `${userId}/${Date.now()}-${Math.round(Math.random() * 1000)}.jpg`;

        // 5. Upload that physical file to your new 'clothing-images' bucket
        const { error: storageError } = await supabase
            .storage
            .from('clothing-images')
            .upload(fileName, buffer, {
                contentType: mimeType || 'image/jpeg',
            });

        if (storageError) throw storageError;

        // 6. Get the public web link to the image we just saved
        const { data: { publicUrl } } = supabase.storage.from('clothing-images').getPublicUrl(fileName);

        // 7. Save everything into the team's 'clothing_items' table
        const { data: insertData, error: insertError } = await supabase
            .from('clothing_items')
            .insert({
                owner_id: userId,
                name: `${aiData.color} ${aiData.category}`, // e.g., "Blue tops"
                category: aiData.category,
                color: aiData.color,
                secondary_colors: aiData.secondary_colors,
                material: aiData.material,
                image_urls: [publicUrl],
                ai_tags: aiData.ai_tags,
                ai_style_summary: aiData.ai_style_summary,
                is_active: true
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 8. Send a success message and the new item back to the mobile app
        return res.status(200).json({
            success: true,
            message: "Clothing item analyzed and added successfully!",
            item: insertData
        });

    } catch (error) {
        console.error("Upload Controller Error:", error);
        return res.status(500).json({ success: false, error: "Server failed to process the item." });
    }
};

// Log a daily wear event and increment the counter
export const logDailyWear = async (req: Request, res: Response) => {
    try {
        const { userId, itemId } = req.body; // Assuming frontend sends this in standard JSON

        if (!userId || !itemId) {
            return res.status(400).json({ success: false, error: "Missing userId or itemId" });
        }

        // 1. Insert the log into daily_wear_logs
        const { error: logError } = await supabase
            .from('daily_wear_logs')
            .insert({ user_id: userId, item_id: itemId });

        if (logError) throw logError;

        // 2. Increment the wear_count on the main clothing_items table
        // We use an RPC call if set up, or just fetch/update. 
        // For a quick hackathon fix, fetch current count then add 1:
        const { data: itemData } = await supabase
            .from('clothing_items')
            .select('wear_count')
            .eq('id', itemId)
            .single();

        const currentCount = itemData?.wear_count || 0;

        const { error: updateError } = await supabase
            .from('clothing_items')
            .update({ wear_count: currentCount + 1 })
            .eq('id', itemId);

        if (updateError) throw updateError;

        return res.json({ success: true, message: "Wear logged successfully!" });

    } catch (error) {
        console.error('Log Wear Error:', error);
        return res.status(500).json({ success: false, error: 'Failed to log daily wear.' });
    }
};

// Execute a peer-to-peer trade
export const executeTrade = async (req: Request, res: Response) => {
    try {
        const { itemId, matchUserId, myUserId } = req.body;

        if (!itemId || !matchUserId || !myUserId) {
            return res.status(400).json({ success: false, error: "Missing trade parameters" });
        }

        // 1. Record the completed trade in the logs
        const { error: tradeError } = await supabase
            .from('marketplace_trades')
            .insert({
                item_id: itemId,
                requester_id: myUserId,
                owner_id: matchUserId,
                status: 'completed',
                completed_at: new Date().toISOString()
            });

        if (tradeError) throw tradeError;

        // 2. Swap the owner of the clothing item to the new user!
        const { error: swapError } = await supabase
            .from('clothing_items')
            .update({ 
                owner_id: myUserId, 
                marketplace_status: 'private', // Take it off the market
                wear_count: 0 // Reset wear count for the new owner!
            })
            .eq('id', itemId);

        if (swapError) throw swapError;

        return res.json({ success: true, message: "Trade executed perfectly!" });

    } catch (error) {
        console.error('Execute Trade Error:', error);
        return res.status(500).json({ success: false, error: 'Failed to execute trade.' });
    }
};

// Fetch items for the 3D Carousel
export const getWardrobeItems = async (req: Request, res: Response) => {
    try {
        const { category, userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: "Missing user ID" });
        }

        let dbQuery = supabase
            .from('clothing_items') // Using your correct table name!
            .select('*')
            .eq('owner_id', userId);

        if (category && category !== 'All') {
            dbQuery = dbQuery.eq('category', category);
        }

        const { data, error } = await dbQuery;

        if (error) throw error;

        return res.json({ success: true, items: data });

    } catch (error) {
        console.error('Fetch Items Error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch wardrobe items.' });
    }
};