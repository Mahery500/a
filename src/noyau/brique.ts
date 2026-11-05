/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ManifesteBrique {
  id: string;
  nom: string;
  description: string;
  ressource: string;
  version?: string;
}

export function definirBrique(manifeste: ManifesteBrique): ManifesteBrique {
  return manifeste;
}
