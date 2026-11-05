/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useEffect, useState } from "react";
import { ASINA_COLORS, applyThemeColors, AsinaColors } from "@/noyau/theme";

export interface ThemeContextType {
  colors: AsinaColors;
  updateTheme: (newColors: Partial<AsinaColors>) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: ASINA_COLORS,
  updateTheme: () => {},
  resetTheme: () => {},
});

export interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const [colors, setColors] = useState<AsinaColors>(ASINA_COLORS);

  useEffect(() => {
    applyThemeColors(colors);
  }, [colors]);

  const updateTheme = (newColors: Partial<AsinaColors>) => {
    setColors((prev) => {
      const merged = { ...prev, ...newColors };
      applyThemeColors(merged);
      return merged;
    });
  };

  const resetTheme = () => {
    setColors(ASINA_COLORS);
    applyThemeColors(ASINA_COLORS);
  };

  return (
    <ThemeContext.Provider value={{ colors, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default AppProviders;
