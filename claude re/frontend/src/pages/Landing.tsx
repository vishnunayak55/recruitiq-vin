import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Target, TrendingUp,
  BrainCircuit, FileText, Award, Map, MessageSquare, Download,
  Sparkles, ChevronRight, Upload, Lock, Zap,
  BarChart2, Search, Layers, AlertCircle, Shield,
} from 'lucide-react';
import api from '../lib/api';

interface Stats {
  registeredUsers: number | null;
  resumeAnalyses: number | null;
}

const USER_THRESHOLD     = 100;
const ANALYSIS_THRESHOLD = 100;

const roundDown = (n: number): string => {
  if (n >= 10_000) return `${Math.floor(n / 1_000)}k`;
  if (n >= 1_000)  return `${(Math.floor(n / 100) * 100).toLocaleString()}`;
  if (n >= 100)    return `${Math.floor(n / 100) * 100}`;
  if (n >= 50)     return `${Math.floor(n / 10) * 10}`;
  return `${n}`;
};

const ScoreRing = ({ value }: { value: number }) => {
  const color = value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400';
  const ring  = value >= 80 ? 'stroke-emerald-500' : value >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" className={ring} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div className="text-center">
        <div className={`text-xl font-black ${color}`}>{value}</div>
        <div className="text-zinc-600 text-[10px]">/100</div>
      </div>
    </div>
  );
};

