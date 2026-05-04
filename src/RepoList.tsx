/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Repository, RepoStatus, SortField, SortOrder } from './types';
import RepoCard from './RepoCard';
import { AnimatePresence } from 'motion/react';

interface RepoListProps {
  repos: Repository[];
  onDelete: (id: string) => void;
  onEdit: (repo: Repository) => void;
  onViewSource: (repo: Repository) => void;
}

const ITEMS_PER_PAGE = 6;

export default function RepoList({ repos, onDelete, onEdit, onViewSource }: RepoListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepoStatus | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('lastUpdated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    repos.forEach(repo => repo.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [repos]);

  const allLanguages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach(repo => {
      if (repo.language) langs.add(repo.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  const filteredAndSortedRepos = useMemo(() => {
    let result = repos.filter((repo) => {
      const matchesSearch = repo.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || repo.status === statusFilter;
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => repo.tags.includes(tag));
      const matchesLanguage = languageFilter === 'all' || repo.language === languageFilter;
      return matchesSearch && matchesStatus && matchesTags && matchesLanguage;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'stars') {
        comparison = a.stars - b.stars;
      } else if (sortField === 'lastUpdated') {
        comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [repos, search, statusFilter, selectedTags, sortField, sortOrder, languageFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedRepos.length / ITEMS_PER_PAGE);
  
  // Auto-adjust page if current page is now empty
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  } else if (currentPage <= 0 && totalPages > 0) {
    setCurrentPage(1);
  }

  const paginatedRepos = filteredAndSortedRepos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center transition-colors">
        <div className="relative flex-grow w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari berdasarkan judul..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium focus:outline-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-w-[100px] transition-colors"
          >
            <option value="all">Semua Status</option>
            <option value={RepoStatus.OPEN}>Terbuka</option>
            <option value={RepoStatus.CLOSED}>Tertutup</option>
          </select>

          <select
            value={languageFilter}
            onChange={(e) => { setLanguageFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium focus:outline-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-w-[120px] transition-colors"
          >
            <option value="all">Semua Bahasa</option>
            {allLanguages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortField(field as SortField);
              setSortOrder(order as SortOrder);
            }}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium focus:outline-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-w-[140px] transition-colors"
          >
            <option value="lastUpdated-desc">Terbaru</option>
            <option value="lastUpdated-asc">Terlama</option>
            <option value="stars-desc">Bintang Terbanyak</option>
            <option value="stars-asc">Bintang Sedikit</option>
            <option value="title-asc">A-Z</option>
            <option value="title-desc">Z-A</option>
          </select>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2 flex items-center gap-1 transition-colors">
            <Filter size={12} /> Filter Tag:
          </span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                selectedTags.includes(tag)
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-sm'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button 
              onClick={() => setSelectedTags([])}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline underline-offset-4 transition-colors"
            >
              Hapus filter tag
            </button>
          )}
        </div>
      )}

      {paginatedRepos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {paginatedRepos.map(repo => (
                <div key={repo.id}>
                  <RepoCard
                    repo={repo}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onViewSource={onViewSource}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-8">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-colors"
                id="btn-prev-page"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-colors">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-colors"
                id="btn-next-page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 transition-colors">
          <p className="text-zinc-500 font-medium tracking-wide">Tidak ada repositori yang ditemukan.</p>
          {(search || statusFilter !== 'all' || selectedTags.length > 0 || languageFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setSelectedTags([]); setLanguageFilter('all'); }}
              className="mt-4 text-zinc-900 dark:text-white font-semibold hover:underline transition-colors"
            >
              Hapus semua filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
