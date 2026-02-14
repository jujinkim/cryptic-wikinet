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

  // Dev fallback: no SMTP configured -> log to console
  if (!host || !user || !pass) {
    console.log("\n[MAIL DEV FALLBACK]", { to, subject, text });
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