const DemoAnalysis = () => (
  <div className="relative w-full max-w-3xl mx-auto">
    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-violet-500/8 to-blue-500/10 blur-3xl rounded-3xl" />
    <div className="relative glass rounded-2xl overflow-hidden shadow-2xl" style={{ boxShadow: '0 0 60px rgba(99,102,241,0.12)' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.015]">
        <div className="flex gap-1.5">
          {['bg-red-500/50','bg-yellow-500/50','bg-emerald-500/50'].map(c => (
            <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
          ))}
        </div>
        <div className="flex-1 mx-3 h-5 bg-white/5 rounded-md flex items-center px-2.5 gap-1.5">
          <Lock size={9} className="text-zinc-600" />
          <span className="text-zinc-600 text-[11px]">recruitiq.app/report/example</span>
        </div>
        <span className="text-[10px] text-zinc-600 bg-white/5 border border-white/8 rounded px-1.5 py-0.5">Example Output</span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5 mb-5">
          <ScoreRing value={82} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="text-white font-bold">Resume Analysis Complete</h3>
              <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs rounded-full border border-emerald-500/25">ATS Ready</span>
            </div>
            <p className="text-zinc-500 text-sm mb-3">Strong technical profile. 3 areas for improvement.</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['Keywords','20/25','bg-indigo-500'],
                ['Skills','18/20','bg-violet-500'],
                ['Experience','17/20','bg-blue-500'],
                ['Formatting','14/15','bg-emerald-500'],
                ['Education','8/10','bg-cyan-500'],
                ['Relevance','5/10','bg-orange-500'],
              ] as [string,string,string][]).map(([l,s,c]) => (
                <div key={l} className="bg-white/[0.04] rounded-lg p-2">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-zinc-500 text-[11px]">{l}</span>
                    <span className="text-white text-[11px] font-semibold">{s}</span>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full">
                    <div className={`h-full ${c} rounded-full`} style={{ width: `${parseInt(s) * 100 / parseInt(s.split('/')[1])}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-emerald-500/6 border border-emerald-500/15 rounded-xl p-3">
            <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1"><CheckCircle size={11} /> Strengths</p>
            {['Strong technical skill coverage','Clear project experience','Good education structure'].map(s =>
              <p key={s} className="text-zinc-400 text-xs mb-1">• {s}</p>)}
          </div>
          <div className="bg-red-500/6 border border-red-500/15 rounded-xl p-3">
            <p className="text-red-400 text-xs font-semibold mb-2">Missing Keywords</p>
            {['Docker','AWS','PostgreSQL','CI/CD'].map(k =>
              <span key={k} className="inline-block mr-1 mb-1 px-1.5 py-0.5 bg-red-500/12 text-red-300 text-xs rounded">{k}</span>)}
          </div>
          <div className="bg-indigo-500/6 border border-indigo-500/15 rounded-xl p-3">
            <p className="text-indigo-400 text-xs font-semibold mb-2">Recommendations</p>
            {['Add job-specific keywords','Quantify achievements','Strengthen action verbs'].map(q =>
              <p key={q} className="text-zinc-400 text-xs mb-1">• {q}</p>)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LiveStats = ({ stats, loading }: { stats: Stats; loading: boolean }) => {
  if (loading) return null;
  if (stats.registeredUsers === null || stats.resumeAnalyses === null) return null;
  if (stats.registeredUsers < USER_THRESHOLD || stats.resumeAnalyses < ANALYSIS_THRESHOLD) return null;
  return (
    <div className="border-y border-white/5 bg-white/[0.012] py-5">
      <div className="max-w-lg mx-auto px-4 flex items-center justify-center divide-x divide-white/8">
        {([
          [roundDown(stats.registeredUsers!), 'Job Seekers'],
          [roundDown(stats.resumeAnalyses!),  'Resumes Analyzed'],
        ] as [string,string][]).map(([val, label]) => (
          <div key={label} className="flex-1 text-center px-6">
            <div className="text-3xl font-black text-white tabular-nums mb-0.5">{val}+</div>
            <div className="text-zinc-500 text-sm">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-semibold mb-4">
    {children}
  </div>
);

const FEATURES = [
  { icon: <Target size={18} className="text-indigo-400"/>,       title: 'ATS Score Analysis', desc: 'Deep 6-dimension scoring across keywords, skills, experience, formatting, education, and job relevance.', badge: 'All Plans' },
  { icon: <MessageSquare size={18} className="text-violet-400"/>, title: 'AI Interview Prep',  desc: 'Get 4 personalized interview questions on Pro, 8 on Premium — tailored to your resume and target role.',  badge: 'Pro & Premium' },
  { icon: <Map size={18} className="text-blue-400"/>,             title: 'Career Roadmap',     desc: 'AI-generated step-by-step roadmap from your current level to your target role, with timelines.',           badge: 'Pro & Premium' },
  { icon: <TrendingUp size={18} className="text-emerald-400"/>,   title: 'Job Match Analysis', desc: 'Paste any job description and get an instant match score with a full skills-gap breakdown.',               badge: 'All Plans' },
  { icon: <Download size={18} className="text-cyan-400"/>,        title: 'PDF Report Export',  desc: 'Export your complete analysis as a professional PDF report to share with mentors or track progress.',       badge: 'All Plans' },
  { icon: <Award size={18} className="text-yellow-400"/>,         title: 'Deep Resume Score',  desc: 'Unique scoring on impact, clarity, grammar, quantification, and action verbs with rewrite suggestions.',   badge: 'All Plans' },
];

const CHECKS = [
  { icon: <BarChart2 size={16} className="text-indigo-400"/>, title: 'ATS Score',     desc: 'How well your resume is optimised for applicant tracking systems.' },
  { icon: <Search size={16} className="text-violet-400"/>,    title: 'Keywords',      desc: 'Important keywords you may be missing for your target role.' },
  { icon: <Zap size={16} className="text-blue-400"/>,         title: 'Skills',        desc: 'Whether your technical and professional skills are clearly represented.' },
  { icon: <Layers size={16} className="text-emerald-400"/>,   title: 'Experience',    desc: 'The clarity and impact of your experience and project descriptions.' },
  { icon: <FileText size={16} className="text-cyan-400"/>,    title: 'Formatting',    desc: 'Formatting issues that can hurt readability or ATS compatibility.' },
  { icon: <Target size={16} className="text-orange-400"/>,    title: 'Job Relevance', desc: 'How closely your resume matches the target role.' },
];

const Landing = () => {
  const [stats, setStats] = useState<Stats>({ registeredUsers: null, resumeAnalyses: null });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/stats')
      .then(res => {
        if (cancelled) return;
        const u = res.data?.registeredUsers;
        const a = res.data?.resumeAnalyses;
        setStats({
          registeredUsers: typeof u === 'number' ? u : null,
          resumeAnalyses:  typeof a === 'number' ? a : null,
        });
      })
      .catch(() => { if (!cancelled) setStats({ registeredUsers: null, resumeAnalyses: null }); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">

      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-violet-600/4 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-blue-600/3 rounded-full blur-3xl" />
      </div>

      {/* HERO */}
      <section className="relative pt-28 sm:pt-36 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-medium mb-8">
            <Sparkles size={12} className="text-indigo-400" />
            AI-Powered Resume Intelligence
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black leading-[1.05] tracking-tight mb-6">
            Know What Your Resume<br className="hidden sm:block" />
            <span className="gradient-text"> Is Missing Before You Apply.</span>
          </h1>
          <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Analyze your resume, find ATS gaps, identify missing keywords, and get actionable recommendations — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link to="/analyzer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-200 text-base sm:text-lg group"
              style={{ boxShadow: '0 0 30px rgba(99,102,241,0.25)' }}>
              Analyze My Resume Free
              <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 glass glass-hover text-white font-semibold rounded-xl text-base sm:text-lg">
              View Plans <ChevronRight size={17} />
            </Link>
          </div>
          <DemoAnalysis />
        </div>
      </section>

      {/* LIVE STATS */}
      <LiveStats stats={stats} loading={statsLoading} />

      {/* ANALYZER CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <SectionLabel><Upload size={11} /> Try It Now</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              See What RecruitIQ Finds<br className="hidden sm:block" /> in Your Resume
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
              Upload your resume and get your ATS score, missing keywords, weaknesses, and recommendations in seconds.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 0 60px rgba(99,102,241,0.08)' }}>
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
                <Upload size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">Analyze Your Resume</h3>
              <p className="text-zinc-500 text-sm mb-6">Upload your PDF and get instant ATS feedback.</p>
              <Link to="/analyzer"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-200 group"
                style={{ boxShadow: '0 0 25px rgba(99,102,241,0.2)' }}>
                Upload Resume
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-5 mt-6 text-zinc-600 text-xs">
                <span className="flex items-center gap-1.5"><FileText size={11} /> PDF recommended</span>
                <span className="flex items-center gap-1.5"><Zap size={11} /> AI-powered</span>
                <span className="flex items-center gap-1.5"><Lock size={11} /> Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel><BrainCircuit size={11} /> Process</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">How RecruitIQ Works</h2>
            <p className="text-zinc-400 text-sm sm:text-base">From resume upload to a stronger application in four simple steps.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {([
              { n:'01', t:'Upload',  d:'Upload your resume to RecruitIQ.',                                                            icon:<FileText size={19}/> },
              { n:'02', t:'Analyze', d:'AI evaluates your resume across ATS, keywords, skills, experience, formatting and relevance.',  icon:<BrainCircuit size={19}/> },
              { n:'03', t:'Improve', d:'See exactly what is hurting your resume and get actionable recommendations.',                   icon:<TrendingUp size={19}/> },
              { n:'04', t:'Apply',   d:'Use the improved resume and prepare for the job with RecruitIQ career tools.',                  icon:<Award size={19}/> },
            ] as { n:string; t:string; d:string; icon:React.ReactNode }[]).map((s, i) => (
              <div key={s.n} className="relative text-center group">
                {i < 3 && <div className="hidden md:block absolute top-6 left-[calc(50%+30px)] w-[calc(100%-60px)] h-px bg-gradient-to-r from-indigo-500/25 to-transparent" />}
                <div className="w-12 h-12 rounded-2xl glass group-hover:border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400 transition-colors">{s.icon}</div>
                <div className="text-indigo-500 font-mono text-[11px] mb-1 tracking-widest">{s.n}</div>
                <h4 className="text-white font-bold mb-1.5 text-sm">{s.t}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEE IT IN ACTION */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel><Sparkles size={11} /> Demo</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">See RecruitIQ in Action</h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
              Get more than a score. Understand exactly what is helping — and hurting — your resume.
            </p>
            <span className="inline-block mt-3 text-[11px] text-zinc-600 border border-zinc-800 rounded-full px-3 py-1">
              Example output — not a real user's data
            </span>
          </div>
          <DemoAnalysis />
        </div>
      </section>

      {/* WHAT RECRUITIQ CHECKS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel><Search size={11} /> Analysis</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">What RecruitIQ Checks</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {CHECKS.map(c => (
              <div key={c.title} className="glass glass-hover rounded-xl p-5 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3">{c.icon}</div>
                <h3 className="text-white font-semibold mb-1 text-sm">{c.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel><Zap size={11} /> Features</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Everything You Need for Your Next Application</h2>
            <p className="text-zinc-400 text-sm sm:text-base">One platform to analyze, improve, and prepare for your next opportunity.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="glass glass-hover rounded-xl p-5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">{f.icon}</div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${f.badge === 'All Plans' ? 'bg-emerald-500/12 text-emerald-400' : 'bg-indigo-500/12 text-indigo-400'}`}>{f.badge}</span>
                </div>
                <h3 className="text-white font-semibold mb-1.5 text-sm">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel><TrendingUp size={11} /> Impact</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
              Don't Just Get a Score.<br className="hidden sm:block" /> Know What to Fix.
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

      {/* TRUST & PRIVACY */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-8 sm:p-10 text-center border border-white/8 bg-white/[0.015]">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-5">
              <Shield size={19} className="text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Your Resume. Your Data.</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-md mx-auto">
              RecruitIQ is built with your privacy in mind. Your resume is used only to provide the analysis you request.
              Analysis results are stored in your account and you can delete them at any time from your history.
            </p>
            <div className="flex justify-center gap-6">
              <Link to="/about" className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs underline underline-offset-4">Privacy Policy</Link>
              <Link to="/about" className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs underline underline-offset-4">Terms of Service</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-3">Built for Students and Job Seekers</h2>
          <p className="text-zinc-500 text-sm max-w-lg mx-auto mb-10">
            Designed to help students, freshers, and job seekers understand what is holding their resumes back — before they apply.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {([
              { role:'Engineering Graduate', text:'A platform that gives you the feedback a career coach would — powered by AI.' },
              { role:'First Job Seeker',     text:'Find exactly which keywords and skills your resume is missing for your target role.' },
              { role:'Career Changer',       text:'Prepare for interviews and map your career path, all in one place.' },
            ] as { role:string; text:string }[]).map(t => (
              <div key={t.role} className="glass rounded-xl p-5">
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/8 flex items-center justify-center text-zinc-500 text-xs font-bold">
                    {t.role[0]}
                  </div>
                  <span className="text-zinc-500 text-xs">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="rounded-3xl p-10 sm:p-14 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid rgba(99,102,241,0.18)', boxShadow: '0 0 80px rgba(99,102,241,0.1)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-violet-600/5 pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6">
                <BrainCircuit size={24} className="text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Ready to Improve Your Resume?</h2>
              <p className="text-zinc-400 text-sm sm:text-base mb-8 max-w-sm mx-auto">
                Find out what your resume is missing before you send your next application.
              </p>
              <Link to="/analyzer"
                className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-200 group"
                style={{ boxShadow: '0 0 30px rgba(99,102,241,0.25)' }}>
                Analyze My Resume Free
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-zinc-600 text-xs mt-4">Free plan — no credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <BrainCircuit size={15} className="text-white" />
            </div>
            <span className="font-bold text-white">RecruitIQ</span>
          </div>
          <p className="text-zinc-700 text-xs">© 2025 RecruitIQ. All rights reserved.</p>
          <div className="flex gap-5">
            {[['Privacy', '/about'], ['Terms', '/about'], ['About', '/about']].map(([l, to]) => (
              <Link key={l} to={to} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
