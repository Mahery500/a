import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/noyau/theme";
import App from "./app/App";
import { PageEcranAttente } from "@/briques/ecran-attente";
import "./index.css";

/**
 * Routing minimal par pathname : une seule route standalone (l'écran salle
 * d'attente) doit vivre HORS du SPA App (pas de sidebar, pas de state de
 * navigation interne), donc pas besoin d'installer react-router pour ça.
 * Toute autre URL retombe sur le SPA classique, qui gère sa propre
 * navigation par state (activeView/activeSubTab).
 */
const STANDALONE_ROUTES: Record<string, React.ComponentType> = {
  "/ecran-attente": PageEcranAttente,
};

const StandaloneComponent = STANDALONE_ROUTES[window.location.pathname];

createRoot(document.getElementById("root")!).render(
  <StrictMode>{StandaloneComponent ? <StandaloneComponent /> : <App />}</StrictMode>,
);
