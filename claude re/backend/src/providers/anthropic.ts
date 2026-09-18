import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisResult, JobMatchResult } from '../types';

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is not set in .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIProvider {
  analyzeResume(resumeText: string): Promise<AnalysisResult>;
  matchResumeToJob(resumeText: string, jobDescription: string): Promise<JobMatchResult>;
  generateInterviewQuestions(resumeText: string, jobDescription: string, count: number): Promise<any[]>;
  generateCareerRoadmap(resumeText: string, targetRole: string): Promise<any>;
  generateResumeScore(resumeText: string): Promise<any>;
}

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

const repairJSON = (text: string): string => {
  let s = text.trim().replace(/,\s*$/, '');
  const opens: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of s) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') opens.push('}');
    else if (ch === '[') opens.push(']');
    else if (ch === '}' || ch === ']') opens.pop();
  }

  if (inString) s += '"';
  for (const close of opens.reverse()) s += close;
  return s;
};

const cleanJSON = (text: string): string => {
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const firstObject = cleaned.indexOf('{');
  const firstArray = cleaned.indexOf('[');
  let start = -1;

  if (firstObject === -1) start = firstArray;
  else if (firstArray === -1) start = firstObject;
  else start = Math.min(firstObject, firstArray);

  if (start > 0) cleaned = cleaned.substring(start);
  return cleaned.trim();
};

const callGemini = async (prompt: string): Promise<string> => {
  const override = process.env.GEMINI_MODEL?.trim();
  const modelsToTry = override
    ? [override, ...MODELS.filter((m) => m !== override)]
    : MODELS;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,
          maxOutputTokens: 8192,
        },
      });

      const text = result.response.text();
      console.log(`✅ Model ${modelName} worked`);
      process.env.GEMINI_MODEL = modelName;

      let cleaned = cleanJSON(text);

      try {
        JSON.parse(cleaned);
      } catch {
        console.warn('⚠️ JSON appears incomplete — attempting repair...');
        cleaned = repairJSON(cleaned);
        try {
          JSON.parse(cleaned);
        } catch {
          console.warn('⚠️ JSON repair was unsuccessful. Trying next model...');
          lastError = new Error(`Gemini returned invalid JSON from model ${modelName}`);
          continue;
        }
      }

      return cleaned;
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (
        msg.includes('fetch failed') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('EAI_AGAIN')
      ) {
        throw new Error('Cannot connect to Google AI API. Please check your internet connection and GEMINI_API_KEY.');
      }
      console.warn(`⚠️ Model ${modelName} failed, trying next...`);
      console.warn(`   Reason: ${msg.substring(0, 300)}`);
      lastError = e;
    }
  }

  throw lastError || new Error('No Gemini model is available. Please check your GEMINI_API_KEY and GEMINI_MODEL.');
};


class GeminiProvider implements AIProvider {

  // ==========================================
  // RESUME ATS ANALYSIS
  // ==========================================
  async analyzeResume(resumeText: string): Promise<AnalysisResult> {
    const raw = await callGemini(`
You are a strict ATS resume analyst.
Analyze ONLY the resume text provided below.
Do NOT invent, assume, or hallucinate any information.
Every score must come directly from what is written in the resume.

RESUME TO ANALYZE:
---
${resumeText.substring(0, 4000)}
---

Return ONLY valid JSON:

{
  "overall_score": <integer 0-100, exact sum of all 6 breakdown scores>,
  "breakdown": {
    "keywords": <integer 0-25>,
    "skills": <integer 0-20>,
    "experience": <integer 0-20>,
    "formatting": <integer 0-15>,
    "education": <integer 0-10>,
    "job_relevance": <integer 0-10>
  },
  "strengths": [
    "<specific strength found in THIS resume>",
    "<specific strength found in THIS resume>",
    "<specific strength found in THIS resume>"
  ],
  "weaknesses": [
    "<specific weakness found in THIS resume>",
    "<specific weakness found in THIS resume>",
    "<specific weakness found in THIS resume>"
  ],
  "recommendations": [
    "<specific actionable recommendation for THIS resume>",
    "<specific actionable recommendation for THIS resume>",
    "<specific actionable recommendation for THIS resume>",
    "<specific actionable recommendation for THIS resume>"
  ],
  "missing_keywords": ["<keyword genuinely missing from this resume>"],
  "matched_keywords": ["<keyword actually found in this resume>"],
  "ats_compatible": <true or false>,
  "summary": "<2-3 sentences about THIS specific resume>",
  "sections": {
    "contact": <true or false>,
    "summary": <true or false>,
    "experience": <true or false>,
    "education": <true or false>,
    "skills": <true or false>
  }
}

CRITICAL:
- Return ONLY JSON. No markdown.
- Use ONLY information from the resume.
- Do not invent skills or experience.
- overall_score MUST equal the exact sum of all 6 breakdown scores.
- Be consistent — same resume must always get same score.
`);
    return JSON.parse(raw) as AnalysisResult;
  }


