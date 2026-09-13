import { createHash, randomBytes } from "crypto";

export function generateCodeVerifier(length = 64): string {
  return base64Url(randomBytes(length));
}

export function generateCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return base64Url(hash);
}

export function verifyPkce(verifier: string, challenge: string): boolean {
  if (!verifier || !challenge) return false;
  return generateCodeChallenge(verifier) === challenge;
}

export function randomToken(bytes = 32): string {
  return base64Url(randomBytes(bytes));
}

function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
