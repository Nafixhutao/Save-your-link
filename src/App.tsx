/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Plus, GithubIcon, FolderHeart, Moon, Sun } from 'lucide-react';
import { Repository } from './types';
import RepoForm from './RepoForm';
import RepoList from './RepoList';
import RepoSourceViewer from './RepoSourceViewer';
import { useTheme } from './ThemeContext';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [repos, setRepos] = useState<Repository[]>(() => {
    const saved = localStorage.getItem('repo_vault_data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState<Repository | undefined>(undefined);
  const [viewingSourceRepo, setViewingSourceRepo] = useState<Repository | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('repo_vault_data', JSON.stringify(repos));
  }, [repos]);

  const handleAddOrEdit = (formData: Omit<Repository, 'id' | 'createdAt'>) => {
    if (editingRepo) {
      setRepos(prev => 
        prev.map(repo => 
          repo.id === editingRepo.id 
            ? { ...repo, ...formData, lastUpdated: new Date().toISOString() } 
            : repo
        )
      );
    } else {
      const newRepo: Repository = {
        ...formData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setRepos(prev => [newRepo, ...prev]);
    }
    setIsFormOpen(false);
    setEditingRepo(undefined);
  };

  const handleDelete = (id: string) => {
    console.log('Menghapus repo dengan ID:', id);
    setRepos(prev => prev.filter(repo => repo.id !== id));
  };

  const startEdit = (repo: Repository) => {
    setEditingRepo(repo);
    setIsFormOpen(true);
  };

  return (
    <div className="flex min-h-screen selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors">
      
      {viewingSourceRepo ? (
        <RepoSourceViewer
          repo={viewingSourceRepo}
          onClose={() => setViewingSourceRepo(undefined)}
        />
      ) : (
        <div className="flex-1 relative flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 block transition-colors">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-zinc-900 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-white dark:text-zinc-100 transition-colors">
                  <FolderHeart size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white transition-colors">RepoVault</h1>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                  aria-label="Toggle Dark Mode"
                >
                  {theme === 'dark' ? <Sun size={20} className="text-zinc-400 hover:text-white" /> : <Moon size={20} className="text-zinc-600 hover:text-zinc-900" />}
                </button>
                <button
                  onClick={() => { setIsFormOpen(true); setEditingRepo(undefined); }}
                  className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-sm"
                  id="btn-add-repo"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Repositori Baru</span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-5xl mx-auto w-full px-4 py-8 md:py-12 flex-1">
          {/* Statistics */}
          {!isFormOpen && repos.length > 0 && (
            <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm transition-colors">
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Total Repo</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white transition-colors">{repos.length}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm transition-colors">
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Total Bintang</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white transition-colors">
                  {repos.reduce((acc, r) => acc + (r.stars || 0), 0)}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm transition-colors">
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                <p className="text-lg font-bold text-zinc-600 dark:text-zinc-300 transition-colors">
                  {repos.filter(r => r.status === 'open').length} Terbuka / {repos.filter(r => r.status === 'closed').length} Tertutup
                </p>
              </div>
            </div>
          )}

          {isFormOpen ? (
            <div className="max-w-2xl mx-auto">
              <RepoForm
                onSubmit={handleAddOrEdit}
                initialData={editingRepo}
                onCancel={() => { setIsFormOpen(false); setEditingRepo(undefined); }}
              />
            </div>
          ) : repos.length > 0 ? (
            <RepoList
              repos={repos}
              onDelete={handleDelete}
              onEdit={startEdit}
              onViewSource={setViewingSourceRepo}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 mb-6 transition-colors">
                <GithubIcon size={48} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 transition-colors">Belum ada repositori</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm text-center transition-colors">
                Mulai kumpulkan repositori GitHub keren Anda. Klik tombol di atas untuk menambah yang pertama.
              </p>
            </div>
          )}
          </main>

          <footer className="px-4 py-8 border-t border-zinc-200 dark:border-zinc-800 mt-auto text-center text-zinc-400 dark:text-zinc-500 text-sm transition-colors">
            <p>&copy; {new Date().getFullYear()} RepoVault. Dibuat untuk pengguna setia GitHub.</p>
          </footer>
        </div>
      )}
    </div>
  );
}

