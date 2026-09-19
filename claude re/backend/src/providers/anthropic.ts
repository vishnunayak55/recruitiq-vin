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
  generateResumeRewrite(resumeText: string): Promise<any>;
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
          console.warn('⚠️ JSON repair unsuccessful. Trying next model...');
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
// Same resume = same score always
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
  // KEYWORDS (max 25) — ratio of matched vs total, weighted heavily
  const matchedKeywords = Array.isArray(data.matched_keywords) ? data.matched_keywords.length : 0;
  const missingKeywords = Array.isArray(data.missing_keywords) ? data.missing_keywords.length : 0;
  const totalKeywords = matchedKeywords + missingKeywords;
  const keywordsRatio = totalKeywords > 0 ? matchedKeywords / totalKeywords : 0;
  // Penalty if very few matched keywords (weak resume)
  const keywordPenalty = matchedKeywords < 3 ? 0.4 : matchedKeywords < 6 ? 0.7 : 1;
  const keywords = Math.round(keywordsRatio * 25 * keywordPenalty);

  // SKILLS (max 20) — keyword count is the main driver, not just section presence
  const hasSkillsSection = data.sections?.skills === true ? 1 : 0;
  const skillsBase = hasSkillsSection * 5; // reduced from 10 to 5
  const skillsBonus = Math.min(15, matchedKeywords * 1.5); // keyword count drives this
  const skills = Math.min(20, Math.round(skillsBase + skillsBonus));

  // EXPERIENCE (max 20) — experience section + summary, but penalize weak content
  const hasExperience = data.sections?.experience === true ? 1 : 0;
  const hasSummary = data.sections?.summary === true ? 1 : 0;
  // If very few keywords, experience content is probably weak too
  const expQualityFactor = matchedKeywords < 4 ? 0.5 : matchedKeywords < 8 ? 0.75 : 1;
  const experience = Math.min(20, Math.round(((hasExperience * 14) + (hasSummary * 6)) * expQualityFactor));

  // FORMATTING (max 15) — sections present out of 5
  const sections = data.sections || {};
  const sectionCount = [sections.contact, sections.summary, sections.experience, sections.education, sections.skills].filter(Boolean).length;
  const formatting = Math.round((sectionCount / 5) * 15);

  // EDUCATION (max 10) — education section present
  const education = data.sections?.education === true ? 10 : 0;

  // JOB RELEVANCE (max 10) — only AI score, clamped
  const rawJobRelevance = typeof data.breakdown?.job_relevance === 'number' ? data.breakdown.job_relevance : 3;
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
  "summary": "<2-3 sentences about THIS specific resume>",
  "sections": {
    "contact": <true if contact info present, false otherwise>,
    "summary": <true if professional summary present, false otherwise>,
    "experience": <true if work experience section present, false otherwise>,
    "education": <true if education section present, false otherwise>,
    "skills": <true if skills section present, false otherwise>
  },
  "breakdown": {
    "job_relevance": <integer 0-10, how relevant the resume content is to a professional role>
  }
}

