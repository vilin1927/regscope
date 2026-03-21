"use client";

import { useState, useCallback } from "react";
import type { CompanyResult } from "@/lib/handelsregister-client";

interface CompanyLookupState {
  results: CompanyResult[];
  isSearching: boolean;
  error: string | null;
  searchTerm: string;
  selectedCompany: CompanyResult | null;
}

export function useCompanyLookup() {
  const [state, setState] = useState<CompanyLookupState>({
    results: [],
    isSearching: false,
    error: null,
    searchTerm: "",
    selectedCompany: null,
  });

  const searchCompany = useCallback(async (term: string) => {
    if (term.trim().length < 2) return;

    setState((prev) => ({
      ...prev,
      isSearching: true,
      error: null,
      searchTerm: term,
      selectedCompany: null,
    }));

    try {
      const params = new URLSearchParams({ search: term });
      const response = await fetch(`/api/handelsregister?${params}`);
      const data = await response.json();

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          isSearching: false,
          error: data.error || "Suche fehlgeschlagen",
          results: [],
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSearching: false,
        results: data.all_results || [],
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        isSearching: false,
        error: "Verbindungsfehler. Bitte erneut versuchen.",
        results: [],
      }));
    }
  }, []);

  const selectCompany = useCallback((company: CompanyResult) => {
    setState((prev) => ({ ...prev, selectedCompany: company }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedCompany: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      results: [],
      isSearching: false,
      error: null,
      searchTerm: "",
      selectedCompany: null,
    });
  }, []);

  return {
    ...state,
    searchCompany,
    selectCompany,
    clearSelection,
    reset,
  };
}
