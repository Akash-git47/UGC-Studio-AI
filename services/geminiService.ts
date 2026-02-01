
import { GoogleGenAI } from "@google/genai";

export const generateUGCImage = async (
  personImageBase64: string,
  personImageMimeType: string,
  productImageBase64: string,
  productImageMimeType: string,
  sceneDescription: string
): Promise<string> => {
  // Create a new GoogleGenAI instance right before the call to ensure 
  // it uses the most up-to-date API key from the environment.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not available in the environment.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `A highly realistic, professional UGC (User Generated Content) photo for Instagram. 
  The scene setting is: "${sceneDescription}".
  The image must naturally blend the provided person and the provided product into this environment.
  The person should be interacting with the product in a believable way (e.g., holding it, using it, or having it placed nearby in their space).
  
  Style Requirements:
  - Aesthetic lifestyle photography
  - Soft natural lighting
  - 50mm lens effect with shallow depth of field (bokeh background)
  - Crisp details on both the person and the product
  - Modern Instagram aesthetic (clean, vibrant, authentic)
  - High resolution (1K)`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              data: personImageBase64,
              mimeType: personImageMimeType,
            },
          },
          {
            inlineData: {
              data: productImageBase64,
              mimeType: productImageMimeType,
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
      throw new Error("Invalid response format from Gemini API.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image data found in the response parts.");
  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    // If we get a 404/Not Found, it might be an API key issue in some environments
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API configuration error. Please check your API key and project settings.");
    }
    throw new Error(error.message || "Failed to generate image via Gemini API.");
  }
};
