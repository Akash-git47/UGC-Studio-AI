
import { GoogleGenAI } from "@google/genai";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parses the Gemini API error to provide a human-readable message.
 * Specifically handles quota issues and invalid keys as requested.
 */
const handleApiError = (error: any): string => {
  const errorString = typeof error === 'string' ? error : JSON.stringify(error);
  
  // Check for Quota Exceeded (429)
  if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("429") || errorString.includes("quota")) {
    return "API Quota Exceeded. Please check your plan or wait a few minutes before trying again.";
  }

  // Check for API Key issues (401/403)
  if (errorString.includes("API_KEY_INVALID") || errorString.includes("401") || errorString.includes("403")) {
    return "There is a problem with the API key. Please ensure it is valid and has the correct permissions.";
  }

  // Check for safety filters
  if (errorString.includes("SAFETY") || errorString.includes("blocked")) {
    return "The request was blocked by safety filters. Please try a different scene or image.";
  }

  // Generic production failure on Vercel often relates to missing environment variables
  if (errorString.includes("API_KEY is not available")) {
    return "API key is missing from the environment configuration.";
  }

  return "Something went wrong with the AI generation. Please try again later.";
};

export const generateUGCImage = async (
  personImageBase64: string,
  personImageMimeType: string,
  productImageBase64: string,
  productImageMimeType: string,
  sceneDescription: string,
  retryCount: number = 0
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key is not configured in the environment.");
  }
  
  // Initialize AI client right before use
  const ai = new GoogleGenAI({ apiKey });

  const pMime = personImageMimeType || 'image/jpeg';
  const prodMime = productImageMimeType || 'image/jpeg';

  const prompt = `Generate a realistic User Generated Content (UGC) photo for Instagram.
  Atmosphere: ${sceneDescription}.
  
  The image must show the person from the provided portrait and the product from the product photo.
  The person should be using or holding the product naturally in the environment.
  Lighting: Soft, natural, lifestyle aesthetic.
  Format: High-quality 1:1 square photo.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: personImageBase64,
              mimeType: pMime,
            },
          },
          {
            inlineData: {
              data: productImageBase64,
              mimeType: prodMime,
            },
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("No output content generated.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    // If text is returned instead of image, it might be a subtle block
    if (response.text) {
      throw new Error("SAFETY_BLOCK");
    }

    throw new Error("No image found in response.");

  } catch (error: any) {
    console.error("Gemini API call failed:", error);

    // Simple retry for transient 500 errors
    if (retryCount < 1 && (error.message?.includes('500') || error.message?.includes('429'))) {
      await delay(1500);
      return generateUGCImage(personImageBase64, personImageMimeType, productImageBase64, productImageMimeType, sceneDescription, retryCount + 1);
    }

    // Throw the cleaned up error message
    throw new Error(handleApiError(error));
  }
};
