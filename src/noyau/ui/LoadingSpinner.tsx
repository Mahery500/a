/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = "Chargement...",
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 p-6 text-slate-500 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-emerald-600`} />
      {label && <span className="text-xs font-medium text-slate-500">{label}</span>}
    </div>
  );
};

export interface SkeletonRowProps {
  colonnes?: number;
}

export const SkeletonRow: React.FC<SkeletonRowProps> = ({ colonnes = 4 }) => {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      {Array.from({ length: colonnes }).map((_, i) => (
        <td key={i} className="py-3 px-3.5">
          <div
            className="h-3.5 bg-slate-200 rounded"
            style={{ width: `${Math.max(40, 85 - i * 12)}%` }}
          />
        </td>
      ))}
    </tr>
  );
};
