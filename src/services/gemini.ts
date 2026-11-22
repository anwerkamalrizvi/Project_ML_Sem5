import { TripPreferences, TripPlan, ChatMessage } from '../types';

// BUG-14 fix: use the Vite dev-server proxy path (/api) in development.
// In production, VITE_BACKEND_URL should be set to the full backend URL.
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined)
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api'; // proxied by Vite in dev (vite.config.ts proxy rule)

// ─────────────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────────────
export async function checkBackendHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    // Combine caller's signal with a 4-second timeout (BUG-06 fix)
    const timeout = AbortSignal.timeout(4000);
    let combined: AbortSignal = timeout;
    if (signal) {
      if (typeof (AbortSignal as any).any === 'function') {
        combined = (AbortSignal as any).any([signal, timeout]);
      } else {
        combined = signal;
      }
    }


    const response = await fetch(`${BACKEND_URL}/health`, { signal: combined });
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Trip Plan Generation
// ─────────────────────────────────────────────────────────────────────
export async function generateTripPlan(prefs: TripPreferences): Promise<TripPlan> {
  try {
    const response = await fetch(`${BACKEND_URL}/generate_plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.detail || `Backend error: HTTP ${response.status}`
      );
    }

    const data = await response.json();
    return data as TripPlan;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(
      'Failed to generate trip plan. Please ensure the Python backend is running on port 8000.'
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Streaming Chat
// ─────────────────────────────────────────────────────────────────────
export async function* streamChatResponse(
  messages: ChatMessage[],
  tripContext?: TripPlan
): AsyncGenerator<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        tripContext: tripContext || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend chat error: HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const content = trimmed.substring(6).trim();
        if (content === '[DONE]') return;
        try {
          const parsed = JSON.parse(content);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) yield parsed.text;
        } catch {
          yield content;
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Failed to connect to chat assistant. Please ensure the Python backend is running.');
  }
}

// ─────────────────────────────────────────────────────────────────────
// Budget Optimisation
// ─────────────────────────────────────────────────────────────────────
export async function generateBudgetOptimization(
  prefs: TripPreferences,
  currentBudget: Record<string, number>
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/optimize_budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: prefs, currentBudget }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.recommendations || 'Failed to generate recommendations.';
  } catch (error) {
    throw new Error('Failed to generate budget tips. Please check if backend is running.');
  }
}

// ─────────────────────────────────────────────────────────────────────
// Packing Advice
// ─────────────────────────────────────────────────────────────────────
export async function generatePackingAdvice(
  prefs: TripPreferences,
  weather: string
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/packing_advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: prefs, weather }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.advice || 'Failed to generate packing advice.';
  } catch (error) {
    throw new Error('Failed to generate packing advice. Please check if backend is running.');
  }
}