import { useState, useEffect } from 'react';
import { X, FileCode, Folder, ChevronRight, Loader2, Code2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Repository } from './types';
import { motion } from 'motion/react';

interface Props {
  repo: Repository;
  onClose: () => void;
}

interface TreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export default function RepoSourceViewer({ repo, onClose }: Props) {
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDir, setCurrentDir] = useState<string>('');
  const [viewingFilePath, setViewingFilePath] = useState<string | null>(null);
  
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/repo-tree?url=${encodeURIComponent(repo.link)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        if (!Array.isArray(data)) throw new Error('Invalid structure returned from GitHub API');
        setTree(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [repo]);

  const loadFile = async (path: string) => {
    setViewingFilePath(path);
    setLoadingFile(true);
    setFileContent('');
    try {
      const res = await fetch(`/api/repo-file?url=${encodeURIComponent(repo.link)}&path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Gagal memuat file: ' + res.statusText);
      const text = await res.text();
      setFileContent(text);
    } catch (err: any) {
      setFileContent('Error loading file: ' + err.message);
    } finally {
      setLoadingFile(false);
    }
  };

  const getItemsInDir = (dir: string) => {
    const prefix = dir ? `${dir}/` : '';
    return tree.filter(t => {
      if (!t.path.startsWith(prefix)) return false;
      const rest = t.path.slice(prefix.length);
      return !rest.includes('/');
    }).sort((a, b) => {
      if (a.type === 'tree' && b.type === 'blob') return -1;
      if (a.type === 'blob' && b.type === 'tree') return 1;
      return a.path.localeCompare(b.path);
    });
  };

  const handleNavigate = (path: string, type: 'blob' | 'tree') => {
    if (type === 'tree') {
      setCurrentDir(path);
      setViewingFilePath(null);
    } else {
      loadFile(path);
    }
  };

  const handleBreadcrumbClick = (dirIndex: parseInt) => {
    if (viewingFilePath) {
      setViewingFilePath(null);
    }
    if (dirIndex === -1) {
      setCurrentDir('');
    } else {
      const parts = currentDir.split('/');
      setCurrentDir(parts.slice(0, dirIndex + 1).join('/'));
    }
  };

  const dirParts = (viewingFilePath || currentDir).split('/').filter(Boolean);
  const currentItems = getItemsInDir(currentDir);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAFA] dark:bg-zinc-950 transition-colors">
      {/* Top Navigation Bar */}
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 shrink-0 transition-colors">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Dashboard
        </button>
        <div className="text-sm font-semibold text-zinc-900 dark:text-white transition-colors">
          {repo.title}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-4 text-sm overflow-x-auto pb-2 scrollbar-none">
            <button 
              onClick={() => handleBreadcrumbClick(-1)}
              className={`font-semibold transition-colors shrink-0 ${currentDir === '' && !viewingFilePath ? 'text-zinc-900 dark:text-white' : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'}`}
            >
              {repo.title}
            </button>
            {dirParts.map((part, idx) => {
              const isLast = idx === dirParts.length - 1;
              const isActive = (isLast && !viewingFilePath) || (isLast && viewingFilePath);
              
              return (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  <span className="text-zinc-400 dark:text-zinc-600 transition-colors">/</span>
                  <button
                    onClick={() => {
                      if (!isLast || viewingFilePath) {
                        handleBreadcrumbClick(idx);
                      }
                    }}
                    disabled={isActive}
                    className={`transition-colors ${isActive ? (viewingFilePath ? 'text-zinc-700 dark:text-zinc-300 font-semibold' : 'text-zinc-900 dark:text-white font-bold') : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold'}`}
                  >
                    {part}
                  </button>
                </div>
              );
            })}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-colors"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 gap-3 transition-colors">
                <Loader2 className="animate-spin" size={28} />
                <span className="text-sm font-medium">Memuat struktur repository...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-red-500 dark:text-red-400 gap-3 px-4 text-center transition-colors">
                <AlertTriangle size={28} />
                <span className="text-sm font-medium">Gagal memuat Repository Tree</span>
                <span className="text-xs text-red-400 dark:text-red-500/80">{error}</span>
              </div>
            ) : viewingFilePath ? (
              // File Viewer Mode
              <div className="flex flex-col">
                <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center px-4 justify-between shrink-0 transition-colors">
                  <div className="text-sm font-mono text-zinc-600 dark:text-zinc-400 truncate transition-colors">{viewingFilePath.split('/').pop()}</div>
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-md text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
                      onClick={() => {
                        const blob = new Blob([fileContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = viewingFilePath.split('/').pop() || 'file';
                        a.click();
                      }}
                    >
                      Raw
                    </button>
                  </div>
                </div>
                <div className="relative min-h-[400px]">
                  {loadingFile ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 z-10 backdrop-blur-sm transition-colors">
                      <Loader2 className="animate-spin text-zinc-900 dark:text-white" size={32} />
                    </div>
                  ) : null}
                  <div className="overflow-x-auto">
                    <pre className="p-4 text-sm font-mono text-zinc-800 dark:text-zinc-300 leading-relaxed min-w-full inline-block transition-colors">
                      <code>{fileContent}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              // Directory Listing Mode
              <div>
                <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center px-4 shrink-0 text-xs font-semibold text-zinc-500 uppercase tracking-widest transition-colors">
                  <div className="flex-1">Name</div>
                </div>
                <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/50 transition-colors">
                  {currentDir !== '' && (
                    <button
                      onClick={() => handleBreadcrumbClick(currentDir.split('/').length - 2)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-sm text-left transition-colors"
                    >
                      <span className="w-5 flex justify-center text-blue-500 dark:text-blue-400 font-bold">..</span>
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium transition-colors">..</span>
                    </button>
                  )}
                  {currentItems.length === 0 && currentDir === '' ? (
                    <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                      Tidak ada file dalam repositori ini (atau repositori kosong).
                    </div>
                  ) : (
                    currentItems.map(item => {
                      const name = item.path.split('/').pop() || item.path;
                      const isTree = item.type === 'tree';
                      
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigate(item.path, item.type)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-sm text-left transition-colors group"
                        >
                          <span className={`${isTree ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'} group-hover:${isTree ? 'text-blue-600 dark:text-blue-300' : 'text-zinc-600 dark:text-zinc-300'} transition-colors`}>
                            {isTree ? <Folder size={18} fill="currentColor" className="opacity-20" /> : <FileCode size={18} />}
                          </span>
                          <span className={`flex-1 truncate ${isTree ? 'text-blue-600 dark:text-blue-400 hover:underline' : 'text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white'} transition-colors`}>{name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
