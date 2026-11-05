// src/app/router/icons.tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Registre des icônes de la sidebar.
 * Chaque clé correspond à un `IconName` défini dans `routes.ts`.
 * Toute nouvelle entrée de menu doit ajouter son icône ici.
 */

import type { ComponentType } from "react";
import {
  Activity,
  Award,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderHeart,
  History,
  Layers,
  LayoutGrid,
  ListOrdered,
  Monitor,
  PackagePlus,
  Pill,
  Repeat,
  Settings,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Terminal,
  Ticket,
  Truck,
  UserCheck,
  Users,
  Volume2,
} from "lucide-react";

import type { IconName } from "./routes";

export const ICONES: Record<IconName, ComponentType<{ className?: string }>> = {
  Ticket,
  UserCheck,
  CalendarClock,
  CalendarPlus,
  Users,
  Monitor,
  ListOrdered,
  Stethoscope,
  FolderHeart,
  Syringe,
  Activity,
  History,
  Pill,
  CheckCircle2,
  Layers,
  Truck,
  PackagePlus,
  Repeat,
  ClipboardCheck,
  BookOpen,
  Volume2,
  Building2,
  LayoutGrid,
  FileText,
  ShieldAlert,
  Award,
  Settings,
  Terminal,
};

export function getIcon(name: IconName): ComponentType<{ className?: string }> {
  return ICONES[name] ?? Ticket;
}