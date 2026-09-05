export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  plan: 'free' | 'pro' | 'premium';
  analyses_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  extracted_text: string;
  created_at: Date;
}

export interface ResumeAnalysis {
  id: string;
  user_id: string;
  resume_id: string;
  file_name: string;
  overall_score: number;
  keywords_score: number;
  skills_score: number;
  experience_score: number;
  formatting_score: number;
  education_score: number;
  job_relevance_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missing_keywords: string[];
  matched_keywords: string[];
  ats_compatible: boolean;
  analysis_data: any;
  job_description?: string;
  job_match_percentage?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  created_at: Date;
}

export interface Payment {
  id: string;
  user_id: string;
  order_id: string;
  payment_id?: string;
  plan: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  created_at: Date;
}

export interface AuthRequest extends Request {
  user?: { id: string; email: string; plan: string };
}

export interface AnalysisResult {
  overall_score: number;
  breakdown: {
    keywords: number;
    skills: number;
    experience: number;
    formatting: number;
    education: number;
    job_relevance: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missing_keywords: string[];
  matched_keywords: string[];
  ats_compatible: boolean;
  summary: string;
  sections: {
    contact: boolean;
    summary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
  };
}

export interface JobMatchResult {
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  experience_match: string;
  recommendations: string[];
}
