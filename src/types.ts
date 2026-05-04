/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RepoStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export interface Repository {
  id: string;
  title: string;
  link: string;
  description: string;
  tags: string[];
  language?: string;
  status: RepoStatus;
  stars: number;
  lastUpdated: string; // ISO string
  createdAt: string; // ISO string
}

export type SortField = 'stars' | 'lastUpdated' | 'title';
export type SortOrder = 'asc' | 'desc';
