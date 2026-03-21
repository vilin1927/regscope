"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown, ChevronUp, Loader2, Layers, Hash, Clock } from "lucide-react";
import { screenVariants, screenTransition } from "@/lib/motion";

interface QuestionField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  isComplianceCheck?: boolean;
  options?: { value: string; label: string }[];
}

interface QuestionLayer {
  id: number;
  title: string;
  subtitle?: string;
  icon?: string;
  fields: QuestionField[];
}

interface TemplateRecord {
  id: string;
  industry_code: string;
  industry_label: string;
  questions: QuestionLayer[];
  gegenstand_sample: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TemplateRow({ template }: { template: TemplateRecord }) {
  const [expanded, setExpanded] = useState(false);
  const layers = template.questions || [];
  const totalFields = layers.reduce((sum, l) => sum + (l.fields?.length || 0), 0);
  const complianceChecks = layers.reduce(
    (sum, l) => sum + (l.fields?.filter((f) => f.isComplianceCheck)?.length || 0),
    0
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                {template.industry_label}
              </h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded-full">
                {template.industry_code}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {template.usage_count}x verwendet
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {layers.length} Abschnitte, {totalFields} Fragen
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(template.created_at)}
              </span>
            </div>
            {template.gegenstand_sample && (
              <p className="mt-2 text-xs text-gray-400 truncate max-w-xl">
                Gegenstand: {template.gegenstand_sample}
              </p>
            )}
          </div>
          <div className="shrink-0 mt-1">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 border-t border-gray-100 pt-4">
              {layers.map((layer, i) => (
                <div key={layer.id || i} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <h4 className="font-medium text-gray-900 text-sm">{layer.title}</h4>
                    {layer.subtitle && (
                      <span className="text-xs text-gray-400">— {layer.subtitle}</span>
                    )}
                  </div>
                  <div className="ml-8 space-y-1">
                    {(layer.fields || []).map((field) => (
                      <div key={field.id} className="flex items-start gap-2 text-xs">
                        <span className={`shrink-0 px-1.5 py-0.5 rounded font-mono ${
                          field.isComplianceCheck
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-200 text-gray-600"
                        }`}>
                          {field.type}
                        </span>
                        <span className="text-gray-700">{field.label}</span>
                        {field.required && (
                          <span className="text-red-400 shrink-0">*</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminTemplatesScreen() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/admin/templates");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setTemplates(data.templates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler beim Laden");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={screenTransition}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Branchen-Vorlagen</h1>
          <p className="text-sm text-gray-500">
            {templates.length} {templates.length === 1 ? "Vorlage" : "Vorlagen"} gespeichert
          </p>
        </div>
      </div>

      {/* Stats */}
      {templates.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            <p className="text-xs text-gray-500">Branchen</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900">
              {templates.reduce((sum, t) => sum + t.usage_count, 0)}
            </p>
            <p className="text-xs text-gray-500">Gesamt-Nutzungen</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-gray-900">
              {templates.reduce(
                (sum, t) => sum + (t.questions?.reduce((s, l) => s + (l.fields?.length || 0), 0) || 0),
                0
              )}
            </p>
            <p className="text-xs text-gray-500">Gesamt-Fragen</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Templates list */}
      {templates.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">Keine Vorlagen vorhanden</h3>
          <p className="text-sm text-gray-500">
            Vorlagen werden automatisch erstellt, wenn Unternehmen gescannt werden.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateRow key={template.id} template={template} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
