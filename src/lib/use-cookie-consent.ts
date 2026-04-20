"use client";

import { useEffect, useState } from "react";

import {
  COOKIE_CONSENT_CHANGED_EVENT,
  getCookieConsentState,
  readClientCookieConsentState,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";

export function useCookieConsent(initialChoice?: CookieConsentChoice | null) {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(() => {
    if (initialChoice !== undefined) return initialChoice;
    return readClientCookieConsentState().choice;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncChoice: EventListener = () => {
      setChoice(readClientCookieConsentState().choice);
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncChoice);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncChoice);
  }, []);

  return getCookieConsentState(choice);
}
