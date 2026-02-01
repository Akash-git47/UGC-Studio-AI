
import { GoogleGenAI } from "@google/genai";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    throw new Error("API_KEY is not available in the environment.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  // Optimization: Consistently use JPEG as our optimizer in ImageUploader converts to optimized JPEG
  const pMime = personImageMimeType || 'image/jpeg';
  const prodMime = productImageMimeType || 'image/jpeg';

  const prompt = `Create a realistic, high-quality UGC (User Generated Content) Instagram photo. 
  Scene Atmosphere: "${sceneDescription}".
  
  Instructions:
  1. Blend the person from the provided person-image and the product from the product-image.
  2. Seamlessly place them into the specified scene.
  3. The person should be interacting with the product naturally (holding it, using it, or looking at it).
  4. Use soft, natural lighting and an authentic "smartphone photo" aesthetic.
  5. The final output MUST be a single high-quality 1:1 square image.
  
  Produce ONLY the generated image.`;
  
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
      throw new Error("No output generated from the model.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    // If no image but text was returned, try to provide that as info
    const textOutput = response.text;
    if (textOutput) {
       console.warn("Model returned text instead of image:", textOutput);
       throw new Error(`AI returned text instead of an image. This usually happens if the content is flagged. Try a different scene.`);
    }

    throw new Error("The AI model did not return an image part. Please try again.");

  } catch (error: any) {
    console.error("Gemini API call failed:", error);

    // Retry for rate limits or transient server errors
    if (retryCount < 1 && (error.message?.includes('500') || error.message?.includes('429'))) {
      await delay(2000);
      return generateUGCImage(personImageBase64, personImageMimeType, productImageBase64, productImageMimeType, sceneDescription, retryCount + 1);
    }

    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API endpoint not found. Ensure your environment has access to 'gemini-2.5-flash-image'.");
    }
    
    throw new Error(error.message || "Failed to generate image. Please try again with smaller or clearer images.");
  }
};
