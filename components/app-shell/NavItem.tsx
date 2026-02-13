"use client";

import type { ElementType } from "react";

interface NavItemProps {
  icon: ElementType;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}

export function NavItem({ icon: Icon, label, active, badge, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
        active
          ? "bg-blue-50 text-blue-700"
          : badge
            ? "text-gray-400 hover:bg-gray-50 hover:text-gray-500"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-left truncate">{label}</span>
      {badge && (
        <span className="ml-auto shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-400 border border-blue-100">
          Soon
        </span>
      )}
    </button>
  );
}
