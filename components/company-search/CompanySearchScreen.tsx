"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search, Building2, MapPin, CheckCircle, ArrowRight, Loader2, AlertCircle, X } from "lucide-react";
import { screenVariants, screenTransition } from "@/lib/motion";
import { useCompanyLookup } from "@/hooks/useCompanyLookup";
import type { CompanyResult } from "@/lib/handelsregister-client";

interface CompanySearchScreenProps {
  onCompanyConfirmed: (company: CompanyResult) => void;
  onSkip: () => void;
}

export function CompanySearchScreen({ onCompanyConfirmed, onSkip }: CompanySearchScreenProps) {
  const t = useTranslations("CompanySearch");
  const {
    results,
    isSearching,
    error,
    selectedCompany,
    searchCompany,
    selectCompany,
    clearSelection,
  } = useCompanyLookup();

  const [inputValue, setInputValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    clearSelection();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchCompany(value.trim());
      }, 500);
    }
  };

  const handleConfirm = () => {
    if (selectedCompany) {
      onCompanyConfirmed(selectedCompany);
    }
  };

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={screenTransition}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-xl mb-4">
            <Building2 className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full pl-12 pr-10 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {inputValue && (
            <button
              onClick={() => { setInputValue(""); clearSelection(); }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Selected Company Confirmation */}
        {selectedCompany && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-blue-500 bg-blue-50/50 rounded-xl p-4 sm:p-5 mb-6"
          >
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                  {selectedCompany.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-600">
                  {selectedCompany.register_num && (
                    <span className="font-mono">{selectedCompany.register_num}</span>
                  )}
                  {selectedCompany.state && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedCompany.state}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedCompany.status === "aktuell"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {selectedCompany.status}
                  </span>
                </div>
              </div>
            </div>

            {selectedCompany.gegenstand && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-gray-500 mb-1">{t("gegenstand")}</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedCompany.gegenstand}
                </p>
              </div>
            )}

            {!selectedCompany.gegenstand && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  {t("noGegenstand")}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Results List */}
        {!selectedCompany && results.length > 0 && (
          <div className="space-y-2 mb-6 max-h-[320px] overflow-y-auto">
            <p className="text-xs text-gray-500 font-medium px-1 mb-2">
              {t("resultsCount", { count: results.length })}
            </p>
            {results.map((company, i) => (
              <motion.button
                key={`${company.name}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => selectCompany(company)}
                className="w-full text-left p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate group-hover:text-blue-700">
                      {company.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      {company.register_num && (
                        <span className="text-xs text-gray-500 font-mono">{company.register_num}</span>
                      )}
                      {company.state && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {company.state}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 shrink-0 mt-1" />
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isSearching && !error && results.length === 0 && inputValue.length >= 2 && !selectedCompany && (
          <div className="text-center py-6 text-gray-500 text-sm">
            {t("noResults")}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={onSkip}
            className="px-4 py-2.5 rounded-lg font-medium text-gray-500 hover:bg-gray-100 transition-colors text-sm"
          >
            {t("skip")}
          </button>

          <button
            onClick={handleConfirm}
            disabled={!selectedCompany}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-colors ${
              selectedCompany
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {t("confirm")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
