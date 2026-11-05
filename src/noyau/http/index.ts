/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './types';
export * from './erreurApi';
export * from './jwt';
export * from './session';
export * from './collection';
export * from './clientHttp';
export * from './erreursCloture';
export { extraireMessageErreur } from '@/noyau/utils/erreur';
// Alias pour compatibilité progressive
export { clientHttp as apiClient } from "./clientHttp";
export { ErreurApi as ApiError } from "./erreurApi";
export { extraireElementsCollection as extractCollectionItems } from "./collection";
export { decoderJetonJwt as decodeJwt } from "./jwt";
export { estJetonExpire as isJwtExpired } from "./jwt";
export { obtenirUrlBaseApi as getApiBaseUrl } from "./session";
export { definirUrlBaseApi as setApiBaseUrl } from "./session";
export { obtenirJetonJwt as getStoredJwtToken } from "./session";
export { definirJetonJwt as setStoredJwtToken } from "./session";
export { effacerSession as clearStoredAuth } from "./session";
export { surSessionExpiree as onAuthUnauthorized } from "./session";
