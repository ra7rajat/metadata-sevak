import { NextRequest } from 'next/server';
import { getGenAIClient, resolveModel } from '@/lib/gemini';
import type { NewsArticle } from '@/types';

interface SummaryBody {
  leftArticle: NewsArticle;
  rightArticle: NewsArticle;
}

export async function POST(request: NextRequest): Promise<Response> {
  const body = (await request.json()) as SummaryBody;
  const client = getGenAIClient();

  const prompt = `Extract agreed facts and differing angles. Be neutral.

Article A:
Title: ${body.leftArticle.title}
Snippet: ${body.leftArticle.snippet}
Source: ${body.leftArticle.sourceName}

Article B:
Title: ${body.rightArticle.title}
Snippet: ${body.rightArticle.snippet}
Source: ${body.rightArticle.sourceName}

Respond in JSON with keys:
agreedFacts: string[]
differingAngles: string[]
summary: string`;

  try {
    const modelId = await resolveModel();
    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return new Response(text, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Summary failed';
    return Response.json(
      {
        agreedFacts: [],
        differingAngles: [],
        summary: message,
      },
      { status: 200 }
    );
  }
}
