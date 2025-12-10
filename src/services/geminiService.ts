import { GoogleGenAI, Modality } from "@google/genai";

// Using the specified nano banana model equivalent for image generation
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';
const AUDIO_MODEL_NAME = 'gemini-2.5-flash-preview-tts';

export const generateGhostAsset = async (): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const prompt = `
    A terrifying, high-contrast horror movie ghost figure. 
    The ghost is a pale, spectral woman with long hair, reaching a hand out towards the viewer.
    CRITICAL: The background MUST be pure solid black (#000000). 
    The ghost should look like smoke and decay. 
    Photorealistic style, grainy found footage look.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      const base64Image = part.inlineData.data;
      return `data:image/png;base64,${base64Image}`;
    }
    
    throw new Error("No image data in response");
  } catch (error) {
    console.error("Failed to summon the ghost:", error);
    throw error;
  }
};

export const generateScreamAsset = async (): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBJr084nLzSX38mLU3yR04tcqD0RnDo3Do" });
  
  // TTS prompt to generate a scream-like utterance
  const prompt = "get away from me!";

  try {
    const response = await ai.models.generateContent({
      model: AUDIO_MODEL_NAME,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore often has a good range
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      return part.inlineData.data; // Return raw base64 PCM data
    }
    throw new Error("No audio data in response");
  } catch (error) {
    console.error("Failed to generate scream:", error);
    // Fallback or rethrow. For now rethrow to show error state.
    throw error;
  }
};

// Possession Mode Assets
export const generateZombieFaceAsset = async (): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBJr084nLzSX38mLU3yR04tcqD0RnDo3Do" });

  const prompt = `
    Black and white artistic face paint mask. 
    Symmetrical patterns, theater makeup style, Day of the Dead style.
    CRITICAL: The background MUST be pure solid WHITE (#FFFFFF).
    Costume design.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No zombie face data");
  } catch (error) {
    throw error;
  }
};

export const generateDamagedEyeAsset = async (): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBJr084nLzSX38mLU3yR04tcqD0RnDo3Do" });

  const prompt = `
    A red mechanical robot eye.
    Circular red glowing iris.
    CRITICAL: The background MUST be pure solid WHITE (#FFFFFF).
    Sci-fi robot eye design.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No eye data");
  } catch (error) {
    throw error;
  }
};

export const generateDaggerAsset = async (): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBJr084nLzSX38mLU3yR04tcqD0RnDo3Do" });

  const prompt = `
    An antique silver ornamental artifact.
    Ornate handle at the bottom, long pointed metallic shape at the top.
    Vertical orientation.
    CRITICAL: The background MUST be pure solid white (#FFFFFF).
    Museum display item, historical prop, non-weapon.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No dagger data");
  } catch (error) {
    throw error;
  }
};
