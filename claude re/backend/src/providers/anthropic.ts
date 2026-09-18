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
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
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
  const modelsToTry = override ? [override, ...MODELS.filter((m) => m !== override)] : MODELS;
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
      if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('ENOTFOUND') || msg.includes('EAI_AGAIN')) {
        throw new Error('Cannot connect to Google AI API. Please check your internet connection and GEMINI_API_KEY.');
      }
      console.warn(`⚠️ Model ${modelName} failed, trying next...`);
      console.warn(`   Reason: ${msg.substring(0, 300)}`);
      lastError = e;
    }
  }
  throw lastError || new Error('No Gemini model is available. Please check your GEMINI_API_KEY and GEMINI_MODEL.');
};


// ==========================================
// MATHEMATICAL ATS SCORE CALCULATOR
// This ensures same resume = same score always
// ==========================================
export const calculateATSScore = (data: any): {
  overall_score: number;
  breakdown: {
    keywords: number;
    skills: number;
    experience: number;
    formatting: number;
    education: number;
    job_relevance: number;
  };
} => {
  // KEYWORDS (max 25)
  // Based on actual matched keywords count
  const matchedKeywords = Array.isArray(data.matched_keywords) ? data.matched_keywords.length : 0;
  const missingKeywords = Array.isArray(data.missing_keywords) ? data.missing_keywords.length : 0;
  const totalKeywords = matchedKeywords + missingKeywords;
  const keywordsRatio = totalKeywords > 0 ? matchedKeywords / totalKeywords : 0;
  const keywords = Math.round(keywordsRatio * 25);

  // SKILLS (max 20)
  // Based on skills section presence + number of skills
  const hasSkillsSection = data.sections?.skills === true ? 1 : 0;
  const skillsCount = matchedKeywords; // proxy for skills found
  const skillsBase = hasSkillsSection * 10;
  const skillsBonus = Math.min(10, Math.floor(skillsCount / 2));
  const skills = Math.min(20, skillsBase + skillsBonus);

  // EXPERIENCE (max 20)
  // Based on experience section + content length proxy
  const hasExperience = data.sections?.experience === true ? 1 : 0;
  const hasSummary = data.sections?.summary === true ? 1 : 0;
  const experienceBase = hasExperience * 14;
  const experienceBonus = hasSummary * 6;
  const experience = Math.min(20, experienceBase + experienceBonus);

  // FORMATTING (max 15)
  // Based on how many sections are present
  const sections = data.sections || {};
  const sectionCount = [
    sections.contact,
    sections.summary,
    sections.experience,
    sections.education,
    sections.skills,
  ].filter(Boolean).length;
  const formatting = Math.round((sectionCount / 5) * 15);

  // EDUCATION (max 10)
  // Based on education section presence
  const hasEducation = data.sections?.education === true ? 1 : 0;
  const education = hasEducation * 10;

  // JOB RELEVANCE (max 10)
  // This is the only AI-influenced score — but clamped to 0-10
  const rawJobRelevance = typeof data.breakdown?.job_relevance === 'number'
    ? data.breakdown.job_relevance
    : 5;
  const job_relevance = Math.min(10, Math.max(0, Math.round(rawJobRelevance)));

  const overall_score = Math.min(100, keywords + skills + experience + formatting + education + job_relevance);

  return {
    overall_score,
    breakdown: { keywords, skills, experience, formatting, education, job_relevance },
  };
};


class GeminiProvider implements AIProvider {

