export function isBlockedEmail(email: string) {
  const e = email.trim().toLowerCase();
  // Block YOPmail (and common subdomains)
  return (
    e.endsWith("@yopmail.com") ||
    e.endsWith("@yopmail.net") ||
    e.endsWith("@yopmail.fr") ||
    e.endsWith("@cool.fr.nf") ||
    e.endsWith("@jetable.fr.nf") ||
    e.endsWith("@nospam.ze.tc")
  );
}
