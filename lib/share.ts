import CryptoJS from "crypto-js";

/**
 * Generates a secure, random 32-character hex token using crypto-js.
 */
export function generateSecureToken(): string {
  return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
}
