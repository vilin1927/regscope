"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface AuthFormProps {
  mode: "signin" | "signup";
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode, onSubmit, error }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = t("emailRequired");
    } else if (!EMAIL_RE.test(email.trim())) {
      errors.email = t("emailInvalid");
    }

    if (!password) {
      errors.password = t("passwordRequired");
    } else if (mode === "signup") {
      if (password.length < 8) {
        errors.password = t("passwordTooShort", { min: 8 });
      } else if (!/[A-Z]/.test(password)) {
        errors.password = t("passwordNeedsUppercase");
      } else if (!/\d/.test(password)) {
        errors.password = t("passwordNeedsNumber");
      }
    } else if (password.length < 6) {
      errors.password = t("passwordTooShort", { min: 6 });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
