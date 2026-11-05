/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { FournisseurNotifications } from "@/noyau/notifications";
import { FournisseurSession } from "@/cerveau/session";
import { CoquilleApplicative } from "@/coquille";
import { AppProviders } from "./providers";

export function App() {
  // Purger l'ancien stockage local d'entités simulées
  useEffect(() => {
    localStorage.removeItem("asina_database_v1");
  }, []);

  return (
    <AppProviders>
      <FournisseurNotifications>
        <FournisseurSession>
          <CoquilleApplicative />
        </FournisseurSession>
      </FournisseurNotifications>
    </AppProviders>
  );
}

export default App;