  // ==========================================
  // RESUME ATS ANALYSIS
  // AI extracts data only — score calculated mathematically
  // ==========================================
  async analyzeResume(resumeText: string): Promise<AnalysisResult> {
    const raw = await callGemini(`
You are a strict ATS resume analyst.
Analyze ONLY the resume text provided below.
Do NOT invent, assume, or hallucinate any information.
Extract ONLY what is actually written in the resume.

RESUME TO ANALYZE:
---
${resumeText.substring(0, 4000)}
---

Return ONLY valid JSON:

{
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
  "missing_keywords": ["<important keyword genuinely missing from this resume>"],
  "matched_keywords": ["<keyword actually found in this resume>"],
  "ats_compatible": <true if resume has clear sections and proper formatting, false otherwise>,
  "summary": "<2-3 sentences about THIS specific resume based only on what is written>",
  "sections": {
    "contact": <true if contact info is present, false otherwise>,
    "summary": <true if professional summary is present, false otherwise>,
    "experience": <true if work experience section is present, false otherwise>,
    "education": <true if education section is present, false otherwise>,
    "skills": <true if skills section is present, false otherwise>
  },
  "breakdown": {
    "job_relevance": <integer 0-10, how relevant the resume content is to a professional role>
  }
}

CRITICAL:
- Return ONLY JSON. No markdown.
- Use ONLY information from the resume.
- Do not invent skills, keywords or experience.
- Be consistent — same resume must always return same data.
- matched_keywords must be keywords ACTUALLY found in the resume text.
- missing_keywords must be important keywords NOT found in the resume.
`);

    const aiData = JSON.parse(raw);

    // Calculate score mathematically for consistency
    const { overall_score, breakdown } = calculateATSScore(aiData);

    return {
      ...aiData,
      overall_score,
      breakdown,
    } as AnalysisResult;
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
You are a career coach. Create a complete learning roadmap for someone who wants to become a "${targetRole}".

IMPORTANT: The roadmap MUST start from ABSOLUTE ZERO — assume the person knows NOTHING about this field.
Phase 1 must cover the most basic fundamentals a complete beginner needs on day 1.
Each phase must build naturally on the previous one.
This roadmap must work for ANY role the user enters — not just tech roles.

RESUME (use this only to understand their current background):
${resumeText.substring(0, 2000)}

TARGET ROLE: ${targetRole}

Return ONLY valid JSON:

{
  "current_level": "<actual current role or level from resume>",
  "target_role": "${targetRole}",
  "estimated_time": "<realistic total timeline e.g. 6-12 months>",
  "gap_analysis": "<what they need to learn to become a ${targetRole} based on their resume>",
  "milestones": [
    {
      "phase": 1,
      "level": "Beginner",
      "title": "Absolute Basics — Zero to Hello World",
      "duration": "1-2 months",
      "skills_to_learn": [
        "<the most fundamental skill a complete beginner needs for ${targetRole}>",
        "<basic skill 2>",
        "<basic skill 3>"
      ],
      "actions": [
        "<action a complete beginner can do on day 1>",
        "<action 2>",
        "<action 3>"
      ],
      "resources": [
        { "name": "GeeksforGeeks — ${targetRole} Tutorial", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "freeCodeCamp", "url": "https://www.freecodecamp.org", "type": "course" },
        { "name": "W3Schools", "url": "https://www.w3schools.com", "type": "reference" },
        { "name": "Corey Schafer — YouTube", "url": "https://www.youtube.com/@coreyms", "type": "video" },
        { "name": "Traversy Media — YouTube", "url": "https://www.youtube.com/@TraversyMedia", "type": "video" }
      ]
    },
    {
      "phase": 2,
      "level": "Intermediate",
      "title": "Building — Real Projects",
      "duration": "2-3 months",
      "skills_to_learn": [
        "<intermediate skill 1 that builds on phase 1>",
        "<intermediate skill 2>",
        "<intermediate skill 3>"
      ],
      "actions": [
        "<build a small real project using phase 1 skills>",
        "<action 2>",
        "<action 3>"
      ],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "Coursera — Free Courses", "url": "https://www.coursera.org", "type": "course" },
        { "name": "Udemy", "url": "https://www.udemy.com", "type": "course" },
        { "name": "GitHub", "url": "https://www.github.com", "type": "practice" },
        { "name": "Fireship — YouTube", "url": "https://www.youtube.com/@Fireship", "type": "video" }
      ]
    },
    {
      "phase": 3,
      "level": "Advanced",
      "title": "Mastery — Industry Ready",
      "duration": "2-4 months",
      "skills_to_learn": [
        "<advanced skill 1 needed to get a job as ${targetRole}>",
        "<advanced skill 2>",
        "<advanced skill 3>"
      ],
      "actions": [
        "<build a production-level project that can go in portfolio>",
        "<action 2>",
        "<action 3>"
      ],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "LeetCode", "url": "https://www.leetcode.com", "type": "practice" },
        { "name": "Official Documentation", "url": "https://www.google.com", "type": "docs" },
        { "name": "Medium — Tech Articles", "url": "https://www.medium.com", "type": "article" },
        { "name": "Tech With Tim — YouTube", "url": "https://www.youtube.com/@TechWithTim", "type": "video" }
      ]
    }
  ],
  "certifications": [
    "<most relevant FREE certification for ${targetRole}>",
    "<second certification — can be paid but popular>"
  ],
  "salary_range": "<realistic salary range in INR for ${targetRole} in India>",
  "key_companies": [
    "<top Indian company hiring for ${targetRole}>",
    "<top MNC hiring for ${targetRole} in India>",
    "<startup hiring for ${targetRole}>"
  ],
  "top_skills_needed": [
    "<most important skill for ${targetRole}>",
    "<skill 2>",
    "<skill 3>",
    "<skill 4>",
    "<skill 5>"
  ]
}

CRITICAL:
- Return ONLY valid JSON. No markdown.
- Phase 1 MUST start from ABSOLUTE ZERO basics.
- Skills in each phase must build logically on the previous phase.
- Resources must include real YouTube channel links.
- Certifications must be real and relevant — include at least one free option.
- Salary range must be realistic for India in INR.
- Make everything specific to "${targetRole}".
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
