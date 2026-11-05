/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldAlert } from "lucide-react";

export interface GardeAccesStockProps {
  message: string;
}

export const GardeAccesStock: React.FC<GardeAccesStockProps> = ({ message }) => (
  <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
    <ShieldAlert className="h-4 w-4 shrink-0" />
    <span>{message}</span>
  </div>
);

export default GardeAccesStock;
