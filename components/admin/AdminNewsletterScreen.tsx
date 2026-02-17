"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Eye, Users, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Subscriber {
  userId: string;
  email: string;
  optedIn: boolean;
  frequency: string;
  areas: string[];
  locale: string;
  updatedAt: string;
}

interface SubscribersData {
  subscribers: Subscriber[];
  total: number;
  optedIn: number;
}

export function AdminNewsletterScreen() {
  const t = useTranslations("Admin");
  const [data, setData] = useState<SubscribersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers");
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
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleSend = async () => {
    setShowConfirm(false);
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/send-newsletter", {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        const failed = result.total - result.sent;
        setSendResult({ sent: result.sent, failed });
      } else {
        setSendResult({ sent: 0, failed: -1 });
      }
    } catch {
      setSendResult({ sent: 0, failed: -1 });
    } finally {
      setIsSending(false);
    }
  };

  const handlePreview = async () => {
    setIsLoadingPreview(true);
    setPreviewHtml(null);
    try {
      const res = await fetch("/api/admin/preview-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const result = await res.json();
        setPreviewHtml(result.html);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const activeCount = data?.optedIn || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t("newsletter")}</h2>
        <p className="text-gray-500 mt-1">{t("newsletterDesc")}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Stat Card */}
          <div className="max-w-xs">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg mx-auto mb-3">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                {t("subscribers")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={isLoadingPreview || activeCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingPreview ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {t("preview")}
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isSending || activeCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSending ? t("sending") : t("sendNow")}
            </button>
          </div>

          {/* Send Result */}
          {sendResult && (
            <div
              className={`p-4 rounded-lg text-sm font-medium ${
                sendResult.failed === -1
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {sendResult.failed === -1
                ? t("sendError")
                : t("sendSuccess", {
                    sent: sendResult.sent,
                    failed: sendResult.failed,
                  })}
            </div>
          )}

          {/* Confirm Dialog */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
                <p className="text-gray-900 font-medium mb-4">
                  {t("confirmSend", { count: activeCount })}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSend}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    {t("confirm")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subscriber Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                {t("subscribers")}
              </h3>
            </div>
            {(data?.subscribers.length || 0) === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                {t("noSubscribers")}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">{t("email")}</th>
                    <th className="px-5 py-3">{t("locale")}</th>
                    <th className="px-5 py-3">{t("areas")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.subscribers.map((sub) => (
                    <tr
                      key={sub.userId}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-5 py-3 text-gray-900">{sub.email}</td>
                      <td className="px-5 py-3 text-gray-600 uppercase">
                        {sub.locale}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {sub.areas.length > 0
                          ? sub.areas.join(", ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Preview Panel */}
          {previewHtml && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  {t("preview")}
                </h3>
                <button
                  onClick={() => setPreviewHtml(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full border border-gray-200 rounded-lg"
                  style={{ height: "600px" }}
                  title="Newsletter Preview"
                />
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
