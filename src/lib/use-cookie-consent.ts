"use client";

import { useEffect, useState } from "react";

import {
  COOKIE_CONSENT_CHANGED_EVENT,
  allowsPreferenceStorage,
  readClientCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";

export function useCookieConsent(initialChoice?: CookieConsentChoice | null) {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(() => {
    if (initialChoice !== undefined) return initialChoice;
    return readClientCookieConsent();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncChoice: EventListener = () => {
      setChoice(readClientCookieConsent());
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncChoice);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncChoice);
  }, []);

  return {
    choice,
    allowsPreferences: allowsPreferenceStorage(choice),
  };
}
