import React, { useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import AnalysisReport from '../components/resume/AnalysisReport';

const STEPS = ['Uploading', 'Reading Resume', 'AI Analyzing', 'Generating Report', 'Complete'];

const Analyzer = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [showJob, setShowJob] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobMatch, setJobMatch] = useState<any>(null);

  const validate = (f: File) => {
    const ok = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!ok.includes(f.type) && !f.name.match(/\.(pdf|docx|doc)$/i)) { toast.error('Only PDF and DOCX supported'); return false; }
    if (f.size > 10 * 1024 * 1024) { toast.error('Max file size is 10MB'); return false; }
    return true;
  };

  const setValidFile = (f: File) => { if (validate(f)) { setFile(f); setError(''); setUpgradeRequired(false); setAnalysis(null); } };
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setValidFile(f); }, []);

  const simulateSteps = () => [0, 1000, 2800, 4500, 6000].forEach((d, i) => setTimeout(() => setStep(i), d));

  const handleUpload = async () => {
    if (!file) return;
    if (!user) { navigate('/login'); return; }
    if (user.plan === 'free' && user.analyses_count >= 2) {
      setUpgradeRequired(true);
      setError(`Free plan limit reached (${user.analyses_count}/2). Upgrade to Pro for unlimited analyses.`);
      return;
    }
    setUploading(true); setError(''); setUpgradeRequired(false); setStep(0); simulateSteps();
    try {
      const fd = new FormData(); fd.append('resume', file);
      const { data } = await api.post('/resumes/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAnalysis(data.analysis); setStep(4);
      await refreshUser();
      toast.success('Analysis complete!');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Analysis failed. Please try again.';
      setError(msg); setUpgradeRequired(!!e?.response?.data?.upgradeRequired);
      toast.error(e?.response?.data?.upgradeRequired ? 'Free plan limit reached' : msg);
    } finally { setUploading(false); }
  };

  const handleJobMatch = async () => {
    if (!analysis || jobDesc.trim().length < 50) { toast.error('Enter a job description (min 50 chars)'); return; }
    setJobLoading(true);
    try {
      const { data } = await api.post(`/resumes/${analysis.id}/job-match`, { job_description: jobDesc });
      setJobMatch(data.match);
      setAnalysis((prev: any) => ({ ...prev, job_match_percentage: data.match.match_percentage, matched_skills: data.match.matched_skills, missing_skills: data.match.missing_skills }));
      toast.success('Job match complete!');
    } catch (e: any) { toast.error(e?.response?.data?.error || 'Job matching failed'); }
    finally { setJobLoading(false); }
  };

  const freeBadge = () => {
    if (!user || user.plan !== 'free') return null;
    const left = Math.max(0, 2 - user.analyses_count);
    return (
      <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${left === 0 ? 'bg-red-500/10 border-red-500/25 text-red-400' : left === 1 ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
        {left === 0 ? '⚠ Free limit reached' : `FREE — ${left}/2 analyses remaining`}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080810] pt-20 pb-16 px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>
      <div className="max-w-4xl mx-auto relative">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-2">Resume Analyzer</h1>
          <p className="text-zinc-400">Upload your resume · Get AI-powered ATS score in seconds</p>
          {freeBadge()}
        </div>

        {!analysis ? (
          <div className="space-y-5">
            {/* Drop zone */}
            <div
              onClick={() => !file && !uploading && fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              className={`relative border-2 border-dashed rounded-2xl p-14 text-center transition-all ${
                uploading ? 'border-white/8 cursor-not-allowed' :
                drag ? 'border-indigo-500 bg-indigo-500/5 cursor-copy' :
                file ? 'border-emerald-500/30 bg-emerald-500/5 cursor-default' :
                'border-white/12 hover:border-indigo-500/40 hover:bg-white/[0.02] cursor-pointer'}`}>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" className="hidden" disabled={uploading}
                onChange={e => e.target.files?.[0] && setValidFile(e.target.files[0])} />
              {file ? (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
                    <FileText size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{file.name}</p>
                    <p className="text-zinc-500 text-sm">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  {!uploading && (
                    <button onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                      className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm transition-colors">
                      <X size={13} /> Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto">
                    <Upload size={22} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">Drop your resume here</p>
                    <p className="text-zinc-500 text-sm mt-1">or click to browse</p>
                  </div>
                  <p className="text-zinc-600 text-xs">PDF or DOCX · Max 10MB</p>
                </div>
              )}
            </div>

            {/* Progress */}
            {uploading && (
              <div className="glass rounded-2xl p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <Loader2 size={16} className="text-indigo-400 animate-spin" />
                  <span className="text-white font-medium text-sm">Analyzing with Gemini AI...</span>
                </div>
                <div className="relative">
                  <div className="flex justify-between relative z-10">
                    {STEPS.map((s, i) => (
                      <div key={s} className="flex flex-col items-center gap-2 flex-1">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                          i < step ? 'border-indigo-500 bg-indigo-500 text-white' :
                          i === step ? 'border-indigo-400 bg-indigo-500/20 text-indigo-400 animate-pulse' :
                          'border-white/12 text-zinc-600'}`}>
                          {i < step ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs text-center hidden sm:block ${i <= step ? 'text-zinc-300' : 'text-zinc-600'}`}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/8 z-0">
                    <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-5 bg-red-500/8 border border-red-500/15 rounded-xl animate-fade-in">
                <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-300 font-semibold text-sm">{upgradeRequired ? 'Free Limit Reached' : 'Analysis Failed'}</p>
                  <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
                  {upgradeRequired && <Link to="/pricing" className="inline-flex items-center gap-1 mt-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold">Upgrade to Pro — ₹49 →</Link>}
                </div>
              </div>
            )}

            {/* Buttons */}
            {file && !uploading && !upgradeRequired && (
              <button onClick={handleUpload} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-lg">
                <Target size={20} /> Analyze Resume
              </button>
            )}
            {upgradeRequired && (
              <Link to="/pricing" className="block w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-center text-lg transition-all">
                Upgrade to Pro — Unlimited Analyses · ₹49
              </Link>
            )}
            {!user && <p className="text-center text-zinc-600 text-sm"><Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link> to save your analysis history</p>}
          </div>
        ) : (
          <div className="space-y-5 animate-slide-up">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle size={17} /> Analysis Complete — <span className="text-zinc-400 font-normal text-sm">{analysis.file_name}</span>
              </div>
              <button onClick={() => { setAnalysis(null); setFile(null); setJobMatch(null); setJobDesc(''); setError(''); if (fileRef.current) fileRef.current.value = ''; }}
                className="px-4 py-2 glass glass-hover text-sm text-zinc-400 hover:text-white rounded-xl transition-colors">
                ← Analyze Another
              </button>
            </div>

            <AnalysisReport analysis={analysis} onUpdate={setAnalysis} />

            {/* Job Match */}
            <div className="glass rounded-2xl overflow-hidden">
              <button onClick={() => setShowJob(!showJob)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                <div className="text-left">
                  <h3 className="text-white font-semibold">Job Description Match</h3>
                  <p className="text-zinc-500 text-sm mt-0.5">Compare your resume to a specific job posting</p>
                </div>
                {showJob ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
              </button>
              {showJob && (
                <div className="border-t border-white/5 px-5 pb-5 pt-5 space-y-4">
                  <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={7}
                    placeholder="Paste the full job description here (min 50 characters)..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 caret-white transition-colors" />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${jobDesc.length < 50 ? 'text-zinc-600' : 'text-emerald-500'}`}>{jobDesc.length} chars {jobDesc.length < 50 ? `(need ${50 - jobDesc.length} more)` : '✓'}</span>
                  </div>
                  <button onClick={handleJobMatch} disabled={jobLoading || jobDesc.trim().length < 50}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                    {jobLoading && <Loader2 size={16} className="animate-spin" />}
                    {jobLoading ? 'Matching...' : 'Match Against Job'}
                  </button>

                  {jobMatch && (
                    <div className="space-y-4 animate-fade-in">
                      <div className={`text-center p-6 rounded-xl border ${jobMatch.match_percentage >= 75 ? 'bg-emerald-500/8 border-emerald-500/20' : jobMatch.match_percentage >= 50 ? 'bg-yellow-500/8 border-yellow-500/20' : 'bg-red-500/8 border-red-500/20'}`}>
                        <div className={`text-6xl font-black mb-1 ${jobMatch.match_percentage >= 75 ? 'text-emerald-400' : jobMatch.match_percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{jobMatch.match_percentage}%</div>
                        <div className="text-zinc-400 text-sm">Job Match Score</div>
                        <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${jobMatch.match_percentage >= 75 ? 'bg-emerald-500/15 text-emerald-400' : jobMatch.match_percentage >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                          {jobMatch.match_percentage >= 75 ? '✓ Strong Match' : jobMatch.match_percentage >= 50 ? '~ Moderate Match' : '✗ Weak Match'}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-4">
                          <h4 className="text-emerald-400 font-semibold text-sm mb-3">✓ Matched Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {jobMatch.matched_skills?.length > 0 ? jobMatch.matched_skills.map((s: string) => <span key={s} className="px-2 py-1 bg-emerald-500/15 text-emerald-300 text-xs rounded-lg">{s}</span>) : <span className="text-zinc-500 text-sm">None found</span>}
                          </div>
                        </div>
                        <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-4">
                          <h4 className="text-red-400 font-semibold text-sm mb-3">✗ Missing Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {jobMatch.missing_skills?.length > 0 ? jobMatch.missing_skills.map((s: string) => <span key={s} className="px-2 py-1 bg-red-500/15 text-red-300 text-xs rounded-lg">{s}</span>) : <span className="text-zinc-500 text-sm">None missing!</span>}
                          </div>
                        </div>
                      </div>
                      {jobMatch.experience_match && <div className="p-4 bg-blue-500/8 border border-blue-500/15 rounded-xl"><p className="text-blue-400 font-semibold text-sm mb-1">Experience Assessment</p><p className="text-zinc-300 text-sm leading-relaxed">{jobMatch.experience_match}</p></div>}
                      {jobMatch.recommendations?.length > 0 && (
                        <div className="p-4 glass rounded-xl">
                          <h4 className="text-white font-semibold text-sm mb-3">Recommendations to Improve Match</h4>
                          <ol className="space-y-2">{jobMatch.recommendations.map((r: string, i: number) => <li key={i} className="flex gap-2 text-zinc-300 text-sm"><span className="text-indigo-400 font-bold flex-shrink-0">{i+1}.</span>{r}</li>)}</ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analyzer;
