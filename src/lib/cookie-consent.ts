export const COOKIE_NOTICE_COOKIE = "cw_cookie_notice";
export const COOKIE_NOTICE_MAX_AGE = 60 * 60 * 24 * 180;
export const COOKIE_CONSENT_CHANGED_EVENT = "cw:cookie-consent-changed";
export const COOKIE_CONSENT_OPEN_EVENT = "cw:cookie-consent-open";
export const LOCALE_PROMPT_DISMISS_STORAGE_KEY = "cw.localePrompt.dismissed";
export const WIKI_SIDEBAR_SIDE_STORAGE_KEY = "cw.sidebarSide";

export const COOKIE_CONSENT_CHOICES = ["essential", "preferences"] as const;

export type CookieConsentChoice = (typeof COOKIE_CONSENT_CHOICES)[number];

export function isCookieConsentChoice(value: string | null | undefined): value is CookieConsentChoice {
  return value === "essential" || value === "preferences";
}

export function readCookieConsentChoice(value: string | null | undefined) {
  if (value === "accepted") return "essential";
  return isCookieConsentChoice(value) ? value : null;
}

export function allowsPreferenceStorage(choice: CookieConsentChoice | null | undefined) {
  return choice === "preferences";
}

export function readClientCookieConsent() {
  if (typeof document === "undefined") return null;

  const prefix = COOKIE_NOTICE_COOKIE + "=";
  const entry = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return readCookieConsentChoice(entry ? entry.slice(prefix.length) : null);
}

export function clearPreferenceStorage() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(LOCALE_PROMPT_DISMISS_STORAGE_KEY);
  window.localStorage.removeItem(WIKI_SIDEBAR_SIDE_STORAGE_KEY);
}

export function writeClientCookieConsent(choice: CookieConsentChoice) {
  if (typeof document === "undefined") return;

  if (choice === "essential") {
    clearPreferenceStorage();
  }

  document.cookie = `${COOKIE_NOTICE_COOKIE}=${choice}; Max-Age=${COOKIE_NOTICE_MAX_AGE}; Path=/; SameSite=Lax`;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: { choice } }));
  }
}

export function openCookieConsentSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}
