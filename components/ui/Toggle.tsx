"use client";

import { Check } from "lucide-react";

interface ToggleProps {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  isComplianceCheck?: boolean;
}

export function Toggle({
  label,
  desc,
  checked,
  onChange,
  isComplianceCheck,
}: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`p-4 rounded-lg text-left transition-colors w-full ${
        checked
          ? isComplianceCheck
            ? "bg-green-50 border-2 border-green-300"
            : "bg-blue-50 border-2 border-blue-300"
          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-gray-900 text-sm">{label}</span>
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center ${
            checked
              ? isComplianceCheck
                ? "bg-green-600"
                : "bg-blue-600"
              : "bg-gray-300"
          }`}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
      {desc && <p className="text-sm text-gray-500">{desc}</p>}
    </button>
  );
}
