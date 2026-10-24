import { Platform } from 'react-native';

const STORAGE_KEYS = {
  ENABLED: 'tutorapp_security_enabled',
  PIN: 'tutorapp_security_pin',
  USE_FACEID: 'tutorapp_use_faceid',
};

/**
 * Comprueba si la plataforma web admite WebAuthn (Face ID / Touch ID en Safari / iOS)
 */
export const isFaceIdAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Comprueba si la seguridad está habilitada
 */
export const isSecurityEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEYS.ENABLED) === 'true';
  } catch {
    return false;
  }
};

/**
 * Comprueba si Face ID está activo
 */
export const isFaceIdEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEYS.USE_FACEID) === 'true';
  } catch {
    return false;
  }
};

/**
 * Obtiene el PIN guardado
 */
export const getStoredPin = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.PIN);
  } catch {
    return null;
  }
};

/**
 * Registra y activa Face ID en el iPhone mediante la API WebAuthn del navegador
 */
export const registerFaceId = async (): Promise<boolean> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'TutorApp Clases',
          id: window.location.hostname || undefined,
        },
        user: {
          id: userId,
          name: 'profesor',
          displayName: 'Profesor Cristian',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Obliga a usar Face ID / Touch ID del dispositivo
          userVerification: 'required',
        },
        timeout: 60000,
      },
    });

    if (credential) {
      localStorage.setItem(STORAGE_KEYS.USE_FACEID, 'true');
      return true;
    }
  } catch (err: any) {
    console.warn('Face ID registration declined or not supported:', err?.message || err);
    return false;
  }
  return false;
};

/**
 * Solicita autenticación mediante Face ID (muestra el modal nativo de Face ID de Apple)
 */
export const authenticateWithFaceId = async (): Promise<boolean> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !navigator.credentials) {
    return false;
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'required', // Dispara el escáner de Face ID
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch (err: any) {
    console.warn('Face ID authentication error or cancelled:', err?.message || err);
    return false;
  }
};

/**
 * Valida un PIN introducido contra el guardado
 */
export const verifyPin = (inputPin: string): boolean => {
  const stored = getStoredPin();
  if (!stored) return true;
  return inputPin === stored;
};

/**
 * Guarda y activa la seguridad con PIN y opcionalmente Face ID
 */
export const setupSecurity = async (pin: string, useFaceId: boolean): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEYS.PIN, pin);
    localStorage.setItem(STORAGE_KEYS.ENABLED, 'true');

    if (useFaceId) {
      const faceIdSuccess = await registerFaceId();
      if (!faceIdSuccess) {
        // Aunque Face ID falle o se cancele, el PIN queda activo
        localStorage.setItem(STORAGE_KEYS.USE_FACEID, 'false');
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.USE_FACEID, 'false');
    }

    return true;
  } catch (e) {
    console.error('Error setting up security:', e);
    return false;
  }
};

/**
 * Desactiva la protección de seguridad
 */
export const disableSecurity = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.ENABLED);
    localStorage.removeItem(STORAGE_KEYS.PIN);
    localStorage.removeItem(STORAGE_KEYS.USE_FACEID);
  } catch (e) {
    console.error('Error disabling security:', e);
  }
};
