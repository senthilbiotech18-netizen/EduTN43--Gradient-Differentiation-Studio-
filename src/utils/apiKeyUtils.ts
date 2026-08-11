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
  try {
    const res = await fetch('/api/test-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': apiKey.trim(),
      },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { valid: false, error: err.message || 'Network error while testing key' };
  }
}
