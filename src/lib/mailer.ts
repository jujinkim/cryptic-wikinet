import nodemailer from "nodemailer";

export async function sendMail(args: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ mode: "smtp" | "console" }> {
  const { to, subject, text } = args;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM ?? "no-reply@cryptic-wikinet.local";

  // Fallback: SMTP not configured
  // - In development: do not send, and avoid printing secrets/tokens in logs.
  // - In production: fail fast (verification email is required for member actions).
  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }
    console.log("\n[MAIL DEV FALLBACK]", { to, subject });
    return { mode: "console" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from, to, subject, text });
  return { mode: "smtp" };
}
