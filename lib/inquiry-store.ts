"use client";

import { useSyncExternalStore } from "react";

/**
 * Seznam povpraševanja (podoben košarici, brez plačila).
 * Shranjen samo v brskalniku obiskovalca (localStorage); na strežnik gre
 * šele ob oddaji obrazca.
 */

export type InquiryItem = {
  id: number;
  naziv: string;
  href: string;
  kolicina: number;
};

const KEY = "gc-povprasevanje";
const EVENT = "gc:povprasevanje";
const MAX_ITEMS = 30;
const EMPTY: InquiryItem[] = [];

let cache: { raw: string | null; items: InquiryItem[] } = { raw: null, items: EMPTY };

function read(): InquiryItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.items;
  let items: InquiryItem[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      items = parsed
        .filter(
          (x): x is InquiryItem =>
            typeof x?.id === "number" && typeof x?.naziv === "string" && typeof x?.href === "string",
        )
        .map((x) => ({ ...x, kolicina: Math.min(99, Math.max(1, Math.floor(Number(x.kolicina) || 1))) }))
        .slice(0, MAX_ITEMS);
    }
  } catch {
    items = EMPTY;
  }
  cache = { raw, items };
  return items;
}

function write(items: InquiryItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Zasebno okno ali onemogočena shramba: seznam ostane prazen.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) callback();
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function useInquiryList(): InquiryItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addToInquiry(item: Omit<InquiryItem, "kolicina">) {
  const items = read();
  if (items.some((x) => x.id === item.id)) return;
  write([...items, { ...item, kolicina: 1 }]);
}

export function setQuantity(id: number, kolicina: number) {
  write(read().map((x) => (x.id === id ? { ...x, kolicina: Math.min(99, Math.max(1, kolicina)) } : x)));
}

export function removeFromInquiry(id: number) {
  write(read().filter((x) => x.id !== id));
}

export function clearInquiry() {
  write([]);
}