  // ==========================================
  // RESUME → JOB MATCH
  // ==========================================
  async matchResumeToJob(resumeText: string, jobDescription: string): Promise<JobMatchResult> {
    const raw = await callGemini(`
You are a strict recruiter and ATS job-matching system.
Compare ONLY the actual resume against the actual job description.
Do NOT invent skills or experience.

RESUME:
---
${resumeText.substring(0, 3000)}
---

JOB DESCRIPTION:
---
${jobDescription.substring(0, 2000)}
---

Return ONLY valid JSON:

{
  "match_percentage": <integer 0-100>,
  "matched_skills": ["<skill present in BOTH resume and job description>"],
  "missing_skills": ["<skill required in job but NOT found in resume>"],
  "matched_keywords": ["<keyword present in both>"],
  "missing_keywords": ["<keyword in job but not in resume>"],
  "experience_match": "<honest paragraph explaining match>",
  "recommendations": [
    "<specific recommendation based on actual gaps>",
    "<specific recommendation>",
    "<specific recommendation>"
  ]
}

CRITICAL:
- Return ONLY valid JSON.
- Do not invent skills or experience.
- Base everything on the actual texts provided.
`);
    return JSON.parse(raw) as JobMatchResult;
  }


  // ==========================================
  // INTERVIEW QUESTIONS
  // ==========================================
  async generateInterviewQuestions(resumeText: string, jobDescription: string, count: number): Promise<any[]> {
    const safeCount = Math.max(1, Math.min(Number(count) || 5, 20));

    const raw = await callGemini(`
You are a senior technical interviewer. Generate ${safeCount} UNIQUE interview questions
that are SPECIFICALLY tailored to this candidate's actual resume.

STRICT RULES:
- Read the resume carefully and extract: actual skills, tools, projects, experience, and education.
- Every question MUST reference something actually written in the resume.
- Do NOT ask generic questions like "Tell me about yourself" or "Where do you see yourself in 5 years".
- Do NOT repeat similar questions.
- Mix question types: technical (based on actual skills), behavioral (based on actual experience), situational (based on actual projects).
- Difficulty should progress: start easy, get harder.

RESUME:
---
${resumeText.substring(0, 3000)}
---

JOB DESCRIPTION:
---
${jobDescription ? jobDescription.substring(0, 1000) : 'Not provided — base questions only on resume'}
---

Return ONLY a valid JSON array with exactly ${safeCount} items:

[
  {
    "id": 1,
    "type": "technical",
    "difficulty": "easy",
    "question": "<specific question referencing an actual skill/project/tool from the resume>",
    "why_asked": "<why this is relevant to THIS candidate specifically>",
    "tip": "<specific tip for answering based on their resume>"
  }
]

Allowed types: technical, behavioral, situational
Allowed difficulties: easy, medium, hard

CRITICAL:
- Every question must be UNIQUE.
- Every question must reference something ACTUALLY in the resume.
- Return ONLY valid JSON array — no markdown, no extra text.
- Generate exactly ${safeCount} questions.
`);

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, safeCount) : [];
  }


  // ==========================================
  // CAREER ROADMAP
  // ==========================================
  async generateCareerRoadmap(resumeText: string, targetRole: string): Promise<any> {
    const raw = await callGemini(`
Create a detailed career roadmap for someone who wants to become a "${targetRole}".
Analyze the resume to identify current skill level and gaps.
Generate a structured roadmap from Beginner to Intermediate to Advanced.

RESUME:
${resumeText.substring(0, 2000)}

TARGET ROLE: ${targetRole}

Return ONLY valid JSON:

{
  "current_level": "<actual current role or level from resume>",
  "target_role": "${targetRole}",
  "estimated_time": "<realistic total timeline e.g. 6-12 months>",
  "gap_analysis": "<specific gaps identified>",
  "milestones": [
    {
      "phase": 1,
      "level": "Beginner",
      "title": "Foundation — Core Concepts",
      "duration": "1-2 months",
      "skills_to_learn": ["<fundamental skill 1>", "<skill 2>", "<skill 3>"],
      "actions": ["<concrete beginner action>", "<build a simple project>", "<action>"],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "freeCodeCamp", "url": "https://www.freecodecamp.org", "type": "course" },
        { "name": "W3Schools", "url": "https://www.w3schools.com", "type": "reference" },
        { "name": "YouTube", "url": "https://www.youtube.com", "type": "video" }
      ]
    },
    {
      "phase": 2,
      "level": "Intermediate",
      "title": "Building — Real Projects",
      "duration": "2-3 months",
      "skills_to_learn": ["<intermediate skill 1>", "<skill 2>", "<skill 3>"],
      "actions": ["<build a real project>", "<contribute to open source>", "<action>"],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "Coursera", "url": "https://www.coursera.org", "type": "course" },
        { "name": "Udemy", "url": "https://www.udemy.com", "type": "course" },
        { "name": "GitHub", "url": "https://www.github.com", "type": "practice" }
      ]
    },
    {
      "phase": 3,
      "level": "Advanced",
      "title": "Mastery — Industry Ready",
      "duration": "2-4 months",
      "skills_to_learn": ["<advanced skill 1>", "<skill 2>", "<skill 3>"],
      "actions": ["<build a production-level project>", "<apply for jobs>", "<action>"],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "LeetCode", "url": "https://www.leetcode.com", "type": "practice" },
        { "name": "Official Documentation", "url": "https://www.google.com", "type": "docs" },
        { "name": "Medium", "url": "https://www.medium.com", "type": "article" }
      ]
    }
  ],
  "certifications": ["<relevant certification 1>", "<certification 2>"],
  "salary_range": "<realistic salary range in INR in India>",
  "key_companies": ["<top company hiring for this role in India>"],
  "top_skills_needed": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>"]
}

CRITICAL:
- Return ONLY valid JSON.
- Make roadmap specific to "${targetRole}".
- Skills must progress logically from beginner to advanced.
- Base current level on actual resume content.
`);
    return JSON.parse(raw);
  }


  // ==========================================
  // RESUME WRITING QUALITY SCORE
  // ==========================================
  async generateResumeScore(resumeText: string): Promise<any> {
    const raw = await callGemini(`
Score this specific resume on multiple writing quality dimensions.
Base all scores ONLY on what is actually written.

RESUME:
${resumeText.substring(0, 3000)}

Return ONLY valid JSON:

{
  "impact_score": <integer 0-100>,
  "clarity_score": <integer 0-100>,
  "relevance_score": <integer 0-100>,
  "grammar_score": <integer 0-100>,
  "quantification_score": <integer 0-100>,
  "action_verbs_score": <integer 0-100>,
  "suggestions": {
    "impact": "<specific suggestion based on actual resume>",
    "clarity": "<specific suggestion based on actual resume>",
    "quantification": "<specific suggestion referencing actual sections>",
    "action_verbs": "<specific suggestion with examples from actual resume>"
  },
  "best_line": "<actual best written line from the resume>",
  "worst_line": "<actual weakest line from the resume>",
  "rewritten_worst_line": "<improved version of that specific line>"
}

CRITICAL:
- Return ONLY valid JSON.
- Quote actual lines from the resume.
- Do not invent resume content.
`);
    return JSON.parse(raw);
  }
}


export const aiProvider: AIProvider = new GeminiProvider();
