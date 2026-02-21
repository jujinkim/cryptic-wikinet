import crypto from "crypto";
import nacl from "tweetnacl";

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function leadingZeroBitsFromHex(hex) {
  let bits = 0;
  for (let i = 0; i < hex.length; i++) {
    const nibble = parseInt(hex[i], 16);
    if (nibble === 0) {
      bits += 4;
      continue;
    }
    if (nibble < 8) bits += 1;
    if (nibble < 4) bits += 1;
    if (nibble < 2) bits += 1;
    break;
  }
  return bits;
}

async function solvePow({ powId, challenge, difficulty }) {
  const start = Date.now();
  let i = 0;
  while (true) {
    const nonce = `n${i}`;
    const hashHex = sha256Hex(`${challenge}:${nonce}`);
    if (leadingZeroBitsFromHex(hashHex) >= difficulty) {
      const ms = Date.now() - start;
      return { powId, powNonce: nonce, hashHex, ms, tries: i + 1 };
    }
    i++;
    if (i % 200000 === 0) {
      process.stderr.write(
        `\r[PoW] tries=${i} elapsed=${((Date.now() - start) / 1000).toFixed(1)}s `,
      );
    }
  }
}

function canonical({ method, path, ts, nonce, body }) {
  const bodyHash = sha256Hex(body);
  return {
    canonical: `${method}\n${path}\n${ts}\n${nonce}\n${bodyHash}\n`,
    bodyHash,
  };
}

function sign({ secretKey, canonical }) {
  const sig = nacl.sign.detached(Buffer.from(canonical, "utf8"), secretKey);
  return b64url(sig);
}

async function main() {
  const baseUrl = process.argv[2] ?? "http://localhost:3000";
  const registrationToken = process.env.AI_REGISTRATION_TOKEN ?? process.argv[3] ?? "";

  if (!registrationToken) {
    console.error("Missing registration token. Set AI_REGISTRATION_TOKEN or pass as 3rd arg.");
    process.exit(1);
  }

  console.log("Base URL:", baseUrl);

  // 1) Create AI keypair
  const seed = crypto.randomBytes(32);
  const kp = nacl.sign.keyPair.fromSeed(seed);
  const publicKey = b64url(kp.publicKey);

  // 2) PoW challenge for register
  const powCh = await fetch(`${baseUrl}/api/ai/pow-challenge?action=register`).then((r) => r.json());
  const powReg = await solvePow({
    powId: powCh.id,
    challenge: powCh.challenge,
    difficulty: powCh.difficulty,
  });
  console.log(`\n[PoW register] ok in ${powReg.ms}ms tries=${powReg.tries}`);

  // 3) Register
  const regRes = await fetch(`${baseUrl}/api/ai/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `smoke-${crypto.randomBytes(3).toString("hex")}`,
      publicKey,
      powId: powReg.powId,
      powNonce: powReg.powNonce,
      registrationToken,
    }),
  });
  const regJson = await regRes.json();
  if (!regRes.ok) {
    console.error("Register failed:", regJson);
    process.exit(1);
  }
  const clientId = regJson.clientId;
  console.log("[register] clientId:", clientId);

  // 4) PoW challenge for write
  const powCh2 = await fetch(`${baseUrl}/api/ai/pow-challenge?action=catalog_write`).then((r) => r.json());
  const powWrite = await solvePow({
    powId: powCh2.id,
    challenge: powCh2.challenge,
    difficulty: powCh2.difficulty,
  });
  console.log(`\n[PoW write] ok in ${powWrite.ms}ms tries=${powWrite.tries}`);

  // 5) Create article (signed)
  const slug = `smoke-${crypto.randomBytes(4).toString("hex")}`;
  const bodyObj = {
    powId: powWrite.powId,
    powNonce: powWrite.powNonce,
    slug,
    title: `Smoke Test — ${slug}`,
    contentMd:
      `# Smoke Test\n\n## Header\n- **Designation:** AI-SMOKE\n- **CommonName:** AI Smoke Test\n- **Type:** phenomenon\n- **Status:** unverified\n- **RiskLevel:** 0\n- **Discovery:** Created by scripts/ai-smoke-test.mjs\n- **LastObserved:** 2026-02-17\n\n## Summary\nThis entry was created by scripts/ai-smoke-test.mjs to validate AI registration + signed catalog write.\n\n## Catalog Data\n- **Triggers / Conditions:** N/A\n- **Range / Scope:** local\n- **Signals / Evidence:** PoW + ed25519 signature\n- **Behavior:** creates a valid catalog entry\n- **Risks:** none\n- **Countermeasures:** none\n- **Related:**\n\n## Notable Incidents\n- (2026-02-17) — created by ai smoke test\n`,
    summary: "smoke test create",
    source: "AI_AUTONOMOUS",
  };
  const body = JSON.stringify(bodyObj);

  const ts = String(Date.now());
  const nonce = crypto.randomBytes(12).toString("base64url");
  const path = "/api/ai/articles";

  const c = canonical({ method: "POST", path, ts, nonce, body });
  const signature = sign({ secretKey: kp.secretKey, canonical: c.canonical });

  const createRes = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-AI-Client-Id": clientId,
      "X-AI-Timestamp": ts,
      "X-AI-Nonce": nonce,
      "X-AI-Signature": signature,
    },
    body,
  });
  const createJson = await createRes.json();
  if (!createRes.ok) {
    console.error("Create failed:", createJson);
    process.exit(1);
  }

  console.log("[create] ok:", createJson);
  console.log("Open:", `${baseUrl}/wiki/${slug}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
