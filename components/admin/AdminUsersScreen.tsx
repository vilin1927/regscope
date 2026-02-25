"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface UserRecord {
  id: string;
  email: string;
  createdAt: string;
  totalScans: number;
  lastScanAt: string | null;
  latestComplianceScore: number | null;
  newsletterOptedIn: boolean;
  newsletterFrequency: string | null;
  trialStartedAt: string | null;
}

interface UsersData {
  users: UserRecord[];
  totalUsers: number;
  newUsersThisWeek: number;
}

const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTrialStatus(trialStartedAt: string | null): "none" | "active" | "expired" {
  if (!trialStartedAt) return "none";
  const elapsed = Date.now() - new Date(trialStartedAt).getTime();
  return elapsed < TRIAL_DURATION_MS ? "active" : "expired";
}

export function AdminUsersScreen() {
  const t = useTranslations("Admin");
  const [data, setData] = useState<UsersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t("users")}</h2>
        <p className="text-gray-500 mt-1">{t("usersDesc")}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg mx-auto mb-3">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data?.totalUsers || 0}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                {t("totalUsers")}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-lg mx-auto mb-3">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data?.newUsersThisWeek || 0}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                {t("newThisWeek")}
              </p>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                {t("users")}
              </h3>
            </div>
            {(data?.users.length || 0) === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                {t("noUsers")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3">{t("email")}</th>
                      <th className="px-5 py-3">{t("plan")}</th>
                      <th className="px-5 py-3">{t("scans")}</th>
                      <th className="px-5 py-3">{t("score")}</th>
                      <th className="px-5 py-3">{t("lastScan")}</th>
                      <th className="px-5 py-3">Newsletter</th>
                      <th className="px-5 py-3">{t("signedUp")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-5 py-3 text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-5 py-3">
                          {(() => {
                            const status = getTrialStatus(user.trialStartedAt);
                            if (status === "active")
                              return (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                  {t("trialActive")}
                                </span>
                              );
                            if (status === "expired")
                              return (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                  {t("trialExpired")}
                                </span>
                              );
                            return (
                              <span className="text-xs text-gray-400">
                                {t("planFree")}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {user.totalScans}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {user.latestComplianceScore !== null
                            ? `${user.latestComplianceScore}%`
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {formatDate(user.lastScanAt)}
                        </td>
                        <td className="px-5 py-3">
                          {user.newsletterOptedIn ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 capitalize">
                              {user.newsletterFrequency}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {t("notSubscribed")}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
