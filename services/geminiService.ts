import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateUGCImage = async (
  personImageBase64: string,
  personImageMimeType: string,
  productImageBase64: string,
  productImageMimeType: string,
  sceneDescription: string
): Promise<string> => {
  
  // Construct a prompt that matches the user's high-quality reference style.
  // Reference: "A highly realistic photo of a perfume bottle, placed on a cafe table, soft natural sunlight, cozy warm background, blurred people walking behind, aesthetic lifestyle photography, 50mm lens, shallow depth of field, crisp details, premium visual look, ultra-HD."
  
  const prompt = `A highly realistic photo of this person and this product, placed in a setting described as: "${sceneDescription}". 
  The person should look natural and authentic, genuinely interacting with the product.
  Lighting and style: aesthetic lifestyle photography, 50mm lens, shallow depth of field, crisp details, premium visual look, ultra-HD, soft natural lighting (unless the scene implies otherwise).
  The background should perfectly match the description "${sceneDescription}" and blend seamlessly with the subjects.`;
  
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
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data found in the response.");
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to generate image via Gemini API.");
  }
};