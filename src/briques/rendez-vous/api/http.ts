/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from '@/noyau/http';
import type { OptionsRequete } from '@/noyau/http';

const enJson = (corps?: unknown) => (corps === undefined ? undefined : JSON.stringify(corps));

export const http = {
  get: <T>(endpoint: string, opts?: { params?: OptionsRequete['params'] }) =>
    clientHttp<T>(endpoint, { params: opts?.params }),

  post: <T>(endpoint: string, corps?: unknown) =>
    clientHttp<T>(endpoint, { method: 'POST', body: enJson(corps) }),

  put: <T>(endpoint: string, corps?: unknown) =>
    clientHttp<T>(endpoint, { method: 'PUT', body: enJson(corps) }),

  delete: <T = void>(endpoint: string) =>
    clientHttp<T>(endpoint, { method: 'DELETE' }),
};