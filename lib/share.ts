import crypto from "crypto";

/**
 * Generates a secure, random 32-character hex token using Node's crypto.randomBytes.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(16).toString("hex");
}
