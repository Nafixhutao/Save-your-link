/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { X, Plus, Github, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Repository, RepoStatus } from './types';

interface RepoFormProps {
  onSubmit: (repo: Omit<Repository, 'id' | 'createdAt'>) => void;
  initialData?: Repository;
  onCancel: () => void;
}

export default function RepoForm({ onSubmit, initialData, onCancel }: RepoFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [link, setLink] = useState(initialData?.link || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState(initialData?.tags.join(', ') || '');
  const [language, setLanguage] = useState(initialData?.language || '');
  const [status, setStatus] = useState<RepoStatus>(initialData?.status || RepoStatus.OPEN);
  const [stars, setStars] = useState(initialData?.stars || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepoData = async () => {
    if (!link) return;
    
    setIsLoading(true);
    setError(null);

    // Gunakan AbortController untuk membatalkan permintaan jika terlalu lama (timeout 8 detik)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // Bersihkan dan parsing link
      const cleanLink = link
        .replace(/^(https?:\/\/)?(www\.)?github\.com\//, "")
        .split("?")[0]
        .split("#")[0]
        .replace(/\/$/, "");
      
      const parts = cleanLink.split("/");
      
      if (parts.length < 2) {
        throw new Error("Link GitHub tidak valid. Gunakan format: username/repo");
      }

      const [owner, repoName] = parts;
      const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) throw new Error("Repositori tidak ditemukan.");
        if (response.status === 403) throw new Error("Limit API GitHub tercapai. Tunggu sebentar lagi.");
        throw new Error("Gagal mengambil data dari GitHub.");
      }

      const data = await response.json();
      
      // Update field form dengan data yang didapat
      setTitle(data.name || title);
      setDescription(data.description || description);
      setStars(data.stargazers_count || 0);
      setLanguage(data.language || "");
      
      if (data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
        setTags(data.topics.join(", "));
      } else if (data.language) {
        setTags(data.language.toLowerCase());
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Koneksi lambat atau permintaan habis waktu (timeout).");
        } else {
          setError(err.message);
        }
      } else {
        setError("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setIsLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !link) return;

    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');

    onSubmit({
      title,
      link: link.startsWith('http') ? link : `https://${link}`,
      description,
      tags: tagArray,
      language,
      status,
      stars,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2 transition-colors">
          {initialData ? 'Edit Repositori' : 'Tambah Repositori Baru'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          id="btn-cancel-form"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors" htmlFor="repo-title">Judul</label>
            <input
              id="repo-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="contoh: react-dashboard"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors" htmlFor="repo-link">Link GitHub</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 transition-colors" />
                <input
                  id="repo-link"
                  type="text"
                  required
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="github.com/username/repo"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
              <button
                type="button"
                onClick={fetchRepoData}
                disabled={isLoading || !link}
                className="px-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="Isi otomatis dari GitHub"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span className="text-xs font-semibold hidden sm:inline">Ambil Data</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-2.5 rounded-lg border border-red-100 dark:border-red-500/20 animate-in fade-in slide-in-from-top-1 transition-colors">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors" htmlFor="repo-description">Deskripsi</label>
          <textarea
            id="repo-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tentang apa repositori ini?"
            className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all resize-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors" htmlFor="repo-tags">Tag (pisahkan dengan koma)</label>
            <input
              id="repo-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="react, typescript, tailwind"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors" htmlFor="repo-language">Bahasa</label>
            <input
              id="repo-language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="contoh: TypeScript"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors" htmlFor="repo-status">Status</label>
            <select
              id="repo-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as RepoStatus)}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white"
            >
              <option value={RepoStatus.OPEN}>Terbuka (Open)</option>
              <option value={RepoStatus.CLOSED}>Tertutup (Closed)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors" htmlFor="repo-stars">Bintang</label>
            <input
              id="repo-stars"
              type="number"
              min="0"
              value={stars}
              onChange={(e) => setStars(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="submit"
            id="btn-submit-repo"
            className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-2.5 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            {initialData ? 'Perbarui' : 'Tambah'} Repositori
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-white rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
