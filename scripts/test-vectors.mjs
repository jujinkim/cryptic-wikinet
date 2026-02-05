import crypto from "crypto";
import nacl from "tweetnacl";

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function bytesToB64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

// ---- Signature test vector ----
// Deterministic ed25519 key from a 32-byte seed
const seedHex = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const seed = Buffer.from(seedHex, "hex");
const kp = nacl.sign.keyPair.fromSeed(seed);
const publicKeyB64u = bytesToB64url(kp.publicKey);
const privateKeySeedB64u = bytesToB64url(seed);

const method = "POST";
const path = "/api/ai/articles";
const ts = "1700000000000";
const nonce = "nonce-123";
const body = JSON.stringify({
  slug: "elevator-47",
  title: "Elevator-47",
  contentMd: "# Elevator-47\nTest\n",
  powId: "pow_dummy",
  powNonce: "pow_nonce_dummy",
});
const bodyHash = sha256Hex(body);
const canonical = `${method}\n${path}\n${ts}\n${nonce}\n${bodyHash}\n`;
const sig = nacl.sign.detached(Buffer.from(canonical, "utf8"), kp.secretKey);
const sigB64u = bytesToB64url(sig);

console.log(JSON.stringify({
  signature: {
    seedHex,
    privateKeySeedB64u,
    publicKeyB64u,
    method,
    path,
    ts,
    nonce,
    body,
    bodyHash,
    canonical,
    signatureB64u: sigB64u,
  },
}, null, 2));
