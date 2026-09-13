import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, TrendingUp, Target, Upload, ExternalLink, Trash2, Loader2, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data }] = await Promise.all([api.get('/resumes'), refreshUser()]);
      setAnalyses(data.analyses || []);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this analysis?')) return;
    setDeleting(id);
    try { await api.delete(`/resumes/${id}`); setAnalyses(p => p.filter(a => a.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const avg = analyses.length ? Math.round(analyses.reduce((s, a) => s + (a.overall_score || 0), 0) / analyses.length) : 0;
  const best = analyses.length ? Math.max(...analyses.map(a => a.overall_score || 0)) : 0;
  const left = user?.plan === 'free' ? Math.max(0, 2 - (user?.analyses_count || 0)) : null;

  const sc = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';
  const sb = (s: number) => s >= 80 ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20'
    : s >= 60 ? 'bg-yellow-500/12 text-yellow-400 border-yellow-500/20'
    : 'bg-red-500/12 text-red-400 border-red-500/20';

  return (
    <div className="min-h-screen bg-[#080810] pt-20 pb-16 px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/4 rounded-full blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto relative">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">
              Hey, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">Here's your resume intelligence overview</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} disabled={loading} className="p-2.5 glass glass-hover rounded-xl text-zinc-400 hover:text-white disabled:opacity-40 transition-colors">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link to="/analyzer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-sm">
              <Upload size={15} /> Analyze Resume
            </Link>
          </div>
        </div>

        {/* Free tier banner */}
        {user?.plan === 'free' && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between gap-4 ${left === 0 ? 'bg-red-500/8 border-red-500/15' : left === 1 ? 'bg-yellow-500/8 border-yellow-500/15' : 'glass'}`}>
            <div>
              <p className={`text-sm font-semibold ${left === 0 ? 'text-red-300' : left === 1 ? 'text-yellow-300' : 'text-zinc-300'}`}>
                {left === 0 ? '⚠ Free limit reached — upgrade to continue' : `Free plan: ${left}/2 analyses remaining`}
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">Upgrade to Pro for unlimited analyses at just ₹49</p>
            </div>
            <Link to="/pricing" className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors">
              Upgrade →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <FileText size={18} className="text-indigo-400" />, label: 'Total Analyses', value: loading ? '—' : analyses.length, sub: left != null ? `${left} slot${left===1?'':'s'} left` : 'Unlimited' },
            { icon: <TrendingUp size={18} className="text-blue-400" />, label: 'Average Score', value: loading ? '—' : avg || '—' },
            { icon: <Target size={18} className="text-emerald-400" />, label: 'Best Score', value: loading ? '—' : best || '—' },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-3">{s.icon}</div>
              <div className="text-2xl font-black text-white mb-0.5">{s.value}</div>
              <div className="text-zinc-500 text-xs">{s.label}</div>
              {s.sub && <div className="text-zinc-600 text-xs mt-0.5">{s.sub}</div>}
            </div>
          ))}
          <div className="glass rounded-2xl p-5">
            <div className="text-2xl mb-2">{user?.plan==='premium'?'👑':user?.plan==='pro'?'⚡':'🆓'}</div>
            <div className="text-white font-black capitalize text-lg mb-0.5">{user?.plan}</div>
            <div className="text-zinc-500 text-xs mb-2">Current plan</div>
            {user?.plan === 'free' && <Link to="/pricing" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1"><Zap size={11}/>Upgrade ₹49</Link>}
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-white font-bold flex items-center gap-2"><FileText size={16} className="text-indigo-400" /> Recent Analyses</h2>
            {analyses.length > 6 && <Link to="/history" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">View all ({analyses.length}) →</Link>}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="text-indigo-400 animate-spin" /></div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText size={24} className="text-zinc-600" /></div>
              <h3 className="text-white font-bold mb-2">No analyses yet</h3>
              <p className="text-zinc-500 text-sm mb-6">Upload your first resume to get an AI-powered ATS score.</p>
              <Link to="/analyzer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"><Upload size={15}/>Analyze First Resume</Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {analyses.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                      <FileText size={15} className="text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate max-w-[180px] sm:max-w-xs">{a.file_name}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{new Date(a.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="hidden sm:block text-right">
                      <div className={`text-lg font-black tabular-nums ${sc(a.overall_score)}`}>{a.overall_score}</div>
                      <div className="text-zinc-600 text-xs">/100</div>
                    </div>
                    <span className={`hidden md:inline-flex px-2 py-1 text-xs rounded-lg border font-semibold ${sb(a.overall_score)}`}>
                      {a.overall_score >= 80 ? 'Strong' : a.overall_score >= 60 ? 'Good' : 'Improve'}
                    </span>
                    <Link to={`/report/${a.id}`} className="p-2 text-zinc-500 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-colors"><ExternalLink size={14} /></Link>
                    <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id} className="p-2 text-zinc-600 hover:text-red-400 rounded-lg hover:bg-red-500/5 transition-colors disabled:opacity-40">
                      {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
