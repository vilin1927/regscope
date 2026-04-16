"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import {
  Briefcase,
  Check,
  Eye,
  EyeOff,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { EXPERTISE_TAGS, EXPERTISE_TAG_LABELS } from "@/lib/consultant-types";
import type { ExpertiseTag } from "@/lib/consultant-types";

interface ConsultantSignupScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function ConsultantSignupScreen({
  onSuccess,
  onBack,
}: ConsultantSignupScreenProps) {
  const t = useTranslations("ConsultantSignup");

  // Account fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Consultant profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [selectedTags, setSelectedTags] = useState<ExpertiseTag[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: ExpertiseTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email.trim()) {
      setError(t("emailRequired"));
      return;
    }
    if (!password) {
      setError(t("passwordRequired"));
      return;
    }
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    if (selectedTags.length === 0) {
      setError(t("tagsRequired"));
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create account + consultant profile
      const res = await fetch("/api/consultant/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim() || undefined,
          bio: bio.trim() || undefined,
          tags: selectedTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("signupFailed"));
        setLoading(false);
        return;
      }

      // Step 2: Auto sign-in
      const signInResult = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(t("signupSuccessLoginFailed"));
        setLoading(false);
        return;
      }

      // Step 3: Navigate to consultant dashboard
      onSuccess();
    } catch {
      setError(t("signupFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-lg"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToLogin")}
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 sm:py-8 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">{t("title")}</h1>
                <p className="text-blue-100 text-sm mt-0.5">{t("subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
            {/* Section: Account */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                {t("sectionAccount")}
              </p>

              {/* Email */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("email")} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("password")} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder={t("passwordPlaceholder")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{t("passwordHint")}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Section: Consultant Profile */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                {t("sectionProfile")}
              </p>

              {/* Name */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("name")} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder={t("namePlaceholder")}
                  autoComplete="name"
                />
              </div>

              {/* Phone */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder={t("phonePlaceholder")}
                  autoComplete="tel"
                />
              </div>

              {/* Bio */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("bio")}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                  placeholder={t("bioPlaceholder")}
                />
              </div>

              {/* Expertise Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("expertise")} *
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                      }`}
                    >
                      {selectedTags.includes(tag) && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {EXPERTISE_TAG_LABELS[tag]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? t("submitting") : t("submit")}
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500">
              {t("alreadyHaveAccount")}{" "}
              <button
                type="button"
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("loginLink")}
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
