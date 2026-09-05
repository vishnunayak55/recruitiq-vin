import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Zap, Target, TrendingUp, Shield,
  BrainCircuit, FileText, Award, Map, MessageSquare, Download,
  Sparkles, ChevronRight, Star
} from 'lucide-react';

const AnimatedScore = ({ value }: { value: number }) => {
  const color = value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400';
  const ring = value >= 80 ? 'stroke-emerald-500' : value >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
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
    <div className="relative glass rounded-2xl overflow-hidden shadow-2xl glow">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" /></div>
        <div className="flex-1 mx-4 h-5 bg-white/5 rounded-md flex items-center px-2"><span className="text-zinc-600 text-xs">recruitiq.ai/report/abc123</span></div>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-6 mb-5">
          <AnimatedScore value={82} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-lg">Resume Analysis Complete</h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">ATS Ready</span>
            </div>
            <p className="text-zinc-400 text-sm mb-3">Strong technical profile. 3 critical improvements needed.</p>
            <div className="grid grid-cols-3 gap-2">
              {[['Keywords','20/25','bg-indigo-500'],['Skills','18/20','bg-violet-500'],['Experience','17/20','bg-blue-500'],['Formatting','14/15','bg-emerald-500'],['Education','8/10','bg-cyan-500'],['Relevance','5/10','bg-orange-500']].map(([l,s,c])=>(
                <div key={l} className="bg-white/5 rounded-lg p-2">
                  <div className="flex justify-between mb-1"><span className="text-zinc-500 text-xs">{l}</span><span className="text-white text-xs font-medium">{s}</span></div>
                  <div className="h-1 bg-white/10 rounded-full"><div className={`h-full ${c} rounded-full`} style={{width:`${parseInt(s)*100/parseInt(s.split('/')[1])}%`}} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
            <p className="text-emerald-400 text-xs font-semibold mb-1.5 flex items-center gap-1"><CheckCircle size={11}/>Strengths</p>
            {['Strong React & TypeScript','Quantified achievements','Clean formatting'].map(s=><p key={s} className="text-zinc-400 text-xs mb-0.5">• {s}</p>)}
          </div>
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-400 text-xs font-semibold mb-1.5">Missing Keywords</p>
            {['Docker','AWS','PostgreSQL','CI/CD'].map(k=><span key={k} className="inline-block mr-1 mb-1 px-1.5 py-0.5 bg-red-500/15 text-red-300 text-xs rounded">{k}</span>)}
          </div>
          <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-3">
            <p className="text-indigo-400 text-xs font-semibold mb-1.5 flex items-center gap-1"><MessageSquare size={11}/>Interview Prep</p>
            {['Tell me about your React experience','How do you handle state?','Describe a challenging bug'].map(q=><p key={q} className="text-zinc-400 text-xs mb-0.5 truncate">• {q}</p>)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FEATURES = [
  { icon: <Target size={20} className="text-indigo-400"/>, title: 'ATS Score Analysis', desc: 'Deep 6-dimension scoring — keywords, skills, experience, formatting, education, and job relevance.', badge: 'All Plans' },
  { icon: <MessageSquare size={20} className="text-violet-400"/>, title: 'AI Interview Prep', desc: 'Get 4 personalized interview questions on Pro, 8 on Premium — tailored to your resume + job.', badge: 'Pro & Premium' },
  { icon: <Map size={20} className="text-blue-400"/>, title: 'Career Roadmap', desc: 'AI-generated step-by-step roadmap from your current level to your target role with timelines.', badge: 'Pro & Premium' },
  { icon: <TrendingUp size={20} className="text-emerald-400"/>, title: 'Job Match Analysis', desc: 'Paste any job description and get an instant match score with skills gap breakdown.', badge: 'All Plans' },
  { icon: <Download size={20} className="text-cyan-400"/>, title: 'Download PDF Report', desc: 'Export your complete analysis as a professional PDF report to share with mentors or track progress.', badge: 'All Plans' },
  { icon: <Award size={20} className="text-yellow-400"/>, title: 'Deep Resume Score', desc: 'Unique scoring on impact, clarity, grammar, quantification, and action verbs with rewrite suggestions.', badge: 'All Plans' },
];

const Landing = () => (
  <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
    {/* BG */}
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/6 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
    </div>

    {/* Hero */}
    <section className="relative pt-32 pb-24 px-4">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8 text-sm text-indigo-300">
          <Sparkles size={13} className="text-indigo-400" />
          AI-Powered Resume Intelligence · Gemini AI
        </div>
        <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-6">
          Land Your Dream Job<br />
          <span className="gradient-text">Faster Than Ever.</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your resume. Get an ATS score, interview questions, career roadmap, and a detailed PDF report — all powered by AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/analyzer" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-lg group glow-sm">
            Analyze My Resume Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 glass glass-hover text-white font-semibold rounded-xl text-lg">
            View Plans <ChevronRight size={18} />
          </Link>
        </div>
        <HeroPreview />
      </div>
    </section>

    {/* Stats */}
    <section className="border-y border-white/5 py-12">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[['10K+','Resumes Analyzed'],['94%','ATS Pass Rate'],['3x','More Interviews'],['<30s','Analysis Time']].map(([v,l])=>(
          <div key={l}><div className="text-3xl font-black text-white mb-1">{v}</div><div className="text-zinc-500 text-sm">{l}</div></div>
        ))}
      </div>
    </section>

    {/* Features */}
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">Everything to Get You Hired</h2>
          <p className="text-zinc-400 text-lg">Features you won't find anywhere else — all in one platform</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map(f=>(
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

    {/* Unique Feature Callout */}
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative glass rounded-3xl p-10 overflow-hidden glow">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-violet-600/5" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/15 border border-yellow-500/25 rounded-full text-yellow-400 text-xs font-semibold mb-4">
                <Star size={11} /> UNIQUE TO RECRUITIQ
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Resume DNA Score™</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                We go beyond ATS scores. Our proprietary Resume DNA Score™ analyzes your resume's
                <strong className="text-white"> impact, clarity, grammar, quantification, and action verb strength</strong> — 
                then shows you the weakest line and rewrites it for you.
              </p>
              <Link to="/analyzer" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-colors">
                Try it free → <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {[['Impact Score','87','bg-indigo-500'],['Clarity Score','72','bg-violet-500'],['Grammar Score','95','bg-emerald-500'],['Quantification','58','bg-orange-500'],['Action Verbs','81','bg-blue-500']].map(([l,v,c])=>(
                <div key={l} className="flex items-center gap-3">
                  <span className="text-zinc-400 text-xs w-36">{l}</span>
                  <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                    <div className={`h-full ${c} rounded-full`} style={{width:`${v}%`}} />
                  </div>
                  <span className="text-white text-xs font-bold w-8 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">How It Works</h2>
          <p className="text-zinc-400">From upload to job-ready in under 60 seconds</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {n:'01',t:'Upload Resume',d:'PDF or DOCX. Drag & drop or click to upload.',icon:<FileText size={20}/>},
            {n:'02',t:'AI Analyzes',d:'Gemini AI scores your resume across 6 dimensions.',icon:<BrainCircuit size={20}/>},
            {n:'03',t:'Get Report',d:'Full ATS score, strengths, gaps, and recommendations.',icon:<Award size={20}/>},
            {n:'04',t:'Download & Apply',d:'Export your PDF report and go apply with confidence.',icon:<Download size={20}/>},
          ].map(s=>(
            <div key={s.n} className="text-center group">
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-4 text-indigo-400 group-hover:border-indigo-500/30 transition-colors">{s.icon}</div>
              <div className="text-indigo-400 font-mono text-xs mb-1">{s.n}</div>
              <h4 className="text-white font-bold mb-2">{s.t}</h4>
              <p className="text-zinc-500 text-sm">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-24 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="glass rounded-3xl p-12 glow">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6">
            <BrainCircuit size={28} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Start for Free Today</h2>
          <p className="text-zinc-400 mb-8">2 free analyses. No credit card. No temp emails.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-lg glow-sm">
            Get Started Free <ChevronRight size={20} />
          </Link>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-white/5 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">RecruitIQ</span>
        </div>
        <p className="text-zinc-600 text-sm">© 2025 RecruitIQ. Built with Gemini AI.</p>
        <div className="flex gap-6">
          {['Privacy','Terms','Support'].map(l=><a key={l} href="#" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">{l}</a>)}
        </div>
      </div>
    </footer>
  </div>
);

export default Landing;
