import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ExternalLink, Trash2, Loader2, Search, ArrowUpDown, Plus } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const PER = 10;

const History = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date' | 'score'>('date');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/resumes')
      .then(({ data }) => {
        const all: any[] = data.analyses || [];

        // FIX: Deduplicate by file_name — keep only the latest entry per filename.
        // This prevents users from seeing duplicate rows in history even if
        // duplicate analyses exist in the DB from before the cache fix was deployed.
        const seen = new Map<string, any>();
        for (const a of all) {
          const existing = seen.get(a.file_name);
          if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
            seen.set(a.file_name, a);
          }
        }
        setAnalyses(Array.from(seen.values()));
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this analysis?')) return;
    setDeleting(id);
    try {
      await api.delete(`/resumes/${id}`);
      setAnalyses(p => p.filter(a => a.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = analyses
    .filter(a => a.file_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'score'
      ? b.overall_score - a.overall_score
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const paged = filtered.slice((page - 1) * PER, page * PER);
  const pages = Math.ceil(filtered.length / PER);

  const sc = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';
  const atsBadge = (ok: boolean) => ok ? 'bg-emerald-500/12 text-emerald-400' : 'bg-red-500/12 text-red-400';

  return (
    <div className="min-h-screen bg-[#080810] pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Resume History</h1>
            <p className="text-zinc-500 mt-1 text-sm">{analyses.length} total analyses</p>
          </div>
          <Link to="/analyzer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors">
            <Plus size={15} /> New Analysis
          </Link>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Search by filename..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 glass rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 caret-white" />
          </div>
          <button onClick={() => setSort(s => s === 'date' ? 'score' : 'date')}
            className="flex items-center gap-2 px-4 py-2.5 glass glass-hover rounded-xl text-zinc-400 hover:text-white text-sm transition-colors">
            <ArrowUpDown size={14} /> {sort === 'date' ? 'By Date' : 'By Score'}
          </button>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="text-indigo-400 animate-spin" />
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 text-sm">
              {search ? 'No results match your search.' : 'No analyses yet. Upload your first resume!'}
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                {paged.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                        <FileText size={15} className="text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate max-w-[200px] sm:max-w-xs">{a.file_name}</p>
                        <p className="text-zinc-600 text-xs mt-0.5">{new Date(a.created_at).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className={`text-lg font-black tabular-nums ${sc(a.overall_score)}`}>{a.overall_score}</span>
                      {a.ats_compatible != null && (
                        <span className={`hidden sm:inline-flex text-xs px-2 py-0.5 rounded-lg font-semibold ${atsBadge(a.ats_compatible)}`}>
                          {a.ats_compatible ? 'ATS ✓' : 'ATS ✗'}
                        </span>
                      )}
                      <Link to={`/report/${a.id}`} className="p-2 text-zinc-500 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-colors">
                        <ExternalLink size={14} />
                      </Link>
                      <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id}
                        className="p-2 text-zinc-600 hover:text-red-400 rounded-lg hover:bg-red-500/5 transition-colors disabled:opacity-40">
                        {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {pages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t border-white/5">
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
