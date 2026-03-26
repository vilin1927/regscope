"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Check, X as XIcon } from "lucide-react";

interface AuthFormProps {
  mode: "signin" | "signup";
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode, onSubmit, error }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<{
    valid: boolean;
    consultantName?: string;
    checking: boolean;
  }>({ valid: false, checking: false });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const t = useTranslations("Auth");

  // Clear errors when switching modes
  useEffect(() => {
    setFieldErrors({});
  }, [mode]);

  // Validate referral code with debounce
  useEffect(() => {
    if (mode !== "signup" || !referralCode.trim()) {
      setReferralStatus({ valid: false, checking: false });
      return;
    }
    const timer = setTimeout(async () => {
      setReferralStatus((prev) => ({ ...prev, checking: true }));
      try {
        const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(referralCode.trim())}`);
        const data = await res.json();
        setReferralStatus({
          valid: data.valid,
          consultantName: data.consultantName,
          checking: false,
        });
      } catch {
        setReferralStatus({ valid: false, checking: false });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [referralCode, mode]);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = t("emailRequired");
    } else if (!EMAIL_RE.test(email.trim())) {
      errors.email = t("emailInvalid");
    }

    if (!password) {
      errors.password = t("passwordRequired");
    } else if (password.length < 8) {
      // Fix #22: Same minimum length for both signin and signup
      errors.password = t("passwordTooShort", { min: 8 });
    } else if (mode === "signup") {
      if (!/[A-Z]/.test(password)) {
        errors.password = t("passwordNeedsUppercase");
      } else if (!/\d/.test(password)) {
        errors.password = t("passwordNeedsNumber");
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Store referral code before signup so useAuth can record it after
    if (mode === "signup" && referralCode.trim() && referralStatus.valid) {
      sessionStorage.setItem("complyradar_referral_code", referralCode.trim().toUpperCase());
    }
    setLoading(true);
    try {
      await onSubmit(email, password);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: "email" | "password") => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("email")}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
            fieldErrors.email
              ? "border-red-500 bg-red-50"
              : "border-gray-300"
          }`}
          placeholder={t("emailPlaceholder")}
        />
        {fieldErrors.email && (
          <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("password")}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError("password");
          }}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
            fieldErrors.password
              ? "border-red-500 bg-red-50"
              : "border-gray-300"
          }`}
          placeholder="••••••••"
        />
        {fieldErrors.password && (
          <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
        )}
      </div>

      {/* Referral code — signup only */}
      {mode === "signup" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("referralCode")}
          </label>
          <div className="relative">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10 ${
                referralCode.trim()
                  ? referralStatus.valid
                    ? "border-green-400 bg-green-50"
                    : referralStatus.checking
                      ? "border-gray-300"
                      : "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              placeholder={t("referralPlaceholder")}
              maxLength={12}
            />
            {referralCode.trim() && !referralStatus.checking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {referralStatus.valid ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <XIcon className="w-5 h-5 text-red-400" />
                )}
              </div>
            )}
          </div>
          {referralCode.trim() && !referralStatus.checking && (
            <p className={`text-xs mt-1 ${referralStatus.valid ? "text-green-600" : "text-red-500"}`}>
              {referralStatus.valid
                ? `${t("referralValid")}: ${referralStatus.consultantName}`
                : t("referralInvalid")}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading
          ? "..."
          : mode === "signin"
            ? t("signIn")
            : t("signUp")}
      </button>
    </form>
  );
}
