// src/services/GeminiService.js
// No API key here. This file only talks to our own /api/scan-receipt endpoint.

/**
 * Converts a File object to a raw Base64 string (no data URL prefix).
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Sends the receipt image to our backend, which forwards it to Gemini.
 * @param {File} imageFile The uploaded receipt image.
 * @returns {Array<Object>} An array of structured food items.
 */
export async function scanReceipt(imageFile) {
  const imageBase64 = await fileToBase64(imageFile);

  const response = await fetch('/api/scan-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      mimeType: imageFile.type,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error scanning receipt.');
  }

  return data.items;
}
