import React, { useState } from 'react';
import {
  CheckCircle, XCircle, Lightbulb, Tag, AlertTriangle, Shield,
  Download, MessageSquare, Map, Loader2, Lock, ChevronDown, ChevronUp,
  Award, Zap, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Props { analysis: any; onUpdate?: (a: any) => void; }

const Bar = ({ label, score, max, color }: any) => (
  <div>
    <div className="flex justify-between mb-1.5">
      <span className="text-zinc-400 text-sm">{label}</span>
      <span className="text-white text-sm font-bold">{score}/{max}</span>
    </div>
    <div className="h-2 bg-white/8 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100,(score/max)*100)}%` }} />
    </div>
  </div>
);

const Section = ({ title, icon, children, defaultOpen = true }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2.5 text-white font-semibold">{icon}{title}</div>
        {open ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-white/5 pt-4">{children}</div>}
    </div>
  );
};

const DeepScoreBar = ({ label, value, tip }: any) => {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-zinc-300 text-sm">{label}</span>
        <span className={`text-sm font-bold ${value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-1">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      {tip && <p className="text-zinc-600 text-xs">{tip}</p>}
    </div>
  );
};

const AnalysisReport = ({ analysis, onUpdate }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [jobDescForInterview, setJobDescForInterview] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [showInterviewInput, setShowInterviewInput] = useState(false);
  const [showRoadmapInput, setShowRoadmapInput] = useState(false);

  const score = analysis.overall_score || 0;
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const scoreGrad = score >= 80 ? 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/20'
    : score >= 60 ? 'from-yellow-500/15 to-yellow-600/5 border-yellow-500/20'
    : 'from-red-500/15 to-red-600/5 border-red-500/20';

  const strengths: string[] = Array.isArray(analysis.strengths) ? analysis.strengths : [];
  const weaknesses: string[] = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
  const recommendations: string[] = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];
  const matchedKw: string[] = Array.isArray(analysis.matched_keywords) ? analysis.matched_keywords : [];
  const missingKw: string[] = Array.isArray(analysis.missing_keywords) ? analysis.missing_keywords : [];
  const interviews: any[] = Array.isArray(analysis.interview_questions) ? analysis.interview_questions : [];
  const roadmap = analysis.career_roadmap || null;
  const deep = analysis.deep_score || null;

  const isPro = user?.plan === 'pro' || user?.plan === 'premium';
  const isPremium = user?.plan === 'premium';

  const handleDownloadPDF = () => {
    const content = `
RECRUITIQ — RESUME ANALYSIS REPORT
====================================
File: ${analysis.file_name}
Date: ${new Date(analysis.created_at).toLocaleDateString()}

OVERALL ATS SCORE: ${score}/100
ATS Compatible: ${analysis.ats_compatible ? 'Yes' : 'No'}
${analysis.job_match_percentage ? `Job Match: ${analysis.job_match_percentage}%` : ''}

SCORE BREAKDOWN
---------------
Keywords:    ${analysis.keywords_score}/25
Skills:      ${analysis.skills_score}/20
Experience:  ${analysis.experience_score}/20
Formatting:  ${analysis.formatting_score}/15
Education:   ${analysis.education_score}/10
Relevance:   ${analysis.job_relevance_score}/10

STRENGTHS
---------
${strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

WEAKNESSES
----------
${weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

RECOMMENDATIONS
---------------
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

MATCHED KEYWORDS
----------------
${matchedKw.join(', ')}

MISSING KEYWORDS
----------------
${missingKw.join(', ')}

${analysis.analysis_data?.summary ? `AI ASSESSMENT\n-------------\n${analysis.analysis_data.summary}` : ''}

${interviews.length > 0 ? `\nINTERVIEW QUESTIONS\n-------------------\n${interviews.map((q: any, i: number) => `${i+1}. [${q.type?.toUpperCase()}] ${q.question}\n   Tip: ${q.tip}`).join('\n\n')}` : ''}

${roadmap ? `\nCAREER ROADMAP\n--------------\nTarget: ${roadmap.target_role}\nTimeline: ${roadmap.estimated_time}\n\n${roadmap.milestones?.map((m: any) => `Phase ${m.phase}: ${m.title} (${m.duration})\n  Skills: ${m.skills_to_learn?.join(', ')}\n  Actions: ${m.actions?.join(', ')}`).join('\n\n')}` : ''}

====================================
Generated by RecruitIQ — recruitiq.ai
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RecruitIQ_Report_${analysis.file_name?.replace(/\.[^.]+$/, '')}_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  const handleGenerateInterviews = async () => {
    if (!isPro) { navigate('/pricing'); return; }
    setLoadingInterviews(true);
    try {
      const { data } = await api.post(`/resumes/${analysis.id}/interview-questions`, { job_description: jobDescForInterview });
      onUpdate?.({ ...analysis, interview_questions: data.questions });
      toast.success(`${data.count} interview questions generated!`);
      setShowInterviewInput(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to generate questions');
    } finally { setLoadingInterviews(false); }
  };

  const handleGenerateRoadmap = async () => {
    if (!isPro) { navigate('/pricing'); return; }
    if (!targetRole.trim()) { toast.error('Enter your target role'); return; }
    setLoadingRoadmap(true);
    try {
      const { data } = await api.post(`/resumes/${analysis.id}/career-roadmap`, { target_role: targetRole });
      onUpdate?.({ ...analysis, career_roadmap: data.roadmap });
      toast.success('Career roadmap generated!');
      setShowRoadmapInput(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to generate roadmap');
    } finally { setLoadingRoadmap(false); }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Score Card */}
      <div className={`bg-gradient-to-br ${scoreGrad} border rounded-2xl p-7`}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center flex-shrink-0">
            <div className={`text-8xl font-black tabular-nums ${scoreColor}`}>{score}</div>
            <div className="text-zinc-500 text-xl font-light">/100</div>
            <div className="text-zinc-400 text-sm mt-1">ATS Score</div>
          </div>
          <div className="flex-1 space-y-4 w-full">
            <Bar label="Keywords" score={analysis.keywords_score||0} max={25} color="bg-indigo-500" />
            <Bar label="Skills" score={analysis.skills_score||0} max={20} color="bg-violet-500" />
            <Bar label="Experience" score={analysis.experience_score||0} max={20} color="bg-blue-500" />
            <Bar label="Formatting" score={analysis.formatting_score||0} max={15} color="bg-emerald-500" />
            <Bar label="Education" score={analysis.education_score||0} max={10} color="bg-cyan-500" />
            <Bar label="Job Relevance" score={analysis.job_relevance_score||0} max={10} color="bg-orange-500" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/8">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${analysis.ats_compatible ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-red-500/15 text-red-400 border-red-500/25'}`}>
            {analysis.ats_compatible ? '✓ ATS Compatible' : '✗ ATS Issues Found'}
          </span>
          {analysis.job_match_percentage != null && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">{analysis.job_match_percentage}% Job Match</span>
          )}
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${score>=80?'bg-emerald-500/15 text-emerald-400 border-emerald-500/25':score>=60?'bg-yellow-500/15 text-yellow-400 border-yellow-500/25':'bg-red-500/15 text-red-400 border-red-500/25'}`}>
            {score >= 80 ? '🏆 Strong Resume' : score >= 60 ? '✓ Good Resume' : '⚠ Needs Work'}
          </span>
          <button onClick={handleDownloadPDF} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/12 border border-white/10 rounded-full text-xs text-zinc-300 hover:text-white transition-colors font-medium">
            <Download size={12} /> Download Report
          </button>
        </div>
      </div>

      {/* Deep Score — Unique Feature */}
      {deep && (
        <Section title="Resume DNA Score™" icon={<Award size={16} className="text-yellow-400" />}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <DeepScoreBar label="Impact Score" value={deep.impact_score} tip={deep.suggestions?.impact} />
                <DeepScoreBar label="Clarity Score" value={deep.clarity_score} tip={deep.suggestions?.clarity} />
                <DeepScoreBar label="Grammar Score" value={deep.grammar_score} />
              </div>
              <div className="space-y-3">
                <DeepScoreBar label="Quantification" value={deep.quantification_score} tip={deep.suggestions?.quantification} />
                <DeepScoreBar label="Action Verbs" value={deep.action_verbs_score} tip={deep.suggestions?.action_verbs} />
              </div>
            </div>
            {deep.worst_line && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-red-500/8 border border-red-500/15 rounded-xl">
                  <p className="text-red-400 text-xs font-semibold mb-1">⚠ Weakest Line</p>
                  <p className="text-zinc-400 text-sm italic">"{deep.worst_line}"</p>
                </div>
                <div className="p-3 bg-emerald-500/8 border border-emerald-500/15 rounded-xl">
                  <p className="text-emerald-400 text-xs font-semibold mb-1">✓ Suggested Rewrite</p>
                  <p className="text-zinc-300 text-sm">"{deep.rewritten_worst_line}"</p>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Strengths + Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title={`Strengths (${strengths.length})`} icon={<CheckCircle size={16} className="text-emerald-400" />}>
          {strengths.length > 0
            ? <ul className="space-y-2">{strengths.map((s,i)=><li key={i} className="flex gap-2 text-zinc-300 text-sm leading-relaxed"><span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>{s}</li>)}</ul>
            : <p className="text-zinc-500 text-sm">No specific strengths identified</p>}
        </Section>
        <Section title={`Weaknesses (${weaknesses.length})`} icon={<XCircle size={16} className="text-red-400" />}>
          {weaknesses.length > 0
            ? <ul className="space-y-2">{weaknesses.map((w,i)=><li key={i} className="flex gap-2 text-zinc-300 text-sm leading-relaxed"><span className="text-red-500 mt-0.5 flex-shrink-0">•</span>{w}</li>)}</ul>
            : <p className="text-zinc-500 text-sm">No major weaknesses detected</p>}
        </Section>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Section title="AI Recommendations" icon={<Lightbulb size={16} className="text-yellow-400" />}>
          <ol className="space-y-3">
            {recommendations.map((r,i)=>(
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">{i+1}</span>
                <span className="text-zinc-300 text-sm leading-relaxed">{r}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Keywords */}
      <div className="grid md:grid-cols-2 gap-4">
        {matchedKw.length > 0 && (
          <Section title="Found Keywords" icon={<Tag size={16} className="text-emerald-400" />} defaultOpen={false}>
            <div className="flex flex-wrap gap-2">{matchedKw.map(k=><span key={k} className="px-2.5 py-1 bg-emerald-500/12 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg">{k}</span>)}</div>
          </Section>
        )}
        {missingKw.length > 0 && (
          <Section title="Missing Keywords" icon={<AlertTriangle size={16} className="text-orange-400" />} defaultOpen={false}>
            <div className="flex flex-wrap gap-2">{missingKw.map(k=><span key={k} className="px-2.5 py-1 bg-orange-500/12 border border-orange-500/20 text-orange-300 text-xs rounded-lg">{k}</span>)}</div>
          </Section>
        )}
      </div>

      {/* AI Summary */}
      {analysis.analysis_data?.summary && (
        <Section title="AI Assessment" icon={<Shield size={16} className="text-blue-400" />} defaultOpen={false}>
          <p className="text-zinc-300 text-sm leading-relaxed">{analysis.analysis_data.summary}</p>
        </Section>
      )}

      {/* Interview Questions */}
      <Section title={`AI Interview Prep ${isPro ? `(${isPremium?8:4} Questions)` : '— Pro Feature'}`} icon={<MessageSquare size={16} className="text-violet-400" />} defaultOpen={false}>
        {!isPro ? (
          <div className="text-center py-6">
            <Lock size={28} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm mb-1">Interview prep requires <strong className="text-white">Pro or Premium</strong></p>
            <p className="text-zinc-500 text-xs mb-4">Get 4 questions on Pro · 8 tailored questions on Premium</p>
            <button onClick={() => navigate('/pricing')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
              Upgrade to Pro — ₹49
            </button>
          </div>
        ) : interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((q: any, i: number) => (
              <div key={i} className="p-4 glass rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center">{i+1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.type==='technical'?'bg-blue-500/15 text-blue-400':q.type==='behavioral'?'bg-emerald-500/15 text-emerald-400':'bg-orange-500/15 text-orange-400'}`}>{q.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty==='hard'?'bg-red-500/15 text-red-400':q.difficulty==='medium'?'bg-yellow-500/15 text-yellow-400':'bg-emerald-500/15 text-emerald-400'}`}>{q.difficulty}</span>
                </div>
                <p className="text-white font-medium text-sm mb-2">{q.question}</p>
                {q.tip && <p className="text-zinc-500 text-xs"><span className="text-indigo-400 font-medium">Tip:</span> {q.tip}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {!showInterviewInput ? (
              <div className="text-center py-4">
                <p className="text-zinc-400 text-sm mb-4">Generate {isPremium ? 8 : 4} AI-tailored interview questions based on your resume</p>
                <button onClick={() => setShowInterviewInput(true)} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
                  Generate Interview Questions
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea value={jobDescForInterview} onChange={e => setJobDescForInterview(e.target.value)}
                  placeholder="Paste job description for more targeted questions (optional)..."
                  rows={4} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 caret-white" />
                <button onClick={handleGenerateInterviews} disabled={loadingInterviews}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  {loadingInterviews && <Loader2 size={16} className="animate-spin" />}
                  {loadingInterviews ? 'Generating...' : `Generate ${isPremium?8:4} Questions`}
                </button>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Career Roadmap */}
      <Section title={`Career Roadmap ${isPro ? '' : '— Pro Feature'}`} icon={<Map size={16} className="text-blue-400" />} defaultOpen={false}>
        {!isPro ? (
          <div className="text-center py-6">
            <Lock size={28} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm mb-1">Career roadmap requires <strong className="text-white">Pro or Premium</strong></p>
            <p className="text-zinc-500 text-xs mb-4">Get a step-by-step AI plan to reach your target role</p>
            <button onClick={() => navigate('/pricing')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">Upgrade — ₹49</button>
          </div>
        ) : roadmap ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xs text-zinc-500 mb-1">Timeline</div>
                <div className="text-white font-bold text-sm">{roadmap.estimated_time}</div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xs text-zinc-500 mb-1">Target</div>
                <div className="text-white font-bold text-sm truncate">{roadmap.target_role}</div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xs text-zinc-500 mb-1">Salary</div>
                <div className="text-emerald-400 font-bold text-sm">{roadmap.salary_range || 'TBD'}</div>
              </div>
            </div>
            {roadmap.gap_analysis && <p className="text-zinc-400 text-sm p-3 bg-white/[0.02] rounded-xl"><span className="text-white font-medium">Gap Analysis: </span>{roadmap.gap_analysis}</p>}
            <div className="space-y-3">
              {roadmap.milestones?.map((m: any) => (
                <div key={m.phase} className="p-4 glass rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">{m.phase}</span>
                    <span className="text-white font-semibold text-sm">{m.title}</span>
                    <span className="text-zinc-500 text-xs ml-auto">{m.duration}</span>
                  </div>
                  {m.skills_to_learn?.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">{m.skills_to_learn.map((s: string) => <span key={s} className="px-2 py-0.5 bg-blue-500/12 text-blue-300 text-xs rounded-md">{s}</span>)}</div>}
                  {m.actions?.length > 0 && <ul className="text-zinc-400 text-xs space-y-0.5">{m.actions.slice(0,3).map((a: string, i: number) => <li key={i}>• {a}</li>)}</ul>}
                </div>
              ))}
            </div>
            {roadmap.certifications?.length > 0 && (
              <div className="p-3 bg-yellow-500/8 border border-yellow-500/15 rounded-xl">
                <p className="text-yellow-400 text-xs font-semibold mb-2 flex items-center gap-1"><Award size={11}/>Recommended Certifications</p>
                <div className="flex flex-wrap gap-2">{roadmap.certifications.map((c: string) => <span key={c} className="px-2 py-0.5 bg-yellow-500/12 text-yellow-300 text-xs rounded-md">{c}</span>)}</div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {!showRoadmapInput ? (
              <div className="text-center py-4">
                <p className="text-zinc-400 text-sm mb-4">Get a personalized AI roadmap to reach your dream role</p>
                <button onClick={() => setShowRoadmapInput(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">Generate Career Roadmap</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Developer, Data Scientist, Product Manager..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 caret-white" />
                <button onClick={handleGenerateRoadmap} disabled={loadingRoadmap || !targetRole.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  {loadingRoadmap && <Loader2 size={16} className="animate-spin" />}
                  {loadingRoadmap ? 'Generating Roadmap...' : 'Generate My Roadmap'}
                </button>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
};

export default AnalysisReport;
