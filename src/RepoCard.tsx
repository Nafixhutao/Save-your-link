/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Github, Star, Calendar, Trash2, Edit3, ExternalLink, Code2, AlertTriangle, X } from 'lucide-react';
import { Repository, RepoStatus } from './types';
import { motion, AnimatePresence } from 'motion/react';

interface RepoCardProps {
  repo: Repository;
  onDelete: (id: string) => void;
  onEdit: (repo: Repository) => void;
  onViewSource: (repo: Repository) => void;
}

export default function RepoCard({ repo, onDelete, onEdit, onViewSource }: RepoCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition-all group flex flex-col h-full"
      id={`repo-card-${repo.id}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-colors">
            <Github size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white leading-tight line-clamp-1">{repo.title}</h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded transition-colors ${
              repo.status === RepoStatus.OPEN 
                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {repo.status}
            </span>
            {repo.language && (
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded ml-1 transition-colors">
                {repo.language}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 relative z-30 pointer-events-auto">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Edit clicked for:', repo.id);
              onEdit(repo);
            }}
            className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 sm:bg-transparent sm:opacity-60 sm:hover:opacity-100 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
            title="Edit"
            type="button"
          >
            <Edit3 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Delete clicked for:', repo.id);
              setShowDeleteConfirm(true);
            }}
            className="p-2 bg-zinc-50 hover:bg-red-50 dark:bg-zinc-800/50 dark:hover:bg-red-500/20 sm:bg-transparent sm:opacity-60 sm:hover:opacity-100 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
            title="Hapus"
            type="button"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-2 flex-grow transition-colors">
        {repo.description || "No description provided."}
      </p>

      {repo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {repo.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-auto transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-zinc-500 text-xs font-medium">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <motion.span
              key={repo.stars}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3 }}
            >
              {repo.stars}
            </motion.span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500 text-xs font-medium">
            <Calendar size={14} />
            <span>{formatDate(repo.lastUpdated)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onViewSource(repo)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-900 dark:bg-white dark:border-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer"
            title="Lihat Source Code di Web"
          >
            <Code2 size={14} />
            <span className="hidden sm:inline">Lihat Source</span>
          </button>
          <a
            href={`/api/download?url=${encodeURIComponent(repo.link)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all"
            title="Download Source Code ZIP"
          >
            <Code2 size={14} />
            <span className="hidden sm:inline">Download</span>
          </a>
          <a
            href={repo.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Buka GitHub"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-sm rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/30 shadow-xl rounded-xl p-5 w-full max-w-sm flex flex-col items-center text-center relative"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                className="absolute top-3 right-3 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <X size={16} />
              </button>
              
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle size={24} />
              </div>
              
              <h4 className="text-zinc-900 dark:text-white font-bold mb-1">Hapus Repositori?</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-5">
                Tindakan ini tidak dapat dibatalkan. Menghapus <strong className="text-zinc-900 dark:text-zinc-200">{repo.title}</strong> akan menghapusnya dari daftar Anda.
              </p>
              
              <div className="flex gap-2 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(repo.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