CRITICAL:
- Return ONLY JSON. No markdown.
- Use ONLY information from the resume.
- Do not invent skills, keywords or experience.
- matched_keywords: list EVERY professional keyword, tool, technology, skill name actually found in the resume text.
- missing_keywords: list important professional keywords NOT found in the resume.
- Be thorough with matched_keywords — this directly affects the ATS score.
`);

    const aiData = JSON.parse(raw);
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
- Do NOT ask generic questions like "Tell me about yourself".
- Do NOT repeat similar questions.
- Mix types: technical (actual skills), behavioral (actual experience), situational (actual projects).
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
    "question": "<specific question referencing actual skill/project/tool from resume>",
    "why_asked": "<why this is relevant to THIS candidate specifically>",
    "tip": "<specific tip for answering based on their resume>"
  }
]

Allowed types: technical, behavioral, situational
Allowed difficulties: easy, medium, hard

CRITICAL:
- Every question must be UNIQUE and reference something ACTUALLY in the resume.
- Return ONLY valid JSON array. No markdown.
- Generate exactly ${safeCount} questions.
`);

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, safeCount) : [];
  }


  // ==========================================
  // CAREER ROADMAP — ABSOLUTE BEGINNER START
  // ==========================================
  async generateCareerRoadmap(resumeText: string, targetRole: string): Promise<any> {
    const raw = await callGemini(`
You are a career coach. Create a complete learning roadmap for someone who wants to become a "${targetRole}".

VERY IMPORTANT RULES:
- Phase 1 MUST be for a complete ABSOLUTE BEGINNER — someone who has ZERO knowledge of ${targetRole}.
- Phase 1 must start with the very first thing a beginner does on DAY 1 — e.g. installing tools, writing first program, understanding basic concepts.
- DO NOT start with intermediate or advanced topics in Phase 1.
- Timeline per phase should be short and realistic — 1-2 months per phase MAX.
- Total timeline should be 4-8 months, NOT 12-18 months.
- Salary range must be realistic for FRESHERS in India — entry level, not senior.

RESUME (use only to understand current background, NOT to skip beginner phases):
${resumeText.substring(0, 2000)}

TARGET ROLE: ${targetRole}

Return ONLY valid JSON:

{
  "current_level": "<actual current level from resume>",
  "target_role": "${targetRole}",
  "estimated_time": "<4-8 months total — keep it short and achievable>",
  "gap_analysis": "<what they need to learn>",
  "milestones": [
    {
      "phase": 1,
      "level": "Beginner",
      "title": "Day 1 Basics — Setup & Hello World",
      "duration": "1-2 months",
      "skills_to_learn": [
        "<absolute first skill — e.g. for Python: Install Python, understand variables and data types>",
        "<second beginner skill — e.g. loops, conditions, functions>",
        "<third beginner skill — e.g. basic problem solving>"
      ],
      "actions": [
        "<literally the first thing to do — e.g. Download and install Python from python.org>",
        "<second action — e.g. Complete Python for Everybody course on Coursera (free audit)>",
        "<third action — e.g. Solve 10 easy problems on HackerRank>"
      ],
      "resources": [
        { "name": "GeeksforGeeks ${targetRole} Basics", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "freeCodeCamp Full Course", "url": "https://www.freecodecamp.org", "type": "course" },
        { "name": "W3Schools", "url": "https://www.w3schools.com", "type": "reference" },
        { "name": "Corey Schafer YouTube", "url": "https://www.youtube.com/@coreyms", "type": "video" },
        { "name": "Traversy Media YouTube", "url": "https://www.youtube.com/@TraversyMedia", "type": "video" }
      ]
    },
    {
      "phase": 2,
      "level": "Intermediate",
      "title": "Core Skills — Build Real Things",
      "duration": "2-3 months",
      "skills_to_learn": [
        "<skill that builds on phase 1 — more advanced but not expert level>",
        "<second intermediate skill>",
        "<third intermediate skill>"
      ],
      "actions": [
        "<build a small project using phase 1 skills>",
        "<second action>",
        "<third action>"
      ],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "Coursera Free Courses", "url": "https://www.coursera.org", "type": "course" },
        { "name": "Udemy", "url": "https://www.udemy.com", "type": "course" },
        { "name": "GitHub", "url": "https://www.github.com", "type": "practice" },
        { "name": "Fireship YouTube", "url": "https://www.youtube.com/@Fireship", "type": "video" }
      ]
    },
    {
      "phase": 3,
      "level": "Advanced",
      "title": "Job Ready — Portfolio & Apply",
      "duration": "1-2 months",
      "skills_to_learn": [
        "<advanced skill needed for job>",
        "<second advanced skill>",
        "<third advanced skill>"
      ],
      "actions": [
        "<build a portfolio project>",
        "<apply for internships or junior roles>",
        "<practice DSA on LeetCode>"
      ],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "LeetCode", "url": "https://www.leetcode.com", "type": "practice" },
        { "name": "Official Docs", "url": "https://www.google.com", "type": "docs" },
        { "name": "Medium", "url": "https://www.medium.com", "type": "article" },
        { "name": "Tech With Tim YouTube", "url": "https://www.youtube.com/@TechWithTim", "type": "video" }
      ]
    }
  ],
  "certifications": [
    "<FREE certification — e.g. Google IT Support Certificate, Meta Front-End on Coursera>",
    "<popular paid certification relevant to ${targetRole}>"
  ],
  "salary_range": "<FRESHER salary in India in INR — e.g. ₹3-6 LPA for entry level>",
  "key_companies": [
    "<Indian company hiring freshers for ${targetRole}>",
    "<MNC hiring freshers for ${targetRole} in India>",
    "<startup hiring for ${targetRole}>"
  ],
  "top_skills_needed": [
    "<most important skill>",
    "<skill 2>",
    "<skill 3>",
    "<skill 4>",
    "<skill 5>"
  ]
}

CRITICAL:
- Return ONLY valid JSON. No markdown.
- Phase 1 is for ABSOLUTE BEGINNERS — Day 1 setup and basics only.
- Total timeline MUST be 4-8 months, not 12-18 months.
- Salary MUST be fresher/entry-level range in INR.
- Make everything specific to "${targetRole}".
- Resources must include real YouTube channels, not just youtube.com.
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


  // ==========================================
  // RESUME REWRITE SUGGESTIONS (PRO)
  // ==========================================
  async generateResumeRewrite(resumeText: string): Promise<any> {
    const raw = await callGemini(`
You are an expert resume writer. Rewrite the weak bullet points and summary from this resume.

RULES:
- Use strong action verbs (Developed, Built, Optimized, Led, Achieved, Reduced, Increased)
- Add metrics and numbers wherever possible (even estimated ones like "~30%")
- Keep the same meaning but make it sound more impactful
- Do NOT invent technologies or experience not in the resume
- Rewrite ONLY weak or vague lines — skip lines already strong

RESUME:
---
${resumeText.substring(0, 3000)}
---

Return ONLY valid JSON:

{
  "rewrites": [
    {
      "original": "<exact weak line from the resume>",
      "rewritten": "<improved version with action verb and metric>",
      "improvement": "<one line explaining what was improved>"
    }
  ],
  "summary_rewrite": {
    "original": "<original professional summary if present, else null>",
    "rewritten": "<rewritten summary that is more impactful>"
  },
  "score_improvement": "<estimated ATS score improvement e.g. +15 to +25 points>",
  "total_rewrites": <number of bullet points rewritten>,
  "tips": [
    "<one specific tip for this resume>",
    "<another tip>",
    "<another tip>"
  ]
}

CRITICAL:
- Return ONLY valid JSON.
- Only rewrite lines actually present in the resume.
- Do not invent skills or experience.
- Minimum 3 rewrites, maximum 10.
`);
    return JSON.parse(raw);
  }
}


export const aiProvider: AIProvider = new GeminiProvider();
