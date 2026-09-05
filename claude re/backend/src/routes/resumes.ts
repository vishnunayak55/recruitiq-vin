import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../utils/db';
import { extractTextFromBuffer, validateResumeText } from '../services/resumeParser';
import { aiProvider } from '../providers/anthropic';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF and DOCX files allowed'));
  },
});

const safeParse = (v: any, fb: any = []) => {
  if (Array.isArray(v) || (v && typeof v === 'object')) return v;
  try { return JSON.parse(v); } catch { return fb; }
};

const normalize = (a: any) => ({
  ...a,
  strengths: safeParse(a.strengths, []),
  weaknesses: safeParse(a.weaknesses, []),
  recommendations: safeParse(a.recommendations, []),
  missing_keywords: safeParse(a.missing_keywords, []),
  matched_keywords: safeParse(a.matched_keywords, []),
  matched_skills: safeParse(a.matched_skills, []),
  missing_skills: safeParse(a.missing_skills, []),
  analysis_data: safeParse(a.analysis_data, {}),
  interview_questions: safeParse(a.interview_questions, []),
  career_roadmap: a.career_roadmap ? safeParse(a.career_roadmap, null) : null,
  deep_score: a.deep_score ? safeParse(a.deep_score, null) : null,
});

// Check which optional columns exist (graceful degradation)
const hasColumn = async (table: string, column: string): Promise<boolean> => {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
};

// POST /api/resumes/upload
router.post('/upload', authenticate, upload.single('resume'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Fresh user from DB
    const { data: dbUser } = await supabase
      .from('users')
      .select('plan, analyses_count')
      .eq('id', req.user!.id)
      .single();

    if (!dbUser) return res.status(401).json({ error: 'User not found' });

    if (dbUser.plan === 'free' && dbUser.analyses_count >= 2) {
      return res.status(403).json({
        error: `Free plan limit reached (${dbUser.analyses_count}/2 used). Upgrade to Pro for unlimited analyses.`,
        upgradeRequired: true,
      });
    }

    // Extract text
    let extractedText: string;
    try {
      extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
      validateResumeText(extractedText);
    } catch (e: any) {
      return res.status(422).json({ error: e.message });
    }

    // Save resume record
    const { data: resumeRow, error: rErr } = await supabase
      .from('resumes')
      .insert({
        user_id: req.user!.id,
        file_name: req.file.originalname,
        file_size: req.file.size,
        extracted_text: extractedText,
      })
      .select('id')
      .single();

    if (rErr || !resumeRow) {
      console.error('Resume insert error:', rErr);
      throw rErr;
    }

    // AI Analysis
    let aiResult: any;
    try {
      aiResult = await aiProvider.analyzeResume(extractedText);
    } catch (e: any) {
      console.error('AI error:', e);
      await supabase.from('resumes').delete().eq('id', resumeRow.id);
      return res.status(503).json({
        error: 'Resume analysis is temporarily unavailable. Please try again in a moment.',
      });
    }

    if (typeof aiResult.overall_score !== 'number' || !aiResult.breakdown) {
      await supabase.from('resumes').delete().eq('id', resumeRow.id);
      return res.status(503).json({ error: 'AI returned an invalid response. Please try again.' });
    }

    // Deep score — non-blocking, ignore failure
    let deepScore: any = null;
    try { deepScore = await aiProvider.generateResumeScore(extractedText); } catch {}

    // Build insert object with only base columns first
    const insertData: any = {
      user_id: req.user!.id,
      resume_id: resumeRow.id,
      file_name: req.file.originalname,
      overall_score: aiResult.overall_score,
      keywords_score: aiResult.breakdown?.keywords || 0,
      skills_score: aiResult.breakdown?.skills || 0,
      experience_score: aiResult.breakdown?.experience || 0,
      formatting_score: aiResult.breakdown?.formatting || 0,
      education_score: aiResult.breakdown?.education || 0,
      job_relevance_score: aiResult.breakdown?.job_relevance || 0,
      strengths: aiResult.strengths || [],
      weaknesses: aiResult.weaknesses || [],
      recommendations: aiResult.recommendations || [],
      missing_keywords: aiResult.missing_keywords || [],
      matched_keywords: aiResult.matched_keywords || [],
      ats_compatible: aiResult.ats_compatible ?? false,
      analysis_data: aiResult,
      matched_skills: [],
      missing_skills: [],
    };

    // Add optional columns only if they exist in schema
    // (Run SUPABASE_UPDATE.sql to add them)
    if (deepScore) {
      insertData.deep_score = deepScore;
    }

    // Try with all optional columns, fall back without them if schema error
    let analysisRow: any = null;
    const tryInsert = async (data: any) => {
      const { data: row, error } = await supabase
        .from('resume_analyses')
        .insert(data)
        .select('*')
        .single();
      return { row, error };
    };

    // First attempt: full insert
    let { row, error: aErr } = await tryInsert({
      ...insertData,
      interview_questions: [],
      career_roadmap: null,
    });

    // If schema error on optional columns, retry without them
    if (aErr && aErr.code === 'PGRST204') {
      console.warn('Optional columns missing, inserting without them. Run SUPABASE_UPDATE.sql to add them.');
      const fallback = { ...insertData };
      delete fallback.deep_score;
      const retry = await tryInsert(fallback);
      row = retry.row;
      aErr = retry.error;
    }

    if (aErr || !row) {
      console.error('Analysis insert error:', aErr);
      throw aErr;
    }

    analysisRow = row;

    // Increment analyses count
    await supabase
      .from('users')
      .update({ analyses_count: dbUser.analyses_count + 1 })
      .eq('id', req.user!.id);

    res.status(201).json({
      success: true,
      analysis: normalize(analysisRow),
    });
  } catch (e: any) {
    console.error('Upload error:', e);
    res.status(500).json({ error: 'Failed to process resume. Please try again.' });
  }
});

