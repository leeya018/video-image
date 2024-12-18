"use server";

import { TranscriptionResult, TranscriptionSegment } from "@/types";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function transcribeAudio(
  formData: FormData
): Promise<TranscriptionResult> {
  const file = formData.get("audio") as File;
  if (!file) {
    throw new Error("No audio file provided");
  }

  const formDataForOpenAI = new FormData();
  formDataForOpenAI.append("file", file);
  formDataForOpenAI.append("model", "whisper-1");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formDataForOpenAI,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to transcribe audio");
  }

  const result = await response.json();

  // Split the text into sentences
  const sentences = result.text.match(/[^.!?]+[.!?]+/g) || [result.text];

  const segments: TranscriptionSegment[] = sentences.map(
    (text: string, index: number) => ({
      text: text.trim(),
      start: index * 5, // Approximate timing
      end: (index + 1) * 5,
      image: "", // Will be filled later
    })
  );

  return {
    segments,
    text: result.text,
  };
}

async function generateImageQuery(sentence: string): Promise<string> {
  const prompt = `Given the sentence: "${sentence}", generate a short, specific image query suitable for a stock photo search. Focus on the main subject and action. Keep it under 5 words.`;

  const { text } = await generateText({
    model: openai("gpt-3.5-turbo"),
    prompt: prompt,
    temperature: 0.7,
    maxTokens: 20,
  });

  return text.trim();
}

export async function fetchPexelsImage(sentence: string): Promise<string> {
  const query = await generateImageQuery(sentence);
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query
    )}&per_page=1`,
    {
      headers: {
        Authorization: process.env.PEXELS_API_KEY!,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch image");
  }

  const data = await response.json();
  return data.photos[0]?.src?.medium || "";
}
