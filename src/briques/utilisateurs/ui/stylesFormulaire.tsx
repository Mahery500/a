/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

/* Tokens du design : vert #1f9d55 · vert clair #e7f6ed · vert foncé #14703c ·
   rouge #b42318 · bordure #e5e7eb · muted #5b6472 */
export const LABEL = "block text-xs font-bold text-[#5b6472]";
export const CHAMP =
  "mt-1.5 h-10 w-full px-3 border border-[#e5e7eb] rounded-[10px] text-sm font-normal bg-white text-[#1f2937] focus:outline-hidden focus:border-[#1f9d55] disabled:bg-[#fafbfa] disabled:text-[#5b6472]";
export const AIDE = "block mt-1 text-xs font-normal text-[#5b6472]";
export const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
export const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#1f9d55] bg-[#1f9d55] text-white hover:bg-[#14703c] hover:border-[#14703c] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
export const PUCE = "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold";

export const Requis: React.FC = () => <span className="text-[#b42318]">*</span>;