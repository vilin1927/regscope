"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { NewsletterPreferences } from "@/types/addons";

const DEFAULTS: NewsletterPreferences = {
  optedIn: false,
  frequency: "weekly",
  areas: [],
};

export function useNewsletterPreferences(userId: string | undefined) {
  const [preferences, setPreferences] =
    useState<NewsletterPreferences>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const mountedRef = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Load preferences on mount
  useEffect(() => {
    if (!userId) {
      setPreferences(DEFAULTS);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch("/api/newsletter/preferences")
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setPreferences(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const update = useCallback(
    (partial: Partial<NewsletterPreferences>) => {
      // Optimistic update
      setPreferences((prev) => {
        const next = { ...prev, ...partial };

        // Debounced save to API
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
          if (!mountedRef.current) return;
          setIsSaving(true);
          setError(undefined);

          try {
            const res = await fetch("/api/newsletter/preferences", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(next),
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Save failed");
            }
          } catch (err) {
            if (mountedRef.current) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Fehler beim Speichern"
              );
            }
          } finally {
            if (mountedRef.current) {
              setIsSaving(false);
            }
          }
        }, 500);

        return next;
      });
    },
    []
  );

  return { preferences, isLoading, isSaving, error, update };
}
