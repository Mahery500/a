/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
      <div className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200/60 mb-3 shadow-inner">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h4 className="text-sm font-bold text-slate-800 leading-snug">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
