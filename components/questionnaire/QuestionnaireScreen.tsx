"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ProgressBar } from "./ProgressBar";
import { LayerRenderer } from "./LayerRenderer";
import { questionnaireLayers } from "@/data/questionnaire/layers";
import { validateLayer, type ValidationErrors } from "@/lib/validation";
import type { BusinessProfile } from "@/data/questionnaire/types";

interface QuestionnaireScreenProps {
  initialAnswers?: BusinessProfile;
  onComplete: (answers: BusinessProfile) => void;
}

export function QuestionnaireScreen({
  initialAnswers,
  onComplete,
}: QuestionnaireScreenProps) {
  const [currentLayer, setCurrentLayer] = useState(0);
  const [answers, setAnswers] = useState<BusinessProfile>(
    initialAnswers || {}
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [shakeKey, setShakeKey] = useState(0);
  const t = useTranslations("Questionnaire");

  const layers = questionnaireLayers;
  const layer = layers[currentLayer];
  const totalLayers = layers.length;
  const isLastLayer = currentLayer === totalLayers - 1;
  const isOptionalLayer = layer.optional;

  const isLayerValid =
    isOptionalLayer || Object.keys(validateLayer(layer, answers)).length === 0;

  const updateAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (prev[fieldId]) {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      }
      return prev;
    });
  };

  const goNext = () => {
    if (!isOptionalLayer) {
      const validationErrors = validateLayer(layer, answers);
      if (Object.keys(validationErrors).length > 0) {
        const resolved: Record<string, string> = {};
        for (const [fieldId, key] of Object.entries(validationErrors)) {
          resolved[fieldId] = t(`validation.${key}`);
        }
        setErrors(resolved);
        setShakeKey((k) => k + 1);
        const firstErrorId = Object.keys(validationErrors)[0];
        const el = document.getElementById(`field-${firstErrorId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
    }

    setErrors({});
    if (isLastLayer) {
      onComplete(answers);
    } else {
      setCurrentLayer((p) => p + 1);
    }
  };

  const goPrev = () => {
    setErrors({});
    if (currentLayer > 0) setCurrentLayer((p) => p - 1);
  };

  const skipLayer = () => {
    setErrors({});
    if (isLastLayer) {
      onComplete(answers);
    } else {
      setCurrentLayer((p) => p + 1);
    }
  };

  const isPlanning = answers.noCompanyYet === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <ProgressBar
        currentStep={currentLayer + 1}
        totalSteps={totalLayers}
      />

      <motion.div
        key={shakeKey}
        animate={
          shakeKey > 0
            ? {
                x: [0, -8, 8, -6, 6, -3, 3, 0],
                transition: { duration: 0.5 },
              }
            : {}
        }
        className="bg-white rounded-2xl border border-gray-200 p-8"
      >
        <AnimatePresence mode="wait">
          <LayerRenderer
            key={layer.id}
            layer={layer}
            answers={answers}
            onUpdate={updateAnswer}
            errors={errors}
          />
        </AnimatePresence>

        {Object.keys(errors).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-700 font-medium">
              {t("validation.fixErrors")}
            </p>
          </motion.div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={goPrev}
            disabled={currentLayer === 0}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
              currentLayer === 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t("back")}
          </button>

          <div className="flex items-center gap-3">
            {isOptionalLayer && (
              <button
                onClick={skipLayer}
                className="px-5 py-2.5 rounded-lg font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {t("skip")}
              </button>
            )}
            <button
              onClick={goNext}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
                isLayerValid
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLastLayer
                ? isPlanning
                  ? t("analyzePrelaunch")
                  : t("analyze")
                : t("next")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
