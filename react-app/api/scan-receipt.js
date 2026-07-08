// api/scan-receipt.js
// Vercel serverless function — runs server-side only.
// The Gemini API key never reaches the browser.

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPT_TEXT = `
  Analyze this receipt image. Your goal is to extract food and drink items, estimate shelf life, and determine storage.

  CRITICAL INSTRUCTION: **You MUST return ONLY a valid JSON array of objects.**

  1. Filter: Only extract food and drink items. Exclude non-food items, taxes, fees, and store information.
  2. Shelf Life: Provide a realistic estimate (e.g., "7 days", "1 month").
  3. Storage: Determine the primary storage location and use one of these words ONLY: **"Pantry"**, **"Fridge"**, or **"Freezer"**.

  Schema: [{"name": string, "shelfLife": string, "storage": "Pantry" | "Fridge" | "Freezer"}]
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set on server." });
  }

  const { imageBase64, mimeType } = req.body || {};

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "imageBase64 and mimeType are required." });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const textPart = { text: PROMPT_TEXT };

    const result = await model.generateContent([imagePart, textPart]);
    const text = result.response.text();

    let items;
    try {
      items = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch (parseErr) {
      console.error("Gemini output was not valid JSON:", text);
      return res.status(502).json({ error: "AI analysis failed to produce structured data." });
    }

    return res.status(200).json({ items });
  } catch (err) {
    console.error("Gemini API error:", err);
    return res.status(500).json({ error: "Failed to analyze receipt." });
  }
}
