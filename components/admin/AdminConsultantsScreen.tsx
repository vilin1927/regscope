"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Users, Tag, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";
import { EXPERTISE_TAG_LABELS } from "@/lib/consultant-types";

interface ConsultantRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tags: string[];
  referral_code: string;
  commission_rate: number;
  is_active: boolean;
  referral_count: number;
  help_request_count: number;
  pending_requests: number;
  created_at: string;
}

export function AdminConsultantsScreen() {
  const t = useTranslations("Admin");
  const [consultants, setConsultants] = useState<ConsultantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchConsultants = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/consultants");
      const data = await res.json();
      if (res.ok) setConsultants(data.consultants || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);

  const toggleActive = async (consultantId: string, currentActive: boolean) => {
    const res = await fetch("/api/admin/consultants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultantId, is_active: !currentActive }),
    });
    if (res.ok) {
      setConsultants((prev) =>
        prev.map((c) => (c.id === consultantId ? { ...c, is_active: !currentActive } : c))
      );
    }
  };

  const updateCommission = async (consultantId: string, rate: number) => {
    const res = await fetch("/api/admin/consultants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultantId, commission_rate: rate }),
    });
    if (res.ok) {
      setConsultants((prev) =>
        prev.map((c) => (c.id === consultantId ? { ...c, commission_rate: rate } : c))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-gray-400" />
          {t("consultantsTitle")}
        </h1>
        <span className="text-sm text-gray-500">
          {consultants.length} {t("consultantsCount")}
        </span>
      </div>

      {consultants.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("noConsultants")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultants.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Main row */}
              <div
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    {c.is_active ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        {t("active")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                        {t("inactive")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{c.email}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{c.referral_count} {t("referrals")}</span>
                  <span>{c.help_request_count} {t("requests")}</span>
                  {c.pending_requests > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                      {c.pending_requests} {t("pending")}
                    </span>
                  )}
                  {expandedId === c.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === c.id && (
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-4">
                  {/* Tags */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">{t("expertiseTags")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700"
                        >
                          <Tag className="w-3 h-3" />
                          {EXPERTISE_TAG_LABELS[tag as keyof typeof EXPERTISE_TAG_LABELS] || tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Referral code */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">{t("referralCode")}</p>
                    <code className="text-sm font-bold text-blue-700 tracking-wider">{c.referral_code}</code>
                  </div>

                  {/* Commission rate */}
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-medium text-gray-500">{t("commissionRate")}</p>
                    <select
                      value={c.commission_rate}
                      onChange={(e) => updateCommission(c.id, parseFloat(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {[5, 10, 15, 20, 25, 30].map((v) => (
                        <option key={v} value={v}>
                          {v}%
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Toggle active */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(c.id, c.is_active);
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {c.is_active ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                    {c.is_active ? t("deactivate") : t("activate")}
                  </button>

                  {/* Created date */}
                  <p className="text-xs text-gray-400">
                    {t("registeredOn")} {new Date(c.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
