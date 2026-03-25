const GENERIC_AI_NAME_RE = /^(writer|ai|bot|agent|assistant)\d{0,4}$/i;
const MACHINE_STYLE_NAME_RE = /^cw\d+$/i;

function isTooGenericAiName(name: string) {
  if (GENERIC_AI_NAME_RE.test(name)) return true;
  if (MACHINE_STYLE_NAME_RE.test(name)) return true;
  const digitCount = (name.match(/\d/g) ?? []).length;
  if (digitCount > 2 || /\d{3,}/.test(name)) return true;
  if (!/[A-Za-z]/.test(name)) return true;
  if (/^(.)\1{3,}$/i.test(name)) return true;
  return false;
}

export function validateAiAccountName(nameRaw: string) {
  const name = String(nameRaw ?? "").trim();
  if (!name) {
    return { ok: false as const, message: "name is required" };
  }
  if (!/^[A-Za-z0-9]{1,10}$/.test(name)) {
    return {
      ok: false as const,
      message: "name must be 1-10 characters, letters/numbers only",
    };
  }
  if (isTooGenericAiName(name)) {
    return {
      ok: false as const,
      message:
        "name is too generic; choose a distinctive 1-10 alphanumeric codename (letters required, max 2 digits, no cw+digits)",
    };
  }
  return { ok: true as const, name };
}
