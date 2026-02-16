#!/usr/bin/env node

import { prisma, disconnect } from "./_prisma.mjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/make-admin.mjs <email>");
  process.exit(2);
}

try {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, emailVerified: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    console.error("Create an account via /signup first (or insert the user), then re-run.");
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`Already ADMIN: ${email}`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`Promoted to ADMIN: ${email}`);
  if (!user.emailVerified) {
    console.log("Note: emailVerified is null. This user may still be blocked from member-only actions.");
  }
} finally {
  await disconnect();
}
