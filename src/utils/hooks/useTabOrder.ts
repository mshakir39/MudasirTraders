'use client';

import { useState, useEffect, useRef } from 'react';
import { ICategory } from '@/interfaces';

const COOKIE_KEY = 'stockTabOrder';

function readCookieRaw(): {
  order: string[];
  selectedTab: string | null;
} | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_KEY}=`));
    if (!match) return null;
    const raw = decodeURIComponent(match.split('=').slice(1).join('='));
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { order: parsed, selectedTab: null };
    return {
      order: parsed.order || [],
      selectedTab: parsed.selectedTab || null,
    };
  } catch {
    return null;
  }
}

function writeCookie(order: string[], selectedTab: string) {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(JSON.stringify({ order, selectedTab }));
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_KEY}=${value}; expires=${expires.toUTCString()}; path=/`;
}

export function useTabOrder(categories: ICategory[]) {
  const applied = useRef(false);
  const ready = useRef(false);

  // Start empty — the effect below will populate from cookie or fall back to API order
  const [orderedCategories, setOrderedCategories] = useState<ICategory[]>([]);
  const [currentBrandName, setCurrentBrandName] = useState<string>('');

  // Runs once when categories arrive from the server
  useEffect(() => {
    if (categories.length === 0 || applied.current) return;
    applied.current = true;

    const cookie = readCookieRaw();

    if (!cookie) {
      // No cookie — use API order, select first
      setOrderedCategories(categories);
      setCurrentBrandName(categories[0].brandName);
      ready.current = true;
      return;
    }

    // Reorder categories according to saved order
    const reordered = cookie.order
      .map((name) => categories.find((cat) => cat.brandName === name))
      .filter(Boolean) as ICategory[];

    // Append any new brands not in the saved order
    const savedNames = new Set(reordered.map((c) => c.brandName));
    const newCats = categories.filter((c) => !savedNames.has(c.brandName));
    const finalOrder = [...reordered, ...newCats];

    // Restore selected tab — verify it still exists
    const savedTab = cookie.selectedTab;
    const tabExists =
      savedTab && finalOrder.some((c) => c.brandName === savedTab);
    const brand = tabExists ? savedTab! : finalOrder[0].brandName;

    setOrderedCategories(finalOrder);
    setCurrentBrandName(brand);
    ready.current = true;
  }, [categories]);

  // Persist to cookie — but only after the initial restore is done
  useEffect(() => {
    if (!ready.current || !currentBrandName || orderedCategories.length === 0)
      return;
    writeCookie(
      orderedCategories.map((cat) => cat.brandName),
      currentBrandName
    );
  }, [orderedCategories, currentBrandName]);

  return {
    orderedCategories,
    setOrderedCategories,
    currentBrandName,
    setCurrentBrandName,
  };
}
