"use client";

import { useEffect, useState } from "react";

import {
  readPreferenceStorageItem,
  writePreferenceStorageItem,
  removePreferenceStorageItem,
  type PreferenceStorageKey,
} from "@/lib/cookie-consent";
import { useCookieConsent } from "@/lib/use-cookie-consent";

export function usePreferenceStorage(key: PreferenceStorageKey) {
  const { choice, allowsPreferences } = useCookieConsent();
  const [value, setValue] = useState<string | null>(() => readPreferenceStorageItem(key));

  useEffect(() => {
    setValue(readPreferenceStorageItem(key, choice));
  }, [key, choice]);

  function setStoredValue(next: string) {
    const didWrite = writePreferenceStorageItem(key, next, choice);
    setValue(didWrite ? next : null);
    return didWrite;
  }

  function clearStoredValue() {
    removePreferenceStorageItem(key);
    setValue(null);
  }

  return {
    value: allowsPreferences ? value : null,
    setValue: setStoredValue,
    clearValue: clearStoredValue,
    allowsPreferences,
    choice,
  };
}
