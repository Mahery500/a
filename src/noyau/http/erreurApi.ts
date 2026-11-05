/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Erreur HTTP typée pour les réponses non 2xx de l'API Symfony / API Platform.
 */
export class ErreurApi extends Error {
  readonly statut: number;
  readonly donnees: unknown;
  readonly endpoint: string;

  constructor(statut: number, message: string, donnees: unknown = null, endpoint: string = "") {
    super(message);
    this.name = "ErreurApi";
    this.statut = statut;
    this.donnees = donnees;
    this.endpoint = endpoint;
  }

  get estNonAutorise(): boolean {
    return this.statut === 401;
  }

  get estInterdit(): boolean {
    return this.statut === 403;
  }

  get estIntrouvable(): boolean {
    return this.statut === 404;
  }

  get estErreurReseau(): boolean {
    return this.statut === 0;
  }

  // Propriétés de compatibilité
  get status(): number {
    return this.statut;
  }

  get isUnauthorized(): boolean {
    return this.estNonAutorise;
  }

  get isForbidden(): boolean {
    return this.estInterdit;
  }

  get isNotFound(): boolean {
    return this.estIntrouvable;
  }

  get isNetworkError(): boolean {
    return this.estErreurReseau;
  }
}

export default ErreurApi;
