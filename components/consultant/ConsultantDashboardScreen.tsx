"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Users,
  Bell,
  Link2,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Mail,
  Phone,
  Tag,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { EXPERTISE_TAG_LABELS } from "@/lib/consultant-types";
import type { Consultant, Referral, HelpRequest } from "@/lib/consultant-types";

interface DashboardData {
  consultant: Consultant;
  referrals: Referral[];
  helpRequests: HelpRequest[];
  stats: {
    totalReferrals: number;
    activeReferrals: number;
    pendingRequests: number;
    totalRequests: number;
  };
}

export function ConsultantDashboardScreen() {
  const t = useTranslations("Consultant");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/consultant/dashboard");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        return;
      }
      setData(json);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const copyReferralCode = async () => {
    if (!data?.consultant.referral_code) return;
    await navigator.clipboard.writeText(data.consultant.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-red-600">{error || t("loadError")}</p>
      </div>
    );
  }

  const { consultant, referrals, helpRequests, stats } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header with referral code */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("dashboardTitle")}</h1>
            <p className="text-sm text-gray-500 mt-1">{consultant.name}</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2.5 rounded-xl">
            <Link2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{t("referralCode")}:</span>
            <code className="text-sm font-bold text-blue-900 tracking-wider">{consultant.referral_code}</code>
            <button
              onClick={copyReferralCode}
              className="ml-1 p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              title={t("copyCode")}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-blue-600" />
              )}
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              title={t("showQR")}
            >
              <QrCode className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* QR Code */}
        {showQR && data?.consultant.referral_code && (
          <div className="flex justify-center sm:justify-end mt-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 inline-flex flex-col items-center gap-2">
              <QRCodeSVG
                value={data.consultant.referral_code}
                size={160}
                level="M"
              />
              <p className="text-xs text-gray-500 font-medium">{data.consultant.referral_code}</p>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {consultant.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
            >
              <Tag className="w-3 h-3" />
              {EXPERTISE_TAG_LABELS[tag as keyof typeof EXPERTISE_TAG_LABELS] || tag}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label={t("totalReferrals")}
          value={stats.totalReferrals}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          label={t("activeReferrals")}
          value={stats.activeReferrals}
          icon={<ArrowRight className="w-5 h-5 text-green-600" />}
          color="green"
        />
        <StatCard
          label={t("pendingRequests")}
          value={stats.pendingRequests}
          icon={<Bell className="w-5 h-5 text-amber-600" />}
          color="amber"
        />
        <StatCard
          label={t("totalRequests")}
          value={stats.totalRequests}
          icon={<Clock className="w-5 h-5 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Help Requests */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            {t("helpRequests")}
            {stats.pendingRequests > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                {stats.pendingRequests} {t("new")}
              </span>
            )}
          </h2>
        </div>

        {helpRequests.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">
            {t("noHelpRequests")}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {helpRequests.map((req) => (
              <div key={req.id} className="px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{req.category}</span>
                      <StatusBadge status={req.status} t={t} />
                    </div>
                    {req.message && (
                      <p className="text-sm text-gray-500 mt-1">{req.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(req.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {req.contact_revealed && (
                    <div className="flex flex-col gap-1 text-sm">
                      {req.customer_email && (
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          {req.customer_email}
                        </span>
                      )}
                      {req.customer_phone && (
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="w-3.5 h-3.5" />
                          {req.customer_phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referrals */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            {t("referralsList")}
          </h2>
        </div>

        {referrals.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">
            {t("noReferrals")}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {referrals.map((ref) => (
              <div key={ref.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("customer")} #{ref.customer_user_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(ref.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <StatusBadge status={ref.status} t={t} />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    amber: "bg-amber-50",
    purple: "bg-purple-50",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className={`w-10 h-10 ${bgMap[color]} rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useTranslations> }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    active: "bg-green-100 text-green-700",
    contacted: "bg-blue-100 text-blue-700",
    resolved: "bg-gray-100 text-gray-600",
    converted: "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-600",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {t(`status_${status}`)}
    </span>
  );
}
