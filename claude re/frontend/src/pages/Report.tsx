import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Calendar, FileText } from 'lucide-react';
import api from '../lib/api';
import AnalysisReport from '../components/resume/AnalysisReport';

const Report = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/resumes/${id}`)
      .then(({ data }) => setAnalysis(data.analysis))
      .catch(e => setError(e?.response?.data?.error || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#080810] pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 glass glass-hover rounded-xl text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Resume Report</h1>
            {analysis && (
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-zinc-500 text-xs"><FileText size={12}/>{analysis.file_name}</span>
                <span className="flex items-center gap-1.5 text-zinc-500 text-xs"><Calendar size={12}/>{new Date(analysis.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={28} className="text-indigo-400 animate-spin" />
            <p className="text-zinc-500 text-sm">Loading your report...</p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 p-6 bg-red-500/8 border border-red-500/15 rounded-2xl">
            <AlertCircle size={20} className="text-red-400 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold">Could not load report</p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
              <Link to="/dashboard" className="text-indigo-400 text-sm mt-2 inline-block hover:text-indigo-300">← Back to Dashboard</Link>
            </div>
          </div>
        ) : analysis ? (
          <AnalysisReport analysis={analysis} onUpdate={setAnalysis} />
        ) : null}
      </div>
    </div>
  );
};

export default Report;
