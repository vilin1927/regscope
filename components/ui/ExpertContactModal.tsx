"use client";

import { useState, useRef, useEffect } from "react";
import { X, CheckCircle, ChevronDown, ChevronUp, Phone, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { getExpertForCategory, type ExpertCategoryKey } from "@/data/experts";
import { ExpertAvatar } from "./ExpertAvatar";

interface ExpertContactModalProps {
  categoryKey: ExpertCategoryKey;
  onClose: () => void;
}

export function ExpertContactModal({
  categoryKey,
  onClose,
}: ExpertContactModalProps) {
  const t = useTranslations("Expert");
  const tExperts = useTranslations("Experts");
  const tConsent = useTranslations("ContactConsent");
  const [sent, setSent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("complyradar_contact_consent") === "true";
    }
    return false;
  });
  const [consentChecked, setConsentChecked] = useState(false);
  const [sending, setSending] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [shareContact, setShareContact] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const expert = getExpertForCategory(categoryKey);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/help-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryKey,
          message: message.trim() || undefined,
          contactEmail: shareContact ? contactEmail.trim() || undefined : undefined,
          contactPhone: shareContact ? contactPhone.trim() || undefined : undefined,
        }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const bioText = tExperts(`${expert.i18nKey}.bio`);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-bold text-gray-900">
            {t("modalTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {!consentGiven ? (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{tConsent("title")}</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{tConsent("body")}</p>
            <label className="flex items-start gap-3 cursor-pointer mb-5 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
              />
              <span className="text-sm font-medium text-gray-700">{tConsent("checkbox")}</span>
            </label>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                {tConsent("decline")}
              </button>
              <button
                onClick={() => {
                  setConsentGiven(true);
                  sessionStorage.setItem("complyradar_contact_consent", "true");
                  fetch("/api/consent/contact", { method: "POST" }).catch(() => {});
                }}
                disabled={!consentChecked}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {tConsent("accept")}
              </button>
            </div>
          </div>
        ) : sent ? (
          <div className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {t("successTitle")}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {t("successMessage")}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <>
            {/* Expert profile header */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-4">
                <ExpertAvatar expert={expert} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900">
                    {tExperts(`${expert.i18nKey}.name`)}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    {tExperts(`${expert.i18nKey}.title`)}
                  </p>
                  {/* Collapsible bio */}
                  <div className="mt-1">
                    <p
                      className={`text-xs text-gray-500 ${bioExpanded ? "" : "line-clamp-2"}`}
                    >
                      {bioText}
                    </p>
                    <button
                      type="button"
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="inline-flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-700 mt-0.5 transition-colors"
                    >
                      {bioExpanded ? (
                        <>
                          {t("less")}
                          <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          {t("more")}
                          <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-4 pt-3">
                <p className="text-sm font-medium text-gray-700">
                  {tExperts("fillFormHeading")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("category")}
                </label>
                <input
                  type="text"
                  readOnly
                  value={tExperts(`${expert.i18nKey}.title`)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("message")}
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("messagePlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Contact sharing toggle */}
              <div className="border border-gray-200 rounded-lg p-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareContact}
                    onChange={(e) => setShareContact(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {t("shareContact")}
                    </p>
                    <p className="text-xs text-gray-500">{t("shareContactDesc")}</p>
                  </div>
                </label>

                {shareContact && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("email")}
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder={t("emailPlaceholder")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("phone")}
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+49 123 456789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sending ? "..." : t("send")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
