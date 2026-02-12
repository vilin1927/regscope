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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
          {badge}
        </span>
      )}
    </button>
  );
}
