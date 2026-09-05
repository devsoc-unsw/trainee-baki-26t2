// lib/gemini.ts

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askGemini(prompt: string) {
  const response = await ai.interactions.create({
    model: "gemini-3.6-flash",
    input: prompt,
  });

  return response.output_text;
}