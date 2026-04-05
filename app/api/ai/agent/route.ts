import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { redis } from '@/lib/redis';

// Conversation history context
const CONTEXT_WINDOW = 10; // messages
const MEMORY_TTL = 60 * 60 * 2; // 2 hours

/**
 * 🧠 The Zoki Core Agent API
 * 
 * This endpoint serves as the central brain for all communication channels (Telegram, Discord, Web).
 * It uses Redis to store conversation memory per user, ensuring "Zoki" remembers context during a session.
 * 
 * Payload: { userId: string, message: string, channel: 'discord' | 'telegram' | 'web' }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, message, channel } = await request.json();

    if (!userId || !message) {
      return NextResponse.json({ error: 'userId and message are required' }, { status: 400 });
    }

    // Define Zoki's Persona
    const SYSTEM_PROMPT = `
You are "Zoki", a Senior SaaS Architect and Full-Stack Engineer developing the **PIE** (Pricing Intelligence Engine) platform.
You are working with your user, **Goga**.

**Tone & Personality:**
*   Professional yet friendly and casual ("Goga", "Drugu", "Brat").
*   Use Macedonian as the default language unless Goga speaks English (then reply in English).
*   You are proactive, competent, and autonomous. You don't just answer; you execute tasks.

**Project Context (PIE):**
*   **Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, Redis, BullMQ.
*   **Key Features:** Competitor price scraping, AI price recommendations (Autonomous Agent), Elasticity Analysis, Stripe Billing, PWA support.
*   **Current Status:** The system is fully functional and deployed (Phase 28).
*   **Recent Work:** You are currently building the "Synapse Link" (Phase 29) to connect chat bots with the AI.

**Constraints:**
*   If you need to write code, provide concise, high-quality TypeScript.
*   If Goga asks for a status update, summarize the latest phases.
*   Keep responses concise and actionable.
`;

    // 1. Retrieve conversation history from Redis
    const historyKey = `chat:history:${userId}`;
    const historyJSON = await redis.get<string>(historyKey);
    const chatHistory: { role: 'user' | 'assistant'; content: string }[] = historyJSON ? JSON.parse(historyJSON) : [];

    // 2. Append user message
    chatHistory.push({ role: 'user', content: message });

    // 3. Trim history if it exceeds the window
    if (chatHistory.length > CONTEXT_WINDOW) {
      // Keep the last N messages (excluding the system prompt which is handled by API)
      chatHistory.splice(0, chatHistory.length - CONTEXT_WINDOW);
    }

    // 4. Call Anthropic API (Claude 3.5 Sonnet/Haiku)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Construct messages for the API
    const apiMessages = [
      { role: 'user' as const, content: SYSTEM_PROMPT }, 
      ...chatHistory
    ];

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307', // Fast and cheap for chat
      max_tokens: 1024,
      messages: apiMessages,
    });

    const contentBlocks = response.content as unknown as Array<{ type: string; text?: string }>;
    const textBlock = contentBlocks.find((b) => b.type === 'text' || b.type === 'text_block');
    const replyText = textBlock?.text || "Sorry, I couldn't process that.";

    // 5. Update conversation history in Redis
    chatHistory.push({ role: 'assistant', content: replyText });
    await redis.set(historyKey, JSON.stringify(chatHistory), { ex: MEMORY_TTL });

    // 6. Return the response to the caller (the bot)
    return NextResponse.json({ 
      success: true, 
      reply: replyText,
      meta: {
        channel,
        tokensUsed: response.usage.output_tokens
      }
    });

  } catch (error: any) {
    // Log the error internally
    console.error('[Agent API Error]', error);
    
    // Fallback response if API fails (system is still stable!)
    return NextResponse.json({ 
      success: true, 
      reply: "⚠️ My systems are currently undergoing maintenance. I'll get back to you shortly!" 
    }, { status: 200 }); // Return 200 so the bot doesn't crash
  }
}
