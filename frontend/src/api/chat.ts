// API base URL — swap for production
const API_BASE = import.meta.env.VITE_API_URL || 'https://tripmate.royal300.com/api';

export interface ChatResponseDone {
  responseType: 'text' | 'packages' | 'lead_form' | 'escalation';
  packages?: any[];
  capturedLead?: { name: string; phone_number: string } | null;
  escalated?: boolean;
  sessionId: string;
}

export interface ChatCallbacks {
  onToken: (text: string) => void;
  onDone: (meta: ChatResponseDone) => void;
  onError: (msg: string) => void;
}

let currentController: AbortController | null = null;

export async function sendChatMessage(
  message: string,
  sessionId: string | null,
  callbacks: ChatCallbacks
): Promise<void> {
  // Cancel any in-flight request
  if (currentController) {
    currentController.abort();
  }
  currentController = new AbortController();

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
      signal: currentController.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Server error' }));
      callbacks.onError(err.error || 'Server error');
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7).trim();
          const dataLine = lines[lines.indexOf(line) + 1] || '';
          if (!dataLine.startsWith('data: ')) continue;
          const data = JSON.parse(dataLine.slice(6));

          if (eventType === 'token') {
            callbacks.onToken(data.text);
          } else if (eventType === 'done') {
            callbacks.onDone(data as ChatResponseDone);
          } else if (eventType === 'error') {
            callbacks.onError(data.message);
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('Chat API error:', err);
      callbacks.onError("I'm having trouble connecting. Please try again.");
    }
  } finally {
    currentController = null;
  }
}

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
