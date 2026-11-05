/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import {
  abonnerCodeSystemsChanges,
  notifierCodeSystemsChanges,
} from "@/noyau/referentiels/codeSystemsEvents";
import {
  DiagnosticDefinition,
  NouvelleDiagnosticDefinitionInput,
  ModificationDiagnosticDefinitionInput,
  CodificationDiagnostic,
  CodeSystemeOption,
  NouveauCodeSystemeInput,
} from "../modele/diagnostic-definition.types";
import { diagnosticDefinitionApi } from "../api/diagnostic-definition.api";

export function useDiagnosticDefinitions() {
  const notif = useNotifier();

  const [definitions, setDefinitions] = useState<DiagnosticDefinition[]>([]);
  const [codeSystems, setCodeSystems] = useState<CodeSystemeOption[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtres
  const [recherche, setRecherche] = useState<string>("");
  const [filtreChapitre, setFiltreChapitre] = useState<string>("tous");
  const [filtreActif, setFiltreActif] = useState<"tous" | "actifs" | "inactifs">("tous");

  const rechargerCodeSystems = useCallback(async () => {
    try {
      const liste = await diagnosticDefinitionApi.listerCodeSystems().catch(() => []);
      setCodeSystems(liste);
    } catch {
      // silencieux
    }
  }, []);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [defsData, csData] = await Promise.all([
        diagnosticDefinitionApi.listerDefinitions(),
        diagnosticDefinitionApi.listerCodeSystems(),
      ]);
      setDefinitions(defsData);
      setCodeSystems(csData);
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger les définitions de diagnostics.");
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [notif]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  // Synchronisation inter-modules
  useEffect(() => {
    return abonnerCodeSystemsChanges(() => {
      rechargerCodeSystems();
    });
  }, [rechargerCodeSystems]);

  const chapitres = useMemo(() => {
    const set = new Set<string>();
    definitions.forEach((d) => {
      if (d.chapitre?.trim()) {
        set.add(d.chapitre.trim());
      }
    });
    return Array.from(set).sort();
  }, [definitions]);

  const definitionsFiltrees = useMemo(() => {
    return definitions.filter((def) => {
      if (filtreActif === "actifs" && !def.actif) return false;
      if (filtreActif === "inactifs" && def.actif) return false;
      if (filtreChapitre !== "tous" && def.chapitre !== filtreChapitre) return false;

      if (recherche.trim()) {
        const q = recherche.toLowerCase().trim();
        const matchCode = def.code.toLowerCase().includes(q);
        const matchLibelle = def.libelle.toLowerCase().includes(q);
        const matchDesc = def.description?.toLowerCase().includes(q);
        const matchChapitre = def.chapitre?.toLowerCase().includes(q);
        const matchCodif = def.codifications.some(
          (c) =>
            c.code.toLowerCase().includes(q) || (c.libelle && c.libelle.toLowerCase().includes(q)),
        );
        return matchCode || matchLibelle || matchDesc || matchChapitre || matchCodif;
      }

      return true;
    });
  }, [definitions, filtreActif, filtreChapitre, recherche]);

  const creerDefinition = useCallback(
    async (saisie: NouvelleDiagnosticDefinitionInput): Promise<boolean> => {
      try {
        const nouvelle = await diagnosticDefinitionApi.creerDefinition(saisie);
        setDefinitions((prec) => [...prec, nouvelle]);
        notif.succes(`Diagnostic ${nouvelle.code} créé avec succès.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de création du diagnostic."));
        return false;
      }
    },
    [notif],
  );

  const modifierDefinition = useCallback(
    async (id: number, saisie: ModificationDiagnosticDefinitionInput): Promise<boolean> => {
      try {
        const maj = await diagnosticDefinitionApi.modifierDefinition(id, saisie);
        setDefinitions((prec) => prec.map((d) => (d.id === id ? maj : d)));
        notif.succes(`Diagnostic ${maj.code} mis à jour.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de mise à jour du diagnostic."));
        return false;
      }
    },
    [notif],
  );

  const changerActivation = useCallback(
    async (id: number, actif: boolean): Promise<boolean> => {
      try {
        const maj = await diagnosticDefinitionApi.changerActivation(id, actif);
        setDefinitions((prec) => prec.map((d) => (d.id === id ? maj : d)));
        notif.succes(`Diagnostic ${maj.code} ${actif ? "activé" : "désactivé"}.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de changement de statut."));
        return false;
      }
    },
    [notif],
  );

  const definirCodifications = useCallback(
    async (id: number, codifs: CodificationDiagnostic[]): Promise<boolean> => {
      try {
        const maj = await diagnosticDefinitionApi.definirCodifications(id, codifs);
        setDefinitions((prec) => prec.map((d) => (d.id === id ? maj : d)));
        notif.succes(`Codifications du diagnostic ${maj.code} enregistrées.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec d’enregistrement des codifications."));
        return false;
      }
    },
    [notif],
  );

  const creerCodeSystem = useCallback(
    async (saisie: NouveauCodeSystemeInput): Promise<boolean> => {
      try {
        const nouv = await diagnosticDefinitionApi.creerCodeSystem(saisie);
        setCodeSystems((prec) => [...prec, nouv]);
        notif.succes(`Système de codification ${nouv.code} enregistré.`);
        notifierCodeSystemsChanges();
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de création du système de codification."));
        return false;
      }
    },
    [notif],
  );

  const basculerActivationCodeSystem = useCallback(
    async (id: number, statutActuel: boolean): Promise<boolean> => {
      try {
        const maj = await diagnosticDefinitionApi.changerActivationCodeSystem(id, !statutActuel);
        setCodeSystems((prec) => prec.map((cs) => (cs.id === id ? maj : cs)));
        notif.succes(`Système ${maj.code} ${maj.actif ? "activé" : "désactivé"}.`);
        notifierCodeSystemsChanges();
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec du changement de statut de la terminologie."));
        return false;
      }
    },
    [notif],
  );

  return {
    definitions: definitionsFiltrees,
    definitionsToutes: definitions,
    chapitres,
    codeSystems,
    chargement,
    erreur,
    recherche,
    setRecherche,
    filtreChapitre,
    setFiltreChapitre,
    filtreActif,
    setFiltreActif,
    recharger,
    creerDefinition,
    modifierDefinition,
    changerActivation,
    definirCodifications,
    creerCodeSystem,
    basculerActivationCodeSystem,
  };
}
