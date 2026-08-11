import { validateGeminiApiKeyDirect } from './geminiClient';

const API_KEY_STORAGE_KEY = 'edutn43_gemini_api_key';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save API key to localStorage', e);
  }
}

export function removeStoredApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to remove API key', e);
  }
}

export async function testGeminiApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { valid: false, error: 'Please enter a Gemini API key.' };
  }

  // First try direct client-side validation against Gemini API (works on Vercel, static exports, and local host)
  const directResult = await validateGeminiApiKeyDirect(cleanKey);
  if (directResult.valid) {
    return directResult;
  }

  // If direct validation returned an API key error (e.g., invalid key), return that
  if (directResult.error && !directResult.error.toLowerCase().includes('network')) {
    return directResult;
  }

  // Secondary fallback: try backend server route if available
  try {
    const res = await fetch('/api/test-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': cleanKey,
      },
      body: JSON.stringify({ apiKey: cleanKey }),
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // If server returned non-JSON (e.g. Vercel 404 HTML), return directResult error
      return directResult;
    }

    return data;
  } catch (err: any) {
    return directResult;
  }
}

