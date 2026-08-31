import crypto from "crypto";

// Server-side AES-256-GCM encryption for vault secrets (passwords, TOTP
// seeds). This is the "server-side encryption" approach we chose over
// zero-knowledge: simpler to build, still meets "never stored in plain
// text," but the server (not just the client) holds the key. The key
// itself lives only in VAULT_ENCRYPTION_KEY, never in the database, and
// should be rotated via a re-encryption migration if it's ever exposed.
//
// If this project ever needs to upgrade to zero-knowledge (Phase 2+),
// this file is the only place that changes — encrypt/decrypt would move
// client-side and this file would be deleted.

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.VAULT_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "VAULT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate one with: openssl rand -hex 32"
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plaintext: string): {
  ciphertext: string;
  iv: string;
} {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  // Store ciphertext + auth tag together; iv stored separately per row.
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64")
  };
}

export function decryptSecret(ciphertext: string, iv: string): string {
  const raw = Buffer.from(ciphertext, "base64");
  const authTag = raw.subarray(raw.length - 16);
  const encrypted = raw.subarray(0, raw.length - 16);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString("utf8");
}
