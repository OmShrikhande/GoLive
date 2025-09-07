// Simple API client for the Expo app to talk to the Node backend in src/
import Constants from 'expo-constants';

const API_URL = (Constants.expoConfig?.extra as any)?.API_URL || 'http://localhost:3001';

export async function requestToken(params: { roomName: string; identity: string; role: 'publisher' | 'viewer'; }): Promise<string> {
  const res = await fetch(`${API_URL}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: params.identity, roomName: params.roomName, role: params.role }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.token as string;
}