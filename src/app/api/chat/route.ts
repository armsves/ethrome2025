import { convertToCoreMessages, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { getNexusTools } from '@/lib/ai/tools/nexus';

export async function POST(request: Request) {
  console.log('[API] Received chat request');

  try {
    const { messages, model = 'openai' } = await request.json();
    console.log('[API] Parsed messages:', messages?.length, 'messages');
    console.log('[API] Selected model:', model);

    if (!messages || !Array.isArray(messages)) {
      console.error('[API] Invalid messages format');
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert UI messages to core messages
    console.log('[API] Converting messages to core format');
    const coreMessages = convertToCoreMessages(messages);
    console.log('[API] Core messages:', coreMessages?.length);

    // Get Nexus tools (requires authentication)
    console.log('[API] Fetching Nexus tools');
    const nexusTools = await getNexusTools();
    console.log('[API] Nexus tools loaded:', Object.keys(nexusTools).length, 'tools');

    // Select model based on request
    const selectedModel = model === 'anthropic'
      ? anthropic('claude-sonnet-4-5-20250929')
      : openai('gpt-4o');

    console.log('[API] Calling AI model:', model);
    const result = streamText({
      model: selectedModel,
      messages: coreMessages,
      tools: nexusTools,
    });

    console.log('[API] Streaming response');
    // Use toUIMessageStreamResponse() for @ai-sdk/react compatibility
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[API] Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    console.error('[API] Error message:', errorMessage);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack');

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
