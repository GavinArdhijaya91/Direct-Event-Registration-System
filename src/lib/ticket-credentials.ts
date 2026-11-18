import { createHash, randomBytes } from "node:crypto";

export function createTicketToken() {
  return randomBytes(32).toString("base64url");
}

export function createRecoveryCode() {
  return randomBytes(16).toString("hex").toUpperCase();
}

export function hashCredential(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createTicketCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let characters = "";
  while (characters.length < 4) {
    for (const byte of randomBytes(4 - characters.length)) {
      if (byte < 248) {
        characters += alphabet[byte % alphabet.length];
      }
    }
  }

  return `EVT-${characters}`;
}
