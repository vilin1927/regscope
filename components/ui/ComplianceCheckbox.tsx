"use client";

import { Check } from "lucide-react";

interface ComplianceCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function ComplianceCheckbox({
  checked,
  onChange,
  label,
}: ComplianceCheckboxProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 group"
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked
            ? "bg-green-600 border-green-600"
            : "border-gray-300 group-hover:border-green-400"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span
        className={`text-sm font-medium ${
          checked ? "text-green-700 line-through" : "text-gray-700"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
