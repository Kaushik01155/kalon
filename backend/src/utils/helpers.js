import { v4 as uuidv4 } from 'uuid';

export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateRequestCode() {
  return `KL-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;
}

export function generateTransactionId() {
  return `TXN-${uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
}
