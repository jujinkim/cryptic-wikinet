export const COOKIE_NOTICE_COOKIE = "cw_cookie_notice";
export const COOKIE_NOTICE_MAX_AGE = 60 * 60 * 24 * 180;
export const COOKIE_CONSENT_CHANGED_EVENT = "cw:cookie-consent-changed";
export const COOKIE_CONSENT_OPEN_EVENT = "cw:cookie-consent-open";
export const LOCALE_PROMPT_DISMISS_STORAGE_KEY = "cw.localePrompt.dismissed";
export const WIKI_SIDEBAR_SIDE_STORAGE_KEY = "cw.sidebarSide";

// Register future optional browser-storage keys here so consent revocation clears them too.
export const PREFERENCE_STORAGE_KEYS = [
  LOCALE_PROMPT_DISMISS_STORAGE_KEY,
  WIKI_SIDEBAR_SIDE_STORAGE_KEY,
] as const;

export const COOKIE_CONSENT_CHOICES = ["essential", "preferences"] as const;

export type CookieConsentChoice = (typeof COOKIE_CONSENT_CHOICES)[number];
export type PreferenceStorageKey = (typeof PREFERENCE_STORAGE_KEYS)[number];
export type CookieConsentState = {
  choice: CookieConsentChoice | null;
  allowsPreferences: boolean;
};

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

export function getCookieConsentState(choice: CookieConsentChoice | null | undefined): CookieConsentState {
  const normalizedChoice = choice ?? null;
  return {
    choice: normalizedChoice,
    allowsPreferences: allowsPreferenceStorage(normalizedChoice),
  };
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

export function readClientCookieConsentState() {
  return getCookieConsentState(readClientCookieConsent());
}

export function readPreferenceStorageItem(
  key: PreferenceStorageKey,
  choice: CookieConsentChoice | null | undefined = readClientCookieConsent(),
) {
  if (typeof window === "undefined" || !allowsPreferenceStorage(choice)) return null;
  return window.localStorage.getItem(key);
}

export function writePreferenceStorageItem(
  key: PreferenceStorageKey,
  value: string,
  choice: CookieConsentChoice | null | undefined = readClientCookieConsent(),
) {
  if (typeof window === "undefined" || !allowsPreferenceStorage(choice)) return false;
  window.localStorage.setItem(key, value);
  return true;
}

export function removePreferenceStorageItem(key: PreferenceStorageKey) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function clearPreferenceStorage() {
  if (typeof window === "undefined") return;

  for (const key of PREFERENCE_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
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
