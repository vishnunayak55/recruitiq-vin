import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Zap, Target, TrendingUp, Shield,
  BrainCircuit, FileText, Award, Map, MessageSquare, Download,
  Sparkles, ChevronRight, Upload, Lock, AlertCircle, Search, BarChart2, Layers,
} from 'lucide-react';

const ScoreRing = ({ value }: { value: number }) => {
  const color = value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400';
  const ring  = value >= 80 ? 'stroke-emerald-500' : value >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" className={ring} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="text-center">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-zinc-500 text-xs">/100</div>
      </div>
    </div>
  );
};

const HeroPreview = () => (
  <div className="relative w-full max-w-3xl mx-auto">
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-blue-500/15 blur-3xl rounded-3xl" />
    <div className="relative glass rounded-2xl overflow-hidden shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="flex-1 mx-4 h-5 bg-white/5 rounded-md flex items-center px-2.5 gap-1.5">
          <Lock size={9} className="text-zinc-600" />
          <span className="text-zinc-600 text-xs">recruitiq.app/report/example</span>
        </div>
        <span className="text-[10px] text-zinc-600 bg-white/5 border border-white/8 rounded px-1.5 py-0.5">Example Output</span>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-6 mb-5">
          <ScoreRing value={82} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-lg">Resume Analysis Complete</h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">ATS Ready</span>
            </div>
            <p className="text-zinc-400 text-sm mb-3">Strong technical profile. 3 areas for improvement.</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['Keywords','20/25','bg-indigo-500'],
                ['Skills','18/20','bg-violet-500'],
                ['Experience','17/20','bg-blue-500'],
                ['Formatting','14/15','bg-emerald-500'],
                ['Education','8/10','bg-cyan-500'],
                ['Relevance','5/10','bg-orange-500'],
              ] as [string,string,string][]).map(([l,s,c]) => (
                <div key={l} className="bg-white/5 rounded-lg p-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-500 text-xs">{l}</span>
                    <span className="text-white text-xs font-medium">{s}</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full">
                    <div className={`h-full ${c} rounded-full`} style={{ width: `${parseInt(s) * 100 / parseInt(s.split('/')[1])}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
            <p className="text-emerald-400 text-xs font-semibold mb-1.5 flex items-center gap-1"><CheckCircle size={11} /> Strengths</p>
            {['Strong technical skills','Quantified achievements','Clean formatting'].map(s =>
              <p key={s} className="text-zinc-400 text-xs mb-0.5">• {s}</p>)}
          </div>
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-400 text-xs font-semibold mb-1.5">Missing Keywords</p>
            {['Docker','AWS','PostgreSQL','CI/CD'].map(k =>
              <span key={k} className="inline-block mr-1 mb-1 px-1.5 py-0.5 bg-red-500/15 text-red-300 text-xs rounded">{k}</span>)}
          </div>
          <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-3">
            <p className="text-indigo-400 text-xs font-semibold mb-1.5">Recommendations</p>
            {['Add job-specific keywords','Quantify your impact','Strengthen action verbs'].map(q =>
              <p key={q} className="text-zinc-400 text-xs mb-0.5 truncate">• {q}</p>)}
          </div>
        </div>
      </div>
    </div>
    <p className="text-center text-zinc-600 text-[11px] mt-3">Example output — not a real user's data</p>
  </div>
);

const FEATURES = [
  { icon: <Target size={20} className="text-indigo-400"/>,       title: 'ATS Score Analysis',   desc: 'Deep 6-dimension scoring across keywords, skills, experience, formatting, education, and job relevance.', badge: 'All Plans' },
  { icon: <MessageSquare size={20} className="text-violet-400"/>, title: 'AI Interview Prep',    desc: 'Get personalized interview questions tailored to your resume and target role.',                             badge: 'Pro & Premium' },
  { icon: <Map size={20} className="text-blue-400"/>,             title: 'Career Roadmap',       desc: 'AI-generated step-by-step roadmap from your current level to your target role with timelines.',           badge: 'Pro & Premium' },
  { icon: <TrendingUp size={20} className="text-emerald-400"/>,   title: 'Job Match Analysis',   desc: 'Paste any job description and get an instant match score with a full skills-gap breakdown.',               badge: 'All Plans' },
  { icon: <Download size={20} className="text-cyan-400"/>,        title: 'PDF Report Export',    desc: 'Export your complete analysis as a professional PDF report to share with mentors or track progress.',       badge: 'All Plans' },
  { icon: <Award size={20} className="text-yellow-400"/>,         title: 'Deep Resume Score',    desc: 'Scoring on impact, clarity, grammar, quantification, and action verbs with rewrite suggestions.',          badge: 'All Plans' },
];

const CHECKS = [
  { icon: <BarChart2 size={16} className="text-indigo-400"/>,  title: 'ATS Score',     desc: 'How well your resume is optimised for applicant tracking systems.' },
  { icon: <Search size={16} className="text-violet-400"/>,     title: 'Keywords',      desc: 'Important keywords you may be missing for your target role.' },
  { icon: <Zap size={16} className="text-blue-400"/>,          title: 'Skills',        desc: 'Whether your technical and professional skills are clearly represented.' },
  { icon: <Layers size={16} className="text-emerald-400"/>,    title: 'Experience',    desc: 'The clarity and impact of your experience and project descriptions.' },
  { icon: <FileText size={16} className="text-cyan-400"/>,     title: 'Formatting',    desc: 'Formatting issues that can hurt readability or ATS compatibility.' },
  { icon: <Target size={16} className="text-orange-400"/>,     title: 'Job Relevance', desc: 'How closely your resume matches the target role.' },
];

const USE_CASES = [
  {
    icon: <FileText size={15} className="text-indigo-400" />,
    title: 'Fresh Graduates',
    desc: "Get feedback on your resume before your first application — find out which keywords and skills you're missing for the roles you want.",
  },
  {
    icon: <TrendingUp size={15} className="text-violet-400" />,
    title: 'Active Job Seekers',
    desc: "Not getting callbacks? RecruitIQ shows you exactly what ATS systems flag before your resume reaches a recruiter.",
  },
  {
    icon: <Map size={15} className="text-blue-400" />,
    title: 'Career Changers',
    desc: "See the skill gaps between where you are and where you want to go — then get a roadmap to close them.",
  },
];

const Landing = () => (
  <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">

    {/* Ambient background */}
    <div className="fixed inset-0 pointer-events-none" aria-hidden>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/4 rounded-full blur-3xl" />
    </div>

    {/* ── HERO ── */}
    <section className="relative pt-32 pb-24 px-4">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8 text-sm text-indigo-300">
          <Sparkles size={13} className="text-indigo-400" />
          AI-Powered Resume Intelligence
        </div>
        <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-6">
          Know What Your Resume<br />
          <span className="gradient-text">Is Missing Before You Apply.</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Analyze your resume, find ATS gaps, identify missing keywords, and get actionable recommendations — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/analyzer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-lg group"
            style={{ boxShadow: '0 0 30px rgba(99,102,241,0.25)' }}>
            Analyze My Resume Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 glass glass-hover text-white font-semibold rounded-xl text-lg">
            View Plans <ChevronRight size={18} />
          </Link>
        </div>
        <HeroPreview />
      </div>
    </section>

    {/* ── WHAT IT CHECKS ── */}
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">What RecruitIQ Checks</h2>
          <p className="text-zinc-400 text-sm sm:text-base">Six dimensions that determine whether your resume gets past ATS filters.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {CHECKS.map(c => (
            <div key={c.title} className="glass glass-hover rounded-xl p-5">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3">{c.icon}</div>
              <h3 className="text-white font-semibold mb-1 text-sm">{c.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── FEATURES ── */}
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">Everything You Need for Your Next Application</h2>
          <p className="text-zinc-400 text-lg">One platform to analyze, improve, and prepare.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="glass glass-hover rounded-2xl p-6 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">{f.icon}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.badge === 'All Plans' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500/15 text-indigo-400'}`}>{f.badge}</span>
              </div>
              <h3 className="text-white font-bold mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── HOW IT WORKS ── */}
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">How RecruitIQ Works</h2>
          <p className="text-zinc-400">From resume upload to a stronger application in four steps.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {([
            { n:'01', t:'Upload Resume',  d:'Upload your PDF resume to RecruitIQ.',                                          icon:<FileText size={20}/> },
            { n:'02', t:'AI Analyzes',    d:'AI scores your resume across 6 dimensions.',                                    icon:<BrainCircuit size={20}/> },
            { n:'03', t:'Get Report',     d:'See your ATS score, strengths, gaps, and recommendations.',                    icon:<Award size={20}/> },
            { n:'04', t:'Apply with Confidence', d:'Export your PDF report and go apply with a stronger resume.',           icon:<Download size={20}/> },
          ] as { n:string; t:string; d:string; icon:React.ReactNode }[]).map((s, i) => (
            <div key={s.n} className="relative text-center group">
              {i < 3 && <div className="hidden md:block absolute top-7 left-[calc(50%+35px)] w-[calc(100%-70px)] h-px bg-gradient-to-r from-indigo-500/25 to-transparent" />}
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-4 text-indigo-400 group-hover:border-indigo-500/30 transition-colors">{s.icon}</div>
              <div className="text-indigo-400 font-mono text-xs mb-1">{s.n}</div>
              <h4 className="text-white font-bold mb-2 text-sm">{s.t}</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── BEFORE / AFTER ── */}
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Don't Just Get a Score. Know What to Fix.
          </h2>
          <p className="text-zinc-600 text-xs mt-2">Illustrative example — individual results vary.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl p-6 border border-red-500/15 bg-red-500/[0.03]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-red-400 text-[11px] font-bold uppercase tracking-widest">Before</span>
            </div>
            <div className="flex items-end gap-2 mb-5">
              <span className="text-5xl font-black text-red-400">72</span>
              <span className="text-zinc-600 text-sm mb-1">/100 ATS</span>
            </div>
            <div className="space-y-2.5">
              {['Missing important keywords','Weak project descriptions','Poor job alignment'].map(p => (
                <div key={p} className="flex items-center gap-2.5 text-xs text-zinc-400">
                  <AlertCircle size={12} className="text-red-400 flex-shrink-0" /> {p}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-6 border border-emerald-500/20 bg-emerald-500/[0.03]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">After Improvements</span>
            </div>
            <div className="flex items-end gap-2 mb-5">
              <span className="text-5xl font-black text-emerald-400">↑</span>
              <span className="text-zinc-400 text-sm mb-1">ATS Score Improved</span>
            </div>
            <div className="space-y-2.5">
              {['Better keyword alignment','Stronger project descriptions','Clearer measurable impact','Better role relevance'].map(p => (
                <div key={p} className="flex items-center gap-2.5 text-xs text-zinc-400">
                  <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" /> {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── WHO IT'S FOR ── */}
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-black text-white mb-3">Built for Students and Job Seekers</h2>
        <p className="text-zinc-500 text-sm max-w-lg mx-auto mb-10">
          Designed to help students, freshers, and job seekers understand what is holding their resumes back — before they apply.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 text-left">
          {USE_CASES.map(u => (
            <div key={u.title} className="glass rounded-xl p-5">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3">{u.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-2">{u.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── TRUST & PRIVACY ── */}
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-8 sm:p-10 text-center border border-white/8 bg-white/[0.015]">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-5">
            <Shield size={19} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Your Resume. Your Data.</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4 max-w-md mx-auto">
            Your resume is used only to generate the analysis you request. Results are stored in your account
            and you can delete them at any time from your history.
          </p>
          <p className="text-zinc-600 text-xs mb-6 max-w-sm mx-auto">
            RecruitIQ does not sell or share your resume data with third parties.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-zinc-600 text-xs">
            <span className="flex items-center gap-1.5"><Lock size={11} /> Your data stays private</span>
            <span className="flex items-center gap-1.5"><Upload size={11} /> Delete anytime</span>
            <span className="flex items-center gap-1.5"><Shield size={11} /> No third-party sharing</span>
          </div>
        </div>
      </div>
    </section>

    {/* ── FINAL CTA ── */}
    <section className="py-24 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="glass rounded-3xl p-12" style={{ boxShadow: '0 0 80px rgba(99,102,241,0.08)' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6">
            <BrainCircuit size={28} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Ready to Improve Your Resume?</h2>
          <p className="text-zinc-400 mb-8">Find out what your resume is missing before you send your next application.</p>
          <Link to="/analyzer"
            className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-lg group"
            style={{ boxShadow: '0 0 30px rgba(99,102,241,0.25)' }}>
            Analyze My Resume Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-zinc-600 text-xs mt-4">Free plan — no credit card required</p>
        </div>
      </div>
    </section>

    {/* ── FOOTER ── */}
    <footer className="border-t border-white/5 py-10 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">RecruitIQ</span>
        </div>
        <p className="text-zinc-600 text-sm">© 2025 RecruitIQ. All rights reserved.</p>
        <div className="flex gap-6">
          {[['Privacy', '/about'], ['Terms', '/about'], ['About', '/about']].map(([l, to]) => (
            <Link key={l} to={to} className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">{l}</Link>
          ))}
        </div>
      </div>
    </footer>

  </div>
);

export default Landing;
