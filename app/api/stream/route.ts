/**
 * Server-Sent Events (SSE) endpoint for real-time price tracking.
 * 
 * Streams events from the Redis event stream to connected clients.
 * Uses a polling approach since Upstash Redis doesn't support native pub/sub.
 */

import { getOrgContext } from '@/lib/auth/context';
import { readStreamSince, getLatestTimestamp, StreamEvent } from '@/lib/realtime/pubsub';

// Reconnect in 1s on unexpected close
const RECONNECT_DELAY_MS = 1000;

/**
 * Format an SSE event string.
 */
function formatSSE(event: StreamEvent): string {
  return `event: ${event.type}\nid: ${event.id}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

/**
 * Format an SSE comment (keep-alive).
 */
function formatComment(text: string): string {
  return `: ${text}\n\n`;
}

const encoder = new TextEncoder();

export async function GET(request: Request) {
  const orgId = getOrgContext(request);

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      let lastSeenTimestamp = await getLatestTimestamp(orgId);
      let isClosed = false;
      let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
      let pollTimeout: ReturnType<typeof setTimeout> | null = null;

      // Helper to safely write to the stream
      function enqueue(data: string) {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            isClosed = true;
          }
        }
      }

      // Keep-alive: send comment every 15 seconds to prevent connection timeout
      keepAliveInterval = setInterval(() => {
        enqueue(formatComment('keep-alive'));
      }, 15000);

      // Poll for new events every 1 second
      async function poll() {
        if (isClosed) return;

        try {
          const events = await readStreamSince(orgId, lastSeenTimestamp + 1);

          for (const event of events) {
            enqueue(formatSSE(event));
            lastSeenTimestamp = Math.max(lastSeenTimestamp, event.timestamp);
          }
        } catch (error) {
          console.error('[SSE] Error polling for events:', error);
          // Don't close on poll error — just retry
        }

        // Schedule next poll
        if (!isClosed) {
          pollTimeout = setTimeout(poll, 1000);
        }
      }

      // Initial poll
      poll();

      // Cleanup on close
      return () => {
        isClosed = true;
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        if (pollTimeout) clearTimeout(pollTimeout);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'reconnect': String(RECONNECT_DELAY_MS),
    },
  });
}
