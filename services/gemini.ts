import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScriptLine, Frame } from "../types";

// Helper to get client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean JSON markdown
const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * Agent 1: Script Writer
 * Generates a script based on the user's idea.
 */
export const generateScript = async (idea: string): Promise<ScriptLine[]> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    당신은 2025년 유튜브 쇼츠 트렌드를 선도하는 전문 시나리오 작가 'ScriptAgent'입니다.
    사용자의 아이디어를 바탕으로 30~50초 분량의 임팩트 있는 쇼츠 대본을 작성하세요.
    
    출력 형식: JSON Array
    각 항목은 { "character": string, "dialogue": string, "emotion": string } 형태여야 합니다.
    Character는 'Narrator' 또는 등장인물 이름입니다.
    대사는 짧고 간결하며, 구어체를 사용하세요.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `아이디어: ${idea}\n\n이 아이디어로 쇼츠 대본을 작성해줘.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            character: { type: Type.STRING },
            dialogue: { type: Type.STRING },
            emotion: { type: Type.STRING }
          },
          required: ["character", "dialogue", "emotion"]
        }
      }
    }
  });

  const jsonStr = cleanJson(response.text || "[]");
  const data = JSON.parse(jsonStr);
  
  return data.map((item: any, index: number) => ({
    id: `script-${index}`,
    ...item
  }));
};

/**
 * Agent 2: Visual Director (Storyboard)
 * Converts script into visual frames with precise prompts.
 */
export const generateStoryboard = async (script: ScriptLine[]): Promise<Frame[]> => {
  const ai = getAiClient();
  
  const scriptText = script.map(s => `${s.character} (${s.emotion}): ${s.dialogue}`).join('\n');

  const systemInstruction = `
    당신은 세계적인 영화 감독이자 비주얼 디렉터 'VisualAgent'입니다.
    주어진 대본을 분석하여 시각적으로 매혹적인 쇼츠 스토리보드(프레임 리스트)를 생성하세요.
    
    요구사항:
    1. 전체 영상을 4-8개의 핵심 프레임으로 나누세요.
    2. 각 프레임에 적절한 대사를 배분하세요 (scriptLinesIndices).
    3. visualDescription: 프레임의 내용을 한국어로 자세히 묘사.
    4. imagePrompt: 이미지 생성 AI(Imagen/Midjourney 등)에 넣을 **영어** 프롬프트. (Photorealistic, 8k, cinematic lighting 등 키워드 포함 필수).
    5. audioPrompt: 배경음악 및 효과음 분위기 설명.
    6. duration: 프레임 지속 시간 (초).
    7. transition: 이 프레임이 시작될 때의 전환 효과. 첫 프레임은 FADE_IN, 중간은 CUT/CROSS_DISSOLVE, 마지막 근처는 FADE_OUT 등을 적절히 사용.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `대본:\n${scriptText}\n\n위 대본을 바탕으로 스토리보드를 JSON으로 생성해줘.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.INTEGER },
            duration: { type: Type.NUMBER },
            visualDescription: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            audioPrompt: { type: Type.STRING },
            transition: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['CUT', 'FADE_IN', 'FADE_OUT', 'CROSS_DISSOLVE'] },
                duration: { type: Type.NUMBER }
              },
              required: ["type", "duration"]
            },
            startScriptIndex: { type: Type.INTEGER },
            endScriptIndex: { type: Type.INTEGER }
          },
          required: ["sceneNumber", "duration", "visualDescription", "imagePrompt", "audioPrompt", "transition", "startScriptIndex", "endScriptIndex"]
        }
      }
    }
  });

  const jsonStr = cleanJson(response.text || "[]");
  const data = JSON.parse(jsonStr);

  return data.map((item: any, index: number) => ({
    id: `frame-${index}`,
    sceneNumber: item.sceneNumber,
    duration: item.duration,
    visualDescription: item.visualDescription,
    imagePrompt: item.imagePrompt,
    audioPrompt: item.audioPrompt,
    transition: item.transition || { type: 'CUT', duration: 0 },
    scriptLines: script.slice(item.startScriptIndex, item.endScriptIndex + 1),
  }));
};

/**
 * Agent 3: Production (Image Generator)
 * Uses Imagen model to generate actual images.
 */
export const generateFrameImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  
  try {
    // Using Imagen 3 models as per guidance for image generation
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001', 
      prompt: prompt + ", cinematic, 4k, highly detailed, photorealistic, 9:16 aspect ratio",
      config: {
        numberOfImages: 1,
        aspectRatio: '9:16',
        outputMimeType: 'image/jpeg'
      }
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64Image) {
      return `data:image/jpeg;base64,${base64Image}`;
    }
    throw new Error("No image data returned");

  } catch (error) {
    console.warn("Imagen generation failed, falling back to placeholder or checking error", error);
    // Fallback if the key doesn't support Imagen or quota exceeded
    return `https://picsum.photos/seed/${Math.random()}/576/1024`; 
  }
};

/**
 * Agent 4: Audio Engineer (TTS)
 * Generates speech for the dialogue.
 */
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  const ai = getAiClient();
  
  if (!text || text.trim() === '') return undefined;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Korean voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        // Prepare data URI for playback
        return `data:audio/mp3;base64,${base64Audio}`; 
    }
    return undefined;
  } catch (e) {
    console.error("TTS Generation failed", e);
    return undefined;
  }
};