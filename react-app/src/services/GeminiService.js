// src/services/GeminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Converts a File object to a Base64 string for the API call.
 */
function fileToGenerativePart(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        inlineData: {
          data: reader.result.split(',')[1],
          mimeType: file.type,
        },
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Sends the receipt image to Gemini for analysis.
 * @param {File} imageFile The uploaded receipt image.
 * @returns {Array<Object>} An array of structured food items.
 */
export async function scanReceipt(imageFile) {
  if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY not set.");

  // FIX: Updated to "gemini-2.5-flash" as 1.5 is retired
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  // 2. Process the image
  const imagePart = await fileToGenerativePart(imageFile);

  // 3. Define the text prompt
  const promptText = `
    Analyze this receipt image. Your goal is to extract food and drink items, estimate shelf life, and determine storage.
    
    CRITICAL INSTRUCTION: **You MUST return ONLY a valid JSON array of objects.**
    
    1. Filter: Only extract food and drink items. Exclude non-food items, taxes, fees, and store information.
    2. Shelf Life: Provide a realistic estimate (e.g., "7 days", "1 month").
    3. Storage: Determine the primary storage location and use one of these words ONLY: **"Pantry"**, **"Fridge"**, or **"Freezer"**.
    
    Schema: [{"name": string, "shelfLife": string, "storage": "Pantry" | "Fridge" | "Freezer"}]
  `;

  // 4. Create the text part object
  const textPart = {
      text: promptText,
  };

  // 5. Send both parts to the model
  const result = await model.generateContent([imagePart, textPart]);
  const text = result.response.text();
  
  try {
    // 6. Parse and return the JSON
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.error("Gemini output was not valid JSON:", text);
    throw new Error("AI analysis failed to produce structured data.");
  }
}