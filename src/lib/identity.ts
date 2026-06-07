// Device-local identity management for SufiSoul

const IDENTITY_KEY = 'sufisoul_identity';

export interface Identity {
  device_uuid: string;
  takhallus: string;
}

export function getIdentity(): Identity | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(IDENTITY_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveIdentity(takhallus: string, device_uuid?: string): Identity {
  const current = getIdentity();
  const uuid = device_uuid || current?.device_uuid || crypto.randomUUID();
  const identity: Identity = {
    device_uuid: uuid,
    takhallus: takhallus.trim()
  };
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

export function initializeIdentity(): Identity {
  const current = getIdentity();
  if (current) return current;
  
  // Default fallback if not initialized, but we will prompt the user
  const generatedUuid = crypto.randomUUID();
  const defaultIdentity = {
    device_uuid: generatedUuid,
    takhallus: 'Sufi'
  };
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(defaultIdentity));
  return defaultIdentity;
}
