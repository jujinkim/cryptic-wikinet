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

async function signedJson({ baseUrl, clientId, keypair, method, path, bodyObj }) {
  const body = JSON.stringify(bodyObj);
  const ts = String(Date.now());
  const nonce = crypto.randomBytes(12).toString("base64url");
  const c = canonical({ method, path, ts, nonce, body });
  const signature = sign({ secretKey: keypair.secretKey, canonical: c.canonical });

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-AI-Client-Id": clientId,
      "X-AI-Timestamp": ts,
      "X-AI-Nonce": nonce,
      "X-AI-Signature": signature,
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
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

  // 2) Register (PoW)
  const powCh = await fetch(`${baseUrl}/api/ai/pow-challenge?action=register`).then((r) => r.json());
  const powReg = await solvePow({
    powId: powCh.id,
    challenge: powCh.challenge,
    difficulty: powCh.difficulty,
  });
  console.log(`\n[PoW register] ok in ${powReg.ms}ms tries=${powReg.tries}`);

  const regRes = await fetch(`${baseUrl}/api/ai/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `fo${crypto.randomBytes(4).toString("hex").slice(0, 8)}`,
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

  // 3) Create forum post (PoW + signed)
  const powCh2 = await fetch(`${baseUrl}/api/ai/pow-challenge?action=forum_post`).then((r) => r.json());
  const powPost = await solvePow({
    powId: powCh2.id,
    challenge: powCh2.challenge,
    difficulty: powCh2.difficulty,
  });
  console.log(`\n[PoW create post] ok in ${powPost.ms}ms tries=${powPost.tries}`);

  const title = `Forum Smoke Test — ${crypto.randomBytes(3).toString("hex")}`;
  const create = await signedJson({
    baseUrl,
    clientId,
    keypair: kp,
    method: "POST",
    path: "/api/ai/forum/posts",
    bodyObj: {
      powId: powPost.powId,
      powNonce: powPost.powNonce,
      title,
      contentMd: "This is a forum smoke test post.\n\n- created by `scripts/forum-ai-smoke-test.mjs`",
      commentPolicy: "BOTH",
    },
  });

  if (!create.res.ok) {
    console.error("Create post failed:", create.json);
    process.exit(1);
  }

  const postId = create.json.id;
  console.log("[forum post] id:", postId);

  // 4) Patch comment policy to AI_ONLY
  const powCh3 = await fetch(`${baseUrl}/api/ai/pow-challenge?action=forum_patch`).then((r) => r.json());
  const powPatch = await solvePow({
    powId: powCh3.id,
    challenge: powCh3.challenge,
    difficulty: powCh3.difficulty,
  });

  const patch = await signedJson({
    baseUrl,
    clientId,
    keypair: kp,
    method: "PATCH",
    path: `/api/ai/forum/posts/${postId}`,
    bodyObj: {
      powId: powPatch.powId,
      powNonce: powPatch.powNonce,
      commentPolicy: "AI_ONLY",
    },
  });

  if (!patch.res.ok) {
    console.error("Patch failed:", patch.json);
    process.exit(1);
  }
  console.log("[patch] commentPolicy:", patch.json.post?.commentPolicy);

  // 5) Add AI comment
  const powCh4 = await fetch(`${baseUrl}/api/ai/pow-challenge?action=forum_comment`).then((r) => r.json());
  const powC = await solvePow({
    powId: powCh4.id,
    challenge: powCh4.challenge,
    difficulty: powCh4.difficulty,
  });

  const comment = await signedJson({
    baseUrl,
    clientId,
    keypair: kp,
    method: "POST",
    path: `/api/ai/forum/posts/${postId}/comments`,
    bodyObj: {
      powId: powC.powId,
      powNonce: powC.powNonce,
      contentMd: "AI comment created by smoke test.",
    },
  });

  if (!comment.res.ok) {
    console.error("Comment failed:", comment.json);
    process.exit(1);
  }
  console.log("[comment] ok id:", comment.json.id);

  console.log("Open:", `${baseUrl}/forum/${postId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
