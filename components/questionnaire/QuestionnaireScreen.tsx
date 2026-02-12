"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ProgressBar } from "./ProgressBar";
import { LayerRenderer } from "./LayerRenderer";
import { questionnaireLayers } from "@/data/questionnaire/layers";
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
  const t = useTranslations("Questionnaire");

  const layers = questionnaireLayers;
  const layer = layers[currentLayer];
  const totalLayers = layers.length;
  const isLastLayer = currentLayer === totalLayers - 1;
  const isOptionalLayer = layer.optional;

  const updateAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const goNext = () => {
    if (isLastLayer) {
      onComplete(answers);
    } else {
      setCurrentLayer((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (currentLayer > 0) setCurrentLayer((p) => p - 1);
  };

  const skipLayer = () => {
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

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <AnimatePresence mode="wait">
          <LayerRenderer
            key={layer.id}
            layer={layer}
            answers={answers}
            onUpdate={updateAnswer}
          />
        </AnimatePresence>

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
              className="px-6 py-2.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {isLastLayer
                ? isPlanning
                  ? t("analyzePrelaunch")
                  : t("analyze")
                : t("next")}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
