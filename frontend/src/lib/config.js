import { Capacitor } from '@capacitor/core';

/** Backend URL for native app — change to your PC IP when testing on a real phone */
const DEV_HOST = import.meta.env.VITE_DEV_HOST || '10.0.2.2';

export const isNative = Capacitor.isNativePlatform();

export function getApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (isNative) return `http://${DEV_HOST}:5000/api`;
  return '/api';
}

export function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (isNative) return `http://${DEV_HOST}:5000`;
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000`;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
}