// GET /api/resumes
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('id, file_name, overall_score, ats_compatible, job_match_percentage, created_at')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ analyses: data || [] });
  } catch (e: any) {
    console.error('List error:', e);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// GET /api/resumes/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Analysis not found' });
    res.json({ analysis: normalize(data) });
  } catch (e: any) {
    console.error('Get error:', e);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// DELETE /api/resumes/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('resume_analyses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    console.error('Delete error:', e);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// POST /api/resumes/:id/job-match
router.post('/:id/job-match', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { job_description } = req.body;
    if (!job_description || job_description.trim().length < 50)
      return res.status(400).json({ error: 'Job description too short (min 50 characters)' });

    const { data: analysis } = await supabase
      .from('resume_analyses')
      .select('*, resumes(extracted_text)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

    const resumeText = (analysis as any).resumes?.extracted_text || '';

    let match: any;
    try {
      match = await aiProvider.matchResumeToJob(resumeText, job_description);
    } catch (e: any) {
      console.error('Job match AI error:', e);
      return res.status(503).json({ error: 'Job matching temporarily unavailable. Please try again.' });
    }

    await supabase
      .from('resume_analyses')
      .update({
        job_description,
        job_match_percentage: match.match_percentage,
        matched_skills: match.matched_skills || [],
        missing_skills: match.missing_skills || [],
      })
      .eq('id', req.params.id);

    res.json({ success: true, match });
  } catch (e: any) {
    console.error('Job match error:', e);
    res.status(500).json({ error: 'Job matching failed. Please try again.' });
  }
});

// POST /api/resumes/:id/interview-questions
router.post('/:id/interview-questions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: user } = await supabase
      .from('users').select('plan').eq('id', req.user!.id).single();

    if (!user || user.plan === 'free')
      return res.status(403).json({ error: 'Interview prep requires Pro or Premium plan', upgradeRequired: true });

    const count = user.plan === 'premium' ? 8 : 4;

    const { data: analysis } = await supabase
      .from('resume_analyses')
      .select('*, resumes(extracted_text)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

    const resumeText = (analysis as any).resumes?.extracted_text || '';
    const { job_description = '' } = req.body;

    let questions: any[];
    try {
      questions = await aiProvider.generateInterviewQuestions(resumeText, job_description, count);
    } catch (e: any) {
      console.error('Interview Q error:', e);
      return res.status(503).json({ error: 'Failed to generate questions. Please try again.' });
    }

    // Try to save — ignore if column missing
    try {
      await supabase
        .from('resume_analyses')
        .update({ interview_questions: questions })
        .eq('id', req.params.id);
    } catch {}

    res.json({ success: true, questions, count });
  } catch (e: any) {
    console.error('Interview questions error:', e);
    res.status(500).json({ error: 'Failed to generate interview questions.' });
  }
});

// POST /api/resumes/:id/career-roadmap
router.post('/:id/career-roadmap', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: user } = await supabase
      .from('users').select('plan').eq('id', req.user!.id).single();

    if (!user || user.plan === 'free')
      return res.status(403).json({ error: 'Career roadmap requires Pro or Premium plan', upgradeRequired: true });

    const { target_role } = req.body;
    if (!target_role || !target_role.trim())
      return res.status(400).json({ error: 'Target role is required' });

    const { data: analysis } = await supabase
      .from('resume_analyses')
      .select('*, resumes(extracted_text)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

    const resumeText = (analysis as any).resumes?.extracted_text || '';

    let roadmap: any;
    try {
      roadmap = await aiProvider.generateCareerRoadmap(resumeText, target_role);
    } catch (e: any) {
      console.error('Roadmap AI error:', e);
      return res.status(503).json({ error: 'Failed to generate roadmap. Please try again.' });
    }

    // Try to save — ignore if column missing
    try {
      await supabase
        .from('resume_analyses')
        .update({ career_roadmap: roadmap })
        .eq('id', req.params.id);
    } catch {}

    res.json({ success: true, roadmap });
  } catch (e: any) {
    console.error('Roadmap error:', e);
    res.status(500).json({ error: 'Failed to generate career roadmap.' });
  }
});

export default router;
